import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { arr, has } from '../lib/format';
import { useEnquiry } from '../contexts/EnquiryContext';
import { DemoBadge, EmptyState, ErrorState, Fact, Gallery, PageHero, PageLoader, SectionHead, SkeletonGrid, Soon, StatusPill } from '../components/ui';
import { BuildingCard, ListingCard } from '../components/Cards';

export function Buildings() {
  const { data, loading, error, reload } = useApi<Row[]>('/api/content?type=buildings');
  useSeo('Buildings', 'Buildings and towers across Iston Builder Group projects.');
  return (
    <>
      <PageHero eyebrow="Architecture" title="Buildings" text="Towers and wings across our projects. Select a building to see its residences." crumbs={[['Buildings']]} />
      <section className="container-x py-12 md:py-16">
        {loading ? (
          <SkeletonGrid n={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (data || []).length === 0 ? (
          <EmptyState title="Buildings — Coming Soon" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((b) => (
              <BuildingCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function BuildingDetail() {
  const { slug = '' } = useParams();
  const { open } = useEnquiry();
  const { data: b, loading, error, status, reload } = useApi<Row>(`/api/content?type=buildings&slug=${encodeURIComponent(slug)}`);
  const units = useApi<Row[]>(b?.id ? `/api/content?type=properties&building_id=${b.id}` : null);
  useSeo(b?.name || 'Building', b ? `${b.name}${b.projects?.name ? ` at ${b.projects.name}` : ''} — Iston Builder Group.` : undefined, b?.cover_image);

  if (loading) return <PageLoader />;
  if (status === 404) return <EmptyState title="Building not found" action={<Link to="/buildings" className="btn btn-primary">All buildings</Link>} />;
  if (error || !b) return <div className="container-x py-20"><ErrorState message={error} onRetry={reload} /></div>;
  const amenities = arr(b.amenities);

  return (
    <div className="container-x py-10 md:py-14">
      <Link to="/buildings" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-navy">
        <ArrowLeft className="h-3.5 w-3.5" /> All buildings
      </Link>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Gallery images={[b.cover_image, ...arr(b.gallery)].filter(Boolean) as string[]} alt={b.name} />
        </div>
        <div className="lg:col-span-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill status={b.status} />
            <DemoBadge show={b.is_demo} />
          </div>
          {b.projects && (
            <Link to={`/projects/${b.projects.slug}`} className="mt-4 block text-[11px] font-bold tracking-[0.18em] text-brass uppercase">
              {b.projects.name}
            </Link>
          )}
          <h1 className="font-display mt-2 text-5xl leading-none text-navy">{b.name}</h1>
          <p className="mt-5 text-[15px] leading-relaxed whitespace-pre-line text-muted">{has(b.description) ? b.description : 'Building details coming soon.'}</p>
          <dl className="mt-8 grid grid-cols-2 gap-5">
            <Fact label="Floors" value={b.floors} />
            <Fact label="Units" value={b.units} />
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {amenities.length ? amenities.map((a) => <span key={a} className="rounded-full border border-line px-3 py-1.5 text-xs text-navy">{a}</span>) : <Soon>Amenities coming soon</Soon>}
          </div>
          <button onClick={() => open({ interest: 'Specific listing', item_type: 'building', item_id: b.id, item_title: b.name })} className="btn btn-primary mt-8 w-full sm:w-auto">
            Enquire about {b.name}
          </button>
        </div>
      </div>
      <section className="mt-16 border-t border-line pt-14">
        <SectionHead title="Residences in this building" />
        {units.loading ? (
          <SkeletonGrid />
        ) : (units.data || []).length === 0 ? (
          <EmptyState title="Residences coming soon" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(units.data || []).map((r) => (
              <ListingCard key={r.id} kind="properties" r={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
