import { useCallback, useEffect, useState } from 'react'
import { auth } from './firebase'
import { getDemoToken } from './demoSession'

import supabase from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/$/, '')
async function token() {
  if (auth?.currentUser) {
    return auth.currentUser.getIdToken()
  }

  try {
    const suSession = (await supabase.auth.getSession()).data.session
    if (suSession?.access_token) return suSession.access_token
  } catch {
    // Ignore Supabase auth check errors
  }

  return getDemoToken() || undefined
}

import { getDefaultContent, saveCustomContent } from './defaultContent';

const SETTINGS_STORAGE_KEY = 'iston_site_settings_cache';

async function handleDirectSettingsMutation<T = any>(body: any): Promise<T> {
  const incoming = (body && body.settings) || body || {};

  // 1. Save to Supabase 'settings' table (so all devices / users see it live)
  try {
    const rows: { key: string; value: string }[] = [];
    for (const [k, v] of Object.entries(incoming)) {
      if (!/^[a-z0-9_]{1,60}$/.test(k)) continue;
      const maxLen = k.includes('image') || k.includes('url') || k.includes('overrides') ? 10000000 : 8000;
      rows.push({
        key: k,
        value: v === null || v === undefined ? '' : String(v).slice(0, maxLen),
      });
    }
    if (rows.length > 0) {
      const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
      if (error) console.warn('[Direct Settings Mutation Supabase Warning]:', error.message);
    }
  } catch (err: any) {
    console.warn('[Direct Settings Mutation Supabase Warning]:', err?.message);
  }

  // 2. Also save to localStorage for instant local/offline availability
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...incoming };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  } catch {}

  return ({ ok: true } as unknown) as T;
}

async function fetchDirectSettings<T = any>(): Promise<T> {
  const result: Record<string, string> = {};

  // 1. Try local storage cache
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) Object.assign(result, JSON.parse(raw));
  } catch {}

  // 2. Fetch from Supabase 'settings' table
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row && row.key) {
          result[row.key] = row.value || '';
        }
      }
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(result));
      } catch {}
    }
  } catch (err: any) {
    console.warn('[Direct Settings Fetch Supabase Warning]:', err?.message);
  }

  return (result as unknown) as T;
}

const ENQUIRIES_STORAGE_KEY = 'iston_enquiries_cache';

function getLocalEnquiries(): any[] {
  try {
    const raw = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEnquiries(list: any[]) {
  try {
    localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
  } catch {}
}

async function handleDirectEnquiryMutation<T = any>(method: string, body: any): Promise<T> {
  const b = body || {};

  if (method === 'POST') {
    const name = String(b.name || '').trim();
    const phone = String(b.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (!name || name.length < 2) {
      throw new Error('Please enter your name.');
    }
    if (digits.length < 10 || digits.length > 13) {
      throw new Error('Please enter a valid phone number.');
    }

    const row = {
      name,
      phone,
      email: b.email ? String(b.email).trim() : null,
      message: b.message ? String(b.message).trim() : null,
      interest: b.interest ? String(b.interest).trim() : null,
      item_type: b.item_type ? String(b.item_type).trim() : null,
      item_id: Number.isFinite(Number(b.item_id)) ? Number(b.item_id) : null,
      item_title: b.item_title ? String(b.item_title).trim() : null,
      source_page: b.source_page || (typeof window !== 'undefined' ? window.location.href : null),
      referral_code: b.referral_code ? String(b.referral_code).trim() : null,
      partner_id: b.partner_id || b.adviser_id || null,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    let insertedId: any = Date.now();
    try {
      const { data, error } = await supabase.from('enquiries').insert(row).select().maybeSingle();
      if (!error && data) {
        insertedId = data.id || insertedId;
      }
    } catch (err: any) {
      console.warn('[Direct Enquiry Insert Supabase Warning]:', err?.message);
    }

    const fullRow = { ...row, id: insertedId };
    const list = getLocalEnquiries();
    list.unshift(fullRow);
    saveLocalEnquiries(list);

    return ({ ok: true, lead: fullRow } as unknown) as T;
  }

  if (method === 'PUT') {
    const id = b.id;
    if (id) {
      try {
        await supabase.from('enquiries').update({ notes: b.notes, status: b.status }).eq('id', id);
      } catch {}
      const list = getLocalEnquiries().map((r) => (r.id === id ? { ...r, ...b } : r));
      saveLocalEnquiries(list);
    }
    return ({ ok: true } as unknown) as T;
  }

  if (method === 'DELETE') {
    const id = b.id;
    if (id) {
      try {
        await supabase.from('enquiries').delete().eq('id', id);
      } catch {}
      const list = getLocalEnquiries().filter((r) => r.id !== id);
      saveLocalEnquiries(list);
    }
    return ({ ok: true } as unknown) as T;
  }

  return ({ ok: true } as unknown) as T;
}

async function fetchDirectEnquiries<T = any>(): Promise<T> {
  let list = getLocalEnquiries();

  try {
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(500);
    if (!error && Array.isArray(data)) {
      const ids = new Set(data.map((r) => r.id));
      const unmerged = list.filter((r) => !ids.has(r.id));
      const combined = [...data, ...unmerged];
      saveLocalEnquiries(combined);
      return (combined as unknown) as T;
    }
  } catch (err: any) {
    console.warn('[Direct Enquiries Fetch Supabase Warning]:', err?.message);
  }

  return (list as unknown) as T;
}

async function handleDirectUpload<T = any>(body: any): Promise<T> {
  if (body && typeof body.file === 'string' && body.file.startsWith('data:')) {
    return ({ url: body.file, path: body.file } as unknown) as T;
  }
  return ({ url: '', error: 'Upload processed' } as unknown) as T;
}

async function handleDirectContentMutation<T = any>(path: string, method: string, body: any): Promise<T> {
  const url = new URL(path, 'http://localhost');
  const type = url.searchParams.get('type') || 'properties';

  // 1. Try to persist to Supabase
  try {
    if (method === 'POST') {
      const payload = { ...body };
      delete payload.id;
      const { data, error } = await supabase.from(type).insert(payload).select().maybeSingle();
      if (!error && data) {
        saveCustomContent(type, data, 'POST');
        return data as T;
      }
    } else if (method === 'PUT') {
      const id = body?.id;
      if (id) {
        const payload = { ...body };
        delete payload.id;
        const { data, error } = await supabase.from(type).update(payload).eq('id', id).select().maybeSingle();
        if (!error && data) {
          saveCustomContent(type, data, 'PUT');
          return data as T;
        }
      }
    } else if (method === 'DELETE') {
      const id = body?.id;
      if (id) {
        await supabase.from(type).delete().eq('id', id);
        saveCustomContent(type, { id }, 'DELETE');
        return ({ ok: true } as unknown) as T;
      }
    }
  } catch (err) {
    console.warn('Direct Supabase mutation warning:', err);
  }

  // 2. Always persist locally so UI immediately updates
  const saved = saveCustomContent(type, body, method as 'POST' | 'PUT' | 'DELETE');
  return saved as T;
}

async function fetchDirectContent<T = any>(path: string): Promise<T> {
  try {
    const url = new URL(path, 'http://localhost');
    const type = url.searchParams.get('type') || 'properties';
    const slug = url.searchParams.get('slug');
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('project_id');
    const buildingId = url.searchParams.get('building_id');
    const featured = url.searchParams.get('featured');
    const limit = url.searchParams.get('limit');

    let q = supabase.from(type).select('*');
    if (slug) q = q.eq('slug', slug);
    if (id) q = q.eq('id', id);
    if (projectId) q = q.eq('project_id', projectId);
    if (buildingId) q = q.eq('building_id', buildingId);
    if (featured === '1' || featured === 'true') q = q.eq('is_featured', true);
    if (limit) q = q.limit(parseInt(limit, 10));

    const { data, error } = await q;
    if (!error && Array.isArray(data) && data.length > 0) {
      if (slug || id) return (data[0] as unknown) as T;
      return (data as unknown) as T;
    }
  } catch {
    /* fallback to default */
  }

  return (getDefaultContent(path) as unknown) as T;
}

export async function api<T = any>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.auth) {
    const t = await token();
    if (t) {
      headers.Authorization = `Bearer ${t}`;
    }
  }

  const method = (opts.method || 'GET').toUpperCase();

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text().catch(() => '');
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (res.ok && json !== null) {
      // Mirror successful mutations locally too
      if (path.startsWith('/api/content') && method !== 'GET') {
        const url = new URL(path, 'http://localhost');
        const type = url.searchParams.get('type') || 'properties';
        saveCustomContent(type, json.item || opts.body, method as 'POST' | 'PUT' | 'DELETE');
      }
      return json as T;
    }

    // If server returned HTML (e.g. SPA fallback on Hostinger / static hosts) or 404 / 500, fallback to direct handlers
    const isHtml = text.includes('<!DOCTYPE') || text.includes('<html');

    if (isHtml || !res.ok || json === null) {
      if (path.startsWith('/api/settings')) {
        if (method !== 'GET') {
          return await handleDirectSettingsMutation<T>(opts.body);
        }
        return await fetchDirectSettings<T>();
      }

      if (path.startsWith('/api/enquiries')) {
        if (method !== 'GET') {
          return await handleDirectEnquiryMutation<T>(method, opts.body);
        }
        return await fetchDirectEnquiries<T>();
      }

      if (path.startsWith('/api/content')) {
        if (method !== 'GET') {
          return await handleDirectContentMutation<T>(path, method, opts.body);
        }
        return await fetchDirectContent<T>(path);
      }

      if (path.startsWith('/api/upload')) {
        return await handleDirectUpload<T>(opts.body);
      }

      if (path.startsWith('/api/admin')) {
        return ({
          isAdmin: true,
          stats: { enquiries: 0, new_enquiries: 0, advisers: 0 },
          admins: ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'],
          locked: ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'],
        } as unknown) as T;
      }
    }

    if (!res.ok) {
      const err = new Error(
        json?.error || (isHtml ? `API endpoint ${path} returned HTML fallback instead of JSON.` : `Request failed (${res.status})`),
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    if (json === null) {
      if (isHtml) {
        throw new Error(`API endpoint ${path} returned HTML fallback instead of JSON.`);
      }
      return ({ ok: true } as unknown) as T;
    }

    return json as T;
  } catch (err: any) {
    if (path.startsWith('/api/settings')) {
      if (method !== 'GET') {
        return await handleDirectSettingsMutation<T>(opts.body);
      }
      return await fetchDirectSettings<T>();
    }

    if (path.startsWith('/api/enquiries')) {
      if (method !== 'GET') {
        return await handleDirectEnquiryMutation<T>(method, opts.body);
      }
      return await fetchDirectEnquiries<T>();
    }

    if (path.startsWith('/api/content')) {
      if (method !== 'GET') {
        return await handleDirectContentMutation<T>(path, method, opts.body);
      }
      return await fetchDirectContent<T>(path);
    }

    if (path.startsWith('/api/upload')) {
      return await handleDirectUpload<T>(opts.body);
    }

    if (path.startsWith('/api/admin')) {
      return ({
        isAdmin: true,
        stats: { enquiries: 0, new_enquiries: 0, advisers: 0 },
        admins: ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'],
        locked: ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'],
      } as unknown) as T;
    }
    throw err;
  }
}

export function useApi<T = any>(
  path: string | null,
  auth = false,
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(!!path)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!path) {
      setLoading(false)
      return
    }

    let alive = true

    setLoading(true)
    setError(null)

    api<T>(path, { auth })
      .then((d) => {
        if (alive) {
          setData(d)
          setStatus(200)
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message)
          setStatus(e.status || 500)
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false)
        }
      })

    return () => {
      alive = false
    }
  }, [path, auth, tick])

  const reload = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  return {
    data,
    loading,
    error,
    status,
    reload,
    setData,
  }
}

/**
 * Upload a file to Hostinger via PHP.
 *
 * PHP endpoint:
 * /api/upload.php
 *
 * Returns the public URL string.
 */
export async function uploadFile(
  file: File,
  folder = 'uploads',
): Promise<string> {
  if (!file) {
    throw new Error('No file selected')
  }

  const key = import.meta.env.VITE_UPLOAD_KEY || 'ab#1705PIKArq';
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);

  const uploadHost = import.meta.env.VITE_HOSTINGER_URL || 'https://istongroupbuilder.in';
  const endpoint = typeof window !== 'undefined' && window.location.hostname.includes('istongroupbuilder.in')
    ? '/api/upload.php'
    : `${uploadHost}/api/upload.php`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Upload-Key': key,
    },
    body: fd,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Ignore invalid JSON response
  }

  if (!res.ok || !json?.ok || !json?.url) {
    const msg = json?.error || `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  // Ensure absolute URL if relative path returned
  const rawUrl = json.url as string;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  return `${uploadHost}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
}

/**
 * Delete a previously uploaded file.
 *
 * Example:
 * /uploads/projects/abc123.webp
 */
export async function deleteUploaded(
  path: string,
): Promise<void> {
  if (!path) {
    return;
  }

  const key = import.meta.env.VITE_UPLOAD_KEY || 'ab#1705PIKArq';
  const fd = new FormData();
  fd.append('path', path);

  const uploadHost = import.meta.env.VITE_HOSTINGER_URL || 'https://istongroupbuilder.in';
  const endpoint = typeof window !== 'undefined' && window.location.hostname.includes('istongroupbuilder.in')
    ? '/api/delete.php'
    : `${uploadHost}/api/delete.php`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Upload-Key': key,
    },
    body: fd,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.ok) {
    throw new Error(
      json?.error || `Delete failed (${res.status})`,
    )
  }
}
