from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, JSON
from datetime import datetime
from enum import Enum


class ActionType(str, Enum):
    INVESTMENT = "INVESTMENT"
    SAVINGS = "SAVINGS"
    CANCELLATION = "CANCELLATION"
    BUDGET_LOCK = "LOCK"
    ALERT = "ALERT"


class ActionStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DISMISSED = "DISMISSED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"


class AgentAction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")

    # Frontend Display
    type: ActionType
    title: str
    message: str  # Short description (e.g. "Invest ₹5k")
    reasoning: str  # The "Why" (Crucial for Trust)

    # Execution Payload
    function_name: str
    parameters: Dict[str, Any] = Field(default={}, sa_type=JSON)

    status: ActionStatus = ActionStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
