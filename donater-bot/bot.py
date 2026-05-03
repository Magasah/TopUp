"""
Точка входа: Aiogram 3 + aiosqlite.
Запуск: python bot.py  (из каталога donater-bot)
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import ErrorEvent

from config import BASE_DIR, config
from database.db import init_db
from handlers import games, misc, order, payment, review, settings, start
from handlers.admin import admin_router
from middlewares.anti_spam import AntiSpamMiddleware
from middlewares.i18n import I18nMiddleware
from middlewares.subscription import SubscriptionMiddleware
from utils.singleton_lock import acquire as singleton_acquire
from utils.singleton_lock import release as singleton_release


async def main() -> None:
    Path("logs").mkdir(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.FileHandler(Path("logs/bot.log"), encoding="utf-8"),
            logging.StreamHandler(),
        ],
        force=True,
    )
    log = logging.getLogger("bot")

    if not config.bot_token:
        raise SystemExit("BOT_TOKEN is required (.env)")

    await init_db()
    log.info("Database ready")

    bot = Bot(token=config.bot_token)
    dp = Dispatcher(storage=MemoryStorage())

    dp.update.outer_middleware(I18nMiddleware())
    dp.update.outer_middleware(AntiSpamMiddleware())
    dp.update.outer_middleware(SubscriptionMiddleware())

    @dp.errors()
    async def global_errors(event: ErrorEvent) -> None:
        logging.exception("Unhandled: %s", event.exception)

    dp.include_router(start.router)
    dp.include_router(games.router)
    dp.include_router(order.router)
    dp.include_router(payment.router)
    dp.include_router(settings.router)
    dp.include_router(review.router)
    dp.include_router(admin_router)
    dp.include_router(misc.router)

    await bot.delete_webhook(drop_pending_updates=False)
    try:
        wh = await bot.get_webhook_info()
        if getattr(wh, "url", None):
            logging.getLogger("bot").warning(
                "После delete_webhook URL всё ещё: %s — при конфликте проверьте API вручную.",
                wh.url,
            )
    except Exception as exc:
        logging.getLogger("bot").debug("get_webhook_info: %s", exc)

    logging.getLogger("bot").info(
        "Long polling. Если в логах TelegramConflictError (409): "
        "остановите ВСЕ другие процессы с этим BOT_TOKEN (второй python bot.py, "
        "node index.js / Grammy, VPS, PaaS), закройте лишние терминалы и диспетчер задач (node.exe). "
        "Одновременно может работать только один getUpdates на токен."
    )
    await dp.start_polling(bot)


if __name__ == "__main__":
    _lock = BASE_DIR / ".bot_singleton.lock"
    singleton_acquire(_lock)
    try:
        asyncio.run(main())
    finally:
        singleton_release(_lock)
