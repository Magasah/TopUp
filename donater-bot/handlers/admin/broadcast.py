from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardButton

from database import queries
from filters.admin import AdminFilter
from states.order import AdminFlow

router = Router(name="admin_broadcast")


@router.callback_query(F.data == "adm:broadcast", AdminFilter())
async def cb_bc(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.set_state(AdminFlow.broadcast_text)
    await query.message.answer(t("broadcast_ask"))


@router.message(AdminFlow.broadcast_text, F.text, AdminFilter())
async def msg_bc_text(message: Message, t, state: FSMContext):
    txt = (message.text or "").strip()
    await state.update_data(bc_text=txt)
    await state.set_state(AdminFlow.broadcast_confirm)
    b = InlineKeyboardBuilder()
    b.row(
        InlineKeyboardButton(text=t("confirm_send"), callback_data="bc:send"),
        InlineKeyboardButton(text=t("bc_cancel"), callback_data="bc:cancel"),
    )
    await message.answer(t("broadcast_preview", text=txt[:3500]), reply_markup=b.as_markup())


@router.callback_query(F.data == "bc:cancel", AdminFilter())
async def cb_bc_cancel(query: CallbackQuery, state: FSMContext):
    await query.answer()
    await state.clear()
    await query.message.answer("Отменено.")


@router.callback_query(F.data == "bc:send", AdminFilter())
async def cb_bc_send(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    data = await state.get_data()
    txt = data.get("bc_text") or ""
    await state.clear()
    ids = await queries.all_user_tg_ids()
    ok = 0
    for uid in ids:
        try:
            await query.bot.send_message(uid, txt, parse_mode="HTML")
            ok += 1
        except Exception:
            pass
    await queries.broadcast_insert(txt, ok)
    await query.message.answer(t("broadcast_sent", n=ok))
