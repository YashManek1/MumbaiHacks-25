from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class BudgetRule(SQLModel, table=True):
    __tablename__ = "budget_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Budget rule details
    category: str = Field(max_length=50, index=True)
    monthly_limit: float = Field(default=0.0)
    alert_threshold: float = Field(default=80.0)  # Alert at 80% of limit
    is_active: bool = Field(default=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
