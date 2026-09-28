import supabase from './db-client.js';
import { cors, requireAdmin, enc, dec, isEnc } from './_lib.js';

const STATUSES = ['new', 'contacted', 'follow_up', 'closed'];
const PII = ['name', 'phone', 'email', 'message', 'notes'];
const s = (v, n) => (v === undefined || v === null ? null : String(v).trim().slice(0, n) || null);

function decrypt(row) {
  const out = { ...row };
  for (const k of PII) out[k] = dec(row[k]);
  return out;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'POST') {
      const b = req.body || {};
      if (b.website) return res.status(201).json({ ok: true }); // honeypot
      const name = s(b.name, 120);
      const phone = s(b.phone, 30);
      const email = s(b.email, 160);
      const digits = (phone || '').replace(/\D/g, '');
      if (!name || name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
      if (digits.length < 10 || digits.length > 13) return res.status(400).json({ error: 'Please enter a valid phone number.' });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });
      const itemId = parseInt(b.item_id, 10);
      const row = {
        name: enc(name),
        phone: enc(phone),
        email: enc(email),
        message: enc(s(b.message, 2000)),
        interest: s(b.interest, 120),
        item_type: s(b.item_type, 40),
        item_id: Number.isFinite(itemId) ? itemId : null,
        item_title: s(b.item_title, 200),
        source_page: s(b.source_page, 300),
        referral_code: s(b.referral_code, 60),
        partner_id: null,
        status: 'new',
      };
      const { error } = await supabase.from('enquiries').insert(row);
      if (error) throw error;
      return res.status(201).json({ ok: true });
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      // Only rows written through this API are encrypted; anything else is ignored.
      const rows = (data || []).filter((r) => isEnc(r.name)).map(decrypt).filter((r) => r.name);
      return res.status(200).json(rows);
    }
    if (req.method === 'PUT') {
      const { id, status, notes } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = {};
      if (status !== undefined) {
        if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        patch.status = status;
      }
      if (notes !== undefined) patch.notes = enc(s(notes, 4000));
      const { data, error } = await supabase.from('enquiries').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return res.status(200).json(decrypt(data));
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('enquiries').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('enquiries API error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
