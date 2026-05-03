from aiogram import Router
from aiogram.types import Message

router = Router()

@router.message()
async def unknown_message(message: Message, t):
    await message.answer("Я тебя не понял. Нажми кнопку /start, чтобы продолжить.")
