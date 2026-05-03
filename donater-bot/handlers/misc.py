from datetime import datetime

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import default_state
from aiogram.types import CallbackQuery, Message

from config import config
from database import queries
from filters.admin import AdminFilter
from handlers.start import _main_menu_markup
from utils import tg_api

router = Router(name="misc")


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext, t):
    await state.clear()
    kb = await _main_menu_markup(t)
    await tg_api.raw_send_message(message.chat.id, t("cancel_cmd"), reply_markup=kb, parse_mode="HTML")


@router.message(Command("ping"), AdminFilter())
async def cmd_ping(message: Message, t):
    now = datetime.now().strftime("%H:%M:%S")
    await message.answer(t("ping_ok", time=now))


@router.message(Command("myorders"))
async def cmd_myorders(message: Message, t):
    uid = message.from_user.id
    rows = await queries.user_orders_list(uid, 5)
    if not rows:
        await message.answer(t("myorders_empty"), parse_mode="HTML")
        return
    lines = [t("myorders_title")]
    for r in rows:
        st = r["status"]
        if st == "pending":
            lab = t("status_pending")
        elif st == "accepted":
            lab = t("status_accepted")
        else:
            lab = t("status_rejected")
        lines.append(
            t(
                "myorders_line",
                id=r["id"],
                label=r["product_label"][:40],
                status=lab,
            )
        )
    await message.answer("\n".join(lines), parse_mode="HTML")


@router.message(StateFilter(default_state), F.text, ~F.text.startswith("/"))
async def unknown_text(message: Message, t):
    await message.answer(t("unknown_hint"))


@router.message(StateFilter(default_state), F.photo)
async def unknown_photo(message: Message, t):
    await message.answer(t("unknown_hint"))
