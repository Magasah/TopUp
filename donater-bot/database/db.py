import logging
from pathlib import Path

import aiosqlite

from config import BASE_DIR, config

log = logging.getLogger(__name__)


async def get_connection() -> aiosqlite.Connection:
    path = Path(config.database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = await aiosqlite.connect(path)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON")
    return conn


async def init_db() -> None:
    schema_path = BASE_DIR / "database" / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")
    conn = await get_connection()
    try:
        await conn.executescript(sql)
        await conn.commit()
        await _seed_if_empty(conn)
        await conn.commit()
    finally:
        await conn.close()


async def _seed_if_empty(conn: aiosqlite.Connection) -> None:
    cur = await conn.execute("SELECT COUNT(*) AS c FROM games")
    row = await cur.fetchone()
    if row and row["c"] > 0:
        return
    await conn.execute(
        "INSERT INTO games (name, emoji, is_active) VALUES (?, ?, 1)", ("Free Fire", "🔥")
    )
    await conn.execute(
        "INSERT INTO games (name, emoji, is_active) VALUES (?, ?, 1)",
        ("PUBG Mobile", "🎮"),
    )
    cur = await conn.execute("SELECT id, name FROM games ORDER BY id")
    games = await cur.fetchall()
    ff_id = next(g["id"] for g in games if "Free" in g["name"])
    pubg_id = next(g["id"] for g in games if "PUBG" in g["name"])
    ff_products = [
        ("💎 100 алмазов", 11, 0, 0, 10),
        ("💎 310 алмазов", 31, 1, 0, 20),
        ("💎 520 алмазов", 51, 0, 0, 30),
        ("💎 1060 алмазов", 110, 1, 0, 40),
        ("💎 2180 алмазов", 180, 0, 0, 50),
        ("💎 5600 алмазов", 550, 0, 1, 60),
    ]
    for label, price, pop, best, so in ff_products:
        await conn.execute(
            """INSERT INTO products (game_id, label, price_tjs, is_popular, is_best_value, sort_order, is_active)
               VALUES (?, ?, ?, ?, ?, ?, 1)""",
            (ff_id, label, price, pop, best, so),
        )
    pubg_products = [
        ("🎮 60 UC", 15, 0, 0, 10),
        ("🎮 180 UC", 40, 1, 0, 20),
        ("🎮 325 UC", 70, 0, 0, 30),
        ("🎮 660 UC", 130, 1, 0, 40),
        ("🎮 1800 UC", 330, 0, 1, 50),
    ]
    for label, price, pop, best, so in pubg_products:
        await conn.execute(
            """INSERT INTO products (game_id, label, price_tjs, is_popular, is_best_value, sort_order, is_active)
               VALUES (?, ?, ?, ?, ?, ?, 1)""",
            (pubg_id, label, price, pop, best, so),
        )
    log.info("Database seeded with default games and products")
