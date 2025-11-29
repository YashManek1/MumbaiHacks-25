from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date, datetime

class TransactionBase(SQLModel):
    amount: float
    description: str
    category: Optional[str] = "Uncategorized"
    transaction_date: date
    is_recurring: bool = False
    source: str = "manual"  # manual, csv, image, whatsapp

class Transaction(TransactionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: int
    user_id: int

class TransactionUpdate(SQLModel):
    category: Optional[str] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None