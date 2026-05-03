import time
from collections import defaultdict, deque
from typing import Any, Awaitable, Callable, Deque, Dict

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject

from config import config

_window: dict[int, Deque[float]] = defaultdict(deque)
_order_ts: dict[int, float] = {}


class AntiSpamMiddleware(BaseMiddleware):
    """Не более N событий в минуту на пользователя (сообщения + callback)."""

    def __init__(self, per_minute: int | None = None) -> None:
        self.per_minute = per_minute or config.anti_spam_per_minute

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
        if not uid:
            return await handler(event, data)

        now = time.monotonic()
        dq = _window[uid]
        while dq and now - dq[0] > 60:
            dq.popleft()
        if len(dq) >= self.per_minute:
            t = data.get("t")
            if t and isinstance(event, Message):
                await event.answer(t("rate_limit", m=1))
            elif t and isinstance(event, CallbackQuery):
                await event.answer(t("rate_limit", m=1), show_alert=True)
            return None
        dq.append(now)
        return await handler(event, data)


def order_rate_limit_minutes(uid: int, minutes: int = 2) -> int:
    """Возвращает оставшиеся минуты ожидания между заказами (0 = можно)."""
    last = _order_ts.get(uid)
    if not last:
        return 0
    elapsed = time.monotonic() - last
    need = minutes * 60
    if elapsed >= need:
        return 0
    return max(1, int((need - elapsed) / 60) + 1)


def register_order_placed(uid: int) -> None:
    _order_ts[uid] = time.monotonic()
