import { cors, DEMO_EMAIL, DEMO_PASSWORD, issueDemoToken } from './_lib.js';

// Issues a short-lived, read-only demo admin session.
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (String(email || '').trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect demo credentials.' });
  }
  return res.status(200).json({ token: issueDemoToken(), email: DEMO_EMAIL });
}
