// Read-only demo admin session & interactive demo adviser sessions
export const DEMO_EMAIL = 'demo@istonbuildergroup.com';
export const DEMO_PASSWORD = 'IstonDemo@2026';

export const DEMO_ADVISER_EMAIL = 'adviser.demo@istongroupbuilder.in';

export const DEMO_ADVISER = {
  adviser_id: 'IST-ADV-7701',
  user_id: 'demo-adviser-uid-7701',
  full_name: 'Vikramaditya Verma (Demo Adviser)',
  email: DEMO_ADVISER_EMAIL,
  phone: '+91 98200 12345',
  sponsor_id: 'IST-ADV-1001',
  sponsor_code: 'ADV1001',
  referral_code: 'DEMO7701',
  depth_level: 2,
  status: 'active' as const,
  registration_fee: 1100,
  payment_status: 'verified_paid' as const,
  payment_reference: 'UPI848492019284',
  bank_details: {
    upi_id: 'vikram.adviser@okaxis',
    account_number: '918484843391',
    ifsc: 'UTIB0001234',
    bank_name: 'Axis Bank',
  },
  created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  activated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_PENDING_ADVISER = {
  adviser_id: 'IST-ADV-8822',
  user_id: 'demo-pending-uid-8822',
  full_name: 'Ananya Deshmukh (Pending Verification)',
  email: 'ananya.deshmukh@gmail.com',
  phone: '+91 99300 54321',
  sponsor_id: 'IST-ADV-7701',
  sponsor_code: 'DEMO7701',
  referral_code: 'ADV8822',
  depth_level: 3,
  status: 'pending' as const,
  registration_fee: 1100,
  payment_status: 'pending_verification' as const,
  payment_reference: 'UPI774920183921',
  bank_details: {
    upi_id: 'ananya.d@okhdfcbank',
    account_number: '50100234918234',
    ifsc: 'HDFC0000128',
    bank_name: 'HDFC Bank',
  },
  created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  activated_at: null,
  updated_at: new Date().toISOString(),
};

const KEY = 'iston_demo_session';
const ADVISER_KEY = 'iston_demo_adviser_session';

import { sanitizeApiBaseUrl, buildRequestUrl } from './api';

const API_BASE_URL = sanitizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || '');
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

export function getDemoAdviserSession(): typeof DEMO_ADVISER | typeof DEMO_PENDING_ADVISER | null {
  try {
    const raw = localStorage.getItem(ADVISER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function demoLogin(email: string, password: string) {
  try {
    const requestUrl = buildRequestUrl(API_BASE_URL, '/api/demo-login');
    const r = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.token) {
      localStorage.setItem(KEY, JSON.stringify({ token: d.token, exp: Date.now() + 11.5 * 3600 * 1000 }));
      listeners.forEach((fn) => fn());
      return;
    }
  } catch {
    /* fallback to client demo token */
  }

  // Client demo fallback if API endpoint is not present
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    localStorage.setItem(KEY, JSON.stringify({ token: 'demo-local-admin-token-2026', exp: Date.now() + 11.5 * 3600 * 1000 }));
    listeners.forEach((fn) => fn());
    return;
  }
  throw new Error('Invalid demo credentials');
}

export function loginAsDemoAdviser(pending = false) {
  const adviser = pending ? DEMO_PENDING_ADVISER : DEMO_ADVISER;
  localStorage.setItem(ADVISER_KEY, JSON.stringify(adviser));
  // Also register in local cache so tree & referrals recognize it
  try {
    const raw = localStorage.getItem('iston_advisers_state_cache');
    const cache = raw ? JSON.parse(raw) : { advisers: [] };
    const idx = cache.advisers.findIndex((a: any) => a.email.toLowerCase() === adviser.email.toLowerCase());
    if (idx >= 0) cache.advisers[idx] = adviser;
    else cache.advisers.push(adviser);
    localStorage.setItem('iston_advisers_state_cache', JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
  return adviser;
}

export function demoLogout() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(ADVISER_KEY);
  listeners.forEach((fn) => fn());
}

export function onDemoChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
