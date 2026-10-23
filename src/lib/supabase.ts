import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://fvobdtfatsrojjacatyg.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_1lg_QT3d1faQA8-iZfol3g_W82djmEN';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

