from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm  # ✅ REQUIRED for Swagger UI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead)
async def register_user(
    user_in: UserCreate,
    session: AsyncSession = Depends(get_session),
) -> Any:
    # Check if user exists
    result = await session.exec(select(User).where(User.email == user_in.email))
    existing_user = result.first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )

    # Create new user
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        monthly_income=user_in.monthly_income,
        risk_tolerance=user_in.risk_tolerance,
        hashed_password=security.get_password_hash(user_in.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/login")
async def login(
    # ✅ FIX: Use OAuth2Form so the "Authorize" button works
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
) -> Any:
    # Find user by email (Swagger sends email in the 'username' field)
    result = await session.exec(select(User).where(User.email == form_data.username))
    user = result.first()

    # Validate password
    if not user or not security.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Return Token
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }