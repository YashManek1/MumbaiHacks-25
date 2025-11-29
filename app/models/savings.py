from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class SavingsBase(SQLModel):
    total_funds: float = 0.0
    savings_allocated: float = 0.0
    savings_available: float = 0.0
    monthly_savings_rate: float = 0.0


class Savings(SavingsBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SavingsUpdate(SQLModel):
    total_funds: Optional[float] = None
    savings_allocated: Optional[float] = None
    savings_available: Optional[float] = None
    monthly_savings_rate: Optional[float] = None


class SavingsRead(SavingsBase):
    id: int
    user_id: int


class AddSavingsRequest(SQLModel):
    amount: float
    note: Optional[str] = None