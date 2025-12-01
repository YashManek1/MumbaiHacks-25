from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date


class Goal(SQLModel, table=True):
    """Savings goals - matches frontend expectations."""
    __tablename__ = "goals"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)

    # Goal details (matching frontend field names)
    title: str = Field(max_length=100)
    total: float = Field(default=0.0)  # Target amount
    current: float = Field(default=0.0)  # Current funded amount
    priority: str = Field(default="medium", max_length=20)  # high, medium, low
    monthly_contribution: float = Field(default=100.0)
    icon: str = Field(default="🎯", max_length=10)
    estimated_completion: Optional[str] = Field(default=None, max_length=50)
    is_completed: bool = Field(default=False)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
