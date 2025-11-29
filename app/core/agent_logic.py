import google.generativeai as genai
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from app.core.config import settings
from app.models.transaction import Transaction
from app.models.user import User
from app.models.banking import Bill
from app.models.savings import Savings
from app.models.goal import Goal
from app.models.agent_data import AgentAction, ActionStatus, ActionType
from app.models.budget import Budget
from app.core import agent_tools
from app.core import finance  # ✅ IMPORT SHARED FINANCE LOGIC
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# 1. Setup Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# 2. Safety Settings    
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}


# --- HELPER: Signature Generation for Deduplication ---
def _generate_signature(function_name: str, parameters: dict) -> str:
    """
    Creates a unique string signature for an action to prevent duplicates.
    Focuses on the core 'identity' of the action.
    """
    sig = function_name.lower()

    # Normalize parameters for comparison
    params = parameters or {}

    if function_name == "propose_budget_investigation":
        cat = params.get("category", "unknown").lower()
        sig += f":{cat}"

    elif function_name == "pay_bill":
        bill = params.get("bill_name", "unknown").lower()
        date = params.get("due_date", "unknown")
        sig += f":{bill}:{date}"

    elif function_name == "fund_goal":
        gid = str(params.get("goal_id", "unknown"))
        sig += f":{gid}"

    elif function_name == "create_goal":
        title = params.get("title", "unknown").lower()
        sig += f":{title}"

    elif function_name == "transfer_funds":
        src = params.get("from_acc", "").lower()
        dest = params.get("to_acc", "").lower()
        amt = str(int(params.get("amount", 0)))
        sig += f":{src}:{dest}:{amt}"

    return sig


# --- SUB-AGENT 1: THE DETECTIVE (Data Aggregation) ---
async def _detective_gather_intel(session: AsyncSession, user: User):
    """
    Gathers raw facts using the SHARED finance logic used by the Dashboard.
    """
    # 1. Savings & Liquidity
    savings_res = await session.exec(select(Savings).where(Savings.user_id == user.id))
    savings = savings_res.first()
    available_cash = savings.savings_available if savings else 0.0

    # 2. Upcoming Bills (Next 7 Days)
    upcoming_limit = datetime.now().date() + timedelta(days=7)
    bills_res = await session.exec(
        select(Bill).where(
            Bill.user_id == user.id,
            Bill.is_paid == False,
            Bill.due_date <= upcoming_limit,
        )
    )
    bills = bills_res.all()
    liability_total = sum(b.amount for b in bills)

    # 3. Active Goals
    goals_res = await session.exec(select(Goal).where(Goal.user_id == user.id))
    goals = goals_res.all()
    active_goals = [g for g in goals if not g.is_completed]

    # 4. Spending & Budget Stats (USING SHARED LOGIC)
    today = datetime.now()
    income = user.monthly_income or 0.0

    # Get monthly summary (Income, Expenses, Net Savings)
    summary = await finance.get_monthly_summary(
        session, user.id, today.month, today.year, income
    )

    # Get detailed breakdown (Allocated vs Spent vs Remaining)
    budget_breakdown = await finance.get_budget_vs_actual(
        session, user.id, today.month, today.year, income
    )

    # Detect Anomalies (Spent > Allocated by 20%)
    anomalies = []
    for item in budget_breakdown:
        # Only flag if user actually set a budget (Allocated > 0) and exceeded it significantly
        if item["status"] == "Over Budget" and item["allocated"] > 0:
            diff_percent = int(
                ((item["spent"] - item["allocated"]) / item["allocated"]) * 100
            )
            if diff_percent > 20:
                anomalies.append(
                    {
                        "category": item["category"],
                        "amount": item["spent"],
                        "average": item["allocated"],  # Using allocated as baseline
                        "diff_percent": diff_percent,
                    }
                )

    return {
        "cash": available_cash,
        "bills": bills,
        "liabilities": liability_total,
        "goals": active_goals,
        "spending_total": summary["total_expenses"],
        "budget_breakdown": budget_breakdown,
        "anomalies": anomalies,
        "market": agent_tools.get_market_context(),
    }


# --- SUB-AGENT 2: THE STRATEGIST (Python Math Proposals) ---
def _strategist_propose_actions(intel: Dict[str, Any], user: User) -> List[str]:
    """
    Generates strict mathematical proposals based on the Detective's Intel.
    """
    proposals = []

    # A. Bill Sweeper Proposal
    for bill in intel["bills"]:
        if intel["cash"] >= bill.amount:
            proposals.append(
                f"PROPOSAL: Pay Bill '{bill.biller_name}' (₹{bill.amount}) due {bill.due_date}. Priority: CRITICAL."
            )
        else:
            proposals.append(
                f"WARNING: Insufficient funds for Bill '{bill.biller_name}' (₹{bill.amount}). Manual Intervention Needed."
            )

    # B. Budget Alert Proposal
    for anomaly in intel["anomalies"]:
        proposals.append(
            f"PROPOSAL: Investigate {anomaly['category']} spend of ₹{anomaly['amount']:.2f} ({anomaly['diff_percent']}% over budget)."
        )

    # C. Wealth Allocation Proposal (Surplus Calculation)
    # Safe Buffer = 50% of Income (or 20k default)
    income = user.monthly_income or 50000
    safe_buffer = income * 0.50

    # Real Surplus = Cash - Liabilities - Buffer
    surplus = intel["cash"] - intel["liabilities"] - safe_buffer

    if surplus > 500:
        # We have free money! Suggest allocation.
        if intel["goals"]:
            # Prioritize High Priority Goals
            high_pri = [g for g in intel["goals"] if g.priority == "high"]
            target_goal = high_pri[0] if high_pri else intel["goals"][0]

            # Cap allocation at goal remaining amount
            remaining_needed = target_goal.total - target_goal.current
            alloc_amount = min(surplus * 0.8, remaining_needed)

            if alloc_amount > 0:
                proposals.append(
                    f"PROPOSAL: Fund Goal '{target_goal.title}' (ID: {target_goal.id}) with ₹{alloc_amount:.0f}. Priority: HIGH."
                )
        else:
            proposals.append(
                f"PROPOSAL: Create Goal 'Emergency Fund' (Target: ₹50000). User has surplus but no goals."
            )

        if surplus > 50000 and intel["market"]["Nifty50_Index"]["trend"] != "Bearish":
            proposals.append(
                f"PROPOSAL: Invest Surplus (₹5000). Amount available > ₹50k. Market Trend: {intel['market']['Nifty50_Index']['trend']}."
            )

    return proposals


# --- MAIN HEAD AGENT: THE CFO (LLM Orchestrator) ---
async def run_agentic_loop(session: AsyncSession, user: User):
    """
    The Master Orchestrator.
    1. Gathers Intel (Detective)
    2. Generates Proposals (Strategist)
    3. Decides & Executes (CFO/LLM)
    """
    print(f"🧠 [Head Agent] Starting cycle for: {user.full_name}")

    # 1. GATHER INTEL
    intel = await _detective_gather_intel(session, user)

    # 2. GENERATE STRATEGY PROPOSALS
    proposals = _strategist_propose_actions(intel, user)
    proposals_text = (
        "\n".join([f"- {p}" for p in proposals])
        if proposals
        else "No immediate mathematical actions needed."
    )

    # 3. FETCH EXISTING PENDING ACTIONS (To prevent dupes)
    existing_actions = await session.exec(
        select(AgentAction).where(
            AgentAction.user_id == user.id, AgentAction.status == ActionStatus.PENDING
        )
    )
    existing_sigs = {
        _generate_signature(a.function_name, a.parameters)
        for a in existing_actions.all()
    }

    # 4. THE CFO PROMPT
    system_instruction = f"""
    You are FinBuddy (The CFO), a Fiduciary Financial Agent for {user.full_name}.
    
    --- FINANCIAL STATE ---
    Income: ₹{user.monthly_income}
    Available Cash (Savings): ₹{intel['cash']}
    Pending Liabilities (Bills): ₹{intel['liabilities']}
    Total Spent This Month: ₹{intel['spending_total']}
    
    --- STRATEGIST PROPOSALS (Math-Based) ---
    {proposals_text}
    
    --- MARKET CONTEXT ---
    {intel['market']}
    
    --- YOUR TASK ---
    Review the proposals. As the CFO, you must AUTHORIZE actions using the tools.
    
    RULES:
    1. **Verify Liquidity:** Do not authorize transfers/investments if (Cash - Liabilities) is too low.
    2. **Prioritize:** Bills > Budget Alerts > Goals > Investments.
    3. **Enrich:** When calling tools, add warm, encouraging reasoning to the `reasoning` parameter.
    4. **Execute:** - If Strategist says "Pay Bill", call `pay_bill`.
       - If Strategist says "Fund Goal", call `fund_goal`.
       - If Strategist says "Create Goal", call `create_goal`.
       - If Strategist says "Investigate", call `propose_budget_investigation`.
    
    Do NOT chat. ONLY CALL TOOLS to execute the approved proposals.
    """

    # 5. EXECUTE (Reasoning Phase)
    tools_schema = [
        agent_tools.fund_goal,
        agent_tools.add_savings,
        agent_tools.create_goal,
        agent_tools.pay_bill,
        agent_tools.invest_surplus,
        agent_tools.secure_savings,
        agent_tools.propose_budget_investigation,
        agent_tools.update_dynamic_budget,
        agent_tools.log_financial_insight,
    ]

    # Safety Settings
    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }

    try:
        model = genai.GenerativeModel("gemini-2.5-flash", tools=tools_schema)
        chat = model.start_chat(enable_automatic_function_calling=False)
        response = chat.send_message(
            system_instruction, safety_settings=safety_settings
        )

        if not response.parts:
            print("🤔 [Head Agent] No actions authorized.")
            return

        for part in response.parts:
            if part.function_call:
                fn_name = part.function_call.name
                args = dict(part.function_call.args)

                # Deduplication Check
                sig = _generate_signature(fn_name, args)
                if sig in existing_sigs:
                    print(f"⚠️ [Head Agent] Duplicate action blocked: {sig}")
                    continue

                print(f"🤖 [Head Agent] Authorizing Action: {fn_name}")
                reasoning = args.get("reasoning", "Authorized by CFO Agent.")

                # Action Typing
                mapped_type = ActionType.ALERT
                if "investigation" in fn_name or "bill" in fn_name:
                    mapped_type = ActionType.ALERT
                elif "invest" in fn_name:
                    mapped_type = ActionType.INVESTMENT
                elif "fund" in fn_name or "create" in fn_name or "savings" in fn_name:
                    mapped_type = ActionType.SAVINGS
                elif "log" in fn_name:
                    mapped_type = ActionType.ALERT

                # Friendly Titles
                title = fn_name.replace("_", " ").title()
                if fn_name == "fund_goal":
                    title = "🎯 Goal Boost"
                if fn_name == "pay_bill":
                    title = "🧾 Bill Due"
                if fn_name == "invest_surplus":
                    title = "📈 Growth Move"
                if fn_name == "propose_budget_investigation":
                    title = "⚠️ Budget Alert"

                new_action = AgentAction(
                    user_id=user.id,
                    type=mapped_type,
                    title=title,
                    message=reasoning,
                    reasoning=reasoning,
                    function_name=fn_name,
                    parameters=args,
                    status=ActionStatus.PENDING,
                )
                session.add(new_action)
                existing_sigs.add(sig)

        await session.commit()
        print("✅ [Head Agent] Cycle Complete.")

    except Exception as e:
        print(f"❌ [Head Agent] Critical Failure: {e}")


# --- OTHER ENDPOINTS HELPERS (Chat & Response) ---


async def process_investigation_response(
    session: AsyncSession, action: AgentAction, user_response: str
) -> AgentAction:
    """
    Handles user reply to budget alerts.
    """
    print(f"🧠 [Agent] Processing investigation response for action {action.id}")

    params = action.parameters
    new_cost = params.get("new_cost", 0.0)
    category = params.get("category", "Unknown")

    user = await session.get(User, action.user_id)
    user_income = user.monthly_income if user and user.monthly_income > 0 else 50000.0

    system_instruction = f"""
    You are FinBuddy. A user responded to a budget alert for '{category}'.
    New Expense: ₹{new_cost:.2f}. Monthly Income: ₹{user_income:.2f}.
    
    User Response: "{user_response}"
    
    TASK:
    1. If user approves budget increase (e.g., "Yes, adjust it", "It's inflation", "New normal"):
       - CALL `update_dynamic_budget`. 
       - The `new_target_amount` MUST be exactly {new_cost}.
    2. If user denies (e.g., "One time", "Party", "No"):
       - Output text: "Alert dismissed. One-time expense."
    """

    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }

    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash", tools=[agent_tools.update_dynamic_budget]
        )
        chat = model.start_chat(enable_automatic_function_calling=False)
        response = chat.send_message(
            system_instruction, safety_settings=safety_settings
        )

        fn_call = None
        if response.parts and response.parts[0].function_call:
            fn_call = response.parts[0].function_call

        if fn_call and fn_call.name == "update_dynamic_budget":
            args = dict(fn_call.args)
            target_amt = args.get("new_target_amount")
            new_percent = target_amt / user_income

            budget_query = select(Budget).where(
                Budget.user_id == user.id, Budget.category == category
            )
            result = await session.exec(budget_query)
            existing_budget = result.one_or_none()

            if existing_budget:
                existing_budget.percentage = new_percent
                existing_budget.updated_at = datetime.utcnow()
                session.add(existing_budget)
            else:
                old_percent = finance.DEFAULT_INDIAN_BUDGET.get(category, 0.0)
                new_budget_entry = Budget(
                    user_id=user.id, category=category, percentage=new_percent
                )
                session.add(new_budget_entry)

            await session.commit()

            action.status = ActionStatus.EXECUTED
            action.message = f"✅ Budget Updated: {category} is now {new_percent*100:.1f}% of income. New Limit: ₹{target_amt:.0f}"
            action.reasoning = f"User approved: '{user_response}'"
        else:
            final_message = response.text.strip()
            action.status = ActionStatus.DISMISSED
            action.message = f"Alert dismissed: {final_message}"
            action.reasoning = f"User input: '{user_response}'"

        session.add(action)
        await session.commit()
        await session.refresh(action)
        return action

    except Exception as e:
        action.status = ActionStatus.FAILED
        action.message = f"❌ Error: {str(e)}"
        session.add(action)
        await session.commit()
        await session.refresh(action)
        return action


async def generate_budget_plan(session: AsyncSession, user: User):
    """
    Generates a full personalized budget plan structure.
    Returns structured JSON with Allocated/Spent/Remaining logic.
    """
    market_context = agent_tools.get_market_context()

    # Fetch current budget status from shared Finance logic
    today = datetime.now()
    budget_breakdown = await finance.get_budget_vs_actual(
        session, user.id, today.month, today.year, user.monthly_income or 0
    )

    # Format budget breakdown for LLM context
    budget_context_str = "\n".join(
        [
            f"- {b['category']}: Allocated ₹{b['allocated']}, Spent ₹{b['spent']}, Status: {b['status']}"
            for b in budget_breakdown
        ]
    )

    prompt = f"""
    Act as an Expert Financial Planner for {user.full_name}.
    
    Create a Personalized Monthly Budget Plan based on this data:
    - Income: ₹{user.monthly_income}
    - Risk Profile: {user.risk_tolerance}
    - Market Data: {market_context}
    
    CURRENT SPENDING STATUS:
    {budget_context_str}
    
    TASK:
    Generate a JSON response that categorizes the user's budget.
    For each category, provide:
    1. 'category': Name of the category
    2. 'allocated': Recommended allocation (based on income)
    3. 'spent': Actual spent so far (from context)
    4. 'remaining': allocated - spent
    
    Also provide a 'savings_strategy' summary and 'total_expenses'.
    
    OUTPUT FORMAT (JSON ONLY):
    {{
        "total_income": float,
        "total_expenses": float,
        "categories": [
            {{ "category": "string", "allocated": float, "spent": float, "remaining": float }}
        ],
        "savings_strategy": "string description",
        "market_adjustments": "string description"
    }}
    """

    model = genai.GenerativeModel(
        "gemini-2.5-flash", generation_config={"response_mime_type": "application/json"}
    )
    response = model.generate_content(prompt, safety_settings=SAFETY_SETTINGS)
    return response.text


async def agent_chat_response(session: AsyncSession, user: User, query: str):
    """
    Real-time Q&A with the financial agent.
    """
    # 1. Gather comprehensive context (using the Detective)
    intel = await _detective_gather_intel(session, user)

    goals_txt = "\n".join(
        [f"- {g.title}: ₹{g.current:.0f}/₹{g.total:.0f}" for g in intel["goals"]]
    )
    bills_txt = "\n".join(
        [f"- {b.biller_name}: ₹{b.amount} (Due: {b.due_date})" for b in intel["bills"]]
    )
    budget_txt = "\n".join(
        [
            f"- {b['category']}: Spent ₹{b['spent']} / {b['allocated']}"
            for b in intel["budget_breakdown"]
        ]
    )

    prompt = f"""
    You are FinBuddy, a smart financial assistant.
    User Query: "{query}"
    
    --- FINANCIAL SNAPSHOT ---
    Income: ₹{user.monthly_income}
    Available Cash (Savings): ₹{intel['cash']}
    Upcoming Bills: ₹{intel['liabilities']}
    Net Available (Cash - Bills): ₹{intel['cash'] - intel['liabilities']}
    Total Spent this Month: ₹{intel['spending_total']}
    
    --- BUDGET STATUS ---
    {budget_txt}
    
    --- GOALS & BILLS ---
    Active Goals:
    {goals_txt}
    
    Upcoming Bills:
    {bills_txt}
    
    --- MARKET TRENDS ---
    {intel['market']}
    
    INSTRUCTIONS:
    1. Be concise and friendly.
    2. If asking about affordability, use 'Net Available' to decide.
    3. Do NOT use markdown bolding (**). Plain text only.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt, safety_settings=SAFETY_SETTINGS)
    return response.text.replace("**", "").replace("*", "")
