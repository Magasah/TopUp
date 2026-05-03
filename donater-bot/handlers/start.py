import logging
from typing import Union

from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import config
from database import queries
from utils import photos
from utils import tg_api
from utils.formatter import escape_html

log = logging.getLogger(__name__)
router = Router(name="start")


def _channel_url() -> str:
    ch = config.channel_id.strip()
    if not ch:
        return "https://t.me/"
    if ch.startswith("@"):
        return f"https://t.me/{ch[1:]}"
    if ch.startswith("-100"):
        return f"https://t.me/c/{ch.replace('-100', '')}/1"
    if ch.startswith("http"):
        return ch
    return f"https://t.me/{ch}"


def _sub_kb(t):
    b = InlineKeyboardBuilder()
    b.row(InlineKeyboardButton(text=t("btn_subscribe"), url=_channel_url()))
    b.row(InlineKeyboardButton(text=t("btn_i_subscribed"), callback_data="sub:check"))
    return b.as_markup()


async def _main_menu_markup(t):
    games = await queries.games_list_active()
    rows = []
    buf = []
    for g in games:
        name = g["name"]
        st = "destructive" if "free" in name.lower() else "primary"
        buf.append(
            {
                "text": f"{g['emoji']} {g['name']}"[:64],
                "callback_data": f"nav:game:{g['id']}",
                "style": st,
            }
        )
        if len(buf) == 2:
            rows.append(buf)
            buf = []
    if buf:
        rows.append(buf)
    rows.append(
        [
            {"text": "⚙️ Настройки", "callback_data": "menu:settings"},
            {"text": "📞 Поддержка", "url": config.support_url},
        ]
    )
    return {"inline_keyboard": rows}


async def send_main_menu(bot, chat_id: int, t):
    text = f"{t('main_title')}\n\n{t('main_sub')}"
    kb = await _main_menu_markup(t)
    await tg_api.raw_send_message(chat_id, text, reply_markup=kb)


@router.message(CommandStart())
async def cmd_start(message: Message, t):
    uid = message.from_user.id
    un = message.from_user.username
    fn = message.from_user.first_name
    await queries.user_upsert(uid, un, fn, "ru")
    lang = await queries.user_get_language(uid)

    if config.channel_id.strip():
        try:
            member = await message.bot.get_chat_member(config.channel_id.strip(), uid)
            from aiogram.enums import ChatMemberStatus

            if member.status in (ChatMemberStatus.LEFT, ChatMemberStatus.KICKED):
                cap = t("subscribe_required")
                photo = photos.welcome_photo()
                if photo:
                    await message.answer_photo(photo=photo, caption=cap, parse_mode="HTML", reply_markup=_sub_kb(t))
                else:
                    await message.answer(cap, parse_mode="HTML", reply_markup=_sub_kb(t))
                return
        except Exception as exc:
            log.warning("subscription check: %s", exc)

    name = escape_html(fn or "friend")
    welcome = t("welcome", name=name, main_sub=t("main_sub"))
    photo = photos.welcome_photo()
    kb = await _main_menu_markup(t)
    if photo:
        try:
            await message.answer_photo(photo=photo, caption=welcome, parse_mode="HTML", reply_markup=kb)
        except Exception as exc:
            log.warning("welcome photo: %s", exc)
            await tg_api.raw_send_message(message.chat.id, welcome, reply_markup=kb)
    else:
        await tg_api.raw_send_message(message.chat.id, welcome, reply_markup=kb)


@router.callback_query(F.data == "sub:check")
async def cb_sub_check(query: CallbackQuery, t):
    await query.answer()
    uid = query.from_user.id
    if not config.channel_id.strip():
        await send_main_menu(query.bot, query.message.chat.id, t)
        return
    try:
        member = await query.bot.get_chat_member(config.channel_id.strip(), uid)
        from aiogram.enums import ChatMemberStatus

        if member.status in (ChatMemberStatus.LEFT, ChatMemberStatus.KICKED):
            await query.message.answer(t("not_subscribed"))
            return
    except Exception as exc:
        log.warning("sub check: %s", exc)
    await query.message.answer(t("subscribed_ok"), parse_mode="HTML")
    await send_main_menu(query.bot, query.message.chat.id, t)


@router.callback_query(F.data == "menu:home")
async def cb_home(query: CallbackQuery, t):
    await query.answer()
    await send_main_menu(query.bot, query.message.chat.id, t)


@router.callback_query(F.data == "menu:support")
async def cb_support_unused(query: CallbackQuery, t):
    """Поддержка открывается по URL в главном меню; оставлено для старых кнопок callback."""
    await query.answer()
    text = f"{t('support_title')}\n\n{t('support_body', sid=config.support_manager_id)}"
    b = InlineKeyboardBuilder()
    b.row(InlineKeyboardButton(text="💬 Написать в поддержку", url=config.support_url))
    b.row(InlineKeyboardButton(text=t("main_menu"), callback_data="menu:home"))
    await query.message.answer(text, parse_mode="HTML", reply_markup=b.as_markup())
