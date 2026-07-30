from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.backup import Backup
from app.models.device import Device
from app.schemas.backup import BackupCreate, BackupRead
from app.schemas.diff import BackupDiffRead
from app.services.diff_engine import generate_diff
from app.services.netmiko_ssh import fetch_running_config

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/backups", tags=["backups"])


def _get_device(device_id: int, db: Session) -> Optional[Device]:
    return db.query(Device).filter(Device.id == device_id).first()


def _get_backup_by_id(backup_id: int, db: Session) -> Optional[Backup]:
    return db.query(Backup).filter(Backup.id == backup_id).first()


@router.get("/", response_model=List[BackupRead])
def list_backups(
    device_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[Backup]:
    try:
        query = db.query(Backup)
        if device_id is not None:
            query = query.filter(Backup.device_id == device_id)
        return query.offset(skip).limit(limit).all()
    except Exception as error:
        logger.exception("Unable to list backups.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve backups.",
        )


@router.get("/diff", response_model=BackupDiffRead)
def diff_backups(base_id: int, compare_id: int, db: Session = Depends(get_db)) -> BackupDiffRead:
    try:
        base_backup = _get_backup_by_id(backup_id=base_id, db=db)
        compare_backup = _get_backup_by_id(backup_id=compare_id, db=db)

        if not base_backup or not compare_backup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or both backups were not found.",
            )

        diff_lines = generate_diff(base_backup.config_text, compare_backup.config_text)
        return BackupDiffRead(
            base_backup_id=base_id,
            compare_backup_id=compare_id,
            diff_lines=diff_lines,
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to generate backup diff.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate diff.",
        )


@router.post("/manual", response_model=BackupRead, status_code=status.HTTP_201_CREATED)
def create_manual_backup(device_id: int, db: Session = Depends(get_db)) -> Backup:
    try:
        device = _get_device(device_id=device_id, db=db)
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found.",
            )

        try:
            config_text = fetch_running_config(
                hostname=device.hostname,
                ip_address=device.ip_address,
                username=device.username,
                password=device.password,
                secret=device.secret,
                port=device.port,
            )
            backup_payload = BackupCreate(
                device_id=device.id,
                config_text=config_text,
                success=True,
            )
        except Exception as ssh_error:
            logger.exception("Failed to fetch running config for device %s.", device.hostname)
            backup_payload = BackupCreate(
                device_id=device.id,
                config_text="",
                success=False,
                notes=str(ssh_error),
            )

        new_backup = Backup(**backup_payload.model_dump())
        db.add(new_backup)
        db.commit()
        db.refresh(new_backup)
        return new_backup
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to create manual backup.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create backup.",
        )


@router.get("/{backup_id}", response_model=BackupRead)
def get_backup(backup_id: int, db: Session = Depends(get_db)) -> Backup:
    try:
        backup = _get_backup_by_id(backup_id=backup_id, db=db)
        if not backup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup not found.",
            )
        return backup
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to retrieve backup by ID.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve backup.",
        )
