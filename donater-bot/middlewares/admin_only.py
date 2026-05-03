from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery
from config import config

class AdminOnlyMiddleware(BaseMiddleware):
    async def __call__(self, handler, event, data):
        user_id = None
        if isinstance(event, (Message, CallbackQuery)):
            user_id = event.from_user.id
        if user_id and user_id not in config.admin_ids_list:
            if isinstance(event, Message):
                await event.answer("⛔️ Доступ запрещен")
            elif isinstance(event, CallbackQuery):
                await event.answer("⛔️ Доступ запрещен", show_alert=True)
            return
        return await handler(event, data)
