from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date


# --- BILLS ---
class BillBase(SQLModel):
    biller_name: str
    amount: float
    due_date: date
    is_paid: bool = False
    recurring: bool = True


class BillCreate(BillBase):
    pass


class Bill(BillBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
