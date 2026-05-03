"""
Один процесс long polling на машину: иначе два python.exe → 409 Conflict.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

log = logging.getLogger(__name__)


def _pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if sys.platform == "win32":
        import ctypes

        k = ctypes.windll.kernel32
        SYNCHRONIZE = 0x00100000
        h = k.OpenProcess(SYNCHRONIZE, False, pid)
        if h:
            k.CloseHandle(h)
            return True
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def acquire(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        try:
            old = int(path.read_text(encoding="utf-8").strip().splitlines()[0])
        except (ValueError, OSError, IndexError):
            old = 0
        if old and _pid_alive(old):
            raise SystemExit(
                f"Уже запущен бот (PID {old}, lock {path}).\n"
                "Остановите второй процесс или удалите lock только если процесс точно мёртв.\n"
                "Иначе Telegram: Conflict — другой getUpdates с этим BOT_TOKEN."
            )
        try:
            path.unlink(missing_ok=True)  # type: ignore[arg-type]
        except OSError:
            pass
    path.write_text(str(os.getpid()), encoding="utf-8")


def release(path: Path) -> None:
    try:
        if path.exists():
            txt = path.read_text(encoding="utf-8").strip().splitlines()[0]
            if txt == str(os.getpid()):
                path.unlink(missing_ok=True)  # type: ignore[arg-type]
    except OSError as exc:
        log.debug("singleton lock release: %s", exc)
