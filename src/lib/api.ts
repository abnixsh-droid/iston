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

import { getDefaultContent } from './defaultContent';

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

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method || 'GET',
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
      return json as T;
    }

    // If server returned HTML (e.g. SPA fallback on Hostinger), fallback for content
    if (path.startsWith('/api/content')) {
      return await fetchDirectContent<T>(path);
    }

    if (!res.ok) {
      const err = new Error(
        json?.error || `Request failed (${res.status})`,
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    if (json === null) {
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        if (path.startsWith('/api/content')) {
          return await fetchDirectContent<T>(path);
        }
        throw new Error(`API endpoint ${path} returned HTML fallback instead of JSON.`);
      }
      return ({ ok: true } as unknown) as T;
    }

    return json as T;
  } catch (err: any) {
    if (path.startsWith('/api/content')) {
      return await fetchDirectContent<T>(path);
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
