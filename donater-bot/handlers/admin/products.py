from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardButton

from database import queries
from filters.admin import AdminFilter
from states.order import AdminFlow
router = Router(name="admin_products")


@router.callback_query(F.data == "adm:products", AdminFilter())
async def cb_products(query: CallbackQuery, t):
    await query.answer()
    games = await queries.games_list_active()
    b = InlineKeyboardBuilder()
    for g in games:
        b.row(
            InlineKeyboardButton(
                text=f"{g['emoji']} {g['name']}"[:60], callback_data=f"admgp:{g['id']}"
            )
        )
    b.row(InlineKeyboardButton(text=t("admin_back"), callback_data="adm:home"))
    await query.message.answer("Выберите игру:", reply_markup=b.as_markup())


@router.callback_query(F.data.regexp(r"^admgp:(\d+)$"), AdminFilter())
async def cb_gp(query: CallbackQuery, t):
    await query.answer()
    gid = int((query.data or "").split(":")[-1])
    game = await queries.game_by_id(gid)
    if not game:
        return
    products = await queries.products_by_game(gid)
    b = InlineKeyboardBuilder()
    for p in products:
        b.row(
            InlineKeyboardButton(text="🗑", callback_data=f"admdp:{p['id']}"),
            InlineKeyboardButton(
                text=f"{p['label'][:40]} — {p['price_tjs']}", callback_data=f"admpinfo:{p['id']}"
            ),
        )
    b.row(InlineKeyboardButton(text="➕ Товар", callback_data=f"admpa:{gid}"))
    b.row(InlineKeyboardButton(text=t("admin_back"), callback_data="adm:products"))
    head = f"💎 <b>Товары</b> — {game['emoji']} {game['name']}"
    await query.message.answer(head, parse_mode="HTML", reply_markup=b.as_markup())


@router.callback_query(F.data.regexp(r"^admpa:(\d+)$"), AdminFilter())
async def cb_addp(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    gid = int((query.data or "").split(":")[-1])
    await state.set_state(AdminFlow.wizard)
    await state.update_data(
        wiz_kind="product_add", wiz_step="label", wiz_game_id=gid, wiz_label=None, wiz_price=None
    )
    await query.message.answer("Шаг 1: название / количество (например 310 алмазов):")


@router.callback_query(AdminFlow.wizard, F.data.regexp(r"^admpop:([01])$"), AdminFilter())
async def cb_pop(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    data = await state.get_data()
    if data.get("wiz_step") != "pop":
        return
    popular = (query.data or "").endswith("1")
    await state.update_data(wiz_popular=popular, wiz_step="best")
    b = InlineKeyboardBuilder()
    b.row(
        InlineKeyboardButton(text="✅ Да", callback_data="admbest:1"),
        InlineKeyboardButton(text="❌ Нет", callback_data="admbest:0"),
    )
    await query.message.answer("Лучшая ценность?", reply_markup=b.as_markup())


@router.callback_query(AdminFlow.wizard, F.data.regexp(r"^admbest:([01])$"), AdminFilter())
async def cb_best(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    data = await state.get_data()
    if data.get("wiz_step") != "best":
        return
    best = (query.data or "").endswith("1")
    gid = int(data["wiz_game_id"])
    so = await queries.product_next_sort_order(gid)
    await queries.product_insert(
        gid,
        data["wiz_label"],
        int(data["wiz_price"]),
        bool(data.get("wiz_popular")),
        best,
        so,
    )
    await state.clear()
    await query.message.answer("✅ Товар сохранён.")


@router.callback_query(F.data.regexp(r"^admdp:(\d+)$"), AdminFilter())
async def cb_delp(query: CallbackQuery, t):
    await query.answer()
    pid = int((query.data or "").split(":")[-1])
    await queries.product_delete(pid)
    await query.message.answer("Товар удалён.")
