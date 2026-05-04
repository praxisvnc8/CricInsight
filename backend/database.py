"""
database.py – Synchronous SQLAlchemy engine & session configuration for the
IPL Dashboard (CricInsight) project.

"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv() 

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
)

# ── SQLAlchemy engine (synchronous, connection-pooled) ──────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # number of persistent connections kept in the pool
    max_overflow=10,       # extra connections allowed beyond pool_size
    pool_pre_ping=True,    # verify connections are alive before handing them out
    echo=False,            # set True to log every SQL statement (useful for debugging)
)

# ── Session factory ─────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# ── Declarative base for future ORM models ──────────────────────────────────
Base = declarative_base()


# ── FastAPI dependency ──────────────────────────────────────────────────────
def get_db():
    """Yield a SQLAlchemy session and ensure it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
