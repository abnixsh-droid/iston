import { cors, requireAdmin, readConfig, writeConfig } from './_lib.js';

// Site settings are stored in the private `config` storage bucket (settings.json),
// readable publicly only through this API and writable only by verified admins.
export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const data = await readConfig('settings.json', {});
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(data || {});
    }
    if (req.method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const incoming = (req.body && req.body.settings) || {};
      const current = await readConfig('settings.json', {});
      let changed = 0;
      for (const [k, v] of Object.entries(incoming)) {
        if (!/^[a-z0-9_]{1,60}$/.test(k)) continue;
        current[k] = v === null || v === undefined ? '' : String(v).slice(0, 8000);
        changed++;
      }
      if (!changed) return res.status(400).json({ error: 'No settings provided' });
      await writeConfig('settings.json', current);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('settings API error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
