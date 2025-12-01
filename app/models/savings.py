from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Savings(SQLModel, table=True):
    __tablename__ = "savings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, unique=True)

    # Core savings fields (matching actual database columns)
    savings_allocated: float = Field(default=0.0)
    savings_available: float = Field(default=0.0)
    monthly_savings_rate: float = Field(default=0.0)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
