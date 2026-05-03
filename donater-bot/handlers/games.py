import logging
import re

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from database import queries
from handlers.start import _main_menu_markup
from utils import photos, tg_api

log = logging.getLogger(__name__)
router = Router(name="games")


@router.callback_query(F.data == "nav:games")
async def cb_nav_games(query: CallbackQuery, t):
    await query.answer()
    kb = await _main_menu_markup(t)
    await tg_api.raw_send_message(query.message.chat.id, t("choose_game"), reply_markup=kb)


@router.callback_query(F.data.regexp(re.compile(r"^nav:game:(\d+)$")))
async def cb_game(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    chat_id = query.message.chat.id
    try:
        m = re.match(r"^nav:game:(\d+)$", query.data or "")
        gid = int(m.group(1)) if m else 0
        game = await queries.game_by_id(gid)
        if not game:
            await tg_api.raw_send_message(chat_id, t("game_not_found"))
            return
        products = await queries.products_by_game(gid)
        if not products:
            await tg_api.raw_send_message(chat_id, t("products_empty"))
            return

        await state.update_data(
            selected_game_id=gid,
            selected_game_name=game["name"],
            selected_emoji=game["emoji"],
        )

        caption = t(
            "choose_product",
            game=f"{game['emoji']} {game['name']}",
        )
        rows = [dict(p) for p in products]
        kb = tg_api.product_keyboard_rows(rows, back_cb="menu:home")

        path = photos.game_cover_path(game["name"])
        fid = game["cover_file_id"]
        if path:
            await tg_api.raw_send_photo_file(chat_id, path, caption, reply_markup=kb)
        elif fid:
            await tg_api.raw_send_photo_file_id(chat_id, fid, caption, reply_markup=kb)
        else:
            await tg_api.raw_send_message(chat_id, caption, reply_markup=kb)
        try:
            await query.message.delete()
        except Exception:
            pass
    except Exception as exc:
        log.exception("games: %s", exc)
        await tg_api.raw_send_message(chat_id, t("error_generic"))
