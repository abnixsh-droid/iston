import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return <img src="/images/logo.jpg" alt="Iston Builder Group logo" width={40} height={40} className={`rounded-lg object-cover ${className}`} />;
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" data-no-translate className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0" aria-label="Iston Builder Group — Home">
      <LogoMark className={`h-8 w-8 sm:h-10 sm:w-10 shrink-0 ${light ? 'ring-1 ring-white/25' : ''}`} />
      <span className="leading-none select-none truncate">
        <span className={`block font-latin-display keep-tracking text-[1.05rem] sm:text-[1.45rem] font-semibold tracking-[0.1em] sm:tracking-[0.14em] ${light ? 'text-white' : 'text-navy'}`}>ISTON</span>
        <span className={`block font-latin keep-tracking text-[7px] sm:text-[8.5px] font-bold tracking-[0.2em] sm:tracking-[0.34em] uppercase ${light ? 'text-white/60' : 'text-muted'}`}>Builder Group</span>
      </span>
    </Link>
  );
}
