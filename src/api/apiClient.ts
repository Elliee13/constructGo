import { getAccessToken } from '../stores/supabaseAuthStore';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const DEMO_API_KEY = process.env.EXPO_PUBLIC_DEMO_API_KEY?.trim();

if (__DEV__) {
  console.log('[apiClient] BASE_URL:', API_BASE_URL ?? '<missing>');
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
};

const buildUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL');
  }
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (__DEV__ && DEMO_API_KEY) {
    headers.Authorization = `Bearer ${DEMO_API_KEY}`;
  }

  const hasBody = typeof options.body !== 'undefined';
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
};
