import ssl
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

# --- SSL CONFIGURATION FOR SUPABASE TRANSACTION POOLER ---
# Supabase uses valid SSL certificates, but we need to configure SSL properly
# For Transaction Mode, we need to be more permissive with SSL verification
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False  # Required for Supabase pooler
ssl_context.verify_mode = ssl.CERT_NONE  # Disable strict verification for pooler

# --- DATABASE ENGINE (Optimized for Supabase Transaction Pooler) ---
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable SQL logging in production
    future=True,
    connect_args={
        "ssl": ssl_context,
        "statement_cache_size": 0,  # ✅ FIXED: Correct parameter name for asyncpg
        "server_settings": {
            "application_name": "finance_assistant_app",
            "jit": "off",  # Disable JIT for faster connections
        },
        "timeout": 30,  # Connection timeout
        "command_timeout": 60,  # Query execution timeout
    },
    # Use NullPool for Transaction Mode (no connection reuse)
    poolclass=NullPool,
)


async def init_db():
    """
    Creates the database tables on startup.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logging.info("✅ Database tables created successfully")
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
