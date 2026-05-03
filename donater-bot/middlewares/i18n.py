import json
import logging
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject

from database import queries

log = logging.getLogger(__name__)

BASE = Path(__file__).resolve().parent.parent
with (BASE / "locales" / "ru.json").open(encoding="utf-8") as _f:
    RU: Dict[str, str] = json.load(_f)
with (BASE / "locales" / "tj.json").open(encoding="utf-8") as _f:
    TJ: Dict[str, str] = json.load(_f)


def _make_t(lang: str):
    cat = TJ if lang == "tj" else RU

    def t(key: str, **kw: Any) -> str:
        s = cat.get(key) or RU.get(key) or key
        if not kw:
            return s
        try:
            return s.format(**kw)
        except Exception as exc:
            log.warning("i18n format %s: %s", key, exc)
            return s

    return t


class I18nMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        uid = None
        if isinstance(event, Message) and event.from_user:
            uid = event.from_user.id
        elif isinstance(event, CallbackQuery) and event.from_user:
            uid = event.from_user.id
        lang = "ru"
        if uid:
            try:
                lang = await queries.user_get_language(uid)
            except Exception as exc:
                log.warning("user_get_language: %s", exc)
        data["lang"] = lang
        data["t"] = _make_t(lang)
        result = await handler(event, data)
        if uid:
            try:
                await queries.user_touch_activity(uid)
            except Exception:
                pass
        return result
