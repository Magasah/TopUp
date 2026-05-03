from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional, Sequence

import aiosqlite

from database.db import get_connection


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


async def user_upsert(
    tg_id: int,
    username: Optional[str],
    first_name: Optional[str],
    language: str,
) -> None:
    conn = await get_connection()
    try:
        cur = await conn.execute("SELECT id FROM users WHERE tg_id = ?", (tg_id,))
        row = await cur.fetchone()
        if row:
            await conn.execute(
                """UPDATE users SET username = ?, first_name = ?, last_active = datetime('now')
                   WHERE tg_id = ?""",
                (username, first_name, tg_id),
            )
        else:
            lang = language if language in ("ru", "tj") else "ru"
            await conn.execute(
                """INSERT INTO users (tg_id, username, first_name, language)
                   VALUES (?, ?, ?, ?)""",
                (tg_id, username, first_name, lang),
            )
        await conn.commit()
    finally:
        await conn.close()


async def user_touch_activity(tg_id: int) -> None:
    conn = await get_connection()
    try:
        await conn.execute(
            "UPDATE users SET last_active = datetime('now') WHERE tg_id = ?", (tg_id,)
        )
        await conn.commit()
    finally:
        await conn.close()


async def user_get_language(tg_id: int) -> str:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            "SELECT language FROM users WHERE tg_id = ?", (tg_id,)
        )
        row = await cur.fetchone()
        return row["language"] if row else "ru"
    finally:
        await conn.close()


async def user_set_language(tg_id: int, lang: str) -> None:
    conn = await get_connection()
    try:
        l = "tj" if lang == "tj" else "ru"
        await conn.execute(
            "UPDATE users SET language = ? WHERE tg_id = ?", (l, tg_id)
        )
        await conn.commit()
    finally:
        await conn.close()


async def games_list_active() -> List[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            "SELECT * FROM games WHERE is_active = 1 ORDER BY id"
        )
        return list(await cur.fetchall())
    finally:
        await conn.close()


async def game_by_id(gid: int) -> Optional[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute("SELECT * FROM games WHERE id = ?", (gid,))
        return await cur.fetchone()
    finally:
        await conn.close()


async def products_by_game(game_id: int) -> List[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """SELECT * FROM products WHERE game_id = ? AND is_active = 1
               ORDER BY sort_order, id""",
            (game_id,),
        )
        return list(await cur.fetchall())
    finally:
        await conn.close()


async def product_by_id(pid: int) -> Optional[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute("SELECT * FROM products WHERE id = ?", (pid,))
        return await cur.fetchone()
    finally:
        await conn.close()


async def order_create(
    user_tg_id: int,
    username: Optional[str],
    game_name: str,
    product_label: str,
    price_tjs: int,
    game_account_id: str,
    payment_method: str,
    receipt_file_id: str,
) -> int:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """INSERT INTO orders (user_tg_id, username, game_name, product_label, price_tjs,
               game_account_id, payment_method, receipt_file_id, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')""",
            (
                user_tg_id,
                username,
                game_name,
                product_label,
                price_tjs,
                game_account_id,
                payment_method,
                receipt_file_id,
            ),
        )
        await conn.commit()
        return int(cur.lastrowid)
    finally:
        await conn.close()


async def order_by_id(oid: int) -> Optional[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute("SELECT * FROM orders WHERE id = ?", (oid,))
        return await cur.fetchone()
    finally:
        await conn.close()


async def orders_list_filtered(
    status: str, limit: int, offset: int
) -> List[aiosqlite.Row]:
    conn = await get_connection()
    try:
        if status == "all":
            cur = await conn.execute(
                "SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
        else:
            cur = await conn.execute(
                """SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC
                   LIMIT ? OFFSET ?""",
                (status, limit, offset),
            )
        return list(await cur.fetchall())
    finally:
        await conn.close()


async def order_count_by_status(status: str) -> int:
    conn = await get_connection()
    try:
        if status == "all":
            cur = await conn.execute("SELECT COUNT(*) AS c FROM orders")
        else:
            cur = await conn.execute(
                "SELECT COUNT(*) AS c FROM orders WHERE status = ?", (status,)
            )
        row = await cur.fetchone()
        return int(row["c"]) if row else 0
    finally:
        await conn.close()


async def order_accept(oid: int) -> None:
    conn = await get_connection()
    try:
        await conn.execute(
            """UPDATE orders SET status = 'accepted', completed_at = datetime('now')
               WHERE id = ? AND status = 'pending'""",
            (oid,),
        )
        await conn.commit()
    finally:
        await conn.close()


async def order_reject(oid: int, reason: str) -> None:
    conn = await get_connection()
    try:
        await conn.execute(
            """UPDATE orders SET status = 'rejected', completed_at = datetime('now'),
               reject_reason = ? WHERE id = ? AND status = 'pending'""",
            (reason or "", oid),
        )
        await conn.commit()
    finally:
        await conn.close()


async def orders_recent_for_user(user_tg_id: int, limit: int = 5) -> List[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """SELECT * FROM orders WHERE user_tg_id = ? AND status = 'accepted'
               ORDER BY datetime(COALESCE(completed_at, created_at)) DESC, id DESC LIMIT ?""",
            (user_tg_id, limit),
        )
        return list(await cur.fetchall())
    finally:
        await conn.close()


async def user_has_accepted_order(user_tg_id: int) -> bool:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """SELECT 1 FROM orders WHERE user_tg_id = ? AND status = 'accepted' LIMIT 1""",
            (user_tg_id,),
        )
        return await cur.fetchone() is not None
    finally:
        await conn.close()


async def user_orders_list(user_tg_id: int, limit: int = 5) -> List[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """SELECT id, product_label, price_tjs, status, created_at
               FROM orders WHERE user_tg_id = ? ORDER BY id DESC LIMIT ?""",
            (user_tg_id, limit),
        )
        return list(await cur.fetchall())
    finally:
        await conn.close()


async def stats_summary() -> dict[str, Any]:
    conn = await get_connection()
    try:
        async def one(sql: str, params: Sequence[Any] = ()) -> int:
            c = await conn.execute(sql, params)
            r = await c.fetchone()
            return int(r[0]) if r and r[0] is not None else 0

        users_total = await one("SELECT COUNT(*) FROM users")
        orders_total = await one("SELECT COUNT(*) FROM orders")
        pending = await one("SELECT COUNT(*) FROM orders WHERE status = 'pending'")
        accepted = await one("SELECT COUNT(*) FROM orders WHERE status = 'accepted'")
        rejected = await one("SELECT COUNT(*) FROM orders WHERE status = 'rejected'")

        online_24h = await one(
            """SELECT COUNT(*) FROM users WHERE datetime(last_active) >= datetime('now', '-1 day')"""
        )

        orders_today = await one(
            """SELECT COUNT(*) FROM orders WHERE date(created_at) = date('now')"""
        )
        orders_week = await one(
            """SELECT COUNT(*) FROM orders WHERE datetime(created_at) >= datetime('now', '-7 days')"""
        )
        orders_month = await one(
            """SELECT COUNT(*) FROM orders WHERE datetime(created_at) >= datetime('now', '-30 days')"""
        )

        rev_today = await one(
            """SELECT COALESCE(SUM(price_tjs),0) FROM orders WHERE status='accepted'
               AND date(completed_at) = date('now')"""
        )
        rev_week = await one(
            """SELECT COALESCE(SUM(price_tjs),0) FROM orders WHERE status='accepted'
               AND datetime(completed_at) >= datetime('now', '-7 days')"""
        )
        rev_month = await one(
            """SELECT COALESCE(SUM(price_tjs),0) FROM orders WHERE status='accepted'
               AND datetime(completed_at) >= datetime('now', '-30 days')"""
        )
        rev_all = await one(
            "SELECT COALESCE(SUM(price_tjs),0) FROM orders WHERE status='accepted'"
        )

        cur = await conn.execute(
            """SELECT product_label, COUNT(*) AS c FROM orders WHERE status='accepted'
               GROUP BY product_label ORDER BY c DESC LIMIT 3"""
        )
        top_products = [(r["product_label"], r["c"]) for r in await cur.fetchall()]

        done_rate = (
            round(100 * accepted / (accepted + rejected), 1)
            if (accepted + rejected) > 0
            else 0.0
        )

        return {
            "users_total": users_total,
            "online_24h": online_24h,
            "orders_total": orders_total,
            "orders_today": orders_today,
            "orders_week": orders_week,
            "orders_month": orders_month,
            "pending": pending,
            "accepted": accepted,
            "rejected": rejected,
            "revenue_today": rev_today,
            "revenue_week": rev_week,
            "revenue_month": rev_month,
            "revenue_all": rev_all,
            "top_products": top_products,
            "done_rate": done_rate,
        }
    finally:
        await conn.close()


async def all_user_tg_ids() -> List[int]:
    conn = await get_connection()
    try:
        cur = await conn.execute("SELECT tg_id FROM users")
        rows = await cur.fetchall()
        return [int(r["tg_id"]) for r in rows]
    finally:
        await conn.close()


async def broadcast_insert(text: str, sent_count: int) -> None:
    conn = await get_connection()
    try:
        await conn.execute(
            "INSERT INTO broadcasts (text, sent_count) VALUES (?, ?)", (text, sent_count)
        )
        await conn.commit()
    finally:
        await conn.close()


async def game_insert(name: str, emoji: str, cover_file_id: Optional[str]) -> int:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            "INSERT INTO games (name, emoji, cover_file_id, is_active) VALUES (?, ?, ?, 1)",
            (name, emoji, cover_file_id),
        )
        await conn.commit()
        return int(cur.lastrowid)
    finally:
        await conn.close()


async def game_delete(gid: int) -> None:
    conn = await get_connection()
    try:
        await conn.execute("DELETE FROM games WHERE id = ?", (gid,))
        await conn.commit()
    finally:
        await conn.close()


async def product_insert(
    game_id: int,
    label: str,
    price_tjs: int,
    is_popular: bool,
    is_best_value: bool,
    sort_order: int,
) -> int:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """INSERT INTO products (game_id, label, price_tjs, is_popular, is_best_value, sort_order, is_active)
               VALUES (?, ?, ?, ?, ?, ?, 1)""",
            (
                game_id,
                label,
                price_tjs,
                1 if is_popular else 0,
                1 if is_best_value else 0,
                sort_order,
            ),
        )
        await conn.commit()
        return int(cur.lastrowid)
    finally:
        await conn.close()


async def product_update(
    pid: int,
    label: Optional[str] = None,
    price_tjs: Optional[int] = None,
    is_popular: Optional[bool] = None,
    is_best_value: Optional[bool] = None,
) -> None:
    conn = await get_connection()
    try:
        parts: List[str] = []
        vals: List[Any] = []
        if label is not None:
            parts.append("label = ?")
            vals.append(label)
        if price_tjs is not None:
            parts.append("price_tjs = ?")
            vals.append(price_tjs)
        if is_popular is not None:
            parts.append("is_popular = ?")
            vals.append(1 if is_popular else 0)
        if is_best_value is not None:
            parts.append("is_best_value = ?")
            vals.append(1 if is_best_value else 0)
        if not parts:
            return
        vals.append(pid)
        await conn.execute(
            f"UPDATE products SET {', '.join(parts)} WHERE id = ?", vals
        )
        await conn.commit()
    finally:
        await conn.close()


async def product_delete(pid: int) -> None:
    conn = await get_connection()
    try:
        await conn.execute("DELETE FROM products WHERE id = ?", (pid,))
        await conn.commit()
    finally:
        await conn.close()


async def product_next_sort_order(game_id: int) -> int:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            "SELECT COALESCE(MAX(sort_order), 0) AS m FROM products WHERE game_id = ?",
            (game_id,),
        )
        row = await cur.fetchone()
        return int(row["m"]) + 10 if row else 10
    finally:
        await conn.close()


async def review_create(order_id: Optional[int], user_tg_id: int, text: str) -> int:
    conn = await get_connection()
    try:
        cur = await conn.execute(
            """INSERT INTO reviews (order_id, user_tg_id, text, status)
               VALUES (?, ?, ?, 'pending')""",
            (order_id, user_tg_id, text),
        )
        await conn.commit()
        return int(cur.lastrowid)
    finally:
        await conn.close()


async def review_by_id(rid: int) -> Optional[aiosqlite.Row]:
    conn = await get_connection()
    try:
        cur = await conn.execute("SELECT * FROM reviews WHERE id = ?", (rid,))
        return await cur.fetchone()
    finally:
        await conn.close()


async def review_update_text(rid: int, text: str) -> None:
    conn = await get_connection()
    try:
        await conn.execute("UPDATE reviews SET text = ? WHERE id = ?", (text, rid))
        await conn.commit()
    finally:
        await conn.close()


async def review_set_status(
    rid: int, status: str, channel_msg_id: Optional[int] = None
) -> None:
    conn = await get_connection()
    try:
        if channel_msg_id is not None:
            await conn.execute(
                """UPDATE reviews SET status = ?, channel_msg_id = COALESCE(?, channel_msg_id)
                   WHERE id = ?""",
                (status, channel_msg_id, rid),
            )
        else:
            await conn.execute("UPDATE reviews SET status = ? WHERE id = ?", (status, rid))
        await conn.commit()
    finally:
        await conn.close()
