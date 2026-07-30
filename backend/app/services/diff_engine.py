from __future__ import annotations

import difflib
from typing import List


def generate_diff(old_text: str, new_text: str) -> List[str]:
    old_lines = old_text.splitlines(keepends=True)
    new_lines = new_text.splitlines(keepends=True)
    diff_lines = list(difflib.unified_diff(old_lines, new_lines, fromfile="old_config", tofile="new_config", lineterm=""))
    return diff_lines
