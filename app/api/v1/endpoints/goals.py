from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.goal import Goal, GoalCreate, FundGoalRequest
from app.models.savings import Savings, AddSavingsRequest

# ✅ Import Agent Loop
from app.core.agent_logic import run_agentic_loop

router = APIRouter()


# ============ Helper Functions ============


def calculate_estimated_completion(current: float, total: float, monthly: float) -> str:
    if monthly <= 0:
        return "N/A"
    remaining = total - current
    if remaining <= 0:
        return "Completed"
    months = remaining / monthly
    completion = datetime.now() + timedelta(days=months * 30)
    return completion.strftime("%b %Y")


def goal_to_dict(goal: Goal) -> dict:
    progress = (goal.current / goal.total * 100) if goal.total > 0 else 0
    remaining = max(goal.total - goal.current, 0)
    return {
        "id": goal.id,
        "title": goal.title,
        "icon": goal.icon,
        "current": goal.current,
        "total": goal.total,
        "priority": goal.priority,
        "monthly_contribution": goal.monthly_contribution,
        "estimated_completion": goal.estimated_completion,
        "progress": round(progress, 1),
        "remaining": remaining,
        "is_completed": goal.current >= goal.total,
        "created_at": goal.created_at.isoformat() if goal.created_at else None,
    }


async def get_or_create_savings(session: AsyncSession, user_id: int) -> Savings:
    result = await session.exec(select(Savings).where(Savings.user_id == user_id))
    savings = result.first()
    if not savings:
        savings = Savings(user_id=user_id)
        session.add(savings)
        await session.commit()
        await session.refresh(savings)
    return savings


# ============ Goals CRUD ============


@router.get("/", response_model=List[dict])
async def get_all_goals(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Goal).where(Goal.user_id == current_user.id))
    goals = result.all()
    return [goal_to_dict(goal) for goal in goals]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    estimated = calculate_estimated_completion(
        0, goal_data.total, goal_data.monthly_contribution
    )
    goal = Goal(
        user_id=current_user.id,
        title=goal_data.title,
        total=goal_data.total,
        monthly_contribution=goal_data.monthly_contribution,
        priority=goal_data.priority,
        icon=goal_data.icon,
        current=0.0,
        estimated_completion=estimated,
    )
    session.add(goal)
    await session.commit()
    await session.refresh(goal)

    # ✅ Trigger Agent
    background_tasks.add_task(run_agentic_loop, session, current_user)

    return goal_to_dict(goal)


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    refund_amount = goal.current
    if refund_amount > 0:
        savings = await get_or_create_savings(session, current_user.id)
        savings.savings_available += refund_amount
        session.add(savings)

    await session.delete(goal)
    await session.commit()

    # ✅ Trigger Agent
    background_tasks.add_task(run_agentic_loop, session, current_user)

    return {"message": "Goal deleted", "refunded_amount": refund_amount}


@router.post("/{goal_id}/fund")
async def fund_goal(
    goal_id: int,
    fund_data: FundGoalRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    savings = await get_or_create_savings(session, current_user.id)
    if fund_data.amount > savings.savings_available:
        raise HTTPException(status_code=400, detail="Insufficient savings")

    goal.current += fund_data.amount
    savings.savings_available -= fund_data.amount

    session.add(goal)
    session.add(savings)
    await session.commit()

    # ✅ Trigger Agent
    background_tasks.add_task(run_agentic_loop, session, current_user)

    return {"message": "Funded", "goal": goal_to_dict(goal)}


# ============ Savings Endpoints ============


@router.get("/savings/info")
async def get_savings_info(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get comprehensive savings information, including goal progress.
    """
    savings = await get_or_create_savings(session, current_user.id)

    # Calculate goals data
    result = await session.exec(select(Goal).where(Goal.user_id == current_user.id))
    goals = result.all()

    total_goals_amount = sum(g.total for g in goals)
    total_funded = sum(g.current for g in goals)
    completed_goals = sum(1 for g in goals if g.current >= g.total)
    monthly_contributions = sum(g.monthly_contribution for g in goals)

    # Avoid division by zero
    overall_progress = (
        (total_funded / total_goals_amount * 100) if total_goals_amount > 0 else 0
    )

    return {
        "total_funds": savings.total_funds,
        "savings_allocated": savings.savings_allocated,
        "savings_available": savings.savings_available,
        "monthly_savings_rate": savings.monthly_savings_rate,
        "monthly_income": current_user.monthly_income or 0,
        "total_goals_amount": total_goals_amount,
        "total_funded": total_funded,
        "overall_progress": round(overall_progress, 1),
        "completed_goals": completed_goals,
        "total_goals": len(goals),
        "monthly_contributions": monthly_contributions,
    }


@router.post("/savings/add")
async def add_savings(
    savings_data: AddSavingsRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    savings = await get_or_create_savings(session, current_user.id)
    savings.total_funds += savings_data.amount
    savings.savings_available += savings_data.amount
    session.add(savings)
    await session.commit()

    # ✅ Trigger Agent
    background_tasks.add_task(run_agentic_loop, session, current_user)

    return {"message": "Added", "new_available": savings.savings_available}
