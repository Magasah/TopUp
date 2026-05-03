/**
 * SQLite через sql.js (без нативной сборки; работает на Windows без MSVC).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvPath() {
  const envPath = process.env.DATABASE_PATH || './database/bot.db';
  return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
}

let rawDb = null;
let dbPathFs = '';
let persistScheduled = false;

function persistNow() {
  if (!rawDb || !dbPathFs) return;
  const data = rawDb.export();
  fs.mkdirSync(path.dirname(dbPathFs), { recursive: true });
  fs.writeFileSync(dbPathFs, Buffer.from(data));
}

function schedulePersist() {
  if (persistScheduled) return;
  persistScheduled = true;
  queueMicrotask(() => {
    persistScheduled = false;
    persistNow();
  });
}

function wrapPrepare(sql) {
  return {
    get(...params) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      const ok = stmt.step();
      const row = ok ? stmt.getAsObject() : undefined;
      stmt.free();
      return row;
    },
    all(...params) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
    run(...params) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      schedulePersist();
      let lastInsertRowid = 0;
      try {
        const r = rawDb.exec('SELECT last_insert_rowid() AS id');
        if (r[0]?.values?.[0]?.[0] != null) {
          lastInsertRowid = Number(r[0].values[0][0]);
        }
      } catch {
        /* ignore */
      }
      const changes = typeof rawDb.getRowsModified === 'function' ? rawDb.getRowsModified() : 0;
      return { lastInsertRowid, changes };
    },
  };
}

function wrapDb() {
  return {
    prepare: (sql) => wrapPrepare(sql),
    exec(sql) {
      rawDb.exec(sql);
      schedulePersist();
    },
  };
}

let dbFacade = null;

export async function initDatabase() {
  if (dbFacade) return dbFacade;

  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();

  dbPathFs = loadEnvPath();
  const dir = path.dirname(dbPathFs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(dbPathFs)) {
    const filebuffer = fs.readFileSync(dbPathFs);
    rawDb = new SQL.Database(filebuffer);
  } else {
    rawDb = new SQL.Database();
  }

  try {
    rawDb.run('PRAGMA foreign_keys = ON;');
  } catch {
    /* ignore */
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  rawDb.exec(schema);

  dbFacade = wrapDb();
  seedIfEmpty(dbFacade);
  persistNow();
  return dbFacade;
}

export function getDb() {
  if (!dbFacade) {
    throw new Error('Database not initialized — call await initDatabase() first');
  }
  return dbFacade;
}

function seedIfEmpty(db) {
  const nGames = db.prepare('SELECT COUNT(*) AS c FROM games').get().c;
  if (nGames > 0) return;

  const insGame = db.prepare(
    'INSERT INTO games (name, emoji, is_active) VALUES (?, ?, 1)'
  );
  const r1 = insGame.run('Free Fire', '🔥');
  const r2 = insGame.run('PUBG Mobile', '🎮');
  const ffId = Number(r1.lastInsertRowid);
  const pubgId = Number(r2.lastInsertRowid);

  const insProd = db.prepare(
    `INSERT INTO products (game_id, label, price_tjs, is_popular, is_best_value, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  );

  const ffProducts = [
    ['💎 100 алмазов', 11, 0, 0, 10],
    ['💎 310 алмазов', 31, 1, 0, 20],
    ['💎 520 алмазов', 51, 0, 0, 30],
    ['💎 1060 алмазов', 110, 1, 0, 40],
    ['💎 2180 алмазов', 180, 0, 0, 50],
    ['💎 5600 алмазов', 550, 0, 1, 60],
  ];
  for (const [label, price, pop, best, so] of ffProducts) {
    insProd.run(ffId, label, price, pop, best, so);
  }

  const pubgProducts = [
    ['🎮 60 UC', 15, 0, 0, 10],
    ['🎮 180 UC', 40, 1, 0, 20],
    ['🎮 325 UC', 70, 0, 0, 30],
    ['🎮 660 UC', 130, 1, 0, 40],
    ['🎮 1800 UC', 330, 0, 1, 50],
  ];
  for (const [label, price, pop, best, so] of pubgProducts) {
    insProd.run(pubgId, label, price, pop, best, so);
  }
}

export function userUpsert(tgId, { username, firstName, language }) {
  const db = getDb();
  const row = db.prepare('SELECT id, language FROM users WHERE tg_id = ?').get(tgId);
  if (row) {
    db.prepare(
      `UPDATE users SET username = ?, first_name = ?, last_active = datetime('now') WHERE tg_id = ?`
    ).run(username || null, firstName || null, tgId);
    return row;
  }
  const lang = language && (language === 'tj' || language === 'ru') ? language : 'ru';
  db.prepare(
    `INSERT INTO users (tg_id, username, first_name, language) VALUES (?, ?, ?, ?)`
  ).run(tgId, username || null, firstName || null, lang);
  return { id: null, language: lang };
}

export function userGetLanguage(tgId) {
  const row = getDb().prepare('SELECT language FROM users WHERE tg_id = ?').get(tgId);
  return row ? row.language : 'ru';
}

export function userSetLanguage(tgId, lang) {
  getDb()
    .prepare('UPDATE users SET language = ? WHERE tg_id = ?')
    .run(lang === 'tj' ? 'tj' : 'ru', tgId);
}

export function gamesListActive() {
  return getDb()
    .prepare('SELECT * FROM games WHERE is_active = 1 ORDER BY id')
    .all();
}

export function gameById(id) {
  return getDb().prepare('SELECT * FROM games WHERE id = ?').get(id);
}

export function productsByGame(gameId) {
  return getDb()
    .prepare(
      'SELECT * FROM products WHERE game_id = ? AND is_active = 1 ORDER BY sort_order, id'
    )
    .all(gameId);
}

export function productById(id) {
  return getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
}

export function orderCreate(data) {
  const {
    userTgId,
    username,
    gameName,
    productLabel,
    priceTjs,
    gameAccountId,
    paymentMethod,
    receiptFileId,
  } = data;
  const r = getDb()
    .prepare(
      `INSERT INTO orders (user_tg_id, username, game_name, product_label, price_tjs, game_account_id, payment_method, receipt_file_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      userTgId,
      username || null,
      gameName,
      productLabel,
      priceTjs,
      gameAccountId,
      paymentMethod,
      receiptFileId || null
    );
  return Number(r.lastInsertRowid);
}

export function orderById(id) {
  return getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

export function ordersListFiltered(status, limit = 50, offset = 0) {
  if (status === 'all') {
    return ordersListAll(limit, offset);
  }
  const st =
    status === 'pending'
      ? 'pending'
      : status === 'accepted'
        ? 'accepted'
        : 'rejected';
  return getDb()
    .prepare(
      `SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(st, limit, offset);
}

export function orderCountByStatus(status) {
  if (status === 'all') {
    return getDb().prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  }
  return getDb()
    .prepare('SELECT COUNT(*) AS c FROM orders WHERE status = ?')
    .get(status).c;
}

export function ordersListAll(limit, offset) {
  return getDb()
    .prepare(
      `SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

export function orderAccept(id) {
  getDb()
    .prepare(
      `UPDATE orders SET status = 'accepted', completed_at = datetime('now') WHERE id = ? AND status = 'pending'`
    )
    .run(id);
}

export function orderReject(id, reason) {
  getDb()
    .prepare(
      `UPDATE orders SET status = 'rejected', completed_at = datetime('now'), reject_reason = ? WHERE id = ? AND status = 'pending'`
    )
    .run(reason || '', id);
}

export function statsSummary() {
  const db = getDb();
  const usersTotal = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const ordersTotal = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const pending = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'`).get()
    .c;
  const accepted = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE status = 'accepted'`).get()
    .c;
  const rejected = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE status = 'rejected'`).get()
    .c;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);

  const usersToday = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE datetime(joined_at) >= datetime(?)`)
    .get(todayStart.toISOString()).c;
  const usersMonth = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE datetime(joined_at) >= datetime(?)`)
    .get(monthStart.toISOString()).c;
  const usersYear = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE datetime(joined_at) >= datetime(?)`)
    .get(yearStart.toISOString()).c;

  const revenueMonth = db
    .prepare(
      `SELECT COALESCE(SUM(price_tjs), 0) AS s FROM orders WHERE status = 'accepted'
       AND datetime(completed_at) >= datetime(?)`
    )
    .get(monthStart.toISOString()).s;

  const revenueAll = db
    .prepare(
      `SELECT COALESCE(SUM(price_tjs), 0) AS s FROM orders WHERE status = 'accepted'`
    )
    .get().s;

  return {
    usersTotal,
    usersToday,
    usersMonth,
    usersYear,
    ordersTotal,
    pending,
    accepted,
    rejected,
    revenueMonth,
    revenueAll,
  };
}

export function allUserTgIds() {
  return getDb()
    .prepare('SELECT tg_id FROM users')
    .all()
    .map((r) => r.tg_id);
}

export function broadcastInsert(text, sentCount) {
  getDb()
    .prepare('INSERT INTO broadcasts (text, sent_count) VALUES (?, ?)')
    .run(text, sentCount);
}

export function gameInsert(name, emoji, coverFileId) {
  const r = getDb()
    .prepare(
      'INSERT INTO games (name, emoji, cover_file_id, is_active) VALUES (?, ?, ?, 1)'
    )
    .run(name, emoji, coverFileId || null);
  return Number(r.lastInsertRowid);
}

export function gameUpdateCover(id, coverFileId) {
  getDb().prepare('UPDATE games SET cover_file_id = ? WHERE id = ?').run(coverFileId, id);
}

export function gameDelete(id) {
  getDb().prepare('DELETE FROM games WHERE id = ?').run(id);
}

export function productInsert({
  gameId,
  label,
  priceTjs,
  isPopular,
  isBestValue,
  sortOrder,
}) {
  const r = getDb()
    .prepare(
      `INSERT INTO products (game_id, label, price_tjs, is_popular, is_best_value, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    )
    .run(
      gameId,
      label,
      priceTjs,
      isPopular ? 1 : 0,
      isBestValue ? 1 : 0,
      sortOrder ?? 0
    );
  return Number(r.lastInsertRowid);
}

export function productUpdate(id, fields) {
  const allowed = [
    'label',
    'price_tjs',
    'is_popular',
    'is_best_value',
    'sort_order',
    'is_active',
  ];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
  }
  if (!sets.length) return;
  vals.push(id);
  getDb()
    .prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`)
    .run(...vals);
}

export function productDelete(id) {
  getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
}

export function reviewCreate({ orderId, userTgId, text }) {
  const r = getDb()
    .prepare(
      `INSERT INTO reviews (order_id, user_tg_id, text, status) VALUES (?, ?, ?, 'pending')`
    )
    .run(orderId ?? null, userTgId, text);
  return Number(r.lastInsertRowid);
}

export function reviewById(id) {
  return getDb().prepare('SELECT * FROM reviews WHERE id = ?').get(id);
}

export function reviewUpdateText(id, text) {
  getDb().prepare('UPDATE reviews SET text = ? WHERE id = ?').run(text, id);
}

export function reviewSetStatus(id, status, channelMsgId) {
  getDb()
    .prepare(
      'UPDATE reviews SET status = ?, channel_msg_id = COALESCE(?, channel_msg_id) WHERE id = ?'
    )
    .run(status, channelMsgId ?? null, id);
}

export function ordersRecentForUser(userTgId, limit = 5) {
  return getDb()
    .prepare(
      `SELECT * FROM orders WHERE user_tg_id = ? AND status = 'accepted' ORDER BY completed_at DESC LIMIT ?`
    )
    .all(userTgId, limit);
}
