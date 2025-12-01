from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date


class Goal(SQLModel, table=True):
    __tablename__ = "goals"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Goal details
    name: str = Field(max_length=100)
    target_amount: float = Field(default=0.0)
    current_amount: float = Field(default=0.0)
    deadline: Optional[date] = Field(default=None)
    category: Optional[str] = Field(default="general", max_length=50)
    is_completed: bool = Field(default=False)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
