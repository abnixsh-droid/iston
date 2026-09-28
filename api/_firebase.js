import crypto from 'crypto';

// Verifies Firebase Auth ID tokens (RS256) against Google's public certificates.
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cache = { certs: null, exp: 0 };

async function getCerts() {
  if (cache.certs && Date.now() < cache.exp) return cache.certs;
  const r = await fetch(CERTS_URL);
  if (!r.ok) throw new Error('Could not fetch Firebase certificates');
  const certs = await r.json();
  const m = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  cache = { certs, exp: Date.now() + (m ? Number(m[1]) * 1000 : 3600000) };
  return certs;
}

const b64 = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export async function verifyFirebaseToken(token) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase is not configured on the server (FIREBASE_PROJECT_ID).');
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const header = JSON.parse(b64(parts[0]).toString('utf8'));
  const payload = JSON.parse(b64(parts[1]).toString('utf8'));
  if (header.alg !== 'RS256') throw new Error('Invalid token algorithm');
  const certs = await getCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error('Unknown token key');
  const ok = crypto.createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(cert, b64(parts[2]));
  if (!ok) throw new Error('Invalid token signature');
  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new Error('Invalid token audience');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Invalid token issuer');
  if (!payload.sub || payload.exp <= now || payload.iat > now + 300) throw new Error('Token expired');
  return { id: payload.sub, email: (payload.email || '').toLowerCase(), email_verified: payload.email_verified === true };
}
