export async function api<T = any>(
  path: string,
  opts: {
    method?: string
    body?: unknown
    auth?: boolean
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (opts.auth) {
    console.log(`[API] Fetching token for ${path}...`);
    const t = await token()
    if (t) headers.Authorization = `Bearer ${t}`
    console.log(`[API] Token attached:`, !!t);
  }

  const finalUrl = `${API_BASE_URL}${path}`;
  console.log(`[API] Requesting:`, finalUrl);

  const res = await fetch(finalUrl, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  console.log(`[API] Status:`, res.status);
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const err = new Error(json?.error || `Request failed (${res.status})`) as Error & { status?: number }
    err.status = res.status
    throw err
  }

  // Agar backend empty data bhej de, toh loading pe atakne se bachane ke liye error throw karein
  if (!json) {
    throw new Error("Backend returned empty data instead of user details.")
  }

  return json as T
}
