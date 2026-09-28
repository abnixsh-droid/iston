import supabase from './db-client.js';
import { cors, getAdmin, requireAdmin, ADMIN_EMAILS, readConfig, writeConfig } from './_lib.js';

const TABLES = ['projects', 'buildings', 'properties', 'plots', 'society_houses', 'progress_updates', 'promotions'];
const PURGE_ORDER = ['properties', 'plots', 'society_houses', 'progress_updates', 'buildings', 'promotions', 'projects'];

async function count(table, filter) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c || 0;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const r = await getAdmin(req);
      if (r.error) return res.status(r.code).json({ isAdmin: false, error: r.error, email: r.user?.email || null });
      const stats = {};
      const demo = {};
      await Promise.all(
        TABLES.map(async (t) => {
          stats[t] = await count(t);
          demo[t] = await count(t, (q) => q.eq('is_demo', true));
        })
      );
      stats.enquiries = await count('enquiries');
      stats.new_enquiries = await count('enquiries', (q) => q.eq('status', 'new'));
      const extra = await readConfig('admins.json', []);
      const admins = Array.from(new Set([...ADMIN_EMAILS, ...(Array.isArray(extra) ? extra : [])]));
      return res.status(200).json({ isAdmin: true, email: r.user.email, stats, demo, admins, locked: ADMIN_EMAILS });
    }

    if (req.method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const { action, email } = req.body || {};
      if (action === 'purge_demo') {
        for (const t of PURGE_ORDER) {
          const { error } = await supabase.from(t).delete().eq('is_demo', true);
          if (error) throw error;
        }
        return res.status(200).json({ ok: true });
      }
      const e = String(email || '').trim().toLowerCase();
      if (action === 'add_admin') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Invalid email' });
        const extra = await readConfig('admins.json', []);
        await writeConfig('admins.json', Array.from(new Set([...(Array.isArray(extra) ? extra : []), e])));
        return res.status(200).json({ ok: true });
      }
      if (action === 'remove_admin') {
        if (ADMIN_EMAILS.includes(e)) return res.status(400).json({ error: 'Pre-configured admins cannot be removed.' });
        const extra = await readConfig('admins.json', []);
        await writeConfig('admins.json', (Array.isArray(extra) ? extra : []).filter((x) => x !== e));
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin API error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
