from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # ✅ ADD THIS LINE so Pydantic accepts the key from .env
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        # This tells Pydantic to ignore other random variables in .env
        # instead of crashing (useful for system env vars)
        extra = "ignore"


settings = Settings()
