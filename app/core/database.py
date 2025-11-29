import ssl
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings

# --- SSL CONFIGURATION ---
# Necessary for many cloud providers (Supabase, Neon, Render) when connecting from local
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# --- DATABASE ENGINE ---
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    future=True,
    # Pass arguments directly to the asyncpg driver
    connect_args={
        "ssl": ssl_context,
        "timeout": 60,  # ✅ Give DB 60s to wake up/connect (Default is often too short)
        "command_timeout": 30,  # ✅ Allow 30s for queries to execute
    },
    # Connection Pooling (Strict limits to avoid "MaxClients" errors)
    pool_size=5,  # Max 5 permanent connections
    max_overflow=0,  # 0 temporary connections (Hard limit)
    pool_pre_ping=True,  # Verify connection is alive before using
    pool_recycle=300,  # Recycle connections every 5 mins
)


async def init_db():
    """
    Creates the database tables on startup.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    except Exception as e:
        print(f"❌ Database Initialization Failed: {e}")
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
