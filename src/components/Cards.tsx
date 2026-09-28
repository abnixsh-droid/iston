import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers, MapPin } from 'lucide-react';
import type { Row } from '../lib/api';
import { KINDS } from '../lib/kinds';
import type { KindKey } from '../lib/kinds';
import { has, price, show } from '../lib/format';
import { DemoBadge, Img, StatusPill } from './ui';

export function ProjectCard({ p, large = false }: { p: Row; large?: boolean }) {
  return (
    <Link to={`/projects/${p.slug}`} className="group card-lift img-zoom block overflow-hidden rounded-[1.75rem] border border-line bg-white">
      <div className="relative overflow-hidden">
        <Img src={p.cover_image} alt={p.name} className={`w-full ${large ? 'aspect-[16/11]' : 'aspect-[4/3]'}`} />
        <div className="absolute top-4 left-4 flex gap-2">
          <StatusPill status={p.status} />
          <DemoBadge show={p.is_demo} />
        </div>
      </div>
      <div className="flex items-start justify-between gap-4 p-5 md:p-6">
        <div>
          <h3 className="font-display text-[1.7rem] leading-tight text-navy">{p.name}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" /> {show(p.location, 'Location coming soon')}
          </p>
          {has(p.tagline) && <p className="mt-3 line-clamp-2 text-sm text-ink/70">{p.tagline}</p>}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-navy transition group-hover:bg-navy group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function ListingCard({ kind, r }: { kind: KindKey; r: Row }) {
  const K = KINDS[kind];
  const chips = [
    r.bhk ? `${r.bhk} BHK` : null,
    K.typeField ? r[K.typeField] : null,
    r[K.areaField],
    kind === 'plots' && r.plot_number ? `Plot ${r.plot_number}` : null,
  ].filter(Boolean) as string[];
  return (
    <Link to={`${K.base}/${r.slug}`} className="group card-lift img-zoom flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white">
      <div className="relative overflow-hidden">
        <Img src={r.cover_image || K.fallbackImg} alt={r.title} className="aspect-[4/3] w-full" />
        <div className="absolute top-4 left-4 flex gap-2">
          <StatusPill status={r.status} />
          <DemoBadge show={r.is_demo} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase">{r.projects?.name || K.label}</p>
        <h3 className="mt-1.5 font-display text-2xl leading-tight text-navy">{r.title}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.length ? (
            chips.map((c) => (
              <span key={c} className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-navy/80">
                {c}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-muted">Details coming soon</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 mt-5">
          <span className="text-sm font-bold text-navy">{price(r.price)}</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-muted group-hover:text-navy">
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BuildingCard({ b }: { b: Row }) {
  return (
    <Link to={`/buildings/${b.slug}`} className="group card-lift img-zoom block overflow-hidden rounded-[1.75rem] border border-line bg-white">
      <div className="relative overflow-hidden">
        <Img src={b.cover_image} alt={b.name} className="aspect-[4/3] w-full" />
        <div className="absolute top-4 left-4 flex gap-2">
          <StatusPill status={b.status} />
          <DemoBadge show={b.is_demo} />
        </div>
      </div>
      <div className="p-5">
        <p className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase">{b.projects?.name || 'Building'}</p>
        <h3 className="mt-1.5 font-display text-2xl text-navy">{b.name}</h3>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {has(b.floors) ? `${b.floors} floors` : 'Floors: coming soon'}
          </span>
          <span>{has(b.units) ? `${b.units} units` : 'Units: coming soon'}</span>
        </div>
      </div>
    </Link>
  );
}
