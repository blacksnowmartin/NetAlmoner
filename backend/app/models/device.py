from __future__ import annotations

import logging

from sqlalchemy import Column, Integer, String

from app.core.database import Base

logger = logging.getLogger(__name__)

try:
    class Device(Base):
        __tablename__ = "devices"

        id = Column(Integer, primary_key=True, index=True)
        hostname = Column(String(128), unique=True, nullable=False, index=True)
        ip_address = Column(String(45), unique=True, nullable=False, index=True)
        vendor = Column(String(64), nullable=False)
        username = Column(String(64), nullable=False)
        password = Column(String(256), nullable=False)
        secret = Column(String(256), nullable=True)
        port = Column(Integer, nullable=False, default=22)

        def __repr__(self) -> str:
            return (
                f"<Device(id={self.id}, hostname={self.hostname}, "
                f"ip_address={self.ip_address}, vendor={self.vendor})>"
            )
except Exception as error:
    logger.exception("Failed to define the Device model.")
    raise
