from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class GoalTransaction(SQLModel, table=True):
    __tablename__ = "goal_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: int = Field(foreign_key="goals.id", index=True)
    
    # Transaction details
    amount: float = Field(default=0.0)
    note: Optional[str] = Field(default=None, max_length=255)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)