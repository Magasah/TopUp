import logging

from config import config
from utils import tg_api
from utils.formatter import escape_html

log = logging.getLogger(__name__)


def _payment_caption(method: str, t) -> str:
    if method == "dc_city":
        return t("payment_dc")
    if method == "alif":
        return t("payment_alif")
    if method == "mastercard":
        return t("payment_mc")
    if method == "milli":
        return t("payment_milli")
    return method


async def notify_new_order(
    bot,
    order_id: int,
    user_tg_id: int,
    username: str | None,
    game_name: str,
    product_label: str,
    price_tjs: int,
    account_id: str,
    payment_method: str,
    receipt_file_id: str | None,
    t,
) -> None:
    un = escape_html(username or "—")
    pay_caption = escape_html(_payment_caption(payment_method, t))
    text = t(
        "order_card_admin",
        id=order_id,
        username=un,
        game=escape_html(game_name),
        product=escape_html(product_label),
        price=price_tjs,
        account_id=escape_html(account_id),
        payment=pay_caption,
    )
    kb = tg_api.admin_order_actions(
        t("btn_accept"), t("btn_reject"), t("btn_write_user"), order_id, user_tg_id
    )
    for aid in config.admin_ids:
        try:
            if receipt_file_id:
                await tg_api.raw_send_photo_file_id(
                    aid, receipt_file_id, text, reply_markup=kb, parse_mode="HTML"
                )
            else:
                await tg_api.raw_send_message(aid, text, reply_markup=kb, parse_mode="HTML")
        except Exception as exc:
            log.warning("notify admin %s: %s", aid, exc)
