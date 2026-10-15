import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://fvobdtfatsrojjacatyg.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1lg_QT3d1faQA8-iZfol3g_W82djmEN';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use SERVICE_KEY if set, otherwise ANON_KEY.
// If SERVICE_KEY encounters "Unregistered API key" (401), automatically fallback to ANON_KEY.
const primaryKey = SERVICE_KEY || ANON_KEY;

const supabase = createClient(
  SUPABASE_URL,
  primaryKey,
  {
    global: {
      fetch: async (url, options = {}) => {
        let res = await fetch(url, options);
        if (res.status === 401 && SERVICE_KEY && primaryKey === SERVICE_KEY) {
          // If service key is rejected by Supabase, retry with ANON_KEY
          const clonedHeaders = new Headers(options.headers || {});
          clonedHeaders.set('apikey', ANON_KEY);
          if (clonedHeaders.get('Authorization')?.includes(SERVICE_KEY)) {
            clonedHeaders.set('Authorization', `Bearer ${ANON_KEY}`);
          }
          res = await fetch(url, { ...options, headers: clonedHeaders });
        }
        if (!res.ok && res.status >= 500) triggerRestore();
        return res;
      },
    },
  }
);

export default supabase;
