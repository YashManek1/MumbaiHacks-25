import ssl
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

# --- SSL CONFIGURATION ---
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = True  # Enable hostname verification in production
ssl_context.verify_mode = ssl.CERT_REQUIRED  # Use CERT_REQUIRED in production

# --- DATABASE ENGINE ---
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable in production
    future=True,
    connect_args={
        "ssl": ssl_context,
        "server_settings": {
            "application_name": "finance_assistant_app",
            "jit": "off",
        },
        "timeout": 30,
        "command_timeout": 60,
        "prepared_statement_cache_size": 0,
    },
    poolclass=NullPool,
)


async def init_db():
    """
    Creates the database tables on startup.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    except Exception as e:
        logging.error(f"❌ Database Initialization Failed: {e}")
        raise e


async def get_session() -> AsyncSession:
    """
    Dependency to get a database session for API requests.
    """
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        yield session
