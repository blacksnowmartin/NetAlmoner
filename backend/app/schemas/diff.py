from __future__ import annotations

from pydantic import BaseModel


class BackupDiffRead(BaseModel):
    base_backup_id: int
    compare_backup_id: int
    diff_lines: list[str]
