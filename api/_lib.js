import crypto from 'crypto';
import supabase from './db-client.js';
import { verifyFirebaseToken } from './_firebase.js';

// Pre-configured admin accounts (cannot be removed).
// Note: abnixsh@gmail.com and sitaramchaurasiya8@gmail.com
export const ADMIN_EMAILS = ['sitaramchaurasiya8@gmail.com', 'abnixsh@gmail.com'];

const BASE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'iston-default-secret-salt';
const SIGN_KEY = crypto.createHash('sha256').update('iston-sign-v1:' + BASE).digest();
const ENC_KEY = crypto.createHash('sha256').update('iston-enc-v1:' + BASE).digest();

export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/* ---------- private config (Supabase Storage, service-role / table fallback) ---------- */
export async function readConfig(name, fallback) {
  try {
    // 1. Try Supabase storage
    const { data, error } = await supabase.storage.from('config').download(name);
    if (!error && data) {
      return JSON.parse(await data.text());
    }
  } catch {
    /* fallback to DB or default */
  }

  // 2. If reading admins.json, also check admin_allowlist table
  if (name === 'admins.json') {
    try {
      const { data: list, error: listErr } = await supabase.from('admin_allowlist').select('email');
      if (!listErr && Array.isArray(list) && list.length > 0) {
        return list.map((r) => r.email.toLowerCase());
      }
    } catch {
      /* ignore */
    }
  }

  return fallback;
}

export async function writeConfig(name, obj) {
  try {
    const { error } = await supabase.storage
      .from('config')
      .upload(name, Buffer.from(JSON.stringify(obj)), { contentType: 'application/json', upsert: true, cacheControl: '0' });
    if (!error) return;
  } catch {
    /* continue to table sync */
  }

  // If writing admins.json, also sync to admin_allowlist table
  if (name === 'admins.json' && Array.isArray(obj)) {
    try {
      for (const email of obj) {
        await supabase.from('admin_allowlist').upsert({ email: email.toLowerCase(), added_by: 'admin' }, { onConflict: 'email' });
      }
    } catch {
      /* ignore */
    }
  }
}

/* ---------- auth ---------- */
/* ---------- read-only demo admin ---------- */
export const DEMO_EMAIL = 'demo@istonbuildergroup.com';
export const DEMO_PASSWORD = 'IstonDemo@2026';
const DEMO_KEY = crypto.createHash('sha256').update('iston-demo-v1:' + BASE).digest();

export function issueDemoToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'demo', exp: Date.now() + 12 * 3600 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', DEMO_KEY).update(payload).digest('base64url');
  return `demo.${payload}.${sig}`;
}

export function verifyDemoToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return false;
  const [, payload, sig] = parts;
  if (!payload || !sig) return false;
  const good = crypto.createHmac('sha256', DEMO_KEY).update(payload).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return p.role === 'demo' && p.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Verifies any bearer token and extracts verified user identity:
 * Supports Demo session, Firebase ID token, Supabase Auth JWT, or Google ID token.
 */
export async function getUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: 'Unauthorized', code: 401 };

  // 1. Check Demo token
  if (token.startsWith('demo.')) {
    if (!verifyDemoToken(token)) return { error: 'Demo session expired. Please log in again.', code: 401 };
    return {
      user: {
        id: 'demo',
        email: DEMO_EMAIL,
        email_verified: true,
        name: 'Demo Admin',
        picture: null,
        provider: 'demo',
        demo: true,
      },
    };
  }

  // 2. Try Firebase token
  try {
    const fbUser = await verifyFirebaseToken(token);
    if (fbUser && fbUser.email) {
      return {
        user: {
          id: fbUser.id,
          email: fbUser.email.toLowerCase(),
          email_verified: fbUser.email_verified,
          name: fbUser.name || null,
          picture: fbUser.picture || null,
          provider: 'firebase',
        },
      };
    }
  } catch {
    // If not a valid Firebase token, continue to Supabase check
  }

  // 3. Try Supabase Auth token
  try {
    const { data: suData, error: suErr } = await supabase.auth.getUser(token);
    if (!suErr && suData?.user) {
      const u = suData.user;
      return {
        user: {
          id: u.id,
          email: (u.email || '').toLowerCase(),
          email_verified: !!u.email_confirmed_at || true,
          name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          picture: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
          provider: 'supabase',
        },
      };
    }
  } catch {
    // Continue to Google tokeninfo check
  }

  // 4. Try Google OAuth ID Token (via Google tokeninfo API)
  try {
    const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (gRes.ok) {
      const gInfo = await gRes.json();
      if (gInfo && gInfo.email && (gInfo.email_verified === 'true' || gInfo.email_verified === true)) {
        return {
          user: {
            id: gInfo.sub,
            email: gInfo.email.toLowerCase(),
            email_verified: true,
            name: gInfo.name || null,
            picture: gInfo.picture || null,
            provider: 'google',
          },
        };
      }
    }
  } catch {
    // All providers exhausted
  }

  return { error: 'Invalid or expired session', code: 401 };
}

/**
 * Checks if verified user is an authorized administrator.
 */
export async function getAdmin(req) {
  const r = await getUser(req);
  if (r.error) return r;

  const { user } = r;
  if (!user.email_verified) {
    return { error: 'Please verify your email address before accessing the admin panel.', code: 403, user };
  }

  const email = (user.email || '').toLowerCase();
  const normalizedLocked = ADMIN_EMAILS.map((e) => e.toLowerCase());
  let allowed = normalizedLocked.includes(email);

  if (!allowed) {
    const extra = await readConfig('admins.json', []);
    allowed = Array.isArray(extra) && extra.map((e) => String(e).toLowerCase()).includes(email);
  }

  if (!allowed) {
    return { error: 'This account is not authorised for admin access.', code: 403, user };
  }

  return { user: { ...user, isAdmin: true } };
}

export async function requireAdmin(req, res) {
  const r = await getAdmin(req);
  if (r.error) {
    res.status(r.code).json({ error: r.error });
    return null;
  }
  // Demo admin is strictly read-only.
  if (r.user.demo && req.method !== 'GET') {
    res.status(403).json({ error: 'Demo mode is read-only — changes are disabled. Log in with a real admin account to make changes.' });
    return null;
  }
  return r.user;
}

/* ---------- content integrity (HMAC signatures) ---------- */
export function rowSig(table, cols, row) {
  const payload = `${table}:${row.id}:${JSON.stringify(cols.map((c) => (row[c] === undefined ? null : row[c])))}`;
  return crypto.createHmac('sha256', SIGN_KEY).update(payload).digest('base64url');
}

/* ---------- PII encryption (AES-256-GCM) ---------- */
export function enc(v) {
  if (v === null || v === undefined || v === '') return v ?? null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ct = Buffer.concat([c.update(String(v), 'utf8'), c.final()]);
  return 'enc1:' + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}
export function isEnc(v) {
  return typeof v === 'string' && v.startsWith('enc1:');
}
export function dec(v) {
  if (!isEnc(v)) return v;
  try {
    const b = Buffer.from(v.slice(5), 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
