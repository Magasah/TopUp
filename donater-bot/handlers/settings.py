from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardButton

from database import queries
from utils import photos

router = Router(name="settings")


def _kb(lang: str, t):
    b = InlineKeyboardBuilder()
    ru_mark = " ✓" if lang == "ru" else ""
    tj_mark = " ✓" if lang == "tj" else ""
    b.row(
        InlineKeyboardButton(text=t("lang_ru") + ru_mark, callback_data="setlang:ru"),
        InlineKeyboardButton(text=t("lang_tj") + tj_mark, callback_data="setlang:tj"),
    )
    b.row(InlineKeyboardButton(text=t("main_menu"), callback_data="menu:home"))
    return b.as_markup()


@router.callback_query(F.data == "menu:settings")
async def cb_settings(query: CallbackQuery, t):
    await query.answer()
    uid = query.from_user.id
    lang = await queries.user_get_language(uid)
    lang_label = "Тоҷикӣ" if lang == "tj" else "Русский"
    cap = t("settings_title", lang=lang_label)
    path = photos.store_photo()
    if path:
        await query.message.answer_photo(
            photo=path,
            caption=cap,
            parse_mode="HTML",
            reply_markup=_kb(lang, t),
        )
    else:
        await query.message.answer(cap, parse_mode="HTML", reply_markup=_kb(lang, t))


@router.callback_query(F.data.regexp(r"^setlang:(ru|tj)$"))
async def cb_setlang(query: CallbackQuery, t):
    await query.answer()
    lang = (query.data or "").split(":")[-1]
    uid = query.from_user.id
    await queries.user_set_language(uid, lang)
    await query.message.answer(t("language_changed"), parse_mode="HTML")
    lang_label = "Тоҷикӣ" if lang == "tj" else "Русский"
    cap = t("settings_title", lang=lang_label)
    path = photos.store_photo()
    if path:
        await query.message.answer_photo(
            photo=path,
            caption=cap,
            parse_mode="HTML",
            reply_markup=_kb(lang, t),
        )
    else:
        await query.message.answer(cap, parse_mode="HTML", reply_markup=_kb(lang, t))
