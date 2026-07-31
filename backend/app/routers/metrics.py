from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.backup import Backup
from app.models.device import Device
from app.schemas.metrics import BackupStats, DashboardSummary, DeviceHealth

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/metrics", tags=["metrics"])


def _generate_device_health(db: Session) -> List[DeviceHealth]:
    devices = db.query(Device).all()
    backup_groups = defaultdict(list)

    backups = db.query(Backup).order_by(Backup.created_at.desc()).all()
    for backup in backups:
        backup_groups[backup.device_id].append(backup)

    health_items: List[DeviceHealth] = []
    for device in devices:
        device_backups = backup_groups.get(device.id, [])
        backup_count = len(device_backups)
        successful_count = sum(1 for backup in device_backups if backup.success)
        success_rate = (successful_count / backup_count) * 100 if backup_count else 0.0
        last_backup = device_backups[0] if device_backups else None

        health_items.append(
            DeviceHealth(
                device_id=device.id,
                hostname=device.hostname,
                last_backup_at=last_backup.created_at if last_backup else None,
                last_backup_status=last_backup.success if last_backup else None,
                backup_count=backup_count,
                success_rate=success_rate,
            )
        )

    return health_items


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    try:
        device_count = db.query(func.count(Device.id)).scalar() or 0
        total_backups = db.query(func.count(Backup.id)).scalar() or 0
        successful_backups = db.query(func.count(Backup.id)).filter(Backup.success.is_(True)).scalar() or 0
        failed_backups = total_backups - successful_backups
        average_success_rate = (successful_backups / total_backups) * 100 if total_backups else 0.0

        device_health = _generate_device_health(db=db)
        recent_alerts = []
        for health in device_health:
            if health.last_backup_status is False:
                recent_alerts.append(
                    f"Device {health.hostname} has a failed backup at {health.last_backup_at}."
                )

        return DashboardSummary(
            total_devices=device_count,
            backup_stats=BackupStats(
                total_backups=total_backups,
                successful_backups=successful_backups,
                failed_backups=failed_backups,
                average_success_rate=average_success_rate,
            ),
            device_health=device_health,
            recent_alerts=recent_alerts,
        )
    except Exception as error:
        logger.exception("Failed to generate dashboard summary.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve dashboard metrics.",
        )
