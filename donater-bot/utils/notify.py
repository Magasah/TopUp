import json
from config import config
from utils.tg_api import send_photo, send_message, admin_order_kb

async def notify_admins_new_order(order_id, data):
    caption = f"🆕 <b>Новый заказ #{order_id}</b>\n\n"
    caption += f"👤 Пользователь: {data.get('first_name')} (@{data.get('username', '—')})\n"
    caption += f"🎮 Игра: {data['game_name']}\n"
    caption += f"💎 Товар: {data['product_label']}\n"
    caption += f"🆔 ID в игре: <code>{data['game_account_id']}</code>\n"
    caption += f"💳 Оплата: {data['payment_method']} ({data['price_tjs']} смн)"
    
    kb = admin_order_kb(order_id, data['user_tg_id'])
    
    for admin_id in config.admin_ids_list:
        try:
            if data.get('receipt_file_id'):
                await send_photo(admin_id, photo_path=data['receipt_file_id'], caption=caption, keyboard=kb)
            else:
                await send_message(admin_id, caption, keyboard=kb)
        except Exception as e:
            print(f"Failed to notify admin {admin_id}: {e}")
