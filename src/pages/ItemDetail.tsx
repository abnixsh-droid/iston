import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Download, MessageCircle, Phone, Share2 } from 'lucide-react';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { KINDS } from '../lib/kinds';
import type { KindKey } from '../lib/kinds';
import { arr, has, price, telHref, waHref } from '../lib/format';
import { useSettings } from '../contexts/SettingsContext';
import { useEnquiry } from '../contexts/EnquiryContext';
import { DemoBadge, EmptyState, ErrorState, Fact, Gallery, PageLoader, SectionHead, Soon, StatusPill } from '../components/ui';
import { ListingCard } from '../components/Cards';

export default function ItemDetail({ kind }: { kind: KindKey }) {
  const K = KINDS[kind];
  const { slug = '' } = useParams();
  const { s } = useSettings();
  const { open } = useEnquiry();
  const { data: r, loading, error, status, reload } = useApi<Row>(`/api/content?type=${kind}&slug=${encodeURIComponent(slug)}`);
  const related = useApi<Row[]>(r?.project_id ? `/api/content?type=${kind}&project_id=${r.project_id}` : null);
  useSeo(r?.title || K.label, r ? `${r.title}${r.projects?.name ? ` at ${r.projects.name}` : ''} — ${K.label} by Iston Builder Group.` : K.intro, r?.cover_image);

  if (loading) return <PageLoader />;
  if (status === 404)
    return (
      <div className="container-x py-20">
        <EmptyState title={`${K.label} not found`} action={<Link to={K.base} className="btn btn-primary">Browse {K.plural}</Link>} />
      </div>
    );
  if (error || !r) return <div className="container-x py-20"><ErrorState message={error} onRetry={reload} /></div>;

  const images = [r.cover_image || K.fallbackImg, ...arr(r.gallery)].filter(Boolean) as string[];
  const amenities = arr(r.amenities);
  const others = (related.data || []).filter((x) => x.id !== r.id).slice(0, 3);
  const wa = waHref(s.whatsapp, `Hello Iston Builder Group, I'm interested in "${r.title}"${r.projects?.name ? ` (${r.projects.name})` : ''}. ${window.location.href}`);
  const enquire = () => open({ interest: 'Specific listing', item_type: kind, item_id: r.id, item_title: r.title });
  const share = async () => {
    const data = { title: r.title, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div className="container-x py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link to={K.base} className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" /> {K.plural}
        </Link>
        <button onClick={share} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Gallery images={images} alt={r.title} />
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <StatusPill status={r.status} />
            <DemoBadge show={r.is_demo} />
          </div>
          {r.projects && (
            <Link to={`/projects/${r.projects.slug}`} className="mt-4 block text-[11px] font-bold tracking-[0.18em] text-brass uppercase">
              {r.projects.name}
            </Link>
          )}
          <h1 className="font-display mt-2 text-4xl leading-[1.02] text-navy md:text-6xl">{r.title}</h1>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
            {K.facts(r).map(([l, v]) => (
              <Fact key={l} label={l} value={v} />
            ))}
            <Fact label="Price" value={price(r.price)} />
          </dl>

          <div className="mt-10">
            <h2 className="font-display text-3xl text-navy">Description</h2>
            <p className="mt-4 text-[15px] leading-[1.85] whitespace-pre-line text-ink/80">{has(r.description) ? r.description : <Soon>Detailed description coming soon.</Soon>}</p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-3xl text-navy">Amenities & features</h2>
            {amenities.length ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {amenities.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-sm text-ink/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brass" /> {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm"><Soon>Details coming soon.</Soon></p>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-28 rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(11,29,63,0.4)]">
            <p className="text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Price</p>
            <p className="font-display mt-1 text-4xl text-navy">{price(r.price)}</p>
            <p className="mt-2 text-xs text-muted">Final pricing, taxes and charges are confirmed by our sales team.</p>
            <div className="mt-6 grid gap-2">
              <button onClick={enquire} className="btn btn-primary">Enquire Now</button>
              <div className="grid grid-cols-2 gap-2">
                <a href={telHref(s.phone)} className="btn btn-outline"><Phone className="h-4 w-4" /> Call</a>
                <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              </div>
              <Link to="/brochure" className="btn btn-outline"><Download className="h-4 w-4" /> Download Brochure</Link>
            </div>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-20 border-t border-line pt-14">
          <SectionHead title={`More in ${r.projects?.name || 'this project'}`} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((x) => (
              <ListingCard key={x.id} kind={kind} r={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
