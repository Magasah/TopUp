from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardButton

from database import queries
from filters.admin import AdminFilter
from utils.formatter import escape_html

router = Router(name="admin_panel")


def _admin_kb(t):
    b = InlineKeyboardBuilder()
    b.row(InlineKeyboardButton(text=t("admin_stats"), callback_data="adm:stats"))
    b.row(InlineKeyboardButton(text=t("admin_orders"), callback_data="adm:orders"))
    b.row(InlineKeyboardButton(text=t("admin_products"), callback_data="adm:products"))
    b.row(InlineKeyboardButton(text=t("games_manage"), callback_data="adm:games"))
    b.row(InlineKeyboardButton(text=t("admin_broadcast"), callback_data="adm:broadcast"))
    return b.as_markup()


@router.message(Command("admin"), AdminFilter())
async def cmd_admin(message: Message, t):
    await message.answer(t("admin_panel_title"), parse_mode="HTML", reply_markup=_admin_kb(t))


@router.callback_query(F.data == "adm:home", AdminFilter())
async def cb_admin_home(query: CallbackQuery, t):
    await query.answer()
    await query.message.answer(
        t("admin_panel_title"), parse_mode="HTML", reply_markup=_admin_kb(t)
    )


@router.callback_query(F.data == "adm:stats", AdminFilter())
async def cb_stats(query: CallbackQuery, t):
    await query.answer()
    s = await queries.stats_summary()
    top_lines = "\n".join(
        f"  • {escape_html(x[0])}: <b>{x[1]}</b>" for x in s["top_products"]
    ) or "  —"
    text = (
        f"{t('stats_title')}\n───────────────────\n"
        f"🟢 {t('stats_online')}: <code>{s['online_24h']}</code>\n"
        f"📅 {t('stats_orders_today')}: <code>{s['orders_today']}</code>\n"
        f"📅 {t('stats_orders_week')}: <code>{s['orders_week']}</code>\n"
        f"📅 {t('stats_orders_month')}: <code>{s['orders_month']}</code>\n"
        f"📦 {t('stats_orders_all')}: <code>{s['orders_total']}</code>\n"
        f"───────────────────\n"
        f"💰 {t('stats_rev_today')}: <code>{s['revenue_today']}</code> смн\n"
        f"💰 {t('stats_rev_week')}: <code>{s['revenue_week']}</code> смн\n"
        f"💰 {t('stats_rev_month')}: <code>{s['revenue_month']}</code> смн\n"
        f"💰 {t('stats_rev_all')}: <code>{s['revenue_all']}</code> смн\n"
        f"───────────────────\n"
        f"{t('stats_top')}:\n{top_lines}\n"
        f"✅ {t('stats_done_rate')}: <code>{s['done_rate']}</code>%"
    )
    b = InlineKeyboardBuilder()
    b.row(InlineKeyboardButton(text=t("admin_back"), callback_data="adm:home"))
    await query.message.answer(text, parse_mode="HTML", reply_markup=b.as_markup())