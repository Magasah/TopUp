import logging

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import config
from database import queries
from states.order import ReviewFlow
from utils import tg_api
from utils.formatter import escape_html

log = logging.getLogger(__name__)
router = Router(name="review")


@router.message(Command("otziv"))
async def cmd_otziv(message: Message, t, state: FSMContext):
    uid = message.from_user.id
    if not await queries.user_has_accepted_order(uid):
        await message.answer(t("review_no_orders"))
        return
    recent = await queries.orders_recent_for_user(uid, 1)
    oid = recent[0]["id"] if recent else None
    await state.update_data(review_order_id=oid)
    await state.set_state(ReviewFlow.waiting_text)
    b = InlineKeyboardBuilder()
    b.row(InlineKeyboardButton(text=t("confirm_no"), callback_data="rev:cancel"))
    await message.answer(t("write_review"), parse_mode="HTML", reply_markup=b.as_markup())


@router.callback_query(F.data == "rev:cancel")
async def cb_rev_cancel(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.clear()
    await query.message.answer(t("review_cancel"))


@router.message(ReviewFlow.waiting_text, F.text)
async def msg_review_text(message: Message, t, state: FSMContext):
    text = (message.text or "").strip()
    if text.startswith("/"):
        return
    uid = message.from_user.id
    data = await state.get_data()
    oid = data.get("review_order_id")
    rid = await queries.review_create(oid, uid, text)
    await state.clear()
    await message.answer(t("review_sent"), parse_mode="HTML")

    order = await queries.order_by_id(oid) if oid else None
    fake = order or {
        "id": "—",
        "username": message.from_user.username,
        "product_label": "—",
        "game_name": "—",
    }
    card = t(
        "review_admin_card",
        username=escape_html(fake.get("username") or "—"),
        order_id=fake.get("id", "—"),
        product=escape_html(fake.get("product_label", "—")),
        game=escape_html(fake.get("game_name", "—")),
        text=escape_html(text[:500]),
    )
    kb = tg_api.review_admin_keyboard_raw(rid, t)
    for aid in config.admin_ids:
        try:
            await tg_api.raw_send_message(aid, card, reply_markup=kb, parse_mode="HTML")
        except Exception as exc:
            log.warning("review notify %s: %s", aid, exc)
