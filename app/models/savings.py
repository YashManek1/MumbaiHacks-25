from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Savings(SQLModel, table=True):
    __tablename__ = "savings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, unique=True)

    # Core savings fields
    liquid_cash: float = Field(default=0.0)
    emergency_fund: float = Field(default=0.0)
    emergency_fund_target: float = Field(default=50000.0)
    total_invested: float = Field(default=0.0)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
