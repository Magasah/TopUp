import logging
import random
import re
import time
from typing import Dict, List

from aiogram import F, Router
from aiogram.filters import StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder

from database import queries
from handlers.start import _main_menu_markup
from middlewares.anti_spam import order_rate_limit_minutes
from states.order import OrderFlow
from utils import tg_api
from utils.formatter import escape_html

log = logging.getLogger(__name__)
router = Router(name="order")

_captcha_fails: Dict[int, Dict[str, float | int]] = {}
_CAPTCHA_BLOCK_MIN = 5


def _shuffle(opts: List[dict]) -> List[dict]:
    a = list(opts)
    random.shuffle(a)
    return a


@router.callback_query(F.data.regexp(re.compile(r"^prod:(\d+)$")))
async def cb_product(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    uid = query.from_user.id
    chat_id = query.message.chat.id
    try:
        block = _captcha_fails.get(uid, {}).get("blocked_until", 0)
        if isinstance(block, (int, float)) and time.monotonic() < float(block):
            m = max(1, int((float(block) - time.monotonic()) / 60) + 1)
            await query.message.answer(t("captcha_blocked", m=m), parse_mode="HTML")
            return

        wait = order_rate_limit_minutes(uid, minutes=2)
        if wait > 0:
            await query.message.answer(t("rate_limit", m=wait), parse_mode="HTML")
            return

        m = re.match(r"^prod:(\d+)$", query.data or "")
        pid = int(m.group(1)) if m else 0
        p = await queries.product_by_id(pid)
        if not p:
            await query.message.answer(t("error_generic"))
            return
        data = await state.get_data()
        gid = data.get("selected_game_id")
        if not gid or p["game_id"] != gid:
            await query.message.answer(t("error_generic"))
            return

        await state.update_data(
            draft={
                "game_id": gid,
                "game_name": data.get("selected_game_name", ""),
                "product_id": pid,
                "product_label": p["label"],
                "price_tjs": p["price_tjs"],
            },
            captcha_salt="",
            captcha_answer=0,
        )

        a, b = random.randint(1, 9), random.randint(1, 9)
        correct = a + b
        wrong = set()
        while len(wrong) < 3:
            x = random.randint(2, 18)
            if x != correct:
                wrong.add(x)
        opts = _shuffle(
            [{"label": correct, "value": correct, "correct": True}]
            + [{"label": v, "value": v, "correct": False} for v in wrong]
        )
        salt = str(random.randint(1000, 9999))
        await state.update_data(captcha_salt=salt, captcha_answer=correct)
        await state.set_state(OrderFlow.captcha)

        q = f"{a} + {b}"
        kb = tg_api.captcha_keyboard(salt, opts)
        await tg_api.raw_send_message(
            chat_id, t("captcha_title", q=q), reply_markup=kb, parse_mode="HTML"
        )
    except Exception as exc:
        log.exception("order product: %s", exc)
        await query.message.answer(t("error_generic"))


@router.callback_query(OrderFlow.captcha, F.data.regexp(re.compile(r"^cap:(\w+):(\d+)$")))
async def cb_captcha(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    uid = query.from_user.id
    m = re.match(r"^cap:(\w+):(\d+)$", query.data or "")
    if not m:
        return
    salt, val_s = m.group(1), m.group(2)
    val = int(val_s)
    data = await state.get_data()
    if data.get("captcha_salt") != salt:
        return
    correct = int(data.get("captcha_answer") or 0)
    if val == correct:
        _captcha_fails.pop(uid, None)
        await state.set_state(OrderFlow.game_id)
        await state.update_data(captcha_salt="", captcha_answer=0)
        b = InlineKeyboardBuilder()
        b.row(InlineKeyboardButton(text=t("confirm_no"), callback_data="flow:cancel"))
        await query.message.answer(
            t("enter_game_id"), parse_mode="HTML", reply_markup=b.as_markup()
        )
        return

    rec = _captcha_fails.setdefault(uid, {"fails": 0})
    rec["fails"] = int(rec.get("fails", 0)) + 1
    left = max(0, 3 - int(rec["fails"]))
    if rec["fails"] >= 5:
        rec["blocked_until"] = time.monotonic() + _CAPTCHA_BLOCK_MIN * 60
        await query.message.answer(
            t("captcha_blocked", m=_CAPTCHA_BLOCK_MIN), parse_mode="HTML"
        )
        return
    await query.message.answer(t("captcha_wrong", n=left), parse_mode="HTML")


@router.callback_query(F.data == "flow:cancel")
async def cb_flow_cancel(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.clear()
    kb = await _main_menu_markup(t)
    await tg_api.raw_send_message(query.message.chat.id, t("order_cancelled"), reply_markup=kb)


@router.callback_query(F.data == "order:confirm_no")
async def cb_confirm_no(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.clear()
    kb = await _main_menu_markup(t)
    await tg_api.raw_send_message(query.message.chat.id, t("order_cancelled"), reply_markup=kb)


@router.callback_query(OrderFlow.confirm, F.data == "order:confirm_yes")
async def cb_confirm_yes(query: CallbackQuery, t, state: FSMContext):
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


@router.callback_query(OrderFlow.confirm, F.data == "flow:back_summary")
async def cb_back_summary(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    data = await state.get_data()
    draft = data.get("draft") or {}
    if not draft.get("account_id"):
        return
    await state.set_state(OrderFlow.confirm)
    un = (
        f"@{query.from_user.username}"
        if query.from_user and query.from_user.username
        else "—"
    )
    txt = t(
        "order_summary",
        first_name=escape_html(query.from_user.first_name or "—"),
        username=escape_html(un),
        game=escape_html(draft.get("game_name", "")),
        product=escape_html(draft.get("product_label", "")),
        price=draft.get("price_tjs", 0),
        account_id=escape_html(draft.get("account_id", "")),
    )
    kb = tg_api.confirm_order_markup(t("confirm_yes"), t("confirm_no"))
    await tg_api.raw_send_message(query.message.chat.id, txt, reply_markup=kb, parse_mode="HTML")


@router.message(OrderFlow.game_id, F.text)
async def msg_game_id(message: Message, t, state: FSMContext):
    text = (message.text or "").strip()
    if text.startswith("/"):
        return
    if not re.fullmatch(r"\d{6,15}", text):
        await message.answer(t("invalid_id"), parse_mode="HTML")
        return
    data = await state.get_data()
    draft = dict(data.get("draft") or {})
    draft["account_id"] = text
    await state.update_data(draft=draft)
    await state.set_state(OrderFlow.confirm)
    un = f"@{message.from_user.username}" if message.from_user.username else "—"
    summary = t(
        "order_summary",
        first_name=escape_html(message.from_user.first_name or "—"),
        username=escape_html(un),
        game=escape_html(draft.get("game_name", "")),
        product=escape_html(draft.get("product_label", "")),
        price=draft.get("price_tjs", 0),
        account_id=escape_html(text),
    )
    kb = tg_api.confirm_order_markup(t("confirm_yes"), t("confirm_no"))
    await tg_api.raw_send_message(message.chat.id, summary, reply_markup=kb, parse_mode="HTML")
