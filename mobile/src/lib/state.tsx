import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, Entry } from './api';

type Palette = { bg: string; card: string; text: string; muted: string; primary: string; accent: string; border: string; soft: string };
export const palettes: Record<'dark' | 'light', Palette> = {
  dark: { bg: '#10152e', card: '#1d2748', text: '#f7f4ff', muted: '#abb6d5', primary: '#beb6ff', accent: '#ffd6ad', border: '#384467', soft: '#27345c' },
  light: { bg: '#f6f5ff', card: '#ffffff', text: '#252740', muted: '#6d7291', primary: '#665fa6', accent: '#b87752', border: '#e5e1f1', soft: '#efedfa' }
};

type AppState = {
  loading: boolean; baseUrl: string; token: string; username: string; entries: Entry[];
  theme: 'dark' | 'light'; colors: Palette; error: string;
  hasPin: boolean; locked: boolean;
  connect: (baseUrl: string, username: string, password: string, register: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  setPin: (next: string, old: string) => Promise<void>;
  unlock: (value: string) => boolean;
};
const StateContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('local://');
  const [token, setToken] = useState('local');
  const [username, setUsername] = useState('朋友');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [error, setError] = useState('');
  const [pin, setPinState] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync('theme'), SecureStore.getItemAsync('appPin')
    ]).then(async ([savedTheme, savedPin]) => {
      setThemeState(savedTheme === 'light' ? 'light' : 'dark');
      setPinState(savedPin || ''); setLocked(!!savedPin);
      const result = await api<{ entries: Entry[] }>('local://', 'local', '/api/entries');
      setEntries(result.entries);
    }).catch(e => setError(e instanceof Error ? e.message : '无法读取本地记录'))
      .finally(() => setLoading(false));
  }, []);

  const connect = useCallback(async (rawUrl: string, name: string, password: string, register: boolean) => {
    const url = rawUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/[^/]+$/.test(url)) throw new Error('请输入完整的服务端地址，如 http://192.168.1.10:3000');
    await api(url, '', '/health');
    const result = await api<{ token: string; username: string }>(url, '', register ? '/api/register' : '/api/login', 'POST', { username: name.trim(), password });
    const list = await api<{ entries: Entry[] }>(url, result.token, '/api/entries');
    await Promise.all([
      SecureStore.setItemAsync('baseUrl', url), SecureStore.setItemAsync('token', result.token),
      SecureStore.setItemAsync('username', result.username)
    ]);
    setBaseUrl(url); setToken(result.token); setUsername(result.username); setEntries(list.entries); setError('');
  }, []);

  const refresh = useCallback(async () => {
    if (!baseUrl || !token) return;
    try {
      const list = await api<{ entries: Entry[] }>(baseUrl, token, '/api/entries');
      setEntries(list.entries); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : '无法连接服务端'); throw e; }
  }, [baseUrl, token]);

  const logout = useCallback(async () => {
    if (baseUrl === 'local://') return;
    try { if (token) await api(baseUrl, token, '/api/logout', 'POST'); } catch { /* Switching back to local data works offline. */ }
    setBaseUrl('local://'); setToken('local'); setUsername('朋友');
    const list = await api<{ entries: Entry[] }>('local://', 'local', '/api/entries');
    setEntries(list.entries); setError('');
  }, [baseUrl, token]);

  const setTheme = useCallback(async (next: 'dark' | 'light') => {
    await SecureStore.setItemAsync('theme', next);
    setThemeState(next);
  }, []);

  const setPin = useCallback(async (next: string, old: string) => {
    if (pin && old !== pin) throw new Error('当前隐私密码不正确');
    if (next && !/^\d{4}$/.test(next)) throw new Error('请输入 4 位数字密码');
    if (next) await SecureStore.setItemAsync('appPin', next);
    else await SecureStore.deleteItemAsync('appPin');
    setPinState(next); setLocked(false);
  }, [pin]);

  const unlock = useCallback((value: string) => {
    if (value !== pin) return false;
    setLocked(false);
    return true;
  }, [pin]);

  const value = useMemo(() => ({ loading, baseUrl, token, username, entries, theme, colors: palettes[theme], error, hasPin: !!pin, locked, connect, refresh, logout, setTheme, setPin, unlock }),
    [loading, baseUrl, token, username, entries, theme, error, pin, locked, connect, refresh, logout, setTheme, setPin, unlock]);
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useApp() {
  const value = useContext(StateContext);
  if (!value) throw new Error('AppProvider is missing');
  return value;
}
