from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.banking import Bill, BillCreate

router = APIRouter()

# --- BILLS ENDPOINTS ---


@router.post("/bills", response_model=Bill)
async def create_bill(
    bill_in: BillCreate,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Add a recurring bill (e.g., Netflix, Rent).
    """
    bill = Bill(user_id=current_user.id, **bill_in.dict())
    session.add(bill)
    await session.commit()
    await session.refresh(bill)
    return bill


@router.get("/bills", response_model=List[Bill])
async def get_bills(
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get list of all upcoming/unpaid bills.
    """
    result = await session.exec(select(Bill).where(Bill.user_id == current_user.id))
    return result.all()
