import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="currentColor" />
      <path d="M12 30V16l8-6 8 6v14" fill="none" stroke="#d8c09a" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 30V18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16.5 18h7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16.5 30h7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Iston Builder Group — Home">
      <LogoMark className={`h-9 w-9 ${light ? 'text-white/10' : 'text-navy'}`} />
      <span className="leading-none">
        <span className={`block font-display text-[1.45rem] font-semibold tracking-[0.14em] ${light ? 'text-white' : 'text-navy'}`}>ISTON</span>
        <span className={`block text-[8.5px] font-bold tracking-[0.34em] uppercase ${light ? 'text-white/60' : 'text-muted'}`}>Builder Group</span>
      </span>
    </Link>
  );
}
