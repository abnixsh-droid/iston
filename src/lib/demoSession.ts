// Read-only demo admin session (stored locally, verified server-side).
export const DEMO_EMAIL = 'demo@istonbuildergroup.com';
export const DEMO_PASSWORD = 'IstonDemo@2026';
const KEY = 'iston_demo_session';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/$/, '');
const listeners = new Set<() => void>();

export function getDemoToken(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { token, exp } = JSON.parse(raw);
    if (!token || Date.now() > exp) {
      localStorage.removeItem(KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export async function demoLogin(email: string, password: string) {
const r = await fetch(`${API_BASE_URL}/api/demo-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Demo login failed');
  localStorage.setItem(KEY, JSON.stringify({ token: d.token, exp: Date.now() + 11.5 * 3600 * 1000 }));
  listeners.forEach((fn) => fn());
}

export function demoLogout() {
  localStorage.removeItem(KEY);
  listeners.forEach((fn) => fn());
}

export function onDemoChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
