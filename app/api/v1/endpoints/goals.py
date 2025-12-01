"""
Goals and Savings API endpoints.
Matches frontend field names exactly.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.goal import Goal
from app.models.savings import Savings
from app.models.goal_transaction import GoalTransaction

router = APIRouter()


# ============ Pydantic Schemas (matching frontend) ============


class GoalCreate(BaseModel):
    title: str
    total: float
    monthly_contribution: float = 100.0
    priority: str = "medium"
    icon: str = "🎯"


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    total: Optional[float] = None
    monthly_contribution: Optional[float] = None
    priority: Optional[str] = None
    icon: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    current: float
    total: float
    priority: str
    monthly_contribution: float
    estimated_completion: Optional[str] = None
    icon: str
    is_completed: bool
    progress: float
    remaining: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FundGoalRequest(BaseModel):
    amount: float


class AddSavingsRequest(BaseModel):
    amount: float


class SavingsInfoResponse(BaseModel):
    total_funds: float
    savings_allocated: float
    savings_available: float
    monthly_income: float
    monthly_savings_rate: float
    # Computed fields for frontend
    total_goals_amount: float = 0.0
    total_funded: float = 0.0
    overall_progress: float = 0.0
    completed_goals: int = 0
    total_goals: int = 0
    monthly_contributions: float = 0.0
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


class SavingsUpdate(BaseModel):
    total_funds: Optional[float] = None
    savings_allocated: Optional[float] = None
    savings_available: Optional[float] = None
    monthly_income: Optional[float] = None
    monthly_savings_rate: Optional[float] = None


# ============ Helper Functions ============


def calculate_estimated_completion(current: float, total: float, monthly: float) -> str:
    """Calculate estimated completion date."""
    if monthly <= 0:
        return "N/A"
    remaining = total - current
    if remaining <= 0:
        return "Completed"
    months = remaining / monthly
    from datetime import timedelta
    completion = datetime.now() + timedelta(days=months * 30)
    return completion.strftime("%b %Y")


def goal_to_response(goal: Goal) -> dict:
    """Convert Goal model to response dict matching frontend."""
    current_val = float(goal.current or 0)
    total_val = float(goal.total or 1)
    progress = (current_val / total_val * 100) if total_val > 0 else 0
    remaining = max(total_val - current_val, 0)
    
    return {
        "id": goal.id,
        "title": goal.title,
        "icon": goal.icon or "🎯",
        "current": current_val,
        "total": total_val,
        "priority": goal.priority or "medium",
        "monthly_contribution": float(goal.monthly_contribution or 100),
        "estimated_completion": goal.estimated_completion or calculate_estimated_completion(
            current_val, total_val, float(goal.monthly_contribution or 100)
        ),
        "progress": round(progress, 1),
        "remaining": remaining,
        "is_completed": goal.is_completed or current_val >= total_val,
        "created_at": goal.created_at.isoformat() if goal.created_at else None,
    }


async def get_or_create_savings(session: AsyncSession, user_id: int) -> Savings:
    """Get user's savings record or create a default one."""
    stmt = select(Savings).where(Savings.user_id == user_id)
    result = await session.execute(stmt)
    savings = result.scalar_one_or_none()

    if not savings:
        savings = Savings(
            user_id=user_id,
            total_funds=0.0,
            savings_allocated=0.0,
            savings_available=0.0,
            monthly_income=0.0,
            monthly_savings_rate=0.0,
        )
        session.add(savings)
        await session.commit()
        await session.refresh(savings)

    return savings


# ============ Goals Endpoints ============


@router.get("/", response_model=List[dict])
async def get_goals(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all goals for the current user."""
    try:
        stmt = (
            select(Goal)
            .where(Goal.user_id == current_user.id)
            .order_by(Goal.created_at.desc())
        )
        result = await session.execute(stmt)
        goals = result.scalars().all()

        return [goal_to_response(goal) for goal in goals]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch goals: {str(e)}",
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new savings goal."""
    try:
        estimated = calculate_estimated_completion(
            0, goal_data.total, goal_data.monthly_contribution
        )
        
        goal = Goal(
            user_id=current_user.id,
            title=goal_data.title,
            total=goal_data.total,
            current=0.0,
            monthly_contribution=goal_data.monthly_contribution,
            priority=goal_data.priority,
            icon=goal_data.icon,
            estimated_completion=estimated,
            is_completed=False,
        )
        session.add(goal)
        await session.commit()
        await session.refresh(goal)

        return goal_to_response(goal)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}",
        )


@router.get("/{goal_id}")
async def get_goal(
    goal_id: int,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific goal by ID."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return goal_to_response(goal)


@router.patch("/{goal_id}")
async def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update a goal."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal_data.title is not None:
        goal.title = goal_data.title
    if goal_data.total is not None:
        goal.total = goal_data.total
    if goal_data.monthly_contribution is not None:
        goal.monthly_contribution = goal_data.monthly_contribution
    if goal_data.priority is not None:
        goal.priority = goal_data.priority
    if goal_data.icon is not None:
        goal.icon = goal_data.icon

    # Recalculate estimated completion
    goal.estimated_completion = calculate_estimated_completion(
        float(goal.current or 0), float(goal.total or 1), float(goal.monthly_contribution or 100)
    )

    # Check if goal is completed
    if goal.current >= goal.total:
        goal.is_completed = True

    goal.updated_at = datetime.utcnow()

    await session.commit()
    await session.refresh(goal)

    return goal_to_response(goal)


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete a goal and refund any funded amount."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Refund current amount to savings
    refund_amount = float(goal.current or 0)
    if refund_amount > 0:
        savings = await get_or_create_savings(session, current_user.id)
        savings.savings_available += refund_amount
        savings.savings_allocated -= refund_amount
        session.add(savings)

    await session.delete(goal)
    await session.commit()

    return {"message": "Goal deleted", "refunded_amount": refund_amount}


@router.post("/{goal_id}/fund")
async def fund_goal(
    goal_id: int,
    fund_data: FundGoalRequest,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Fund a goal from available savings."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    savings = await get_or_create_savings(session, current_user.id)
    
    if fund_data.amount > savings.savings_available:
        raise HTTPException(status_code=400, detail="Insufficient savings available")

    if fund_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Transfer from savings to goal
    goal.current = float(goal.current or 0) + fund_data.amount
    savings.savings_available -= fund_data.amount
    savings.savings_allocated += fund_data.amount

    # Check if goal is completed
    if goal.current >= goal.total:
        goal.is_completed = True
        goal.estimated_completion = "Completed"

    goal.updated_at = datetime.utcnow()
    savings.updated_at = datetime.utcnow()

    # Record the transaction
    goal_transaction = GoalTransaction(
        goal_id=goal.id,
        amount=fund_data.amount,
        note="Funded from savings",
    )
    session.add(goal_transaction)

    session.add(goal)
    session.add(savings)
    await session.commit()
    await session.refresh(goal)

    return {"message": "Goal funded successfully", "goal": goal_to_response(goal)}


# ============ Savings Endpoints ============


@router.get("/savings/info", response_model=SavingsInfoResponse)
async def get_savings_info(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get user's savings information with computed goal stats."""
    try:
        savings = await get_or_create_savings(session, current_user.id)

        # Get goals stats
        goals_stmt = select(Goal).where(Goal.user_id == current_user.id)
        goals_result = await session.execute(goals_stmt)
        goals = goals_result.scalars().all()

        total_goals_amount = sum(float(g.total or 0) for g in goals)
        total_funded = sum(float(g.current or 0) for g in goals)
        completed_goals = sum(1 for g in goals if g.is_completed)
        monthly_contributions = sum(float(g.monthly_contribution or 0) for g in goals)
        overall_progress = (total_funded / total_goals_amount * 100) if total_goals_amount > 0 else 0

        return SavingsInfoResponse(
            total_funds=float(savings.total_funds or 0),
            savings_allocated=float(savings.savings_allocated or 0),
            savings_available=float(savings.savings_available or 0),
            monthly_income=float(savings.monthly_income or 0),
            monthly_savings_rate=float(savings.monthly_savings_rate or 0),
            total_goals_amount=total_goals_amount,
            total_funded=total_funded,
            overall_progress=round(overall_progress, 1),
            completed_goals=completed_goals,
            total_goals=len(goals),
            monthly_contributions=monthly_contributions,
            last_updated=savings.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch savings info: {str(e)}",
        )


@router.post("/savings/add")
async def add_savings(
    savings_data: AddSavingsRequest,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Add money to available savings."""
    try:
        if savings_data.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        savings = await get_or_create_savings(session, current_user.id)
        
        savings.savings_available += savings_data.amount
        savings.total_funds += savings_data.amount
        savings.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(savings)

        return {
            "message": f"Successfully added ${savings_data.amount:.2f} to savings",
            "savings_available": savings.savings_available,
            "total_funds": savings.total_funds,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add savings: {str(e)}",
        )


@router.put("/savings/update", response_model=SavingsInfoResponse)
async def update_savings(
    savings_data: SavingsUpdate,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update user's savings."""
    try:
        savings = await get_or_create_savings(session, current_user.id)

        if savings_data.total_funds is not None:
            savings.total_funds = savings_data.total_funds
        if savings_data.savings_allocated is not None:
            savings.savings_allocated = savings_data.savings_allocated
        if savings_data.savings_available is not None:
            savings.savings_available = savings_data.savings_available
        if savings_data.monthly_income is not None:
            savings.monthly_income = savings_data.monthly_income
        if savings_data.monthly_savings_rate is not None:
            savings.monthly_savings_rate = savings_data.monthly_savings_rate

        savings.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(savings)

        # Get goals stats for response
        goals_stmt = select(Goal).where(Goal.user_id == current_user.id)
        goals_result = await session.execute(goals_stmt)
        goals = goals_result.scalars().all()

        total_goals_amount = sum(float(g.total or 0) for g in goals)
        total_funded = sum(float(g.current or 0) for g in goals)
        completed_goals = sum(1 for g in goals if g.is_completed)
        monthly_contributions = sum(float(g.monthly_contribution or 0) for g in goals)
        overall_progress = (total_funded / total_goals_amount * 100) if total_goals_amount > 0 else 0

        return SavingsInfoResponse(
            total_funds=float(savings.total_funds or 0),
            savings_allocated=float(savings.savings_allocated or 0),
            savings_available=float(savings.savings_available or 0),
            monthly_income=float(savings.monthly_income or 0),
            monthly_savings_rate=float(savings.monthly_savings_rate or 0),
            total_goals_amount=total_goals_amount,
            total_funded=total_funded,
            overall_progress=round(overall_progress, 1),
            completed_goals=completed_goals,
            total_goals=len(goals),
            monthly_contributions=monthly_contributions,
            last_updated=savings.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update savings: {str(e)}",
        )
