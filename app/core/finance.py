from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, and_, extract
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.user import User

# --- 1. CORE CALCULATIONS ---


def calculate_volatility(amounts: List[float]) -> float:
    """Calculates standard deviation of a list of amounts."""
    if not amounts or len(amounts) < 2:
        return 0.0
    mean = sum(amounts) / len(amounts)
    variance = sum((x - mean) ** 2 for x in amounts) / (len(amounts) - 1)
    return variance**0.5


def classify_user_segment(monthly_income: float) -> Dict[str, str]:
    """Classifies user based on income for tailored advice."""
    if monthly_income < 30000:
        return {"class": "Lower Income", "strategy": "Debt Reduction & Emergency Fund"}
    elif monthly_income < 100000:
        return {"class": "Middle Income", "strategy": "Tax Saving & Moderate Growth"}
    else:
        return {
            "class": "Upper Income",
            "strategy": "Wealth Creation & Diversification",
        }


# --- 2. DASHBOARD ANALYTICS (Shared by API & Agent) ---


async def get_monthly_summary(
    session: AsyncSession, user_id: int, month: int, year: int, income: float
) -> Dict[str, float]:
    """
    Calculates Total Expenses, Net Savings (Income - Exp), and Savings Rate.
    """
    # Sum of expenses (negative amounts)
    query = select(func.sum(Transaction.amount)).where(
        Transaction.user_id == user_id,
        extract("month", Transaction.transaction_date) == month,
        extract("year", Transaction.transaction_date) == year,
        Transaction.amount < 0,
    )
    result = await session.exec(query)
    total_expenses = abs(result.one_or_none() or 0.0)

    # Logic: Savings = Income - Expenses (Cash Flow view)
    net_savings = max(0, income - total_expenses)
    savings_rate = (net_savings / income * 100) if income > 0 else 0

    return {
        "income": income,
        "total_expenses": total_expenses,
        "net_savings": net_savings,
        "savings_rate": round(savings_rate, 1),
    }


async def get_budget_vs_actual(
    session: AsyncSession, user_id: int, month: int, year: int, income: float
) -> List[Dict[str, Any]]:
    """
    Returns the detailed breakdown: Allocated vs Spent vs Remaining per category.
    """
    # 1. Get User's Budget Rules (Allocations)
    budget_rules_query = select(Budget).where(Budget.user_id == user_id)
    budget_rules = (await session.exec(budget_rules_query)).all()

    # 2. Get Actual Spending per Category
    spending_query = (
        select(Transaction.category, func.sum(Transaction.amount))
        .where(
            Transaction.user_id == user_id,
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year,
            Transaction.amount < 0,
        )
        .group_by(Transaction.category)
    )

    spending_results = (await session.exec(spending_query)).all()
    spending_map = {cat: abs(amt) for cat, amt in spending_results}

    # 3. Default Indian Budget Categories if no rules exist
    DEFAULT_ALLOCATION = {
        "Housing & Utilities": 0.35,
        "Groceries & Essentials": 0.20,
        "Transportation": 0.10,
        "Dining & Lifestyle": 0.10,
        "Health & Medical": 0.05,
        "Savings & Investments": 0.20,
    }

    # Merge Logic
    report = []
    processed_categories = set()

    # Process defined budgets
    for rule in budget_rules:
        processed_categories.add(rule.category)
        allocated = income * rule.percentage
        spent = spending_map.get(rule.category, 0.0)
        report.append(
            {
                "category": rule.category,
                "allocated": round(allocated, 0),
                "spent": round(spent, 0),
                "remaining": round(allocated - spent, 0),
                "status": "Over Budget" if spent > allocated else "On Track",
            }
        )

    # Process remaining spending that had no budget rule
    for category, amount in spending_map.items():
        if category not in processed_categories:
            # Check if we have a default for it
            default_pct = DEFAULT_ALLOCATION.get(category, 0.0)
            allocated = income * default_pct
            report.append(
                {
                    "category": category,
                    "allocated": round(allocated, 0),
                    "spent": round(amount, 0),
                    "remaining": round(allocated - amount, 0),
                    "status": (
                        "Unbudgeted"
                        if allocated == 0
                        else ("Over Budget" if amount > allocated else "On Track")
                    ),
                }
            )

    return report


async def get_six_month_trend(
    session: AsyncSession, user_id: int
) -> List[Dict[str, Any]]:
    """
    Returns [ {month: 'Nov', income: X, expense: Y}, ... ] for last 6 months.
    """
    trends = []
    today = date.today()

    # Loop back 6 months
    for i in range(5, -1, -1):
        # Calculate date range for that month
        # Note: Simplification for brevity, precise date math is ideal
        target_month = (today.month - i - 1) % 12 + 1
        target_year = today.year if today.month - i > 0 else today.year - 1
        month_label = datetime(target_year, target_month, 1).strftime("%b")

        # Get Expenses
        exp_q = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            extract("month", Transaction.transaction_date) == target_month,
            extract("year", Transaction.transaction_date) == target_year,
            Transaction.amount < 0,
        )
        exp = abs((await session.exec(exp_q)).one_or_none() or 0.0)

        # Get Income (Positive transactions) - assuming user marks income in transactions
        # Or we can just use the fixed monthly income if transactions don't capture salary
        # For this chart, let's use Actual Income Transactions if available
        inc_q = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            extract("month", Transaction.transaction_date) == target_month,
            extract("year", Transaction.transaction_date) == target_year,
            Transaction.amount > 0,
        )
        inc = (await session.exec(inc_q)).one_or_none() or 0.0

        trends.append(
            {
                "month": month_label,
                "year": target_year,
                "expense": round(exp, 0),
                "income": round(inc, 0),
            }
        )

    return trends
