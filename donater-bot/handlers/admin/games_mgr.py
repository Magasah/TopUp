from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from database import queries
from filters.admin import AdminFilter
from states.order import AdminFlow

router = Router(name="admin_games")


@router.callback_query(F.data == "adm:games", AdminFilter())
async def cb_games(query: CallbackQuery, t):
    await query.answer()
    games = await queries.games_list_active()
    lines = ["🎮 <b>Управление играми</b>\n"]
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram.types import InlineKeyboardButton

    b = InlineKeyboardBuilder()
    for g in games:
        b.row(
            InlineKeyboardButton(text=f"🗑 {g['name']}", callback_data=f"admgdel:{g['id']}")
        )
    b.row(InlineKeyboardButton(text="➕ Игра", callback_data="admgn"))
    b.row(InlineKeyboardButton(text=t("admin_back"), callback_data="adm:home"))
    await query.message.answer("\n".join(lines), parse_mode="HTML", reply_markup=b.as_markup())


@router.callback_query(F.data == "admgn", AdminFilter())
async def cb_gn(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    await state.set_state(AdminFlow.wizard)
    await state.update_data(wiz_kind="game_add", wiz_step="name", wiz_name=None)
    await query.message.answer("Название игры:")


@router.callback_query(F.data.regexp(r"^admgdel:(\d+)$"), AdminFilter())
async def cb_gdel(query: CallbackQuery, t):
    await query.answer()
    gid = int((query.data or "").split(":")[-1])
    await queries.game_delete(gid)
    await query.message.answer("Игра удалена (товары каскадом).")
