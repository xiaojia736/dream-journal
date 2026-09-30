import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import type { Entry, EntryInput, EntryType, Mood, Photo } from './api';

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const entryTypes = new Set<EntryType>(['moment', 'dream', 'diary', 'os']);
const moods = new Set<Mood>(['', 'happy', 'calm', 'sad', 'anxious', 'excited', 'confused', 'scared']);
const photosDirectory = new Directory(Paths.document, 'journal-photos');

type EntryRow = {
  id: string; legacy_id: string | null; text: string; type: EntryType; mood: Mood;
  tags_json: string; occurred_at: string; created_at: string; updated_at: string;
};
type PhotoRow = { id: string; entry_id: string; mime: string; created_at: string };
type BackupPhoto = { mime: string; base64: string };
type PreparedImport = {
  entry: EntryInput; legacyId: string | null; backupId: string | null;
  createdAt: string | null; updatedAt: string | null; photos: BackupPhoto[];
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

function uuid() {
  // IDs identify local records; they are not authentication secrets.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 3) | 8).toString(16);
  });
}

async function database() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('star-sea-journal.sqlite');
      await db.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY NOT NULL,
          legacy_id TEXT UNIQUE,
          text TEXT NOT NULL,
          type TEXT NOT NULL,
          mood TEXT NOT NULL,
          tags_json TEXT NOT NULL,
          occurred_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS entries_occurred ON entries(occurred_at DESC, created_at DESC);
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY NOT NULL,
          entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
          mime TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS photos_entry ON photos(entry_id, created_at);
      `);
      return db;
    })().catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function dateValue(value: unknown): string | null {
  if (value == null || value === '') return null;
  let date: Date;
  if (typeof value === 'number' && Number.isFinite(value)) date = new Date(value);
  else if (typeof value === 'string') {
    const local = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ ,T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(value.trim());
    if (local) {
      const [, y, m, d, h, min, sec] = local;
      date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(sec || 0));
      if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
    } else if (/^\d{13}$/.test(value)) date = new Date(Number(value));
    else date = new Date(value);
  } else return null;
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function validateEntry(value: unknown, legacy = false): EntryInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('记录格式不正确');
  const input = value as Record<string, unknown>;
  if (typeof input.text !== 'string' || input.text.length > 50000) throw new Error('正文最多 50000 字');
  const type = (input.type || (legacy ? 'dream' : 'moment')) as EntryType;
  const mood = (input.mood || '') as Mood;
  if (!entryTypes.has(type) || !moods.has(mood)) throw new Error('类型或情绪无效');
  const tags = input.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 20 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 30)) {
    throw new Error('标签格式不正确');
  }
  const date = dateValue(input.occurredAt ?? (legacy ? input.timestamp ?? input.date ?? input.id : null))
    ?? (legacy ? null : new Date().toISOString());
  if (!date) throw new Error('记录日期无效');
  return { text: input.text.trim(), type, mood, tags: [...new Set(tags.map((tag: string) => tag.trim()))], occurredAt: date };
}

function photoMetadata(value: unknown): BackupPhoto {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('照片格式不正确');
  const candidate = value as Record<string, unknown>;
  const base64 = candidate.base64;
  if (typeof base64 !== 'string' || !base64 || base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error('照片数据不完整');
  const size = base64.length / 4 * 3 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (size > MAX_PHOTO_BYTES) throw new Error('每张照片不能超过 6 MB');
  // MIME comes from the image signature rather than the JSON supplied by a backup.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const head: number[] = [];
  for (let i = 0; i < Math.min(base64.length, 16); i += 4) {
    const value = (alphabet.indexOf(base64[i]) << 18) | (alphabet.indexOf(base64[i + 1]) << 12) |
      (alphabet.indexOf(base64[i + 2]) << 6) | alphabet.indexOf(base64[i + 3]);
    head.push((value >> 16) & 255, (value >> 8) & 255, value & 255);
  }
  let mime: string;
  if (head[0] === 255 && head[1] === 216 && head[2] === 255) mime = 'image/jpeg';
  else if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => head[index] === byte)) mime = 'image/png';
  else if ([82, 73, 70, 70].every((byte, index) => head[index] === byte) &&
      [87, 69, 66, 80].every((byte, index) => head[index + 8] === byte)) mime = 'image/webp';
  else throw new Error('仅支持 JPEG、PNG 或 WebP 照片');
  return { base64, mime };
}

function asEntry(row: EntryRow, photos: Photo[]): Entry {
  return {
    id: row.id, text: row.text, type: row.type, mood: row.mood,
    tags: JSON.parse(row.tags_json) as string[], occurredAt: row.occurred_at,
    createdAt: row.created_at, updatedAt: row.updated_at, photos
  };
}

async function getEntry(db: SQLite.SQLiteDatabase, id: string): Promise<Entry> {
  const row = await db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE id = ?', id);
  if (!row) throw new Error('找不到这条记录');
  const photos = await db.getAllAsync<PhotoRow>('SELECT * FROM photos WHERE entry_id = ? ORDER BY created_at, id', id);
  return asEntry(row, photos.map(photo => ({ id: photo.id, mime: photo.mime })));
}

async function listEntries(db: SQLite.SQLiteDatabase): Promise<Entry[]> {
  const [rows, photos] = await Promise.all([
    db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY occurred_at DESC, created_at DESC'),
    db.getAllAsync<PhotoRow>('SELECT * FROM photos ORDER BY created_at, id')
  ]);
  const byEntry = new Map<string, Photo[]>();
  for (const photo of photos) {
    const list = byEntry.get(photo.entry_id) ?? [];
    list.push({ id: photo.id, mime: photo.mime });
    byEntry.set(photo.entry_id, list);
  }
  return rows.map(row => asEntry(row, byEntry.get(row.id) ?? []));
}

function safeDeletePhoto(uri: string) {
  try { const file = new File(uri); if (file.exists) file.delete(); }
  catch { /* Database no longer points at the file. */ }
}

async function writePhoto(data: BackupPhoto) {
  photosDirectory.create({ idempotent: true, intermediates: true });
  const extension = data.mime === 'image/png' ? 'png' : data.mime === 'image/webp' ? 'webp' : 'jpg';
  const file = new File(photosDirectory, `${uuid()}.${extension}`);
  try {
    await LegacyFileSystem.writeAsStringAsync(file.uri, data.base64, { encoding: LegacyFileSystem.EncodingType.Base64 });
    if (!file.exists || file.size === 0 || file.size > MAX_PHOTO_BYTES) throw new Error('照片保存失败');
    return { id: file.uri, mime: data.mime };
  } catch (error) { safeDeletePhoto(file.uri); throw error; }
}

function prepareImport(input: unknown): PreparedImport[] {
  const source = Array.isArray(input) ? input : (input && typeof input === 'object' ? (input as Record<string, unknown>).entries : null);
  if (!Array.isArray(source) || source.length > 10000) throw new Error('备份必须包含记录数组（最多 10000 条）');
  return source.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('记录格式不正确');
    const record = item as Record<string, unknown>;
    const entry = validateEntry(item, true);
    const legacyId = record.legacyId != null ? String(record.legacyId) :
      record.id != null && !record.occurredAt ? String(record.id) : null;
    const backupId = record.occurredAt && typeof record.id === 'string' && /^[a-f0-9-]{36}$/.test(record.id) ? record.id : null;
    const rawPhotos = record.photos ?? [];
    if (!Array.isArray(rawPhotos) || rawPhotos.length > 5) throw new Error('每条记录最多 5 张照片');
    return {
      entry, legacyId, backupId, photos: rawPhotos.map(photoMetadata),
      createdAt: dateValue(record.createdAt), updatedAt: dateValue(record.updatedAt)
    };
  });
}

export async function localApi(path: string, method: string, data?: unknown): Promise<unknown> {
  const db = await database();
  if (method === 'GET' && path === '/health') return { ok: true, name: '星海日记' };
  if (method === 'GET' && path === '/api/entries') return { entries: await listEntries(db) };
  if (method === 'POST' && path === '/api/entries') {
    const entry = validateEntry(data);
    const id = uuid();
    const now = new Date().toISOString();
    await db.runAsync('INSERT INTO entries (id, text, type, mood, tags_json, occurred_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, entry.text, entry.type, entry.mood, JSON.stringify(entry.tags), entry.occurredAt, now, now);
    return { entry: await getEntry(db, id) };
  }
  const entryId = /^\/api\/entries\/([a-f0-9-]{36})$/.exec(path)?.[1];
  if (entryId && method === 'PUT') {
    const entry = validateEntry(data);
    await getEntry(db, entryId);
    await db.runAsync('UPDATE entries SET text = ?, type = ?, mood = ?, tags_json = ?, occurred_at = ?, updated_at = ? WHERE id = ?',
      entry.text, entry.type, entry.mood, JSON.stringify(entry.tags), entry.occurredAt, new Date().toISOString(), entryId);
    return { entry: await getEntry(db, entryId) };
  }
  if (entryId && method === 'DELETE') {
    const old = await getEntry(db, entryId);
    await db.runAsync('DELETE FROM entries WHERE id = ?', entryId);
    old.photos.forEach(photo => safeDeletePhoto(photo.id));
    return { ok: true };
  }
  const photoEntryId = /^\/api\/entries\/([a-f0-9-]{36})\/photos$/.exec(path)?.[1];
  if (photoEntryId && method === 'POST') {
    await getEntry(db, photoEntryId);
    const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM photos WHERE entry_id = ?', photoEntryId);
    if ((count?.count ?? 0) >= 5) throw new Error('每条记录最多 5 张照片');
    const photo = await writePhoto(photoMetadata(data));
    try {
      await db.runAsync('INSERT INTO photos (id, entry_id, mime, created_at) VALUES (?, ?, ?, ?)',
        photo.id, photoEntryId, photo.mime, new Date().toISOString());
    } catch (error) { safeDeletePhoto(photo.id); throw error; }
    return { photo };
  }
  if (method === 'DELETE' && path.startsWith('/api/photos/')) {
    const photoId = path.slice('/api/photos/'.length);
    const photo = await db.getFirstAsync<PhotoRow>('SELECT * FROM photos WHERE id = ?', photoId);
    if (!photo) throw new Error('找不到这张照片');
    await db.runAsync('DELETE FROM photos WHERE id = ?', photoId);
    safeDeletePhoto(photoId);
    return { ok: true };
  }
  if (method === 'GET' && path === '/api/backup') {
    const entries = await listEntries(db);
    const rows = await db.getAllAsync<Pick<EntryRow, 'id' | 'legacy_id'>>('SELECT id, legacy_id FROM entries');
    const legacyIds = new Map(rows.map(row => [row.id, row.legacy_id]));
    const complete = [];
    for (const entry of entries) {
      const photos: BackupPhoto[] = [];
      for (const photo of entry.photos) {
        const file = new File(photo.id);
        if (!file.exists) throw new Error('有照片文件已丢失，无法生成完整备份');
        photos.push({ mime: photo.mime, base64: await file.base64() });
      }
      complete.push({ ...entry, legacyId: legacyIds.get(entry.id) ?? null, photos });
    }
    return { format: 'star-sea-journal-v1', exportedAt: new Date().toISOString(), entries: complete };
  }
  if (method === 'POST' && path === '/api/import') {
    const prepared = prepareImport(data);
    const createdFiles: string[] = [];
    let imported = 0;
    try {
      await db.withExclusiveTransactionAsync(async transaction => {
        for (const item of prepared) {
          if (item.legacyId && await transaction.getFirstAsync('SELECT 1 FROM entries WHERE legacy_id = ?', item.legacyId)) continue;
          if (item.backupId && await transaction.getFirstAsync('SELECT 1 FROM entries WHERE id = ?', item.backupId)) continue;
          const id = item.backupId ?? uuid();
          const now = new Date().toISOString();
          await transaction.runAsync('INSERT INTO entries (id, legacy_id, text, type, mood, tags_json, occurred_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            id, item.legacyId, item.entry.text, item.entry.type, item.entry.mood, JSON.stringify(item.entry.tags),
            item.entry.occurredAt, item.createdAt ?? now, item.updatedAt ?? item.createdAt ?? now);
          for (const sourcePhoto of item.photos) {
            const photo = await writePhoto(sourcePhoto);
            createdFiles.push(photo.id);
            await transaction.runAsync('INSERT INTO photos (id, entry_id, mime, created_at) VALUES (?, ?, ?, ?)',
              photo.id, id, photo.mime, now);
          }
          imported++;
        }
      });
    } catch (error) {
      createdFiles.forEach(safeDeletePhoto);
      throw error;
    }
    return { imported, skipped: prepared.length - imported };
  }
  throw new Error('接口不存在');
}
