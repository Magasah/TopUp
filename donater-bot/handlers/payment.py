import logging

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from config import config
from database import queries
from middlewares.anti_spam import register_order_placed
from states.order import OrderFlow
from utils import tg_api
from utils.admin_notify import notify_new_order
from utils.formatter import format_money_display

log = logging.getLogger(__name__)
router = Router(name="payment")


def _pay_title(method: str, t) -> str:
    if method == "dc_city":
        return t("payment_dc")
    if method == "alif":
        return t("payment_alif")
    if method == "mastercard":
        return t("payment_mc")
    if method == "milli":
        return t("payment_milli")
    return method


def _pay_number(method: str) -> str:
    if method == "dc_city":
        return config.dc_city_number or "—"
    if method == "alif":
        return config.alif_number
    if method == "mastercard":
        return config.mastercard_number or "—"
    if method == "milli":
        return config.milli_number or "—"
    return "—"


def _payment_detail_kb(number: str, t):
    try:
        from aiogram.types import CopyTextButton

        row = [
            InlineKeyboardButton(
                text=t("copy_number"),
                copy_text=CopyTextButton(text=number.replace(" ", "")),
            )
        ]
    except Exception:
        row = [
            InlineKeyboardButton(
                text=t("copy_number"), callback_data=f"paycopy:{number[:60]}"
            )
        ]
    rows = [row]
    rows.append(
        [InlineKeyboardButton(text=t("confirm_no"), callback_data="flow:back_payment")]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


@router.callback_query(F.data.regexp(r"^paycopy:(.+)$"))
async def cb_pay_copy(query: CallbackQuery, t):
    num = (query.data or "").split(":", 1)[-1]
    await query.answer(t("copy_fallback_alert", number=num), show_alert=True)


@router.callback_query(OrderFlow.payment_choice, F.data.regexp(r"^pay:(dc_city|alif|mastercard|milli)$"))
async def cb_pay_method(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    method = (query.data or "").split(":", 1)[-1]
    data = await state.get_data()
    draft = data.get("draft") or {}
    if not draft:
        return
    draft["payment_method"] = method
    await state.update_data(draft=draft, order_created=False)
    await state.set_state(OrderFlow.waiting_receipt)

    title = _pay_title(method, t)
    number = _pay_number(method)
    display = format_money_display(number)
    price = draft.get("price_tjs", 0)
    body = t("payment_card", title=title, number=display, price=price)
    kb = _payment_detail_kb(number, t)
    await query.message.answer(body, parse_mode="HTML", reply_markup=kb)
    await query.message.answer(t("send_receipt"), parse_mode="HTML")


@router.callback_query(OrderFlow.waiting_receipt, F.data == "flow:back_payment")
async def cb_back_payment(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.set_state(OrderFlow.payment_choice)
    kb = tg_api.payment_methods_markup(
        t("payment_dc"),
        t("payment_alif"),
        t("payment_mc"),
        t("payment_milli"),
        t("confirm_no"),
    )
    await tg_api.raw_send_message(
        query.message.chat.id, t("choose_payment"), reply_markup=kb, parse_mode="HTML"
    )


@router.message(OrderFlow.waiting_receipt, F.photo)
async def msg_receipt_photo(message: Message, t, state: FSMContext):
    data = await state.get_data()
    if data.get("order_created"):
        return
    draft = data.get("draft") or {}
    if not draft:
        await state.clear()
        return
    uid = message.from_user.id
    photos = message.photo
    if not photos:
        return
    fid = photos[-1].file_id
    try:
        oid = await queries.order_create(
            uid,
            message.from_user.username,
            draft["game_name"],
            draft["product_label"],
            int(draft["price_tjs"]),
            str(draft["account_id"]),
            str(draft["payment_method"]),
            fid,
        )
        await state.update_data(order_created=True)
        register_order_placed(uid)
        await state.clear()
        await message.answer(
            t("order_accepted_user", id=oid),
            parse_mode="HTML",
        )
        await notify_new_order(
            message.bot,
            oid,
            uid,
            message.from_user.username,
            draft["game_name"],
            draft["product_label"],
            int(draft["price_tjs"]),
            str(draft["account_id"]),
            str(draft["payment_method"]),
            fid,
            t,
        )
    except Exception as exc:
        log.exception("order_create: %s", exc)
        await message.answer(t("error_generic"))


@router.message(OrderFlow.waiting_receipt, ~F.photo)
async def msg_receipt_wrong(message: Message, t):
    if message.text and message.text.startswith("/"):
        return
    await message.answer(t("need_photo"), parse_mode="HTML")
