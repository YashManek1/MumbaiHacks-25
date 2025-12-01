from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.goal import Goal, GoalCreate, FundGoalRequest
from app.models.savings import Savings, AddSavingsRequest
from app.models.goal_transaction import GoalTransaction

# ✅ Import Agent Loop
from app.core.agent_logic import run_agentic_loop

router = APIRouter()


# --- Pydantic Schemas ---
class SavingsInfoResponse(BaseModel):
    liquid_cash: float
    emergency_fund: float
    emergency_fund_target: float
    total_invested: float
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


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


@router.get("/savings/info", response_model=SavingsInfoResponse)
async def get_savings_info(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get user's savings information."""
    try:
        stmt = select(Savings).where(Savings.user_id == current_user.id)
        result = await session.execute(stmt)
        savings = result.scalar_one_or_none()

        if not savings:
            # Create default savings record for user
            savings = Savings(
                user_id=current_user.id,
                liquid_cash=0.0,
                emergency_fund=0.0,
                emergency_fund_target=50000.0,  # Default 50K target
                total_invested=0.0,
            )
            session.add(savings)
            await session.commit()
            await session.refresh(savings)

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


@router.put("/savings/update")
async def update_savings(
    liquid_cash: Optional[float] = None,
    emergency_fund: Optional[float] = None,
    emergency_fund_target: Optional[float] = None,
    total_invested: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update user's savings."""
    stmt = select(Savings).where(Savings.user_id == current_user.id)
    result = await session.execute(stmt)
    savings = result.scalar_one_or_none()

    if not savings:
        savings = Savings(user_id=current_user.id)
        session.add(savings)

    if liquid_cash is not None:
        savings.liquid_cash = liquid_cash
    if emergency_fund is not None:
        savings.emergency_fund = emergency_fund
    if emergency_fund_target is not None:
        savings.emergency_fund_target = emergency_fund_target
    if total_invested is not None:
        savings.total_invested = total_invested

    await session.commit()
    await session.refresh(savings)

    return {"message": "Savings updated successfully", "savings": savings}


@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    current_user: User = Depends(get_current_user),
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

        response = []
        for goal in goals:
            target = float(goal.target_amount or 1)
            current = float(goal.current_amount or 0)
            progress = min((current / target) * 100, 100) if target > 0 else 0

            response.append(
                GoalResponse(
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
            )

        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch goals: {str(e)}",
        )


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
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

        return GoalResponse(
            id=goal.id,
            name=goal.name,
            target_amount=float(goal.target_amount),
            current_amount=0.0,
            deadline=goal.deadline,
            category=goal.category,
            is_completed=False,
            progress_percentage=0.0,
            created_at=goal.created_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}",
        )


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific goal by ID."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    target = float(goal.target_amount or 1)
    current = float(goal.current_amount or 0)
    progress = min((current / target) * 100, 100) if target > 0 else 0

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


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    current_user: User = Depends(get_current_user),
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

    await session.commit()
    await session.refresh(goal)

    target = float(goal.target_amount or 1)
    current = float(goal.current_amount or 0)
    progress = min((current / target) * 100, 100) if target > 0 else 0

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


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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

    # Create contribution record
    goal_transaction = GoalTransaction(
        goal_id=goal.id,
        amount=contribution.amount,
        note=contribution.note,
    )
    session.add(goal_transaction)

    await session.commit()
    await session.refresh(goal)

    target = float(goal.target_amount or 1)
    current = float(goal.current_amount or 0)
    progress = min((current / target) * 100, 100) if target > 0 else 0

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


@router.get("/{goal_id}/contributions", response_model=List[ContributionResponse])
async def get_goal_contributions(
    goal_id: int,
    current_user: User = Depends(get_current_user),
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
