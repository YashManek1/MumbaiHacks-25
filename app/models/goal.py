from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class GoalBase(SQLModel):
    title: str
    icon: str = "🎯"
    total: float
    current: float = 0.0
    priority: str = "medium"  # high, medium, low
    monthly_contribution: float = 0.0
    estimated_completion: Optional[str] = None


class Goal(GoalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GoalCreate(SQLModel):
    title: str
    total: float
    monthly_contribution: float = 100.0
    priority: str = "medium"
    icon: str = "🎯"


class GoalUpdate(SQLModel):
    title: Optional[str] = None
    total: Optional[float] = None
    current: Optional[float] = None
    monthly_contribution: Optional[float] = None
    priority: Optional[str] = None
    icon: Optional[str] = None


class GoalRead(GoalBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime


class FundGoalRequest(SQLModel):
    amount: float