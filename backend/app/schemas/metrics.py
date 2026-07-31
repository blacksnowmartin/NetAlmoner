from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class BackupStats(BaseModel):
    total_backups: int
    successful_backups: int
    failed_backups: int
    average_success_rate: float


class DeviceHealth(BaseModel):
    device_id: int
    hostname: str
    last_backup_at: Optional[datetime]
    last_backup_status: Optional[bool]
    backup_count: int
    success_rate: float


class DashboardSummary(BaseModel):
    total_devices: int
    backup_stats: BackupStats
    device_health: List[DeviceHealth]
    recent_alerts: List[str]

    class Config:
        orm_mode = True
