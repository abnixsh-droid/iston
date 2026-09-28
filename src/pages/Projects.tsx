import { useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { EmptyState, ErrorState, PageHero, SkeletonGrid } from '../components/ui';
import { ProjectCard } from '../components/Cards';

const TABS: [string, string][] = [
  ['all', 'All'],
  ['current', 'Current'],
  ['upcoming', 'Upcoming'],
  ['under_development', 'Under Development'],
  ['completed', 'Completed'],
];

export default function Projects() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('status') || 'all';
  const { data, loading, error, reload } = useApi<Row[]>('/api/content?type=projects');
  const label = TABS.find(([k]) => k === tab)?.[1] || 'All';
  useSeo(`${tab === 'all' ? '' : label + ' '}Projects`, 'Current, upcoming, under-development and completed projects by Iston Builder Group.');

  const rows = data || [];
  const list = tab === 'all' ? rows : rows.filter((p) => p.status === tab);
  const count = (k: string) => (k === 'all' ? rows.length : rows.filter((p) => p.status === k).length);

  return (
    <>
      <PageHero eyebrow="Portfolio" title="Projects" text="Explore Iston Builder Group’s current, upcoming, under-development and completed projects." crumbs={[['Projects']]} />
      <div className="sticky top-16 z-30 border-b border-line bg-white/95 backdrop-blur lg:top-20">
        <div className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3" role="tablist">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setSp(k === 'all' ? {} : { status: k }, { replace: true })}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${tab === k ? 'bg-navy text-white' : 'bg-mist text-navy hover:bg-line'}`}
            >
              {l} {!loading && <span className="ml-1 opacity-60">{count(k)}</span>}
            </button>
          ))}
        </div>
      </div>
      <section className="container-x py-12 md:py-16">
        {loading ? (
          <SkeletonGrid n={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState title={`${label} projects — Coming Soon`} text="Projects in this category will be listed here once announced." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
