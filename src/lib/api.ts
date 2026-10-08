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
