import logging

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from config import config
from database import queries
from filters.admin import AdminFilter
from states.order import AdminFlow
from utils.formatter import escape_html

log = logging.getLogger(__name__)
router = Router(name="admin_reviews_mod")


def _tags_for_game(name: str) -> str:
    n = (name or "").lower()
    if "free" in n or "fire" in n:
        return "#Выполнено #FreeFire"
    if "pubg" in n:
        return "#Выполнено #PUBGMobile"
    return "#Выполнено"


@router.callback_query(F.data.regexp(r"^revok:(\d+)$"), AdminFilter())
async def cb_revok(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    rid = int((query.data or "").split(":")[-1])
    rev = await queries.review_by_id(rid)
    if not rev or rev["status"] != "pending":
        return
    oid = rev["order_id"]
    order = await queries.order_by_id(oid) if oid else None
    game = order["game_name"] if order else ""
    text = (
        f"{escape_html(rev['text'])}\n\n{_tags_for_game(game)}"
    )
    ch = config.reviews_channel.strip()
    if not ch:
        await query.message.answer("REVIEWS_CHANNEL не задан.")
        return
    try:
        msg = await query.bot.send_message(ch, text, parse_mode="HTML")
        await queries.review_set_status(rid, "published", msg.message_id)
    except Exception as exc:
        log.warning("publish review: %s", exc)
        await query.message.answer("Ошибка публикации.")
        return
    await query.message.answer("✅ Опубликовано.")


@router.callback_query(F.data.regexp(r"^revno:(\d+)$"), AdminFilter())
async def cb_revno(query: CallbackQuery, t):
    await query.answer()
    rid = int((query.data or "").split(":")[-1])
    await queries.review_set_status(rid, "rejected")
    await query.message.answer("Отзыв отклонён.")


@router.callback_query(F.data.regexp(r"^reved:(\d+)$"), AdminFilter())
async def cb_reved(query: CallbackQuery, t, state: FSMContext):
    await query.answer()
    rid = int((query.data or "").split(":")[-1])
    await state.set_state(AdminFlow.review_edit)
    await state.update_data(review_edit_id=rid)
    await query.message.answer("Новый текст отзыва:")


@router.message(AdminFlow.review_edit, F.text, AdminFilter())
async def msg_rev_edit(message: Message, t, state: FSMContext):
    data = await state.get_data()
    rid = data.get("review_edit_id")
    await state.clear()
    if not rid:
        return
    await queries.review_update_text(rid, (message.text or "").strip()[:2000])
    await message.answer("Текст обновлён (статус всё ещё pending — опубликуйте снова).")
