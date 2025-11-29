from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import date

from app.api import deps
from app.core.database import get_session
from app.models.user import User
from app.models.transaction import Transaction, TransactionRead, TransactionUpdate
from app.utils.parsers import parse_csv
from app.core.agent_logic import run_agentic_loop

router = APIRouter()


# --- 1. Upload Endpoint ---
@router.post("/upload", response_model=List[TransactionRead])
async def upload_transactions(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    content = await file.read()
    new_transactions_data = []

    # A. Handle CSV
    if file.filename.endswith(".csv"):
        new_transactions_data = parse_csv(content)
    else:
        raise HTTPException(
            status_code=400, detail="Unsupported file format or parsing failed."
        )

    # B. Save to DB
    saved_txns = []
    for txn_data in new_transactions_data:
        if isinstance(txn_data, dict):
            txn = Transaction(user_id=current_user.id, **txn_data)
            session.add(txn)
            saved_txns.append(txn)

    await session.commit()
    for txn in saved_txns:
        await session.refresh(txn)

    # ✅ Trigger Agent (New data might trigger alerts/sweepers)
    background_tasks.add_task(run_agentic_loop, session, current_user)

    return saved_txns


# --- 2. Read Transactions (GET) ---
@router.get("/", response_model=List[TransactionRead])
async def read_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Fetch transactions with optional date filters.
    """
    query = select(Transaction).where(Transaction.user_id == current_user.id)

    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)

    query = query.limit(limit).order_by(Transaction.transaction_date.desc())

    result = await session.exec(query)
    return result.all()


# --- 3. Update Transaction (PATCH) ---
@router.patch("/{transaction_id}", response_model=TransactionRead)
async def update_transaction(
    transaction_id: int,
    txn_update: TransactionUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Update a transaction category or amount.
    Triggers the Agent because changing amounts affects financial health.
    """
    txn = await session.get(Transaction, transaction_id)
    if not txn or txn.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn_data = txn_update.dict(exclude_unset=True)
    for key, value in txn_data.items():
        setattr(txn, key, value)

    session.add(txn)
    await session.commit()
    await session.refresh(txn)

    # ✅ Trigger Agent (Correction might resolve an alert or change savings logic)
    background_tasks.add_task(run_agentic_loop, session, current_user)

    return txn
