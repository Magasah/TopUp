"""Общий FSM AdminFlow.wizard: game_add и product_add (текст + фото обложки)."""
from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from database import queries
from filters.admin import AdminFilter
from states.order import AdminFlow
from utils.formatter import format_wizard_product_label

router = Router(name="admin_wizard")


@router.message(AdminFlow.wizard, F.text, AdminFilter())
async def wiz_text(message: Message, state: FSMContext):
    data = await state.get_data()
    kind = data.get("wiz_kind")
    text = (message.text or "").strip()

    if kind == "game_add":
        step = data.get("wiz_step")
        if step == "name":
            await state.update_data(wiz_name=text[:120], wiz_step="emoji")
            await message.answer("Эмодзи:")
            return
        if step == "emoji":
            await state.update_data(wiz_emoji=text[:8], wiz_step="cover")
            await message.answer("Фото обложки или /skip")
            return
        if step == "cover":
            if text == "/skip":
                await queries.game_insert(
                    data["wiz_name"], data["wiz_emoji"], None
                )
                await state.clear()
                await message.answer("✅ Игра сохранена.")
            else:
                await message.answer("Отправьте фото или /skip")
        return

    if kind == "product_add":
        step = data.get("wiz_step")
        if step == "label":
            game = await queries.game_by_id(int(data["wiz_game_id"]))
            label = format_wizard_product_label(text, game["name"] if game else "")
            await state.update_data(wiz_label=label, wiz_step="price")
            await message.answer("Цена (смн):")
            return
        if step == "price":
            n = int("".join(ch for ch in text if ch.isdigit()) or "0")
            if n < 1:
                await message.answer("Некорректная цена:")
                return
            await state.update_data(wiz_price=n, wiz_step="pop")
            from aiogram.utils.keyboard import InlineKeyboardBuilder
            from aiogram.types import InlineKeyboardButton

            b = InlineKeyboardBuilder()
            b.row(
                InlineKeyboardButton(text="✅ Да", callback_data="admpop:1"),
                InlineKeyboardButton(text="❌ Нет", callback_data="admpop:0"),
            )
            await message.answer("Популярный?", reply_markup=b.as_markup())
        return


@router.message(AdminFlow.wizard, F.photo, AdminFilter())
async def wiz_photo(message: Message, state: FSMContext):
    data = await state.get_data()
    if data.get("wiz_kind") != "game_add" or data.get("wiz_step") != "cover":
        return
    fid = message.photo[-1].file_id
    await queries.game_insert(data["wiz_name"], data["wiz_emoji"], fid)
    await state.clear()
    await message.answer("✅ Игра сохранена.")
