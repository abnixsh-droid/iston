import crypto from 'crypto';
import supabase from './db-client.js';
import { verifyFirebaseToken } from './_firebase.js';

// Pre-configured admin accounts (cannot be removed). Extra admins live in the private
// `config` storage bucket (admins.json), which is not reachable with the public anon key.
export const ADMIN_EMAILS = ['sitaramchaurasiya8@gmail.com', 'bnixsh@gmail.com'];

const BASE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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

/* ---------- private config (Supabase Storage, service-role only) ---------- */
export async function readConfig(name, fallback) {
  const { data, error } = await supabase.storage.from('config').download(name);
  if (error || !data) return fallback;
  try {
    return JSON.parse(await data.text());
  } catch {
    return fallback;
  }
}
export async function writeConfig(name, obj) {
  const { error } = await supabase.storage
    .from('config')
    .upload(name, Buffer.from(JSON.stringify(obj)), { contentType: 'application/json', upsert: true, cacheControl: '0' });
  if (error) throw error;
}

/* ---------- auth ---------- */
export async function getAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return { error: 'Unauthorized', code: 401 };
  let user;
  try {
    user = await verifyFirebaseToken(token);
  } catch (e) {
    return { error: e.message || 'Invalid or expired session', code: 401 };
  }
  if (!user.email_verified) return { error: 'Please verify your email address before accessing the admin panel.', code: 403, user };
  const email = user.email;
  let allowed = ADMIN_EMAILS.includes(email);
  if (!allowed) {
    const extra = await readConfig('admins.json', []);
    allowed = Array.isArray(extra) && extra.includes(email);
  }
  if (!allowed) return { error: 'This account is not authorised for admin access.', code: 403, user };
  return { user };
}

export async function requireAdmin(req, res) {
  const r = await getAdmin(req);
  if (r.error) {
    res.status(r.code).json({ error: r.error });
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
