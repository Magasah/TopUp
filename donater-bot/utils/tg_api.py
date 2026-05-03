"""Raw Telegram HTTP JSON — inline-кнопки с полем style."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

import aiohttp

from config import config

log = logging.getLogger(__name__)


def _base() -> str:
    return f"https://api.telegram.org/bot{config.bot_token}"


async def raw_send_message(
    chat_id: int,
    text: str,
    reply_markup: Optional[Dict[str, Any]] = None,
    parse_mode: str = "HTML",
) -> dict:
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
    }
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_base()}/sendMessage",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                data = await resp.json(content_type=None)
                if not data.get("ok"):
                    log.error("sendMessage: %s", data)
                return data
    except Exception as exc:
        log.exception("raw_send_message: %s", exc)
        return {"ok": False, "description": str(exc)}


async def raw_send_photo_file(
    chat_id: int,
    file_path: Path,
    caption: str,
    reply_markup: Optional[Dict[str, Any]] = None,
    parse_mode: str = "HTML",
) -> dict:
    try:
        file_bytes = file_path.read_bytes()
    except OSError as exc:
        log.error("read photo: %s", exc)
        return {"ok": False, "description": str(exc)}
    data = aiohttp.FormData()
    data.add_field("chat_id", str(chat_id))
    data.add_field("caption", caption)
    data.add_field("parse_mode", parse_mode)
    data.add_field(
        "photo",
        file_bytes,
        filename=file_path.name,
        content_type="image/jpeg",
    )
    if reply_markup is not None:
        data.add_field("reply_markup", json.dumps(reply_markup))
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_base()}/sendPhoto",
                data=data,
                timeout=aiohttp.ClientTimeout(total=120),
            ) as resp:
                body = await resp.json(content_type=None)
                if not body.get("ok"):
                    log.error("sendPhoto: %s", body)
                return body
    except Exception as exc:
        log.exception("raw_send_photo_file: %s", exc)
        return {"ok": False, "description": str(exc)}


async def raw_send_photo_file_id(
    chat_id: int,
    file_id: str,
    caption: str,
    reply_markup: Optional[Dict[str, Any]] = None,
    parse_mode: str = "HTML",
) -> dict:
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "photo": file_id,
        "caption": caption,
        "parse_mode": parse_mode,
    }
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_base()}/sendPhoto",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                return await resp.json(content_type=None)
    except Exception as exc:
        log.exception("raw_send_photo_file_id: %s", exc)
        return {"ok": False}


async def raw_edit_reply_markup(
    chat_id: int, message_id: int, reply_markup: Optional[Dict[str, Any]]
) -> dict:
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "message_id": message_id,
        "reply_markup": reply_markup or {"inline_keyboard": []},
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_base()}/editMessageReplyMarkup",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                return await resp.json(content_type=None)
    except Exception as exc:
        log.exception("raw_edit_reply_markup: %s", exc)
        return {"ok": False}


def style_btn(text: str, callback_data: str, style: Optional[str] = None) -> dict:
    """Только text + callback_data. Поле ``style`` в Bot API для inline даёт 400
    (invalid button style) у части клиентов/версий API — не отправляем."""
    return {"text": text, "callback_data": callback_data}


def main_menu_markup(lang: str) -> dict:
    """Игры подставляются в хендлере после загрузки из БД — здесь шаблон без id."""
    return {
        "inline_keyboard": [
            [
                style_btn("🔥 Free Fire", "nav:game:__FF__", "destructive"),
                style_btn("🎮 PUBG Mobile", "nav:game:__PUBG__", "primary"),
            ],
            [
                {"text": "⚙️ Настройки", "callback_data": "menu:settings"},
                {"text": "📞 Поддержка", "url": config.support_url},
            ],
        ]
    }


def build_main_menu_from_games(rows_game_buttons: list) -> dict:
    """rows_game_buttons: list of rows, each row list of dict buttons."""
    kb = rows_game_buttons + [
        [
            {"text": "⚙️ Настройки", "callback_data": "menu:settings"},
            {"text": "📞 Поддержка", "url": config.support_url},
        ]
    ]
    return {"inline_keyboard": kb}


def product_keyboard_rows(products: list, back_cb: str = "menu:home") -> dict:
    rows = []
    for p in products:
        st = "primary"
        if p["is_popular"]:
            st = "destructive"
        elif p["is_best_value"]:
            st = "success"
        fire = "🔥 " if p["is_popular"] else ""
        star = "⭐ " if p["is_best_value"] else ""
        line = f"{fire}{star}{p['label']} — {p['price_tjs']} смн"[:64]
        rows.append([style_btn(line, f"prod:{p['id']}", st)])
    rows.append([{"text": "◀️ Назад", "callback_data": back_cb}])
    return {"inline_keyboard": rows}


def payment_methods_markup(
    t_dc: str, t_alif: str, t_mc: str, t_milli: str, t_back: str
) -> dict:
    return {
        "inline_keyboard": [
            [style_btn(t_dc, "pay:dc_city", "primary")],
            [style_btn(t_alif, "pay:alif", "success")],
            [style_btn(t_mc, "pay:mastercard", "destructive")],
            [style_btn(t_milli, "pay:milli", "primary")],
            [{"text": t_back, "callback_data": "flow:back_summary"}],
        ]
    }


def confirm_order_markup(t_yes: str, t_no: str) -> dict:
    return {
        "inline_keyboard": [
            [
                style_btn(t_yes, "order:confirm_yes", "success"),
                style_btn(t_no, "order:confirm_no", "destructive"),
            ]
        ]
    }


def admin_order_actions(t_accept: str, t_reject: str, t_write: str, oid: int, uid: int) -> dict:
    return {
        "inline_keyboard": [
            [
                style_btn(t_accept, f"adm:acc:{oid}", "success"),
                style_btn(t_reject, f"adm:rej:{oid}", "destructive"),
            ],
            [{"text": t_write, "url": f"tg://user?id={uid}"}],
        ]
    }


def captcha_keyboard(salt: str, opts: list) -> dict:
    rows = []
    for opt in opts:
        st = "success" if opt["correct"] else "destructive"
        rows.append(
            [style_btn(str(opt["label"]), f"cap:{salt}:{opt['value']}", st)]
        )
    return {"inline_keyboard": rows}


def review_admin_keyboard_raw(review_id: int, t) -> dict:
    return {
        "inline_keyboard": [
            [
                style_btn(t("review_btn_add"), f"revok:{review_id}", "success"),
                style_btn(t("review_btn_edit"), f"reved:{review_id}", "primary"),
            ],
            [style_btn(t("review_btn_reject"), f"revno:{review_id}", "destructive")],
        ]
    }
