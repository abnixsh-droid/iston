import supabase from './db-client.js';
import { cors, getUser, ADMIN_EMAILS, readConfig } from './_lib.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const r = await getUser(req);
    if (r.error) {
      return res.status(r.code || 401).json({ error: r.error });
    }
    const { user } = r;

    // Determine admin status
    const email = (user.email || '').toLowerCase();
    const lockedAdmins = ADMIN_EMAILS.map((e) => e.toLowerCase());
    let isAdmin = lockedAdmins.includes(email);
    if (!isAdmin) {
      const extra = await readConfig('admins.json', []);
      isAdmin = Array.isArray(extra) && extra.map((e) => String(e).toLowerCase()).includes(email);
    }
    const role = isAdmin ? 'admin' : 'user';

    if (req.method === 'GET' || req.method === 'POST') {
      const body = req.body || {};
      const displayName = body.display_name || user.name || null;
      const photoUrl = body.photo_url || user.picture || null;
      const now = new Date().toISOString();

      let profileData = {
        id: user.id,
        auth_provider: user.provider || 'firebase',
        provider_user_id: user.id,
        email: email,
        email_verified: user.email_verified,
        display_name: displayName,
        photo_url: photoUrl,
        role,
        account_status: 'active',
        last_login_at: now,
      };

      // Upsert into user_profiles in Supabase (safe upsert, non-destructive)
      try {
        const { data: existing } = await supabase.from('user_profiles').select('*').eq('email', email).maybeSingle();
        if (existing) {
          // Update last login and provider info without overwriting custom adviser details
          const { data: updated, error: upErr } = await supabase
            .from('user_profiles')
            .update({
              last_login_at: now,
              email_verified: user.email_verified,
              display_name: displayName || existing.display_name,
              photo_url: photoUrl || existing.photo_url,
              role: existing.role === 'admin' || isAdmin ? 'admin' : 'user',
              updated_at: now,
            })
            .eq('id', existing.id)
            .select('*')
            .maybeSingle();

          if (!upErr && updated) {
            profileData = updated;
          } else {
            profileData = { ...existing, role: existing.role === 'admin' || isAdmin ? 'admin' : 'user' };
          }
        } else {
          // Insert new profile
          const { data: inserted, error: inErr } = await supabase
            .from('user_profiles')
            .insert({
              ...profileData,
              created_at: now,
              updated_at: now,
            })
            .select('*')
            .maybeSingle();

          if (!inErr && inserted) {
            profileData = inserted;
          }
        }
      } catch (err) {
        // Log gracefully if table is not yet migrated, continue with verified token data
        console.warn('Note: user_profiles table sync warning:', err.message);
      }

      // Check if user is an adviser
      let adviser = null;
      try {
        const { data: adv } = await supabase.from('advisers').select('*').eq('email', email).maybeSingle();
        if (adv) {
          adviser = adv;
          profileData.is_adviser = adv.status === 'active';
          profileData.adviser_id = adv.adviser_id;
        }
      } catch {
        /* ignore */
      }

      if (!adviser) {
        const state = await readConfig('advisers_state.json', { advisers: [] });
        const adv = state?.advisers?.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (adv) {
          adviser = adv;
          profileData.is_adviser = adv.status === 'active';
          profileData.adviser_id = adv.adviser_id;
        }
      }

      return res.status(200).json({
        ok: true,
        user: {
          ...profileData,
          isAdmin,
          isDemo: !!user.demo,
        },
        adviser,
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('user API error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
