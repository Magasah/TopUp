from aiogram import Router

from filters.admin import AdminFilter
from handlers.admin import (
    broadcast,
    games_mgr,
    orders,
    panel,
    products,
    reviews_mod,
    wizard,
)

admin_router = Router(name="admin_root")
admin_router.message.filter(AdminFilter())
admin_router.callback_query.filter(AdminFilter())

admin_router.include_router(panel.router)
admin_router.include_router(wizard.router)
admin_router.include_router(orders.router)
admin_router.include_router(products.router)
admin_router.include_router(games_mgr.router)
admin_router.include_router(broadcast.router)
admin_router.include_router(reviews_mod.router)

__all__ = ["admin_router"]
