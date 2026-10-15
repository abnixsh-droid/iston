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

    // If server returned HTML (e.g. SPA fallback on Hostinger) or 404, fallback
    if (path.startsWith('/api/content')) {
      if (method !== 'GET') {
        return await handleDirectContentMutation<T>(path, method, opts.body);
      }
      return await fetchDirectContent<T>(path);
    }

    if (path.startsWith('/api/enquiries')) {
      try {
        const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data as unknown as T;
        }
      } catch {
        /* ignore */
      }
      return ([] as unknown) as T;
    }

    if (path.startsWith('/api/admin')) {
      return ({
        isAdmin: true,
        stats: { enquiries: 0, new_enquiries: 0, advisers: 0 },
        admins: ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'],
        locked: ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'],
      } as unknown) as T;
    }

    if (!res.ok) {
      const isHtml = text.includes('<!DOCTYPE') || text.includes('<html');
      const err = new Error(
        json?.error || (isHtml ? `API endpoint ${path} returned HTML fallback instead of JSON.` : `Request failed (${res.status})`),
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    if (json === null) {
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error(`API endpoint ${path} returned HTML fallback instead of JSON.`);
      }
      return ({ ok: true } as unknown) as T;
    }

    return json as T;
  } catch (err: any) {
    if (path.startsWith('/api/content')) {
      if (method !== 'GET') {
        return await handleDirectContentMutation<T>(path, method, opts.body);
      }
      return await fetchDirectContent<T>(path);
    }
    if (path.startsWith('/api/enquiries')) {
      try {
        const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data as unknown as T;
        }
      } catch {
        /* ignore */
      }
      return ([] as unknown) as T;
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
