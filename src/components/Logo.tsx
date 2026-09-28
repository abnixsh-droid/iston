import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return <img src="/images/logo.jpg" alt="Iston Builder Group logo" width={40} height={40} className={`rounded-lg object-cover ${className}`} />;
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" data-no-translate className="flex items-center gap-2.5" aria-label="Iston Builder Group — Home">
      <LogoMark className={`h-10 w-10 ${light ? 'ring-1 ring-white/25' : ''}`} />
      <span className="leading-none">
        <span className={`block font-latin-display keep-tracking text-[1.45rem] font-semibold tracking-[0.14em] ${light ? 'text-white' : 'text-navy'}`}>ISTON</span>
        <span className={`block font-latin keep-tracking text-[8.5px] font-bold tracking-[0.34em] uppercase ${light ? 'text-white/60' : 'text-muted'}`}>Builder Group</span>
      </span>
    </Link>
  );
}
