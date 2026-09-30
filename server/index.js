import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, createHash, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const DAY = 24 * 60 * 60 * 1000;
const MAX_JSON = 12 * 1024 * 1024;
const MAX_BACKUP_JSON = 100 * 1024 * 1024;
const MAX_PHOTO = 6 * 1024 * 1024;
const TYPES = new Set(['dream', 'diary', 'os']);
const MOODS = new Set(['', 'happy', 'calm', 'sad', 'anxious', 'excited', 'confused', 'scared']);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function database(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      legacy_id TEXT, text TEXT NOT NULL, type TEXT NOT NULL, mood TEXT NOT NULL,
      tags_json TEXT NOT NULL, occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(user_id, legacy_id)
    );
    CREATE INDEX IF NOT EXISTS entries_user_date ON entries(user_id, occurred_at DESC);
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      mime TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS photos_entry ON photos(entry_id);
  `);
  return db;
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

async function bodyJson(req, limit = MAX_JSON) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, '需要 JSON 请求');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, '请求内容过大');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'JSON 格式不正确'); }
}

function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }

function issueSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(tokenHash(token), userId, Date.now() + 30 * DAY);
  return token;
}

function authenticatedUser(db, req) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) throw new HttpError(401, '请先登录');
  const session = db.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .get(tokenHash(match[1]), Date.now());
  if (!session) throw new HttpError(401, '登录已过期，请重新登录');
  return session.user_id;
}

function passwordDigest(password, salt) { return scryptSync(password, salt, 64).toString('hex'); }

function validateEntry(value, legacy = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, '记录格式不正确');
  const text = typeof value.text === 'string' ? value.text.trim() : '';
  if (!text || text.length > 50000) throw new HttpError(400, '正文需要 1 至 50000 字');
  const type = value.type || 'dream';
  const mood = value.mood || '';
  if (!TYPES.has(type) || !MOODS.has(mood)) throw new HttpError(400, '类型或情绪无效');
  const tags = value.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 20 || tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 30)) {
    throw new HttpError(400, '标签格式不正确');
  }
  let dateValue = value.occurredAt;
  if (legacy && !dateValue) dateValue = value.timestamp || value.date || value.id;
  const parsed = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(parsed.getTime())) throw new HttpError(400, '记录日期无效');
  return { text, type, mood, tags: [...new Set(tags.map(t => t.trim()))], occurredAt: parsed.toISOString() };
}

function inspectPhoto(input) {
  if (!input || typeof input !== 'object' || typeof input.base64 !== 'string') throw new HttpError(400, '照片格式不正确');
  if (input.base64.length > Math.ceil(MAX_PHOTO * 4 / 3) + 8 || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.base64)) {
    throw new HttpError(413, '照片不能超过 6 MB');
  }
  const data = Buffer.from(input.base64, 'base64');
  if (!data.length || data.length > MAX_PHOTO) throw new HttpError(413, '照片不能超过 6 MB');
  let mime;
  if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) mime = 'image/jpeg';
  else if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) mime = 'image/png';
  else if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') mime = 'image/webp';
  else throw new HttpError(400, '仅支持 JPEG、PNG 或 WebP 照片');
  return { data, mime };
}

function entryForClient(db, row) {
  return {
    id: row.id, text: row.text, type: row.type, mood: row.mood,
    tags: JSON.parse(row.tags_json), occurredAt: row.occurred_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
    photos: db.prepare('SELECT id, mime FROM photos WHERE entry_id = ? ORDER BY created_at, id').all(row.id)
  };
}

function findEntry(db, userId, id) {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(id, userId);
  if (!entry) throw new HttpError(404, '找不到这条记录');
  return entry;
}

function insertEntry(db, userId, entry, legacyId = null, id = randomUUID()) {
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO entries
    (id, user_id, legacy_id, text, type, mood, tags_json, occurred_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, userId, legacyId, entry.text, entry.type, entry.mood,
    JSON.stringify(entry.tags), entry.occurredAt, now, now
  );
  return db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
}

async function handle(db, req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  if (req.method === 'GET' && path === '/health') return json(res, 200, { ok: true, name: '星海日记' });

  if (req.method === 'POST' && path === '/api/register') {
    const input = await bodyJson(req, 4096);
    const username = typeof input.username === 'string' ? input.username.trim() : '';
    if (!/^[\w\u4e00-\u9fff]{2,32}$/.test(username) || typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128) {
      throw new HttpError(400, '用户名需 2 至 32 字，密码需 8 至 128 字');
    }
    if (db.prepare('SELECT COUNT(*) AS count FROM users').get().count) throw new HttpError(409, '此服务端已创建账号');
    const salt = randomBytes(16).toString('hex');
    const userId = randomUUID();
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)').run(userId, username, salt, passwordDigest(input.password, salt), new Date().toISOString());
    return json(res, 201, { token: issueSession(db, userId), username });
  }
  if (req.method === 'POST' && path === '/api/login') {
    const input = await bodyJson(req, 4096);
    if (!input || typeof input.username !== 'string' || typeof input.password !== 'string' || input.password.length > 128) {
      throw new HttpError(400, '请输入用户名和密码');
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(input.username);
    const candidate = input.password;
    if (!user || !candidate || !timingSafeEqual(Buffer.from(passwordDigest(candidate, user.salt), 'hex'), Buffer.from(user.password_hash, 'hex'))) {
      throw new HttpError(401, '用户名或密码错误');
    }
    return json(res, 200, { token: issueSession(db, user.id), username: user.username });
  }

  const userId = authenticatedUser(db, req);
  if (req.method === 'POST' && path === '/api/logout') {
    const token = req.headers.authorization.slice(7);
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
    return json(res, 200, { ok: true });
  }
  if (req.method === 'GET' && path === '/api/me') {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    return json(res, 200, { username: user.username });
  }
  if (req.method === 'GET' && path === '/api/entries') {
    const rows = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY occurred_at DESC, created_at DESC').all(userId);
    return json(res, 200, { entries: rows.map(row => entryForClient(db, row)) });
  }
  if (req.method === 'POST' && path === '/api/entries') {
    const entry = validateEntry(await bodyJson(req, 60000));
    return json(res, 201, { entry: entryForClient(db, insertEntry(db, userId, entry)) });
  }
  const entryMatch = /^\/api\/entries\/([a-f0-9-]+)$/.exec(path);
  if (entryMatch && req.method === 'PUT') {
    const old = findEntry(db, userId, entryMatch[1]);
    const entry = validateEntry(await bodyJson(req, 60000));
    const now = new Date().toISOString();
    db.prepare(`UPDATE entries SET text = ?, type = ?, mood = ?, tags_json = ?, occurred_at = ?, updated_at = ? WHERE id = ?`)
      .run(entry.text, entry.type, entry.mood, JSON.stringify(entry.tags), entry.occurredAt, now, old.id);
    return json(res, 200, { entry: entryForClient(db, findEntry(db, userId, old.id)) });
  }
  if (entryMatch && req.method === 'DELETE') {
    findEntry(db, userId, entryMatch[1]);
    db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(entryMatch[1], userId);
    return json(res, 200, { ok: true });
  }
  const addPhotoMatch = /^\/api\/entries\/([a-f0-9-]+)\/photos$/.exec(path);
  if (addPhotoMatch && req.method === 'POST') {
    findEntry(db, userId, addPhotoMatch[1]);
    const count = db.prepare('SELECT COUNT(*) AS count FROM photos WHERE entry_id = ?').get(addPhotoMatch[1]).count;
    if (count >= 5) throw new HttpError(400, '每条记录最多 5 张照片');
    const photo = inspectPhoto(await bodyJson(req, 9 * 1024 * 1024));
    const id = randomUUID();
    db.prepare('INSERT INTO photos VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, userId, addPhotoMatch[1], photo.mime, photo.data, new Date().toISOString());
    return json(res, 201, { photo: { id, mime: photo.mime } });
  }
  const photoMatch = /^\/api\/photos\/([a-f0-9-]+)$/.exec(path);
  if (photoMatch && req.method === 'GET') {
    const photo = db.prepare('SELECT mime, data FROM photos WHERE id = ? AND user_id = ?').get(photoMatch[1], userId);
    if (!photo) throw new HttpError(404, '找不到这张照片');
    res.writeHead(200, { 'Content-Type': photo.mime, 'Content-Length': photo.data.length, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' });
    return res.end(photo.data);
  }
  if (photoMatch && req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').run(photoMatch[1], userId);
    if (!result.changes) throw new HttpError(404, '找不到这张照片');
    return json(res, 200, { ok: true });
  }
  if (req.method === 'GET' && path === '/api/backup') {
    const rows = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY occurred_at DESC').all(userId);
    const entries = rows.map(row => ({
      ...entryForClient(db, row),
      photos: db.prepare('SELECT mime, data FROM photos WHERE entry_id = ? ORDER BY created_at, id').all(row.id)
        .map(photo => ({ mime: photo.mime, base64: Buffer.from(photo.data).toString('base64') }))
    }));
    return json(res, 200, { format: 'star-sea-journal-v1', exportedAt: new Date().toISOString(), entries });
  }
  if (req.method === 'POST' && path === '/api/import') {
    const input = await bodyJson(req, MAX_BACKUP_JSON);
    const source = Array.isArray(input) ? input : input?.entries;
    if (!Array.isArray(source) || source.length > 10000) throw new HttpError(400, '备份必须包含记录数组（最多 10000 条）');
    const prepared = source.map(item => ({
      entry: validateEntry(item, true),
      legacyId: item.id && !item.occurredAt ? String(item.id) : null,
      backupId: item.occurredAt && typeof item.id === 'string' && /^[a-f0-9-]{36}$/.test(item.id) ? item.id : null,
      photos: Array.isArray(item.photos) ? item.photos.map(inspectPhoto) : []
    }));
    if (prepared.some(item => item.photos.length > 5)) throw new HttpError(400, '每条记录最多 5 张照片');
    let imported = 0;
    db.exec('BEGIN');
    try {
      for (const item of prepared) {
        if (item.legacyId && db.prepare('SELECT 1 FROM entries WHERE user_id = ? AND legacy_id = ?').get(userId, item.legacyId)) continue;
        if (item.backupId && db.prepare('SELECT 1 FROM entries WHERE user_id = ? AND id = ?').get(userId, item.backupId)) continue;
        const row = insertEntry(db, userId, item.entry, item.legacyId, item.backupId || randomUUID());
        for (const photo of item.photos) {
          db.prepare('INSERT INTO photos VALUES (?, ?, ?, ?, ?, ?)')
            .run(randomUUID(), userId, row.id, photo.mime, photo.data, new Date().toISOString());
        }
        imported++;
      }
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return json(res, 200, { imported, skipped: source.length - imported });
  }
  throw new HttpError(404, '接口不存在');
}

export function createApp(dbPath = resolve(root, 'data', 'journal.sqlite')) {
  const db = database(dbPath);
  const server = createServer((req, res) => {
    handle(db, req, res).catch(error => {
      if (res.headersSent) return res.end();
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error(error);
      json(res, status, { error: status === 500 ? '服务端出错' : error.message });
    });
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 3000);
  const dbPath = process.env.DATABASE_PATH || resolve(root, 'data', 'journal.sqlite');
  createApp(dbPath).listen(port, host, () => console.log(`星海日记服务端：http://${host}:${port}`));
}
