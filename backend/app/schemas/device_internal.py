from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, IPvAnyAddress, constr


class DeviceBase(BaseModel):
    hostname: constr(strip_whitespace=True, min_length=1, max_length=128)
    ip_address: IPvAnyAddress
    vendor: constr(strip_whitespace=True, min_length=1, max_length=64)
    username: constr(strip_whitespace=True, min_length=1, max_length=64)
    password: constr(strip_whitespace=True, min_length=1, max_length=256)
    secret: Optional[constr(strip_whitespace=True, max_length=256)] = None
    port: int = Field(default=22, ge=1, le=65535)


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    hostname: Optional[constr(strip_whitespace=True, min_length=1, max_length=128)] = None
    ip_address: Optional[IPvAnyAddress] = None
    vendor: Optional[constr(strip_whitespace=True, min_length=1, max_length=64)] = None
    username: Optional[constr(strip_whitespace=True, min_length=1, max_length=64)] = None
    password: Optional[constr(strip_whitespace=True, min_length=1, max_length=256)] = None
    secret: Optional[constr(strip_whitespace=True, max_length=256)] = None
    port: Optional[int] = Field(default=None, ge=1, le=65535)
