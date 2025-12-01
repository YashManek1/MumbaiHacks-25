import ssl
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

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
        "statement_cache_size": 0,  # ✅ Disable prepared statements for Transaction Mode
        "server_settings": {
            "application_name": "finance_assistant_app",
            "jit": "off",  # Disable JIT for faster connections
        },
        "timeout": 30,  # Connection timeout in seconds
        "command_timeout": 60,  # Query execution timeout in seconds
    },
    poolclass=NullPool,  # No connection pooling for Transaction Mode
    pool_pre_ping=False,  # Not needed with NullPool
    execution_options={
        "isolation_level": "READ COMMITTED",
    },
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
    Properly handles connection lifecycle for Supabase Transaction Pooler.
    """
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,  # ✅ Disable autoflush for better control
    )

    async with async_session() as session:
        try:
            yield session
            # ✅ Commit any pending changes before closing
            await session.commit()
        except Exception:
            # ✅ Rollback on error
            await session.rollback()
            raise
        finally:
            # ✅ Ensure session is properly closed
            try:
                await session.close()
            except Exception as close_error:
                # Log but don't raise - connection might already be closed
                logging.warning(f"Session close warning: {close_error}")


async def close_db():
    """
    Gracefully dispose of the database engine on shutdown.
    Call this in your FastAPI lifespan shutdown.
    """
    try:
        await engine.dispose()
        logging.info("✅ Database engine disposed successfully")
    except Exception as e:
        logging.error(f"⚠️ Database engine disposal error: {e}")
