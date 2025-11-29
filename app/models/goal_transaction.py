from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class GoalTransactionBase(SQLModel):
    type: str  # deposit, fund, refund
    amount: float
    description: Optional[str] = None


class GoalTransaction(GoalTransactionBase, table=True):
    __tablename__ = "goal_transaction"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    goal_id: Optional[int] = Field(default=None, foreign_key="goal.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GoalTransactionRead(GoalTransactionBase):
    id: int
    user_id: int
    goal_id: Optional[int]
    created_at: datetime