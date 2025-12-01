from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Savings(SQLModel, table=True):
    """User's savings tracking - matches frontend expectations."""
    __tablename__ = "savings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, unique=True)

    # Total funds available (liquid cash + investments)
    total_funds: float = Field(default=0.0)
    
    # Savings breakdown
    savings_allocated: float = Field(default=0.0)  # Allocated to goals
    savings_available: float = Field(default=0.0)  # Available to allocate
    
    # Monthly tracking
    monthly_income: float = Field(default=0.0)
    monthly_savings_rate: float = Field(default=0.0)  # Percentage or amount saved monthly

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
