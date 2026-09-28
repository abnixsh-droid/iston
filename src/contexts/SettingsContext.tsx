import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

// Only the details explicitly provided by Iston Builder Group are defaults.
export const DEFAULTS: Record<string, string> = {
  company_name: 'Iston Builder Group',
  tagline: 'Building Better Spaces. Creating Better Futures.',
  phone: '+91 84848 43391',
  whatsapp: '918484843391',
  hero_project_slug: 'umroli',
  notify_email: 'istonbuildergroup@gmail.com',
  notify_whatsapp: '918484843391',
};

// Brochure file placed in the site's admin folder (public/admin/brochure.pdf).
export const FOLDER_BROCHURE = '/admin/brochure.pdf';

async function folderBrochureExists() {
  try {
    const r = await fetch(FOLDER_BROCHURE, { method: 'HEAD', cache: 'no-store' });
    return r.ok && (r.headers.get('content-type') || '').includes('pdf');
  } catch {
    return false;
  }
}

type Ctx = { s: Record<string, string>; loading: boolean; reload: () => void };
const SettingsCtx = createContext<Ctx>({ s: DEFAULTS, loading: true, reload: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api<Record<string, string>>('/api/settings')
      .then(async (d) => {
        const merged: Record<string, string> = { ...DEFAULTS };
        for (const [k, v] of Object.entries(d || {})) if (v && String(v).trim()) merged[k] = String(v);
        if (!merged.brochure_url && merged.brochure_hidden !== '1' && (await folderBrochureExists())) merged.brochure_url = FOLDER_BROCHURE;
        setS(merged);
        if (merged.site_domain) (window as unknown as { __SITE_DOMAIN__?: string }).__SITE_DOMAIN__ = merged.site_domain;
      })
      .catch(() => setS(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <SettingsCtx.Provider value={{ s, loading, reload: load }}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
