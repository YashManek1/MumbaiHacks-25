from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from sqlmodel import select

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.savings import Savings
from app.models.agent_data import AgentAction, ActionStatus
from app.core import finance

router = APIRouter()


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_data(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns high-level stats: Income, Total Expense, Net Savings, Liquid Cash.
    """
    today = datetime.now()
    income = current_user.monthly_income or 0.0

    # Get Monthly Summary (Shared Logic)
    summary = await finance.get_monthly_summary(
        session, current_user.id, today.month, today.year, income
    )

    # Get Real Liquid Cash (from Savings Model)
    savings_record = (
        await session.exec(select(Savings).where(Savings.user_id == current_user.id))
    ).first()
    liquid_cash = savings_record.savings_available if savings_record else 0.0

    return {
        "period": f"{today.strftime('%B %Y')}",
        "monthly_income": income,
        "total_expenses": summary["total_expenses"],
        "cash_flow_savings": summary["net_savings"],  # Income - Expenses
        "available_liquid_cash": liquid_cash,  # Money in Savings Account ready to use
        "savings_rate": summary["savings_rate"],
    }


@router.get("/budget-breakdown", response_model=List[Dict[str, Any]])
async def get_budget_status(
    month: int = None,
    year: int = None,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns row-by-row data for the Budget Table: Category, Allocated, Spent, Remaining.
    """
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year

    income = current_user.monthly_income or 0.0

    return await finance.get_budget_vs_actual(
        session, current_user.id, month, year, income
    )


@router.get("/trends", response_model=List[Dict[str, Any]])
async def get_six_month_trends(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns data for the 6-month bar chart.
    """
    return await finance.get_six_month_trend(session, current_user.id)


@router.get("/alerts", response_model=List[Dict[str, Any]])
async def get_active_alerts(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Fetches active PENDING alerts for the notification center.
    """
    query = (
        select(AgentAction)
        .where(
            AgentAction.user_id == current_user.id,
            AgentAction.status == ActionStatus.PENDING,
            AgentAction.type == "ALERT",  # Only fetch critical alerts
        )
        .order_by(AgentAction.created_at.desc())
    )

    alerts = (await session.exec(query)).all()
    return [
        {"id": a.id, "title": a.title, "message": a.message, "date": a.created_at}
        for a in alerts
    ]
