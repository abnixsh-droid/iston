import { useCallback, useEffect, useState } from 'react'
import { auth } from './firebase'
import { getDemoToken } from './demoSession'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

async function token() {
if (auth?.currentUser) return auth.currentUser.getIdToken()
return getDemoToken() || undefined
}

export async function api<T = any>(
path: string,
opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
const headers: Record<string, string> = { 'Content-Type': 'application/json' }
if (opts.auth) {
const t = await token()
if (t) headers.Authorization = Bearer ${t}
}
const res = await fetch(path, {
method: opts.method || 'GET',
headers,
body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
})
const json = await res.json().catch(() => null)
if (!res.ok) {
const err = new Error(json?.error || Request failed (${res.status})) as Error & { status?: number }
err.status = res.status
throw err
}
return json as T
}

export function useApi<T = any>(path: string | null, auth = false) {
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
.then((d) => alive && (setData(d), setStatus(200)))
.catch((e) => alive && (setError(e.message), setStatus(e.status || 500)))
.finally(() => alive && setLoading(false))
return () => {
alive = false
}
}, [path, auth, tick])

const reload = useCallback(() => setTick((t) => t + 1), [])
return { data, loading, error, status, reload, setData }
}

/**

Upload a file to Hostinger via PHP (public/api/upload.php).
Returns the public URL string (as CrudPage expects).
*/
export async function uploadFile(file: File, folder = 'uploads'): Promise<string> {
if (!file) throw new Error('No file selected')
const key = import.meta.env.VITE_UPLOAD_KEY
if (!key) throw new Error('Missing VITE_UPLOAD_KEY')
const fd = new FormData()
fd.append('file', file)
fd.append('folder', folder)

const res = await fetch('/api/upload', {
method: 'POST',
headers: { 'X-Upload-Key': key },
body: fd,
credentials: 'same-origin',
})

// PHP always replies JSON; still guard just in case
let json: any = null
try {
json = await res.json()
} catch {
/* ignore */
}

if (!res.ok || !json?.ok || !json?.url) {
const msg = json?.error || Upload failed (${res.status})
throw new Error(msg)
}

return json.url as string
}

/**

Optional helper to delete a previously uploaded file.
Pass the "path" you stored (e.g. /uploads/projects/abc123.webp)
*/
export async function deleteUploaded(path: string): Promise<void> {
if (!path) return
const key = import.meta.env.VITE_UPLOAD_KEY
if (!key) throw new Error('Missing VITE_UPLOAD_KEY')
const fd = new FormData()
fd.append('path', path)

const res = await fetch('/api/delete', {
method: 'POST',
headers: { 'X-Upload-Key': key },
body: fd,
credentials: 'same-origin',
})
const json = await res.json().catch(() => ({}))
if (!res.ok || !json?.ok) {
throw new Error(json?.error || Delete failed (${res.status}))
}
}
