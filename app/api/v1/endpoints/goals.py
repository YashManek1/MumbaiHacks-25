"""
Goals and Savings API endpoints.
Handles CRUD operations for savings goals and user savings information.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel
from datetime import datetime, date

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.goal import Goal
from app.models.savings import Savings
from app.models.goal_transaction import GoalTransaction

router = APIRouter()


# ============ Pydantic Schemas ============


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[date] = None
    category: Optional[str] = "general"


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    deadline: Optional[date] = None
    category: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[date] = None
    category: Optional[str] = None
    is_completed: bool
    progress_percentage: float
    created_at: datetime

    class Config:
        from_attributes = True


class ContributionCreate(BaseModel):
    amount: float
    note: Optional[str] = None


class ContributionResponse(BaseModel):
    id: int
    goal_id: int
    amount: float
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsInfoResponse(BaseModel):
    liquid_cash: float
    emergency_fund: float
    emergency_fund_target: float
    total_invested: float
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


class SavingsUpdate(BaseModel):
    liquid_cash: Optional[float] = None
    emergency_fund: Optional[float] = None
    emergency_fund_target: Optional[float] = None
    total_invested: Optional[float] = None


# ============ Helper Functions ============


def calculate_progress(current: float, target: float) -> float:
    """Calculate progress percentage for a goal."""
    if target <= 0:
        return 0.0
    return min((current / target) * 100, 100)


def goal_to_response(goal: Goal) -> GoalResponse:
    """Convert Goal model to GoalResponse."""
    target = float(goal.target_amount or 0)
    current = float(goal.current_amount or 0)
    progress = calculate_progress(current, target)

    return GoalResponse(
        id=goal.id,
        name=goal.name,
        target_amount=target,
        current_amount=current,
        deadline=goal.deadline,
        category=goal.category,
        is_completed=goal.is_completed or False,
        progress_percentage=round(progress, 1),
        created_at=goal.created_at,
    )


async def get_or_create_savings(session: AsyncSession, user_id: int) -> Savings:
    """Get user's savings record or create a default one."""
    stmt = select(Savings).where(Savings.user_id == user_id)
    result = await session.execute(stmt)
    savings = result.scalar_one_or_none()

    if not savings:
        savings = Savings(
            user_id=user_id,
            liquid_cash=0.0,
            emergency_fund=0.0,
            emergency_fund_target=50000.0,
            total_invested=0.0,
        )
        session.add(savings)
        await session.commit()
        await session.refresh(savings)

    return savings


# ============ Goals Endpoints ============


@router.get("/", response_model=List[GoalResponse])
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


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new savings goal."""
    try:
        goal = Goal(
            user_id=current_user.id,
            name=goal_data.name,
            target_amount=goal_data.target_amount,
            current_amount=0.0,
            deadline=goal_data.deadline,
            category=goal_data.category or "general",
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


@router.get("/{goal_id}", response_model=GoalResponse)
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


@router.put("/{goal_id}", response_model=GoalResponse)
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

    if goal_data.name is not None:
        goal.name = goal_data.name
    if goal_data.target_amount is not None:
        goal.target_amount = goal_data.target_amount
    if goal_data.deadline is not None:
        goal.deadline = goal_data.deadline
    if goal_data.category is not None:
        goal.category = goal_data.category

    # Check if goal is completed
    if goal.current_amount >= goal.target_amount:
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
    """Delete a goal."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await session.delete(goal)
    await session.commit()

    return {"message": "Goal deleted successfully"}


@router.post("/{goal_id}/contribute", response_model=GoalResponse)
async def contribute_to_goal(
    goal_id: int,
    contribution: ContributionCreate,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Add a contribution to a goal."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if contribution.amount <= 0:
        raise HTTPException(
            status_code=400, detail="Contribution amount must be positive"
        )

    # Update goal amount
    goal.current_amount = float(goal.current_amount or 0) + contribution.amount

    # Check if goal is completed
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True

    goal.updated_at = datetime.utcnow()

    # Create contribution record
    goal_transaction = GoalTransaction(
        goal_id=goal.id,
        amount=contribution.amount,
        note=contribution.note,
    )
    session.add(goal_transaction)

    await session.commit()
    await session.refresh(goal)

    return goal_to_response(goal)


@router.get("/{goal_id}/contributions", response_model=List[ContributionResponse])
async def get_goal_contributions(
    goal_id: int,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all contributions for a goal."""
    # Verify goal belongs to user
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Get contributions
    stmt = (
        select(GoalTransaction)
        .where(GoalTransaction.goal_id == goal_id)
        .order_by(GoalTransaction.created_at.desc())
    )
    result = await session.execute(stmt)
    contributions = result.scalars().all()

    return [
        ContributionResponse(
            id=c.id,
            goal_id=c.goal_id,
            amount=float(c.amount),
            note=c.note,
            created_at=c.created_at,
        )
        for c in contributions
    ]


# ============ Savings Endpoints ============


@router.get("/savings/info", response_model=SavingsInfoResponse)
async def get_savings_info(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get user's savings information."""
    try:
        savings = await get_or_create_savings(session, current_user.id)

        return SavingsInfoResponse(
            liquid_cash=float(savings.liquid_cash or 0),
            emergency_fund=float(savings.emergency_fund or 0),
            emergency_fund_target=float(savings.emergency_fund_target or 50000),
            total_invested=float(savings.total_invested or 0),
            last_updated=savings.updated_at if hasattr(savings, "updated_at") else None,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch savings info: {str(e)}",
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

        if savings_data.liquid_cash is not None:
            savings.liquid_cash = savings_data.liquid_cash
        if savings_data.emergency_fund is not None:
            savings.emergency_fund = savings_data.emergency_fund
        if savings_data.emergency_fund_target is not None:
            savings.emergency_fund_target = savings_data.emergency_fund_target
        if savings_data.total_invested is not None:
            savings.total_invested = savings_data.total_invested

        savings.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(savings)

        return SavingsInfoResponse(
            liquid_cash=float(savings.liquid_cash or 0),
            emergency_fund=float(savings.emergency_fund or 0),
            emergency_fund_target=float(savings.emergency_fund_target or 50000),
            total_invested=float(savings.total_invested or 0),
            last_updated=savings.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update savings: {str(e)}",
        )
