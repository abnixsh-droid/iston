import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { fmtDate, show } from '../lib/format';
import { DemoBadge, EmptyState, ErrorState, Img, PageHero, PageLoader, StatusPill } from '../components/ui';

export default function Progress() {
  const projects = useApi<Row[]>('/api/content?type=projects');
  const updates = useApi<Row[]>('/api/content?type=progress_updates');
  useSeo('Under Development — Construction Progress', 'Construction progress and milestones for Iston Builder Group projects under development.');

  const loading = projects.loading || updates.loading;
  const error = projects.error || updates.error;
  const active = (projects.data || []).filter((p) => p.status === 'under_development' || p.status === 'current');
  const byProject = (id: number) => (updates.data || []).filter((u) => u.project_id === id);

  return (
    <>
      <PageHero eyebrow="On Site" title="Under development" text="Construction milestones and progress updates from our active sites." crumbs={[['Progress']]} />
      <section className="container-x space-y-16 py-12 md:py-16">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={() => (projects.reload(), updates.reload())} />
        ) : active.length === 0 ? (
          <EmptyState title="Progress updates coming soon" />
        ) : (
          active.map((p) => {
            const list = byProject(p.id);
            return (
              <article key={p.id} className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <div className="sticky top-28">
                    <Img src={p.cover_image} alt={p.name} className="aspect-[4/3] w-full rounded-[1.5rem]" />
                    <div className="mt-5 flex flex-wrap gap-2">
                      <StatusPill status={p.status} />
                      <DemoBadge show={p.is_demo} />
                    </div>
                    <h2 className="font-display mt-3 text-4xl text-navy">{p.name}</h2>
                    <div className="mt-4">
                      {typeof p.progress_percent === 'number' ? (
                        <>
                          <div className="flex justify-between text-xs font-semibold text-muted">
                            <span>Overall progress</span>
                            <span className="text-navy">{p.progress_percent}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                            <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, p.progress_percent)}%` }} />
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted italic">Overall progress update coming soon.</p>
                      )}
                    </div>
                    <Link to={`/projects/${p.slug}`} className="btn btn-outline btn-sm mt-5">
                      View project <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  {list.length === 0 ? (
                    <EmptyState title="Milestones coming soon" text={`Progress updates for ${p.name} will be posted here.`} />
                  ) : (
                    <ol className="relative space-y-6 border-l border-line pl-6 md:pl-8">
                      {list.map((u) => (
                        <li key={u.id} className="relative">
                          <span className="absolute top-6 -left-[1.95rem] h-3 w-3 rounded-full bg-navy ring-4 ring-white md:-left-[2.45rem]" />
                          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-line p-4 sm:flex-row md:p-5">
                            {u.image && <Img src={u.image} alt={u.title} className="aspect-video w-full shrink-0 rounded-2xl sm:aspect-square sm:w-36" />}
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                                <span className="font-semibold">{fmtDate(u.update_date) || 'Date coming soon'}</span>
                                {u.stage && <span className="rounded-full bg-mist px-2 py-0.5 font-semibold text-navy">{u.stage}</span>}
                                <DemoBadge show={u.is_demo} />
                              </div>
                              <h3 className="mt-2 font-display text-2xl text-navy">{u.title}</h3>
                              <p className="mt-1 text-sm text-muted">{show(u.description, '')}</p>
                              {typeof u.progress_percent === 'number' && (
                                <div className="mt-3 flex items-center gap-3">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                                    <div className="h-full rounded-full bg-brass" style={{ width: `${Math.min(100, u.progress_percent)}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-navy">{u.progress_percent}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
