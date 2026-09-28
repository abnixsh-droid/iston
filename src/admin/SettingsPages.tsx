import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, FileUp, Loader2, Trash2, UserPlus } from 'lucide-react';
import { api, uploadFile, useApi } from '../lib/api';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import type { AdminCtx } from './AdminLayout';

type G = { title: string; fields: [string, string, ('text' | 'textarea')?, string?][] };
const GROUPS: G[] = [
  {
    title: 'Company & homepage',
    fields: [
      ['company_name', 'Company name'],
      ['tagline', 'Tagline'],
      ['hero_subtitle', 'Homepage hero subtitle', 'textarea', 'Leave blank for the default subtitle'],
      ['hero_project_slug', 'Homepage centrepiece project (slug)', 'text', 'e.g. umroli'],
    ],
  },
  {
    title: 'Contact details',
    fields: [
      ['phone', 'Phone (display)'],
      ['whatsapp', 'WhatsApp number', 'text', 'Digits with country code, e.g. 918484843391'],
      ['email', 'Email'],
      ['office_hours', 'Office hours'],
      ['office_address', 'Office address', 'textarea'],
      ['map_embed_url', 'Google Maps embed URL', 'text', 'https://www.google.com/maps/embed?…'],
    ],
  },
  {
    title: 'About us',
    fields: [
      ['about_intro', 'Introduction', 'textarea'],
      ['about_story', 'Our story', 'textarea'],
      ['mission', 'Mission', 'textarea'],
      ['vision', 'Vision', 'textarea'],
      ['rera_info', 'RERA / legal information', 'textarea'],
    ],
  },
  {
    title: 'Domain & hosting (Hostinger)',
    fields: [
      ['site_domain', 'Primary domain', 'text', 'e.g. https://www.yourdomain.com — your Hostinger domain'],
      ['hosting_provider', 'Hosting provider', 'text', 'Hostinger'],
    ],
  },
  {
    title: 'Social links',
    fields: [
      ['instagram_url', 'Instagram URL'],
      ['facebook_url', 'Facebook URL'],
      ['youtube_url', 'YouTube URL'],
      ['linkedin_url', 'LinkedIn URL'],
    ],
  },
  {
    title: 'SEO, footer & partner program',
    fields: [
      ['seo_description', 'Default meta description', 'textarea'],
      ['footer_disclaimer', 'Footer disclaimer', 'textarea'],
      ['partner_program_text', 'Partner Program page text', 'textarea'],
    ],
  },
];

function useRawSettings() {
  return useApi<Record<string, string>>('/api/settings');
}

async function saveSettings(settings: Record<string, string>) {
  await api('/api/settings', { method: 'PUT', auth: true, body: { settings } });
}

export function SettingsPage() {
  const raw = useRawSettings();
  const { reload } = useSettings();
  const { me, refreshMe } = useOutletContext<AdminCtx>();
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [newAdmin, setNewAdmin] = useState('');

  useEffect(() => {
    if (raw.data) setV(raw.data);
  }, [raw.data]);

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const payload: Record<string, string> = {};
      for (const g of GROUPS) for (const [k] of g.fields) payload[k] = v[k] ?? '';
      await saveSettings(payload);
      reload();
      setMsg('Settings saved.');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const adminAction = async (action: string, email: string) => {
    try {
      await api('/api/admin', { method: 'POST', auth: true, body: { action, email } });
      setNewAdmin('');
      refreshMe();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (raw.loading) return <Loader2 className="mx-auto mt-20 h-5 w-5 animate-spin text-navy" />;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <p className="text-xs font-semibold text-muted">Configuration</p>
      <h1 className="font-display text-4xl text-navy">Site settings</h1>
      <p className="mt-2 text-sm text-muted">Blank fields display “Coming Soon” on the website.</p>

      <div className="mt-8 space-y-6">
        {GROUPS.map((g) => (
          <section key={g.title} className="rounded-2xl border border-line bg-white p-5 md:p-6">
            <h2 className="mb-5 font-semibold text-navy">{g.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map(([k, label, type, ph]) => (
                <div key={k} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="label">{label}</label>
                  {type === 'textarea' ? (
                    <textarea className="input" rows={3} value={v[k] || ''} placeholder={ph} onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))} />
                  ) : (
                    <input className="input" value={v[k] || ''} placeholder={ph} onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
          <h2 className="font-semibold text-navy">Admin access</h2>
          <p className="mt-1 text-xs text-muted">These emails can sign in to the admin panel (email/password or Google).</p>
          <ul className="mt-4 divide-y divide-line">
            {(me.admins || []).map((e: string) => (
              <li key={e} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-navy">{e}</span>
                {(me.locked || []).includes(e) ? (
                  <span className="text-[10px] font-bold tracking-wider text-muted uppercase">Pre-configured</span>
                ) : (
                  <button onClick={() => confirm(`Remove ${e}?`) && adminAction('remove_admin', e)} className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="input !h-10" type="email" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} placeholder="new-admin@example.com" />
            <button onClick={() => newAdmin && adminAction('add_admin', newAdmin)} className="btn btn-outline btn-sm !h-10">
              <UserPlus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <span className="text-sm text-muted">{msg}</span>
          <button onClick={save} disabled={busy} className="btn btn-primary btn-sm">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

export function BrochurePage() {
  const raw = useRawSettings();
  const { reload } = useSettings();
  const ref = useRef<HTMLInputElement>(null);
  const [v, setV] = useState({ brochure_url: '', brochure_title: '', brochure_updated: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (raw.data) setV({ brochure_url: raw.data.brochure_url || '', brochure_title: raw.data.brochure_title || '', brochure_updated: raw.data.brochure_updated || '' });
  }, [raw.data]);

  const persist = async (next: typeof v, note: string) => {
    setBusy(true);
    setMsg('');
    try {
      await saveSettings(next);
      setV(next);
      reload();
      raw.reload();
      setMsg(note);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (f?: File) => {
    if (!f) return;
    if (f.type !== 'application/pdf') return setMsg('Please upload a PDF file.');
    if (f.size > 50 * 1024 * 1024) return setMsg('PDF must be under 50 MB.');
    setBusy(true);
    setMsg('Uploading…');
    try {
      const url = await uploadFile(f, 'brochures');
      await persist({ ...v, brochure_url: url, brochure_updated: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }, 'Brochure uploaded and published.');
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(false);
    }
  };

  if (raw.loading) return <Loader2 className="mx-auto mt-20 h-5 w-5 animate-spin text-navy" />;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold text-muted">Downloads</p>
      <h1 className="font-display text-4xl text-navy">Brochure</h1>
      <section className="mt-8 rounded-2xl border border-line bg-white p-5 md:p-6">
        {v.brochure_url ? (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-navy">A brochure is live on the website.</p>
              <a href={v.brochure_url} target="_blank" rel="noreferrer" className="block truncate text-xs text-navy underline">
                {v.brochure_url}
              </a>
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-mist p-4 text-sm text-muted">No brochure uploaded — the website shows “Brochure Coming Soon” with a request form.</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Upload PDF</label>
            <button onClick={() => ref.current?.click()} disabled={busy} className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line p-8 text-sm text-muted hover:border-navy hover:text-navy">
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
              Click to upload a brochure PDF
            </button>
            <input ref={ref} type="file" accept="application/pdf" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">…or brochure link</label>
            <input className="input" value={v.brochure_url} onChange={(e) => setV({ ...v, brochure_url: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <label className="label">Brochure title</label>
            <input className="input" value={v.brochure_title} onChange={(e) => setV({ ...v, brochure_title: e.target.value })} placeholder="Project Brochure" />
          </div>
          <div>
            <label className="label">Last updated</label>
            <input className="input" value={v.brochure_updated} onChange={(e) => setV({ ...v, brochure_updated: e.target.value })} placeholder="e.g. September 2026" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">{msg}</span>
          <div className="flex gap-2">
            {v.brochure_url && (
              <button onClick={() => confirm('Remove the brochure from the website?') && persist({ ...v, brochure_url: '' }, 'Brochure removed.')} disabled={busy} className="btn btn-sm text-rose-600 hover:bg-rose-50">
                Remove
              </button>
            )}
            <button onClick={() => persist(v, 'Brochure details saved.')} disabled={busy} className="btn btn-primary btn-sm">
              Save
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AccountPage() {
  const { me } = useOutletContext<AdminCtx>();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const save = async () => {
    setMsg(null);
    if (p1.length < 8) return setMsg({ ok: false, t: 'Use at least 8 characters.' });
    if (p1 !== p2) return setMsg({ ok: false, t: 'Passwords do not match.' });
    setBusy(true);
    let error: string | null = null;
    try {
      if (!auth?.currentUser) throw new Error('Not signed in.');
      await updatePassword(auth.currentUser, p1);
    } catch (e) {
      const code = (e as { code?: string }).code || '';
      error = code.includes('requires-recent-login') ? 'For security, log out and log in again before changing your password.' : (e as Error).message;
    }
    setBusy(false);
    if (error) setMsg({ ok: false, t: error });
    else {
      setMsg({ ok: true, t: 'Password updated.' });
      setP1('');
      setP2('');
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-semibold text-muted">Security</p>
      <h1 className="font-display text-4xl text-navy">Account</h1>
      <section className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6">
        <p className="text-sm text-muted">
          Signed in as <span className="font-semibold text-navy">{me.email}</span>
        </p>
        <div>
          <label className="label">New password</label>
          <input type="password" className="input" value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input type="password" className="input" value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" />
        </div>
        {msg && <p className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.t}</p>}
        <button onClick={save} disabled={busy} className="btn btn-primary w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </section>
    </div>
  );
}
