from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BackupCreate(BaseModel):
    device_id: int
    config_text: str = Field(min_length=1)
    success: bool = True
    notes: Optional[str] = None


class BackupRead(BaseModel):
    id: int
    device_id: int
    config_text: str
    success: bool
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
