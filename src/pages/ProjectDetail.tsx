import BrochureButton from '../components/BrochureButton';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { arr, fmtDate, has, show, telHref, waHref } from '../lib/format';
import { useSettings } from '../contexts/SettingsContext';
import { useEnquiry } from '../contexts/EnquiryContext';
import { DemoBadge, EmptyState, ErrorState, Fact, Gallery, Img, PageLoader, SectionHead, Soon, StatusPill } from '../components/ui';
import { BuildingCard, ListingCard } from '../components/Cards';

export default function ProjectDetail() {
  const { slug = '' } = useParams();
  const { s } = useSettings();
  const { open } = useEnquiry();
  const { data: p, loading, error, status, reload } = useApi<Row>(`/api/content?type=projects&slug=${encodeURIComponent(slug)}`);
  const pid = p?.id;
  const buildings = useApi<Row[]>(pid ? `/api/content?type=buildings&project_id=${pid}` : null);
  const props = useApi<Row[]>(pid ? `/api/content?type=properties&project_id=${pid}` : null);
  const plots = useApi<Row[]>(pid ? `/api/content?type=plots&project_id=${pid}` : null);
  const houses = useApi<Row[]>(pid ? `/api/content?type=society_houses&project_id=${pid}` : null);
  const updates = useApi<Row[]>(pid ? `/api/content?type=progress_updates&project_id=${pid}` : null);
  useSeo(p?.name || 'Project', p ? `${p.name} by Iston Builder Group. ${p.tagline || ''}` : undefined, p?.cover_image);

  if (loading) return <PageLoader />;
  if (status === 404) return <EmptyState title="Project not found" action={<Link to="/projects" className="btn btn-primary">All projects</Link>} />;
  if (error || !p) return <div className="container-x py-20"><ErrorState message={error} onRetry={reload} /></div>;

  const images = [p.cover_image, ...arr(p.gallery)].filter(Boolean) as string[];
  const highlights = arr(p.highlights);
  const amenities = arr(p.amenities);
  const enquire = () => open({ interest: `${p.name} project`, item_type: 'project', item_id: p.id, item_title: p.name });
  const wa = waHref(s.whatsapp, `Hello Iston Builder Group, I'm interested in ${p.name}.`);

  const block = (title: string, rows: Row[] | null, render: (r: Row) => ReactNode) =>
    rows && rows.length > 0 ? (
      <section className="border-t border-line py-14">
        <SectionHead title={title} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map(render)}</div>
      </section>
    ) : null;

  return (
    <>
      <section className="relative min-h-[70svh] overflow-hidden bg-navy-deep text-white">
        <Img src={p.cover_image} alt={p.name} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-deep via-navy-deep/50 to-navy-deep/10" />
        <div className="container-x relative flex min-h-[70svh] flex-col justify-end pt-24 pb-12">
          <Link to="/projects" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={p.status} />
            <DemoBadge show={p.is_demo} />
          </div>
          <h1 className="font-display mt-4 text-6xl leading-[0.95] md:text-8xl">{p.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-white/75">
            <MapPin className="h-4 w-4" /> {show(p.location, 'Location coming soon')}
          </p>
          {has(p.tagline) && <p className="mt-3 max-w-2xl text-lg text-white/80">{p.tagline}</p>}
        </div>
      </section>

      <div className="container-x">
        <section className="grid gap-10 py-14 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-4">Overview</p>
            <p className="text-[15px] leading-[1.85] whitespace-pre-line text-ink/80">
              {has(p.description) ? p.description : 'Detailed project information will be published here soon.'}
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
              <Fact label="Status" value={p.status ? p.status.replace('_', ' ') : null} />
              <Fact label="Location" value={p.location} />
              <Fact label="Configurations" value={p.configurations} />
              <Fact label="Total Area" value={p.total_area} />
              <Fact label="Possession" value={p.possession} />
              <Fact label="RERA No." value={p.rera_number} />
            </dl>

            {highlights.length > 0 && (
              <div className="mt-12">
                <h3 className="font-display text-3xl text-navy">Highlights</h3>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-sm text-ink/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brass" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-12">
              <h3 className="font-display text-3xl text-navy">Amenities</h3>
              {amenities.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span key={a} className="rounded-full border border-line px-4 py-2 text-sm text-navy">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm">
                  <Soon>Amenity details coming soon.</Soon>
                </p>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-12">
                <h3 className="mb-5 font-display text-3xl text-navy">Gallery</h3>
                <Gallery images={images} alt={p.name} />
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-4 rounded-[1.75rem] border border-line p-6">
              <p className="text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Construction progress</p>
              {typeof p.progress_percent === 'number' ? (
                <div>
                  <p className="font-display text-5xl text-navy">{p.progress_percent}%</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, p.progress_percent)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="font-display text-2xl text-navy">Update coming soon</p>
              )}
              <div className="grid gap-2 pt-2">
                <button onClick={enquire} className="btn btn-primary">Enquire Now</button>
                <div className="grid grid-cols-2 gap-2">
                  <a href={telHref(s.phone)} className="btn btn-outline"><Phone className="h-4 w-4" /> Call</a>
                  <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                </div>
                <BrochureButton className="btn btn-outline">Brochure</BrochureButton>
              </div>
            </div>
          </aside>
        </section>

        {block('Buildings', buildings.data, (b) => <BuildingCard key={b.id} b={b} />)}
        {block('Flats & residences', props.data, (r) => <ListingCard key={r.id} kind="properties" r={r} />)}
        {block('Plots', plots.data, (r) => <ListingCard key={r.id} kind="plots" r={r} />)}
        {block('Society houses', houses.data, (r) => <ListingCard key={r.id} kind="society_houses" r={r} />)}

        {(updates.data || []).length > 0 && (
          <section className="border-t border-line py-14">
            <SectionHead title="Progress timeline" />
            <ol className="relative space-y-8 border-l border-line pl-6">
              {(updates.data || []).map((u) => (
                <li key={u.id} className="relative">
                  <span className="absolute top-1.5 -left-[1.95rem] h-3 w-3 rounded-full border-2 border-white bg-navy ring-1 ring-navy" />
                  <p className="text-xs font-semibold text-muted">{fmtDate(u.update_date) || 'Date coming soon'} <DemoBadge show={u.is_demo} className="ml-2" /></p>
                  <p className="mt-1 font-display text-2xl text-navy">{u.title}</p>
                  {u.description && <p className="mt-1 max-w-2xl text-sm text-muted">{u.description}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}
