import { getAccessToken, signOutSupabase } from '../stores/supabaseAuthStore';
import { useProfileStore } from '../stores/profileStore';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

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
  const method = options.method ?? 'GET';
  const hasBody = typeof options.body !== 'undefined';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const token = getAccessToken();
  const hasToken = Boolean(token);
  if (__DEV__) {
    console.log('[apiClient] REQUEST', {
      method,
      url,
      hasToken,
      tokenPrefix: token ? token.slice(0, 16) : null,
      bodyPresent: hasBody,
    });
  }
  if (!token) {
    useProfileStore.getState().clear();
    await signOutSupabase();
    throw new Error('Authentication required. Please sign in.');
  }
  headers.Authorization = `Bearer ${token}`;

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const text = await response.text();

  if (__DEV__) {
    console.log('[apiClient] RESPONSE', { url, status: response.status, contentType: contentType || '<none>' });
  }

  const preview = text.slice(0, 160);
  if (!contentType.includes('application/json')) {
    if (__DEV__) {
      console.log('[apiClient] NON_JSON_PREVIEW', preview);
    }
    if (response.status === 401) {
      useProfileStore.getState().clear();
      await signOutSupabase();
    }
    throw new Error(`Non-JSON response ${response.status} from ${url}; first chars: ${preview}`);
  }

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response ${response.status} from ${url}; first chars: ${preview}`);
    }
  }

  if (response.status === 401) {
    useProfileStore.getState().clear();
    await signOutSupabase();
  }

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
};
