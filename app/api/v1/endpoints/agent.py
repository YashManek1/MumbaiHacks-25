from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Dict, Any
from pydantic import BaseModel
import json

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.agent_data import AgentAction, ActionStatus
from app.core.agent_logic import (
    run_agentic_loop,
    process_investigation_response,
    generate_budget_plan,
    agent_chat_response,
)
from app.core import agent_tools

router = APIRouter()


# --- Request/Response Models ---
class InvestigationResponse(BaseModel):
    user_response: str


class ChatRequest(BaseModel):
    query: str


class ChatResponse(BaseModel):
    response: str


# --- 1. Trigger Analysis (The "Refresh" Button) ---
@router.post("/analyze")
async def trigger_agent_analysis(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Manually triggers the Agent to scan transactions and market data.
    """
    await run_agentic_loop(session, current_user)
    return {
        "message": "Agent analysis initiated. Check /actions/pending for new tasks."
    }


# --- 2. Get Pending Actions (The "Agent Inbox") ---
@router.get("/actions/pending", response_model=List[AgentAction])
async def get_pending_actions(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    [NEW] Returns ONLY the actions waiting for user input/approval.
    Use this to show the "Notification Badge" count or the "Tasks" list.
    """
    result = await session.exec(
        select(AgentAction)
        .where(
            AgentAction.user_id == current_user.id,
            AgentAction.status == ActionStatus.PENDING,
        )
        .order_by(AgentAction.created_at.desc())
    )
    return result.all()


# --- 3. Get All History (The "Activity Log") ---
@router.get("/actions/history", response_model=List[AgentAction])
async def get_action_history(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns the full history of interactions (Executed, Dismissed, Pending).
    """
    result = await session.exec(
        select(AgentAction)
        .where(AgentAction.user_id == current_user.id)
        .order_by(AgentAction.created_at.desc())
    )
    return result.all()


# --- 4. Execute Action (Approve Button) ---
@router.post("/actions/{action_id}/execute")
async def execute_action(
    action_id: int,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    User clicks "Approve" -> System executes the tool.
    """
    action = await session.get(AgentAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Action not found"
        )

    result = {"status": "failed", "details": "Tool execution failed"}

    try:
        func = getattr(agent_tools, action.function_name, None)
        if func:
            result = func(**action.parameters)
            action.status = ActionStatus.EXECUTED
            action.message = f"✅ DONE: {result.get('details')}"
        else:
            action.status = ActionStatus.FAILED
            action.message = f"❌ Error: Tool '{action.function_name}' not implemented."

    except Exception as e:
        action.status = ActionStatus.FAILED
        action.message = f"❌ Execution Exception: {str(e)}"

    session.add(action)
    await session.commit()
    await session.refresh(action)
    return result


# --- 5. Dismiss Action (Ignore/Reject Button) ---
@router.post("/actions/{action_id}/dismiss")
async def dismiss_action(
    action_id: int,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    [NEW] User clicks "Dismiss" or "Ignore".
    Marks the action as DISMISSED so it leaves the Pending list.
    """
    action = await session.get(AgentAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Action not found"
        )

    action.status = ActionStatus.DISMISSED
    action.message = "User dismissed this suggestion."

    session.add(action)
    await session.commit()
    return {"status": "success", "message": "Action dismissed"}


# --- 6. Respond to Investigation (The "Reply" Box) ---
@router.post("/actions/{action_id}/investigate", response_model=AgentAction)
async def process_investigation(
    action_id: int,
    response_data: InvestigationResponse,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    User types a reply to an Agent question (e.g., "Yes, increase budget").
    """
    action = await session.get(AgentAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Action not found"
        )

    if action.status != ActionStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This action is no longer pending.",
        )

    updated_action = await process_investigation_response(
        session, action, response_data.user_response
    )
    return updated_action


# --- 7. Generate Personalized Budget (Full Report) ---
@router.post("/budget/generate")
async def generate_budget(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Generates a full AI budget plan JSON.
    """
    try:
        json_response = await generate_budget_plan(session, current_user)
        # Gemini returns a string, we parse it to JSON for the frontend
        return json.loads(json_response)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate budget: {str(e)}"
        )


# --- 8. Real-Time Chat (The "Ask FinMate" Box) ---
@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    chat_request: ChatRequest,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Chat directly with the Agent about your finances.
    """
    try:
        reply = await agent_chat_response(session, current_user, chat_request.query)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent chat failed: {str(e)}")
