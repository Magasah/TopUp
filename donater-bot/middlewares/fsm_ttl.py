"""Зарезервировано: в aiogram 3 TTL FSM лучше вешать на storage с TTL
или обновлять метку в хендлерах. Сейчас класс оставлен для будущего."""
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject


class FsmTtlMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        return await handler(event, data)
