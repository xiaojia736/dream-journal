import { localApi } from './local';

export type EntryType = 'moment' | 'dream' | 'diary' | 'os';
export type Mood = '' | 'happy' | 'calm' | 'sad' | 'anxious' | 'excited' | 'confused' | 'scared';
export type Photo = { id: string; mime: string };
export type Entry = {
  id: string;
  text: string;
  type: EntryType;
  mood: Mood;
  tags: string[];
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
};
export type EntryInput = Pick<Entry, 'text' | 'type' | 'mood' | 'tags' | 'occurredAt'>;

export async function api<T>(baseUrl: string, token: string, path: string, method = 'GET', data?: unknown): Promise<T> {
  if (baseUrl === 'local://') return await localApi(path, method, data) as T;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: data !== undefined ? JSON.stringify(data) : undefined
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error || `请求失败 (${response.status})`);
  return result as T;
}

export function photoSource(baseUrl: string, token: string, id: string) {
  if (baseUrl === 'local://') return { uri: id };
  return { uri: `${baseUrl}/api/photos/${id}`, headers: { Authorization: `Bearer ${token}` } };
}

export const typeLabels: Record<EntryType, string> = { moment: '生活', dream: '梦境', diary: '日记', os: '内心 OS' };
export const moodLabels: Record<Exclude<Mood, ''>, string> = {
  happy: '开心', calm: '平静', sad: '难过', anxious: '焦虑',
  excited: '兴奋', confused: '困惑', scared: '恐惧'
};
export const moodEmoji: Record<Exclude<Mood, ''>, string> = {
  happy: '😊', calm: '😌', sad: '😢', anxious: '😰',
  excited: '🤩', confused: '😵', scared: '😱'
};
