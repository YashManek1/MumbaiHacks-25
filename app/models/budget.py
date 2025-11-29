from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class Budget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    category: str
    percentage: float  # Stored as a decimal (e.g., 0.30 for 30%)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
