import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { statusLabel } from '../lib/format';

export function DemoBadge({ show = true, className = '' }: { show?: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span
      title="Demo content — for illustration only. Replace from the admin panel."
      className={`inline-flex items-center gap-1 rounded-full border border-dashed border-amber-500/70 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-amber-700 uppercase ${className}`}
    >
      Demo
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  current: 'bg-navy text-white',
  under_development: 'bg-brass text-white',
  upcoming: 'bg-white text-navy border border-line',
  completed: 'bg-emerald-700 text-white',
  available: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  booked: 'bg-amber-50 text-amber-800 border border-amber-200',
  sold: 'bg-rose-50 text-rose-800 border border-rose-200',
  coming_soon: 'bg-mist text-navy border border-line',
};

export function StatusPill({ status, className = '' }: { status?: string | null; className?: string }) {
  const tone = STATUS_TONE[status || 'coming_soon'] || STATUS_TONE.coming_soon;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${tone} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}

export function Img({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-linear-to-br from-navy to-navy-soft text-white/50 ${className}`}>
        <Building2 className="h-8 w-8" strokeWidth={1.2} />
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Image Coming Soon</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setErr(true)} className={`object-cover ${className}`} />;
}

export function Soon({ children = 'Coming Soon' }: { children?: ReactNode }) {
  return <span className="text-muted/80 italic">{children}</span>;
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-navy" />
      <span className="text-xs font-semibold tracking-[0.2em] uppercase">{label}…</span>
    </div>
  );
}

export function SkeletonGrid({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl border border-line">
          <div className="aspect-[4/3] bg-mist" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/3 rounded bg-mist" />
            <div className="h-5 w-2/3 rounded bg-mist" />
            <div className="h-3 w-1/2 rounded bg-mist" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-line bg-mist/60 p-8 text-center">
      <AlertCircle className="h-6 w-6 text-rose-600" />
      <p className="font-semibold text-navy">We couldn’t load this right now.</p>
      {message && <p className="text-sm text-muted">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline btn-sm mt-1">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-3xl border border-dashed border-line p-10 text-center">
      <Building2 className="h-7 w-7 text-brass" strokeWidth={1.4} />
      <p className="font-display text-2xl text-navy">{title}</p>
      {text && <p className="text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  text,
  action,
  light = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className={`font-display text-4xl leading-[1.02] font-medium md:text-5xl ${light ? 'text-white' : 'text-navy'}`}>{title}</h2>
        {text && <p className={`mt-4 text-[15px] leading-relaxed ${light ? 'text-white/70' : 'text-muted'}`}>{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  crumbs = [],
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  crumbs?: [string, string?][];
  children?: ReactNode;
}) {
  return (
    <section className="grid-lines relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-navy-soft/60 blur-3xl" />
      <div className="container-x relative py-14 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-white/55">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          {crumbs.map(([label, to], i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {to ? (
                <Link to={to} className="hover:text-white">
                  {label}
                </Link>
              ) : (
                <span className="text-white/85">{label}</span>
              )}
            </span>
          ))}
        </nav>
        {eyebrow && <p className="eyebrow mb-4 !text-brass-light">{eyebrow}</p>}
        <h1 className="font-display max-w-3xl text-[2.6rem] leading-[1] font-medium md:text-6xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/70">{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [''];
  const current = list[Math.min(active, list.length - 1)];
  return (
    <div>
      <div className="relative overflow-hidden rounded-[1.75rem] bg-mist">
        <Img src={current} alt={alt} className="aspect-[4/3] w-full md:aspect-[16/10]" />
        {list.length > 1 && (
          <span className="absolute right-4 bottom-4 rounded-full bg-navy/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {active + 1} / {list.length}
          </span>
        )}
      </div>
      {list.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${i === active ? 'border-navy' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <Img src={src} alt={`${alt} ${i + 1}`} className="h-16 w-24" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Fact({ label, value }: { label: string; value: unknown }) {
  const hasVal = !(value === null || value === undefined || String(value).trim() === '');
  return (
    <div className="border-t border-line pt-3">
      <dt className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-navy">{hasVal ? String(value) : <Soon />}</dd>
    </div>
  );
}
