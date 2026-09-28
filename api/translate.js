import { cors, readConfig, writeConfig } from './_lib.js';

// Machine-translation fallback (English -> Hindi) for text not covered by the
// curated dictionary — mainly content entered from the admin panel.
// Results are cached in memory and in the private config bucket.
let mem = null;
let dirty = false;

async function loadCache() {
  if (!mem) mem = (await readConfig('hi-cache.json', {})) || {};
  return mem;
}

async function viaGoogle(list) {
  const body = list.map((q) => 'q=' + encodeURIComponent(q)).join('&');
  const r = await fetch('https://translate.googleapis.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=hi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) throw new Error('google ' + r.status);
  const d = await r.json();
  return list.map((_, i) => {
    const v = d[i];
    return Array.isArray(v) ? String(v[0]) : typeof v === 'string' ? v : '';
  });
}

async function viaMyMemory(q) {
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0, 480))}&langpair=en|hi`);
  const d = await r.json();
  const t = d?.responseData?.translatedText || '';
  return /[\u0900-\u097F]/.test(t) ? t : '';
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const q = (Array.isArray(req.body?.q) ? req.body.q : []).slice(0, 60).map((s) => String(s).slice(0, 1500));
    const cache = await loadCache();
    const missing = Array.from(new Set(q.filter((s) => !cache[s])));
    if (missing.length) {
      let out = [];
      try {
        out = await viaGoogle(missing);
      } catch (e) {
        console.error('translate primary failed:', e.message);
      }
      for (let i = 0; i < missing.length; i++) {
        let t = out[i];
        if (!t || !/[\u0900-\u097F]/.test(t)) t = await viaMyMemory(missing[i]).catch(() => '');
        if (t) {
          cache[missing[i]] = t;
          dirty = true;
        }
      }
      if (dirty && Object.keys(cache).length < 20000) {
        dirty = false;
        await writeConfig('hi-cache.json', cache).catch(() => {});
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ t: q.map((s) => cache[s] || '') });
  } catch (err) {
    console.error('translate error:', err);
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
}
