import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { KINDS } from '../lib/kinds';
import type { KindKey } from '../lib/kinds';
import { LISTING_STATUS } from '../lib/format';
import { EmptyState, ErrorState, PageHero, SkeletonGrid } from '../components/ui';
import { ListingCard } from '../components/Cards';

export default function Listings({ kind }: { kind: KindKey }) {
  const K = KINDS[kind];
  const [sp, setSp] = useSearchParams();
  const [panel, setPanel] = useState(false);
  const { data, loading, error, reload } = useApi<Row[]>(`/api/content?type=${kind}`);
  const projects = useApi<Row[]>('/api/content?type=projects');
  useSeo(K.plural, K.intro);

  const f = {
    q: sp.get('q') || '',
    project: sp.get('project') || '',
    status: sp.get('status') || '',
    bhk: sp.get('bhk') || '',
    type: sp.get('type') || '',
  };
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };

  const rows = data || [];
  const types = useMemo(() => (K.typeField ? Array.from(new Set(rows.map((r) => r[K.typeField!]).filter(Boolean))) : []), [rows, K.typeField]);

  const list = rows.filter((r) => {
    if (f.q) {
      const hay = [r.title, r.description, r.projects?.name, r.buildings?.name, r.location, r.bhk ? `${r.bhk} bhk` : '', K.typeField ? r[K.typeField] : '', r.plot_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    if (f.project && String(r.project_id) !== f.project) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.bhk) {
      if (f.bhk === '4' ? !(r.bhk >= 4) : String(r.bhk) !== f.bhk) return false;
    }
    if (f.type && K.typeField && r[K.typeField] !== f.type) return false;
    return true;
  });

  const active = [f.project, f.status, f.bhk, f.type].filter(Boolean).length;

  const filters = (
    <>
      <select className="input" value={f.project} onChange={(e) => set('project', e.target.value)} aria-label="Project">
        <option value="">All projects</option>
        {(projects.data || []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {K.hasBhk && (
        <select className="input" value={f.bhk} onChange={(e) => set('bhk', e.target.value)} aria-label="BHK">
          <option value="">Any BHK</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4+ BHK</option>
        </select>
      )}
      {K.typeField && (
        <select className="input" value={f.type} onChange={(e) => set('type', e.target.value)} aria-label={K.typeLabel}>
          <option value="">Any {K.typeLabel.toLowerCase()}</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      )}
      <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status">
        <option value="">Any status</option>
        {Object.entries(LISTING_STATUS).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <>
      <PageHero eyebrow={K.eyebrow} title={K.plural} text={K.intro} crumbs={[[K.plural]]} />
      <div className="sticky top-16 z-30 border-b border-line bg-white/95 backdrop-blur lg:top-20">
        <div className="container-x py-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input !pl-11" placeholder={`Search ${K.plural.toLowerCase()}…`} value={f.q} onChange={(e) => set('q', e.target.value)} aria-label="Search" />
            </div>
            <button onClick={() => setPanel((p) => !p)} className="btn btn-outline relative !h-12 lg:hidden" aria-expanded={panel}>
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {active > 0 && <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-[10px] text-white">{active}</span>}
            </button>
            <div className="hidden flex-[2] gap-2 lg:flex">{filters}</div>
          </div>
          {panel && <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">{filters}</div>}
        </div>
      </div>
      <section className="container-x py-10 md:py-14">
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <span className="font-bold text-navy">{list.length}</span> {list.length === 1 ? 'result' : 'results'}
            </p>
            {(active > 0 || f.q) && (
              <button onClick={() => setSp({}, { replace: true })} className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        )}
        {loading ? (
          <SkeletonGrid n={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState title={`${K.plural} — Coming Soon`} text="Listings will appear here as they are released." />
        ) : list.length === 0 ? (
          <EmptyState title="No matches" text="Try adjusting your search or filters." action={<button onClick={() => setSp({}, { replace: true })} className="btn btn-outline btn-sm">Clear filters</button>} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <ListingCard key={r.id} kind={kind} r={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
