import ssl
import asyncio
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

# --- SUPPRESS NOISY CONNECTION CLOSE ERRORS ---
logging.getLogger("sqlalchemy.pool.impl.NullPool").setLevel(logging.CRITICAL)
logging.getLogger("asyncpg").setLevel(logging.WARNING)

# --- SSL CONFIGURATION FOR SUPABASE TRANSACTION POOLER ---
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# --- DATABASE ENGINE (Optimized for Supabase Transaction Pooler) ---
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={
        "ssl": ssl_context,
        "statement_cache_size": 0,  # Disable prepared statements for Transaction Mode
        "server_settings": {
            "application_name": "finance_assistant_app",
        },
        "timeout": 60,  # Increase connection timeout
        "command_timeout": 120,  # Increase query timeout
    },
    poolclass=NullPool,  # No connection pooling for Transaction Mode
    pool_pre_ping=False,
)


async def init_db():
    """Creates the database tables on startup."""
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
    Simplified for Supabase Transaction Pooler compatibility.
    """
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    session = async_session()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        # Close session without waiting for connection close confirmation
        # This avoids the timeout errors with Supabase Transaction Pooler
        try:
            await asyncio.wait_for(session.close(), timeout=2.0)
        except (asyncio.TimeoutError, Exception):
            # Silently ignore close timeout - connection will be cleaned up by pooler
            pass


async def close_db():
    """Gracefully dispose of the database engine on shutdown."""
    try:
        await asyncio.wait_for(engine.dispose(), timeout=5.0)
        logging.info("✅ Database engine disposed successfully")
    except asyncio.TimeoutError:
        logging.warning("⚠️ Database engine disposal timed out (this is OK)")
    except Exception as e:
        logging.warning(f"⚠️ Database engine disposal: {e}")
