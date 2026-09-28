import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Inbox, Loader2, Trash2 } from 'lucide-react';
import { api, useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { fmtDate } from '../lib/format';
import type { AdminCtx } from './AdminLayout';
import { ENTITIES } from './entities';

export default function Dashboard() {
  const { me, refreshMe } = useOutletContext<AdminCtx>();
  const enquiries = useApi<Row[]>('/api/enquiries', true);
  const [purging, setPurging] = useState(false);
  const [msg, setMsg] = useState('');
  const stats = me.stats || {};
  const demo = me.demo || {};
  const demoTotal = Object.values(demo).reduce((a: number, b) => a + (Number(b) || 0), 0);

  const purge = async () => {
    if (!confirm('Delete ALL rows marked as demo content? Your real content will not be touched. This cannot be undone.')) return;
    setPurging(true);
    setMsg('');
    try {
      await api('/api/admin', { method: 'POST', auth: true, body: { action: 'purge_demo' } });
      setMsg('All demo content has been removed.');
      refreshMe();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold text-muted">Welcome back</p>
      <h1 className="font-display text-4xl text-navy">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link to="/admin/enquiries" className="col-span-2 rounded-2xl bg-navy p-5 text-white md:col-span-1">
          <Inbox className="h-5 w-5 text-brass-light" />
          <p className="mt-4 font-display text-4xl">{stats.new_enquiries ?? 0}</p>
          <p className="text-xs text-white/60">New enquiries · {stats.enquiries ?? 0} total</p>
        </Link>
        {Object.values(ENTITIES).map((e) => (
          <Link key={e.key} to={`/admin/${e.key}`} className="rounded-2xl border border-line bg-white p-5 transition hover:border-navy">
            <p className="font-display text-4xl text-navy">{stats[e.table] ?? 0}</p>
            <p className="text-xs font-semibold text-muted">{e.label}</p>
            {demo[e.table] > 0 && <p className="mt-1 text-[10px] font-bold text-amber-700 uppercase">{demo[e.table]} demo</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Latest enquiries</h2>
            <Link to="/admin/enquiries" className="flex items-center gap-1 text-xs font-semibold text-navy">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {enquiries.loading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-navy" />
          ) : enquiries.error ? (
            <p className="text-sm text-rose-600">{enquiries.error}</p>
          ) : (enquiries.data || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No enquiries yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(enquiries.data || []).slice(0, 6).map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{q.name}</p>
                    <p className="truncate text-xs text-muted">{q.item_title || q.interest || 'General'} · {q.phone}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${q.status === 'new' ? 'bg-brass text-white' : 'bg-mist text-muted'}`}>{q.status}</span>
                    <p className="mt-1 text-[11px] text-muted">{fmtDate(q.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="mt-3 font-semibold text-navy">Demo content</h2>
          <p className="mt-1 text-sm text-muted">
            {demoTotal > 0
              ? `${demoTotal} items are sample data marked with a “Demo” badge on the website. Replace or remove them before launch.`
              : 'No demo content remains. Your website shows only real content.'}
          </p>
          {demoTotal > 0 && (
            <button onClick={purge} disabled={purging} className="btn btn-sm mt-4 border border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
              {purging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove all demo content
            </button>
          )}
          {msg && <p className="mt-3 text-xs font-semibold text-navy">{msg}</p>}
        </section>
      </div>
    </div>
  );
}
