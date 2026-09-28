import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Download, Handshake, MapPin, Search } from 'lucide-react';
import { useApi } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { useSettings } from '../contexts/SettingsContext';
import { useEnquiry } from '../contexts/EnquiryContext';
import { has, show, statusLabel } from '../lib/format';
import { KINDS } from '../lib/kinds';
import type { KindKey } from '../lib/kinds';
import { DemoBadge, EmptyState, ErrorState, Img, SectionHead, SkeletonGrid, Soon } from '../components/ui';
import { ListingCard, ProjectCard } from '../components/Cards';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease: EASE },
};

const TILES: [string, string, string, string][] = [
  ['/projects', 'Projects', 'Current, upcoming & completed', '/images/umroli-hero.jpg'],
  ['/buildings', 'Buildings', 'Towers & wings', '/images/building.jpg'],
  ['/properties', 'Flats', 'Apartments & residences', '/images/interior.jpg'],
  ['/plots', 'Plots', 'Land parcels', '/images/plot.jpg'],
  ['/society-houses', 'Society Houses', 'Community living', '/images/house.jpg'],
  ['/under-development', 'Under Development', 'Construction progress', '/images/construction.jpg'],
];

export default function Home() {
  const { s } = useSettings();
  const { open } = useEnquiry();
  const navigate = useNavigate();
  useSeo('', s.seo_description, '/images/umroli-hero.jpg');

  const projects = useApi<Row[]>('/api/content?type=projects');
  const featured = useApi<Row[]>('/api/content?type=properties&featured=1&limit=6');
  const promos = useApi<Row[]>('/api/content?type=promotions');
  const progress = useApi<Row[]>('/api/content?type=progress_updates&limit=3');

  const plist = projects.data || [];
  const hero = plist.find((p) => p.slug === s.hero_project_slug) || plist.find((p) => p.status === 'current') || null;
  const heroName = hero?.name || 'Umroli';
  const heroImg = hero?.cover_image || '/images/umroli-hero.jpg';
  const heroLink = hero ? `/projects/${hero.slug}` : '/projects';

  const [kind, setKind] = useState<KindKey>('properties');
  const [q, setQ] = useState('');
  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(`${KINDS[kind].base}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-navy-deep text-white">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
          src={heroImg}
          alt={`${heroName} — Iston Builder Group current project (representative image)`}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-linear-to-t from-navy-deep via-navy-deep/65 to-navy-deep/25" />
        <div className="absolute inset-0 bg-linear-to-r from-navy-deep/70 to-transparent" />

        <div className="container-x relative pt-32 pb-8 md:pb-14">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="eyebrow !text-brass-light">
            Current Project · {heroName}
          </motion.p>
          <h1 className="font-display mt-5 max-w-4xl text-[2.9rem] leading-[0.95] font-medium sm:text-6xl lg:text-[5.6rem]">
            <motion.span className="block" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: EASE }}>
              Building Better Spaces.
            </motion.span>
            <motion.em className="block text-brass-light" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE }}>
              Creating Better Futures.
            </motion.em>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.8 }} className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/75 md:text-base">
            {has(s.hero_subtitle) ? s.hero_subtitle : `${s.company_name} — builder & developer. Discover ${heroName}, our current project, along with flats, plots and society houses.`}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-8 flex flex-wrap gap-3">
            <Link to={heroLink} className="btn btn-light">
              Explore {heroName} <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={() => open({ interest: `${heroName} project`, heading: `Enquire about ${heroName}` })} className="btn btn-ghost">
              Enquire Now
            </button>
            <Link to="/brochure" className="btn btn-ghost hidden sm:inline-flex">
              <Download className="h-4 w-4" /> Brochure
            </Link>
          </motion.div>

          <motion.form
            onSubmit={search}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-10 flex flex-col gap-2 rounded-[1.5rem] border border-white/15 bg-white/10 p-2 backdrop-blur-xl sm:flex-row md:mt-14 md:max-w-3xl"
            role="search"
          >
            <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-navy-deep/40 p-1">
              {(Object.keys(KINDS) as KindKey[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${kind === k ? 'bg-white text-navy' : 'text-white/75 hover:text-white'}`}
                >
                  {k === 'properties' ? 'Flats' : KINDS[k].plural}
                </button>
              ))}
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by project, BHK or keyword" aria-label="Search" className="h-12 w-full bg-transparent text-sm text-ink outline-none" />
              <button type="submit" className="btn btn-primary btn-sm shrink-0">
                Search
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* UMROLI SPOTLIGHT */}
      <section className="py-20 md:py-28">
        <div className="container-x grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <motion.div {...reveal} className="relative lg:col-span-7">
            <div className="img-zoom overflow-hidden rounded-[2rem]">
              <Img src={heroImg} alt={heroName} className="aspect-[4/3] w-full" />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-[0_30px_60px_-30px_rgba(11,29,63,0.45)] sm:right-auto sm:min-w-[20rem] md:p-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-brass uppercase">{hero ? statusLabel(hero.status) : 'Current'} Project</p>
                <p className="font-display text-2xl text-navy">{heroName}</p>
              </div>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
          </motion.div>
          <motion.div {...reveal} className="pt-6 lg:col-span-5 lg:pt-0">
            <p className="eyebrow mb-4">The Centrepiece</p>
            <h2 className="font-display text-5xl leading-[0.98] text-navy md:text-6xl">{heroName}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              {has(hero?.description) ? hero!.description : `Detailed information about ${heroName} — configurations, specifications and pricing — will be published here soon.`}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                ['Location', hero?.location],
                ['Configurations', hero?.configurations],
                ['Possession', hero?.possession],
                ['RERA No.', hero?.rera_number],
              ].map(([l, v]) => (
                <div key={l as string} className="border-t border-line pt-3">
                  <dt className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">{l}</dt>
                  <dd className="mt-1 font-semibold text-navy">{has(v) ? String(v) : <Soon />}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={heroLink} className="btn btn-primary">
                View Project <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button onClick={() => open({ interest: `${heroName} project`, item_type: 'project', item_id: hero?.id, item_title: heroName })} className="btn btn-outline">
                Book a Site Visit
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROMOTIONS */}
      {(promos.data || []).length > 0 && (
        <section className="pb-6">
          <div className="container-x no-scrollbar flex snap-x gap-4 overflow-x-auto">
            {(promos.data || []).map((p) => (
              <div key={p.id} className="relative flex min-w-[85%] snap-start overflow-hidden rounded-[1.75rem] bg-navy text-white sm:min-w-[32rem]">
                {p.image && <Img src={p.image} alt={p.title} className="absolute inset-0 h-full w-full opacity-30" />}
                <div className="relative flex w-full flex-col gap-3 p-7 md:p-9">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-brass-light uppercase">Announcement</span>
                    <DemoBadge show={p.is_demo} />
                  </div>
                  <p className="font-display text-3xl leading-tight">{p.title}</p>
                  {p.subtitle && <p className="text-sm text-white/70">{p.subtitle}</p>}
                  {p.cta_link && (
                    <Link to={p.cta_link} className="btn btn-light btn-sm mt-2 self-start">
                      {p.cta_label || 'Learn more'} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PROPERTIES */}
      <section className="bg-mist py-20 md:py-28">
        <div className="container-x">
          <SectionHead
            eyebrow="Featured"
            title={
              <>
                Featured <em>residences</em>
              </>
            }
            text="A curated selection from our current inventory. Availability and pricing are shared on request."
            action={
              <Link to="/properties" className="btn btn-outline bg-white">
                All properties <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {featured.loading ? (
            <SkeletonGrid />
          ) : featured.error ? (
            <ErrorState message={featured.error} onRetry={featured.reload} />
          ) : (featured.data || []).length === 0 ? (
            <EmptyState title="Featured listings coming soon" text="New residences will be showcased here as they are released." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(featured.data || []).map((r, i) => (
                <motion.div key={r.id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
                  <ListingCard kind="properties" r={r} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EXPLORE */}
      <section className="py-20 md:py-28">
        <div className="container-x">
          <SectionHead eyebrow="Explore" title="Everything we build, in one place." />
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {TILES.map(([to, title, sub, img], i) => (
              <motion.div key={to} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>
                <Link to={to} className="group img-zoom relative block overflow-hidden rounded-[1.5rem] md:rounded-[1.75rem]">
                  <Img src={img} alt={title} className="aspect-[4/5] w-full md:aspect-[4/3]" />
                  <div className="absolute inset-0 bg-linear-to-t from-navy-deep/90 via-navy-deep/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white md:p-6">
                    <div>
                      <p className="font-display text-2xl leading-tight md:text-3xl">{title}</p>
                      <p className="mt-0.5 text-[11px] text-white/65 md:text-xs">{sub}</p>
                    </div>
                    <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-navy sm:grid">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="grid-lines bg-navy py-20 text-white md:py-28">
        <div className="container-x">
          <SectionHead
            light
            eyebrow="Portfolio"
            title="Our projects"
            text="Current, upcoming, under-development and completed projects by Iston Builder Group."
            action={
              <Link to="/projects" className="btn btn-light">
                View all projects <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {projects.loading ? (
            <SkeletonGrid />
          ) : projects.error ? (
            <ErrorState message={projects.error} onRetry={projects.reload} />
          ) : plist.length === 0 ? (
            <EmptyState title="Projects coming soon" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plist.slice(0, 6).map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROGRESS */}
      <section className="py-20 md:py-28">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-4">On Site</p>
            <h2 className="font-display text-4xl leading-[1.02] text-navy md:text-5xl">Under development</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">Follow construction milestones as our projects take shape.</p>
            <Link to="/under-development" className="btn btn-outline mt-7">
              Track progress <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4 lg:col-span-8">
            {progress.loading ? (
              <SkeletonGrid n={2} />
            ) : (progress.data || []).length === 0 ? (
              <EmptyState title="Progress updates coming soon" />
            ) : (
              (progress.data || []).map((u) => (
                <motion.div key={u.id} {...reveal} className="flex gap-4 rounded-[1.5rem] border border-line p-4 md:gap-6 md:p-5">
                  <Img src={u.image || '/images/construction.jpg'} alt={u.title} className="h-24 w-24 shrink-0 rounded-2xl md:h-28 md:w-40" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase">{u.projects?.name || 'Project'}</span>
                      <DemoBadge show={u.is_demo} />
                    </div>
                    <p className="mt-1 font-display text-2xl leading-tight text-navy">{u.title}</p>
                    {typeof u.progress_percent === 'number' ? (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                          <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, u.progress_percent)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-navy">{u.progress_percent}%</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">{show(u.stage, 'Stage update coming soon')}</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ABOUT + BROCHURE */}
      <section className="pb-20 md:pb-28">
        <div className="container-x grid gap-5 lg:grid-cols-2">
          <motion.div {...reveal} className="rounded-[2rem] bg-mist p-8 md:p-12">
            <p className="eyebrow mb-4">About</p>
            <h2 className="font-display text-4xl leading-tight text-navy">{s.company_name}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {has(s.about_intro) ? s.about_intro : 'A detailed company profile of Iston Builder Group will be published here soon.'}
            </p>
            <Link to="/about" className="btn btn-primary mt-8">
              About us <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] bg-navy p-8 text-white md:p-12">
            <div className="grid-lines absolute inset-0" />
            <div className="relative">
              <p className="eyebrow mb-4 !text-brass-light">Brochure</p>
              <h2 className="font-display text-4xl leading-tight">Take the details with you.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                {has(s.brochure_url) ? 'Download the latest brochure for an overview of our projects.' : 'Our brochure is being prepared. Request a copy and we’ll share it as soon as it’s ready.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/brochure" className="btn btn-light">
                  <Download className="h-4 w-4" /> {has(s.brochure_url) ? 'Download Brochure' : 'Brochure — Coming Soon'}
                </Link>
                <Link to="/contact" className="btn btn-ghost">
                  <MapPin className="h-4 w-4" /> Contact
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARTNER TEASER */}
      <section className="border-t border-line py-14">
        <div className="container-x flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mist text-navy">
              <Handshake className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl text-navy">Partner Program</p>
              <p className="text-sm text-muted">A partner & referral program is on the way.</p>
            </div>
          </div>
          <Link to="/partner-program" className="btn btn-outline">
            Coming Soon — Register interest
          </Link>
        </div>
      </section>
    </>
  );
}
