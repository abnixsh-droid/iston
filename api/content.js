import supabase from './db-client.js';
import { cors, requireAdmin, slugify, rowSig } from './_lib.js';

const REL = 'projects(id,name,slug)';
const CONFIG = {
  projects: {
    select: '*',
    slugFrom: 'name',
    cols: ['name', 'slug', 'tagline', 'status', 'location', 'description', 'cover_image', 'gallery', 'highlights', 'amenities', 'configurations', 'rera_number', 'possession', 'total_area', 'progress_percent', 'is_featured', 'is_demo', 'sort_order'],
  },
  buildings: {
    select: `*, ${REL}`,
    slugFrom: 'name',
    cols: ['name', 'slug', 'project_id', 'status', 'floors', 'units', 'description', 'cover_image', 'gallery', 'amenities', 'is_demo', 'sort_order'],
  },
  properties: {
    select: `*, ${REL}, buildings(id,name,slug)`,
    slugFrom: 'title',
    cols: ['title', 'slug', 'project_id', 'building_id', 'property_type', 'bhk', 'carpet_area', 'price', 'status', 'floor', 'facing', 'description', 'cover_image', 'gallery', 'amenities', 'is_featured', 'is_demo', 'sort_order'],
  },
  plots: {
    select: `*, ${REL}`,
    slugFrom: 'title',
    cols: ['title', 'slug', 'project_id', 'plot_number', 'area', 'price', 'status', 'location', 'facing', 'description', 'cover_image', 'gallery', 'amenities', 'is_featured', 'is_demo', 'sort_order'],
  },
  society_houses: {
    select: `*, ${REL}`,
    slugFrom: 'title',
    cols: ['title', 'slug', 'project_id', 'house_type', 'bhk', 'area', 'price', 'status', 'location', 'description', 'cover_image', 'gallery', 'amenities', 'is_featured', 'is_demo', 'sort_order'],
  },
  progress_updates: {
    select: `*, ${REL}`,
    slugFrom: null,
    cols: ['title', 'project_id', 'stage', 'description', 'progress_percent', 'image', 'update_date', 'is_demo', 'sort_order'],
  },
  promotions: {
    select: '*',
    slugFrom: null,
    cols: ['title', 'subtitle', 'cta_label', 'cta_link', 'image', 'active', 'is_demo', 'sort_order'],
  },
};

const INTS = ['progress_percent', 'bhk', 'sort_order', 'project_id', 'building_id'];
const ARRAYS = ['gallery', 'highlights', 'amenities'];
const BOOLS = ['is_featured', 'is_demo', 'active'];

function clean(type, body) {
  const out = {};
  for (const c of CONFIG[type].cols) {
    if (!(c in body)) continue;
    let v = body[c];
    if (typeof v === 'string') v = v.trim();
    if (v === '' || v === undefined) v = null;
    if (INTS.includes(c) && v !== null) {
      const n = parseInt(v, 10);
      v = Number.isFinite(n) ? n : null;
    }
    if (ARRAYS.includes(c)) {
      if (typeof v === 'string') v = v.split('\n').map((s) => s.trim()).filter(Boolean);
      if (!Array.isArray(v)) v = [];
    }
    if (BOOLS.includes(c)) v = !!v;
    out[c] = v;
  }
  return out;
}

// Every row written through the admin API is HMAC-signed. Rows without a valid
// signature (e.g. written directly with the public key) are never served.
async function sigMap(type, ids) {
  if (!ids.length) return {};
  const keys = ids.map((id) => `${type}:${id}`);
  const out = {};
  for (let i = 0; i < keys.length; i += 200) {
    const { data, error } = await supabase.from('content_sigs').select('id,sig').in('id', keys.slice(i, i + 200));
    if (error) throw error;
    for (const r of data || []) out[r.id] = r.sig;
  }
  return out;
}
const valid = (type, row, map) => map[`${type}:${row.id}`] === rowSig(type, CONFIG[type].cols, row);
async function saveSig(type, row) {
  const { error } = await supabase.from('content_sigs').upsert({ id: `${type}:${row.id}`, sig: rowSig(type, CONFIG[type].cols, row) }, { onConflict: 'id' });
  if (error) throw error;
}

async function uniqueSlug(type, base, excludeId) {
  let slug = base || `item-${Date.now().toString(36)}`;
  let q = supabase.from(type).select('id').eq('slug', slug);
  if (excludeId) q = q.neq('id', excludeId);
  const { data } = await q;
  if (data && data.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  return slug;
}

export { CONFIG };

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const type = req.query.type;
  const cfg = CONFIG[type];
  if (!cfg) return res.status(400).json({ error: 'Unknown content type' });

  try {
    if (req.method === 'GET') {
      const { slug, id, project_id, building_id, featured, status, limit, all } = req.query;
      let q = supabase.from(type).select(cfg.select);
      if (slug) q = q.eq('slug', slug);
      if (id) q = q.eq('id', id);
      if (project_id) q = q.eq('project_id', project_id);
      if (building_id && type === 'properties') q = q.eq('building_id', building_id);
      if (featured && cfg.cols.includes('is_featured')) q = q.eq('is_featured', true);
      if (status) q = q.eq('status', status);
      if (type === 'promotions' && !all) q = q.eq('active', true);
      if (type === 'progress_updates') {
        q = q.order('update_date', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
      } else {
        q = q.order('sort_order', { ascending: true, nullsFirst: false }).order('id', { ascending: true });
      }
      if (limit) q = q.limit(Math.min(Number(limit) || 50, 500));

      if (slug || id) {
        const { data, error } = await q.maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Not found' });
        const map = await sigMap(type, [data.id]);
        if (!valid(type, data, map)) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(data);
      }
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      const map = await sigMap(type, rows.map((r) => r.id));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(rows.filter((r) => valid(type, r, map)));
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = req.body || {};

    if (req.method === 'POST') {
      const row = clean(type, body);
      if (cfg.slugFrom) row.slug = await uniqueSlug(type, slugify(row.slug || row[cfg.slugFrom]));
      const { data, error } = await supabase.from(type).insert(row).select('*').single();
      if (error) throw error;
      await saveSig(type, data);
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      if (!body.id) return res.status(400).json({ error: 'id is required' });
      const row = clean(type, body);
      if (cfg.slugFrom && 'slug' in row) row.slug = await uniqueSlug(type, slugify(row.slug || row[cfg.slugFrom]), body.id);
      const { data, error } = await supabase.from(type).update(row).eq('id', body.id).select('*').single();
      if (error) throw error;
      await saveSig(type, data);
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const id = body.id || req.query.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from(type).delete().eq('id', id);
      if (error) throw error;
      await supabase.from('content_sigs').delete().eq('id', `${type}:${id}`);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('content API error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
