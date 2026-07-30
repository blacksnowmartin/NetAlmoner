from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.core.database import Base

logger = logging.getLogger(__name__)

try:
    class Backup(Base):
        __tablename__ = "backups"

        id = Column(Integer, primary_key=True, index=True)
        device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
        config_text = Column(Text, nullable=False)
        success = Column(Boolean, nullable=False, default=True)
        notes = Column(Text, nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

        device = relationship("Device", backref="backups")

        def __repr__(self) -> str:
            return (
                f"<Backup(id={self.id}, device_id={self.device_id}, "
                f"success={self.success}, created_at={self.created_at})>"
            )
except Exception as error:
    logger.exception("Failed to define the Backup model.")
    raise
