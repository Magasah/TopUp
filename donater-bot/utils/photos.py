"""Локальные изображения: assets/ и public/."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from aiogram.types import FSInputFile

BASE = Path(__file__).resolve().parent.parent
ASSETS = BASE / "assets"
PUBLIC = BASE / "public"


def _exists(p: Path) -> bool:
    return p.is_file() and os.access(p, os.R_OK)


def get_fs_photo(*candidates: str) -> Optional[FSInputFile]:
    """Ищет первый существующий файл по имени в public/, затем assets/."""
    for name in candidates:
        for folder in (PUBLIC, ASSETS):
            path = folder / name
            if _exists(path):
                return FSInputFile(path)
    return None


def welcome_photo() -> Optional[FSInputFile]:
    return get_fs_photo(
        "welcome.jpg",
        "старт.jpg",
        "start.jpg",
    )


def game_cover_photo(game_name: str) -> Optional[FSInputFile]:
    n = (game_name or "").lower()
    if "pubg" in n:
        return get_fs_photo(
            "PUBG Mobile товарь.jpg",
            "pubg.jpg",
        )
    if "free" in n or "fire" in n:
        return get_fs_photo(
            "товарь Free Fire.jpg",
            "freefire.jpg",
        )
    return None


def game_cover_path(game_name: str) -> Optional[Path]:
    """Путь к локальной обложке игры (для raw multipart)."""
    n = (game_name or "").lower()
    if "pubg" in n:
        for name in ("PUBG Mobile товарь.jpg", "pubg.jpg"):
            for folder in (PUBLIC, ASSETS):
                p = folder / name
                if _exists(p):
                    return p
    if "free" in n or "fire" in n:
        for name in ("товарь Free Fire.jpg", "freefire.jpg"):
            for folder in (PUBLIC, ASSETS):
                p = folder / name
                if _exists(p):
                    return p
    return None


def store_photo() -> Optional[FSInputFile]:
    return get_fs_photo("store.jpg", "settings.jpg")
