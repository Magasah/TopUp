import math

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardButton

from database import queries
from filters.admin import AdminFilter
from states.order import AdminFlow
from utils import tg_api
from utils.formatter import escape_html

router = Router(name="admin_orders")
PAGE = 8


def _short_pay(m: str) -> str:
    return {"dc_city": "DC", "alif": "Alif", "mastercard": "MC", "milli": "Milli"}.get(
        m, m
    )


def _emoji_status(st: str) -> str:
    if st == "pending":
        return "⏳"
    if st == "accepted":
        return "✅"
    return "❌"


async def _list_markup(t, st: str, page: int):
    total = await queries.order_count_by_status(st)
    total_pages = max(1, math.ceil(total / PAGE) if total else 1)
    page = max(0, min(page, total_pages - 1))
    rows = await queries.orders_list_filtered(st, PAGE, page * PAGE)

    b = InlineKeyboardBuilder()
    b.row(
        InlineKeyboardButton(text=t("orders_filter_new"), callback_data="ordf:pending"),
        InlineKeyboardButton(text=t("orders_filter_done"), callback_data="ordf:accepted"),
    )
    b.row(
        InlineKeyboardButton(
            text=t("orders_filter_rejected"), callback_data="ordf:rejected"
        )
    )
    b.row(InlineKeyboardButton(text=t("admin_back"), callback_data="adm:home"))

    mk0 = b.as_markup()
    lines = list(mk0.inline_keyboard)

    for r in rows:
        em = _emoji_status(r["status"])
        u = (r["username"] or "—")[:18]
        prod = (r["product_label"] or "")[:18]
        line = f"{em} #{r['id']} — @{u} — {prod} — {r['price_tjs']}смн"[:60]
        lines.append([InlineKeyboardButton(text=line, callback_data=f"ordo:{r['id']}")])

    prev_cb = "ordpg:nop" if page <= 0 else f"ordpg:{page - 1}"
    next_cb = "ordpg:nop" if page >= total_pages - 1 else f"ordpg:{page + 1}"
    lines.append(
        [
            InlineKeyboardButton(text="◀️", callback_data=prev_cb),
            InlineKeyboardButton(
                text=f"{page + 1}/{total_pages}", callback_data="ordpg:nop"
            ),
            InlineKeyboardButton(text="▶️", callback_data=next_cb),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=lines), page


@router.callback_query(F.data == "adm:orders", AdminFilter())
async def cb_orders(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.update_data(admin_order_filter="pending", admin_order_page=0)
    mk, _ = await _list_markup(t, "pending", 0)
    head = f"{t('admin_orders')} — <b>pending</b>\n"
    await query.message.answer(head, parse_mode="HTML", reply_markup=mk)


@router.callback_query(F.data.regexp(r"^ordf:(pending|accepted|rejected)$"), AdminFilter())
async def cb_ordf(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    st = (query.data or "").split(":")[-1]
    await state.update_data(admin_order_filter=st, admin_order_page=0)
    mk, _ = await _list_markup(t, st, 0)
    head = f"{t('admin_orders')} — <b>{st}</b>\n"
    await query.message.answer(head, parse_mode="HTML", reply_markup=mk)


@router.callback_query(F.data.regexp(r"^ordpg:(nop|\d+)$"), AdminFilter())
async def cb_ordpg(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    part = (query.data or "").split(":")[-1]
    if part == "nop":
        return
    p = int(part)
    data = await state.get_data()
    st = data.get("admin_order_filter", "pending")
    await state.update_data(admin_order_page=p)
    mk, _ = await _list_markup(t, st, p)
    head = f"{t('admin_orders')} — <b>{st}</b>\n"
    await query.message.answer(head, parse_mode="HTML", reply_markup=mk)


@router.callback_query(F.data.regexp(r"^ordo:(\d+)$"), AdminFilter())
async def cb_ordo(query: CallbackQuery, t):
    await query.answer()
    oid = int((query.data or "").split(":")[-1])
    o = await queries.order_by_id(oid)
    if not o:
        return
    cap = t(
        "order_card_admin",
        id=o["id"],
        username=escape_html(o["username"] or "—"),
        game=escape_html(o["game_name"]),
        product=escape_html(o["product_label"]),
        price=o["price_tjs"],
        account_id=escape_html(o["game_account_id"]),
        payment=escape_html(o["payment_method"]),
    )
    kb = tg_api.admin_order_actions(
        t("btn_accept"), t("btn_reject"), t("btn_write_user"), o["id"], o["user_tg_id"]
    )
    chat_id = query.message.chat.id
    if o["receipt_file_id"]:
        await tg_api.raw_send_photo_file_id(
            chat_id, o["receipt_file_id"], cap, reply_markup=kb, parse_mode="HTML"
        )
    else:
        await tg_api.raw_send_message(chat_id, cap, reply_markup=kb, parse_mode="HTML")


@router.callback_query(F.data.regexp(r"^adm:acc:(\d+)$"), AdminFilter())
async def cb_acc(query: CallbackQuery, t):
    await query.answer()
    oid = int((query.data or "").split(":")[-1])
    o = await queries.order_by_id(oid)
    if not o or o["status"] != "pending":
        return
    await queries.order_accept(oid)
    try:
        await query.bot.send_message(
            o["user_tg_id"],
            t("order_done", id=oid),
            parse_mode="HTML",
        )
    except Exception:
        pass
    await query.message.answer(t("order_accepted_notify"))


@router.callback_query(F.data.regexp(r"^adm:rej:(\d+)$"), AdminFilter())
async def cb_rej(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    oid = int((query.data or "").split(":")[-1])
    await state.set_state(AdminFlow.reject_reason)
    await state.update_data(admin_reject_order_id=oid)
    await query.message.answer(t("reject_reason_prompt"))


@router.message(AdminFlow.reject_reason, F.text, AdminFilter())
async def msg_reject_reason(message: Message, t, state: FSMContext):
    data = await state.get_data()
    oid = data.get("admin_reject_order_id")
    await state.clear()
    if not oid:
        return
    reason = (message.text or "").strip()[:500]
    o = await queries.order_by_id(oid)
    if not o:
        return
    await queries.order_reject(oid, reason)
    try:
        await message.bot.send_message(
            o["user_tg_id"],
            t("order_rejected", id=oid, reason=escape_html(reason)),
            parse_mode="HTML",
        )
    except Exception:
        pass
    await message.answer(t("order_rejected_notify"))
