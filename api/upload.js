import supabase from './db-client.js';
import { cors, requireAdmin } from './_lib.js';

// Returns a signed upload URL so admins can upload large files (brochures, images)
// directly to Supabase Storage without hitting serverless body-size limits.
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { fileName, folder } = req.body || {};
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });
    const safe = String(fileName).toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').slice(-80);
    const dir = String(folder || 'uploads').replace(/[^a-z0-9\-_]/gi, '') || 'uploads';
    const path = `${dir}/${Date.now().toString(36)}-${safe}`;
    const { data, error } = await supabase.storage.from('media').createSignedUploadUrl(path);
    if (error) throw error;
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
    return res.status(200).json({ path: data.path, token: data.token, publicUrl: pub.publicUrl });
  } catch (err) {
    console.error('upload API error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
