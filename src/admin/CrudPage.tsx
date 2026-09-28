import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, ImagePlus, Loader2, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { api, uploadFile, useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { arr } from '../lib/format';
import { ENTITIES } from './entities';
import type { Field } from './entities';
import { DemoBadge, Img, StatusPill } from '../components/ui';

function ImageField({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErr('Please choose an image file.');
    if (f.size > 10 * 1024 * 1024) return setErr('Image must be under 10 MB.');
    setBusy(true);
    setErr('');
    try {
      onChange(await uploadFile(f, folder));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex gap-3">
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">{value ? <Img src={value} alt="" className="h-full w-full" /> : null}</div>
      <div className="flex-1 space-y-2">
        <input className="input !h-10 text-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL or upload" />
        <div className="flex gap-2">
          <button type="button" onClick={() => ref.current?.click()} className="btn btn-outline btn-sm" disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Upload
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="btn btn-sm text-rose-600 hover:bg-rose-50">
              Remove
            </button>
          )}
        </div>
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  );
}

function GalleryField({ value, onChange, folder }: { value: string[]; onChange: (v: string[]) => void; folder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [url, setUrl] = useState('');
  const list = value || [];
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr('');
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;
        urls.push(await uploadFile(f, folder));
      }
      onChange([...list, ...urls]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map((src, i) => (
          <div key={src + i} className="relative h-20 w-24 overflow-hidden rounded-xl border border-line">
            <Img src={src} alt="" className="h-full w-full" />
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-rose-600" aria-label="Remove image">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="grid h-20 w-24 place-items-center rounded-xl border border-dashed border-line text-muted hover:border-navy hover:text-navy">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <input className="input !h-10 text-sm" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" />
        <button type="button" className="btn btn-outline btn-sm !h-10" onClick={() => url.trim() && (onChange([...list, url.trim()]), setUrl(''))}>
          Add
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

function CrudInner() {
  const { entity = '' } = useParams();
  const cfg = ENTITIES[entity];
  const list = useApi<Row[]>(cfg ? `/api/content?type=${cfg.table}&all=1` : null);
  const projects = useApi<Row[]>('/api/content?type=projects');
  const buildings = useApi<Row[]>('/api/content?type=buildings');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Row | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const rows = useMemo(() => {
    const all = list.data || [];
    if (!q || !cfg) return all;
    const s = q.toLowerCase();
    return all.filter((r) => [r[cfg.titleField], r.slug, r.projects?.name, r.location, r.status].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [list.data, q, cfg]);

  if (!cfg) return <p className="text-muted">Unknown section.</p>;

  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(''), 2500);
  };
  const set = (k: string, v: unknown) => {
    setForm((f) => ({ ...(f || {}), [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const save = async () => {
    if (!form) return;
    const e: Record<string, string> = {};
    for (const f of cfg.fields) if (f.required && (form[f.name] === undefined || form[f.name] === null || String(form[f.name]).trim() === '')) e[f.name] = `${f.label} is required.`;
    for (const f of cfg.fields)
      if (f.name.includes('percent') && form[f.name] !== null && form[f.name] !== undefined && form[f.name] !== '') {
        const n = Number(form[f.name]);
        if (!(n >= 0 && n <= 100)) e[f.name] = 'Enter a value between 0 and 100.';
      }
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setErr('');
    try {
      const body: Row = { ...form };
      delete body.projects;
      delete body.buildings;
      await api(`/api/content?type=${cfg.table}`, { method: form.id ? 'PUT' : 'POST', body, auth: true });
      setForm(null);
      list.reload();
      if (cfg.table === 'projects') projects.reload();
      if (cfg.table === 'buildings') buildings.reload();
      flash(`${cfg.singular} saved`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete “${r[cfg.titleField]}”? This cannot be undone.`)) return;
    try {
      await api(`/api/content?type=${cfg.table}`, { method: 'DELETE', body: { id: r.id }, auth: true });
      list.reload();
      flash(`${cfg.singular} deleted`);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const input = (f: Field) => {
    const v = form?.[f.name];
    const cls = `input ${errors[f.name] ? 'invalid' : ''}`;
    switch (f.type) {
      case 'textarea':
        return <textarea className={cls} rows={4} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />;
      case 'number':
        return <input type="number" className={cls} value={v ?? ''} onChange={(e) => set(f.name, e.target.value === '' ? null : e.target.value)} placeholder={f.placeholder} />;
      case 'date':
        return <input type="date" className={cls} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} />;
      case 'select':
        return (
          <select className={cls} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">— Select —</option>
            {f.options!.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        );
      case 'ref': {
        let opts = (f.ref === 'projects' ? projects.data : buildings.data) || [];
        if (f.ref === 'buildings' && form?.project_id) opts = opts.filter((b) => String(b.project_id) === String(form.project_id));
        return (
          <select className={cls} value={v ?? ''} onChange={(e) => set(f.name, e.target.value ? Number(e.target.value) : null)}>
            <option value="">— None —</option>
            {opts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        );
      }
      case 'bool':
        return (
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[#0b1d3f]" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />
            <span className="text-sm font-medium text-navy">{f.label}</span>
          </label>
        );
      case 'image':
        return <ImageField value={v || ''} onChange={(x) => set(f.name, x)} folder={cfg.table} />;
      case 'gallery':
        return <GalleryField value={arr(v)} onChange={(x) => set(f.name, x)} folder={cfg.table} />;
      case 'list':
        return <textarea className={cls} rows={4} value={arr(v).join('\n')} onChange={(e) => set(f.name, e.target.value.split('\n'))} placeholder="One item per line" />;
      default:
        return <input className={cls} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted">Content</p>
          <h1 className="font-display text-4xl text-navy">{cfg.label}</h1>
        </div>
        <button onClick={() => (setForm({ ...cfg.defaults }), setErrors({}), setErr(''))} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add {cfg.singular}
        </button>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input !pl-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}…`} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {list.loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-navy" />
          </div>
        ) : list.error ? (
          <p className="p-6 text-sm text-rose-600">{list.error}</p>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No {cfg.label.toLowerCase()} yet. Click “Add {cfg.singular}” to create one.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 md:gap-4 md:p-4">
                <Img src={r.cover_image || r.image} alt="" className="h-14 w-16 shrink-0 rounded-xl md:w-20" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-semibold text-navy">{r[cfg.titleField]}</p>
                    <DemoBadge show={r.is_demo} />
                    {r.is_featured && <Star className="h-3.5 w-3.5 fill-brass text-brass" />}
                  </div>
                  <p className="truncate text-xs text-muted">{cfg.subtitle(r)}</p>
                </div>
                {r.status && <StatusPill status={r.status} className="hidden md:inline-flex" />}
                <div className="flex shrink-0 gap-1">
                  {cfg.publicBase && r.slug && (
                    <Link to={`${cfg.publicBase}/${r.slug}`} target="_blank" className="rounded-lg p-2 text-muted hover:bg-mist hover:text-navy" aria-label="View on site">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button onClick={() => (setForm({ ...r }), setErrors({}), setErr(''))} className="rounded-lg p-2 text-muted hover:bg-mist hover:text-navy" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(r)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy-deep/50" onClick={() => !saving && setForm(null)}>
          <div className="flex h-full w-full max-w-2xl flex-col bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-2xl text-navy">
                {form.id ? 'Edit' : 'New'} {cfg.singular.toLowerCase()}
              </h2>
              <button onClick={() => setForm(null)} className="rounded-lg p-2 hover:bg-mist" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {cfg.fields.map((f) => (
                  <div key={f.name} className={f.full || f.type === 'bool' ? 'sm:col-span-2' : ''}>
                    {f.type !== 'bool' && (
                      <label className="label">
                        {f.label}
                        {f.required && ' *'}
                      </label>
                    )}
                    {input(f)}
                    {f.help && <p className="mt-1 text-[11px] text-muted">{f.help}</p>}
                    {errors[f.name] && <p className="mt-1 text-xs font-medium text-rose-600">{errors[f.name]}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
              {err ? <p className="text-xs text-rose-600">{err}</p> : <span className="text-xs text-muted">Leave details blank to show “Coming Soon” on the site.</span>}
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setForm(null)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

export default function CrudPage() {
  const { entity = '' } = useParams();
  return <CrudInner key={entity} />;
}
