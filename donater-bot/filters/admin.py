from typing import Union

from aiogram.filters import BaseFilter
from aiogram.types import CallbackQuery, Message

from config import config


class AdminFilter(BaseFilter):
    async def __call__(self, event: Union[Message, CallbackQuery]) -> bool:
        u = event.from_user
        return bool(u and u.id in config.admin_ids)
