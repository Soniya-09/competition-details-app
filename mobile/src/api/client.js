import { API_URL } from '../config';
import { syncServerClock } from '../lib/serverClock';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const session = { token: null, lang: 'en' };
export const setAuthToken = (token) => {
  session.token = token;
};
export const setApiLanguage = (lang) => {
  session.lang = lang;
};

const TIMEOUT_MS = 15_000;

export async function request(path, { method = 'GET', body, formData, signal, timeoutMs = TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener?.('abort', () => controller.abort());

  const headers = { Accept: 'application/json', 'Accept-Language': session.lang };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session.token) headers.Authorization = `Bearer ${session.token}`;

  const startedAt = Date.now();
  let res;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(0, controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR', 'Unable to reach the server');
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => null);
  if (json?.serverTime) syncServerClock(json.serverTime, startedAt, Date.now());
  if (!res.ok) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? `HTTP_${res.status}`, e.message ?? 'Request failed', e.details);
  }
  return json?.data;
}
