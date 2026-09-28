import { useMemo, useState } from 'react';
import { Download, Loader2, Mail, MessageCircle, Phone, Search, Trash2 } from 'lucide-react';
import { api, useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { telHref, waHref } from '../lib/format';

const STATUSES: [string, string][] = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['follow_up', 'Follow-up'],
  ['closed', 'Closed'],
];

function NoteBox({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [v, setV] = useState(row.notes || '');
  const [busy, setBusy] = useState(false);
  const dirty = v !== (row.notes || '');
  const save = async () => {
    setBusy(true);
    try {
      await api('/api/enquiries', { method: 'PUT', auth: true, body: { id: row.id, notes: v } });
      onSaved();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-3 flex gap-2">
      <input className="input !h-10 text-sm" value={v} onChange={(e) => setV(e.target.value)} placeholder="Internal notes…" />
      {dirty && (
        <button onClick={save} disabled={busy} className="btn btn-primary btn-sm !h-10">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
        </button>
      )}
    </div>
  );
}

export default function Enquiries() {
  const { data, loading, error, reload } = useApi<Row[]>('/api/enquiries', true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const rows = useMemo(
    () =>
      (data || []).filter((r) => {
        if (status && r.status !== status) return false;
        if (!q) return true;
        return [r.name, r.phone, r.email, r.interest, r.item_title, r.message, r.referral_code].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase());
      }),
    [data, q, status]
  );

  const setRowStatus = async (id: number, s: string) => {
    try {
      await api('/api/enquiries', { method: 'PUT', auth: true, body: { id, status: s } });
      reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const remove = async (r: Row) => {
    if (!confirm(`Delete enquiry from ${r.name}?`)) return;
    try {
      await api('/api/enquiries', { method: 'DELETE', auth: true, body: { id: r.id } });
      reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const exportCsv = () => {
    const cols = ['created_at', 'name', 'phone', 'email', 'interest', 'item_title', 'message', 'status', 'notes', 'source_page', 'referral_code'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `iston-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted">Leads</p>
          <h1 className="font-display text-4xl text-navy">Enquiries</h1>
        </div>
        <button onClick={exportCsv} disabled={!rows.length} className="btn btn-outline btn-sm bg-white">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input !pl-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, interest…" />
        </div>
        <select className="input sm:!w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-navy" />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">No enquiries found.</p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className={`rounded-2xl border bg-white p-4 md:p-5 ${r.status === 'new' ? 'border-brass/50' : 'border-line'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{r.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(r.created_at).toLocaleString('en-IN')} · {r.source_page || 'website'}
                    {r.referral_code && <span className="ml-2 rounded bg-mist px-1.5 py-0.5 font-semibold text-navy">ref: {r.referral_code}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="input !h-9 !w-36 !rounded-lg text-xs" value={r.status} onChange={(e) => setRowStatus(r.id, e.target.value)}>
                    {STATUSES.map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => remove(r)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-navy px-2.5 py-1 font-semibold text-white">{r.interest || 'General enquiry'}</span>
                {r.item_title && <span className="rounded-full bg-mist px-2.5 py-1 font-semibold text-navy">{r.item_title}</span>}
              </div>
              {r.message && <p className="mt-3 text-sm whitespace-pre-line text-ink/80">{r.message}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={telHref(r.phone)} className="btn btn-outline btn-sm">
                  <Phone className="h-3.5 w-3.5" /> {r.phone}
                </a>
                <a href={waHref(r.phone.replace(/\D/g, '').length === 10 ? '91' + r.phone.replace(/\D/g, '') : r.phone, `Hello ${r.name}, this is Iston Builder Group regarding your enquiry.`)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                {r.email && (
                  <a href={`mailto:${r.email}`} className="btn btn-outline btn-sm">
                    <Mail className="h-3.5 w-3.5" /> {r.email}
                  </a>
                )}
              </div>
              <NoteBox row={r} onSaved={reload} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}
