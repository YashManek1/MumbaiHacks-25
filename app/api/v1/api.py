from app.api. v1.endpoints import (
    auth,
    transactions,
    analysis,
    agent,
    banking,
    goals,
)
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(auth. router, prefix="/auth", tags=["auth"])
api_router.include_router(
    transactions.router, prefix="/transactions", tags=["transactions"]
)
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(banking. router, prefix="/banking", tags=["banking"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])