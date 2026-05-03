"""
Точка входа для хостинга, где ожидают ``python main.py``.
Логика приложения — в ``bot.main`` (async).
"""
from __future__ import annotations

import asyncio

from bot import main as bot_main
from config import BASE_DIR
from utils.singleton_lock import acquire as singleton_acquire
from utils.singleton_lock import release as singleton_release

if __name__ == "__main__":
    _lock = BASE_DIR / ".bot_singleton.lock"
    singleton_acquire(_lock)
    try:
        asyncio.run(bot_main())
    finally:
        singleton_release(_lock)
