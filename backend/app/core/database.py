from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
DATABASE_FILENAME = "net_almoner.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{BASE_DIR / DATABASE_FILENAME}"

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        future=True,
    )
    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        future=True,
    )
    Base = declarative_base()
except Exception as error:
    logger.exception("Failed to initialize the SQLAlchemy engine and session factory.")
    raise


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as error:
        logger.exception("Database session encountered an error.")
        raise
    finally:
        db.close()
