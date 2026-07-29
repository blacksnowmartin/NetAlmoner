from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceRead, DeviceUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/devices", tags=["devices"])


def _get_device_by_id(device_id: int, db: Session) -> Optional[Device]:
    return db.query(Device).filter(Device.id == device_id).first()


def _get_device_by_hostname_or_ip(hostname: str, ip_address: str, db: Session) -> Optional[Device]:
    return (
        db.query(Device)
        .filter((Device.hostname == hostname) | (Device.ip_address == ip_address))
        .first()
    )


@router.get("/", response_model=List[DeviceRead])
def list_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[Device]:
    try:
        return db.query(Device).offset(skip).limit(limit).all()
    except Exception as error:
        logger.exception("Unable to list devices.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve devices.",
        )


@router.post("/", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def create_device(device_payload: DeviceCreate, db: Session = Depends(get_db)) -> Device:
    try:
        existing_device = _get_device_by_hostname_or_ip(
            hostname=device_payload.hostname,
            ip_address=str(device_payload.ip_address),
            db=db,
        )
        if existing_device:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A device with the same hostname or IP address already exists.",
            )

        new_device = Device(**device_payload.model_dump())
        db.add(new_device)
        db.commit()
        db.refresh(new_device)
        return new_device
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to create device.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create device.",
        )


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(device_id: int, db: Session = Depends(get_db)) -> Device:
    try:
        device = _get_device_by_id(device_id=device_id, db=db)
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found.",
            )
        return device
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to retrieve device by ID.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve device.",
        )


@router.patch("/{device_id}", response_model=DeviceRead)
def update_device(device_id: int, device_update: DeviceUpdate, db: Session = Depends(get_db)) -> Device:
    try:
        existing_device = _get_device_by_id(device_id=device_id, db=db)
        if not existing_device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found.",
            )

        update_data = device_update.model_dump(exclude_unset=True)
        for field_name, value in update_data.items():
            setattr(existing_device, field_name, value)

        db.add(existing_device)
        db.commit()
        db.refresh(existing_device)
        return existing_device
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to update device.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update device.",
        )


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, db: Session = Depends(get_db)) -> None:
    try:
        existing_device = _get_device_by_id(device_id=device_id, db=db)
        if not existing_device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found.",
            )

        db.delete(existing_device)
        db.commit()
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Failed to delete device.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete device.",
        )
