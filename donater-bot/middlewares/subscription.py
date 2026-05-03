import logging
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.enums import ChatMemberStatus
from aiogram.types import CallbackQuery, Message, TelegramObject

from config import (
    CHECK_SUBSCRIPTION_CB,
    CHECK_SUBSCRIPTION_CB_LEGACY,
    config,
)

log = logging.getLogger(__name__)


class SubscriptionMiddleware(BaseMiddleware):
    """Блокирует неподписанных, кроме /start и проверки подписки."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        if not config.channel_id.strip():
            return await handler(event, data)

        uid = None
        chat_id = None
        if isinstance(event, Message):
            uid = event.from_user.id if event.from_user else None
            chat_id = event.chat.id if event.chat else None
            if event.text and event.text.startswith("/start"):
                return await handler(event, data)
        elif isinstance(event, CallbackQuery):
            uid = event.from_user.id if event.from_user else None
            chat_id = event.message.chat.id if event.message else None
            if event.data in (
                CHECK_SUBSCRIPTION_CB,
                CHECK_SUBSCRIPTION_CB_LEGACY,
            ):
                return await handler(event, data)

        if not uid or not chat_id:
            return await handler(event, data)

        bot = data.get("bot")
        if not bot:
            return await handler(event, data)

        ch = config.channel_id.strip()
        try:
            member = await bot.get_chat_member(chat_id=ch, user_id=uid)
        except Exception as exc:
            log.warning("get_chat_member: %s", exc)
            return await handler(event, data)

        if member.status in (
            ChatMemberStatus.LEFT,
            ChatMemberStatus.KICKED,
        ):
            t = data.get("t")
            if t:
                if isinstance(event, Message):
                    await event.answer(t("not_subscribed"))
                elif isinstance(event, CallbackQuery):
                    await event.answer(t("not_subscribed"), show_alert=True)
            return None

        return await handler(event, data)
