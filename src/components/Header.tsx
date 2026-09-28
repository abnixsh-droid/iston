import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Menu, MessageCircle, Phone, X } from 'lucide-react';
import Logo from './Logo';
import { useEnquiry } from '../contexts/EnquiryContext';
import { useSettings } from '../contexts/SettingsContext';
import { telHref, waHref } from '../lib/format';

export const NAV: [string, string][] = [
  ['/projects', 'Projects'],
  ['/buildings', 'Buildings'],
  ['/properties', 'Flats'],
  ['/plots', 'Plots'],
  ['/society-houses', 'Society Houses'],
  ['/under-development', 'Progress'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Header() {
  const { pathname } = useLocation();
  const { open } = useEnquiry();
  const { s } = useSettings();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
  }, [menu]);

  const solid = !isHome || scrolled || menu;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid ? 'border-b border-line/80 bg-white/92 shadow-[0_8px_30px_-20px_rgba(11,29,63,0.35)] backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
          <Logo light={!solid} />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
            {NAV.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-[13px] font-semibold transition ${
                    solid ? (isActive ? 'bg-mist text-navy' : 'text-ink/70 hover:text-navy') : isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/brochure" className={`hidden items-center gap-1.5 px-2 text-[13px] font-semibold md:flex ${solid ? 'text-navy' : 'text-white'}`}>
              <Download className="h-4 w-4" /> Brochure
            </Link>
            <a href={telHref(s.phone)} className={`hidden btn btn-sm lg:inline-flex ${solid ? 'btn-outline' : 'btn-ghost'}`}>
              <Phone className="h-3.5 w-3.5" /> {s.phone}
            </a>
            <button onClick={() => open()} className={`btn btn-sm hidden sm:inline-flex ${solid ? 'btn-primary' : 'btn-light'}`}>
              Enquire
            </button>
            <button
              onClick={() => setMenu((m) => !m)}
              className={`grid h-10 w-10 place-items-center rounded-full xl:hidden ${solid ? 'text-navy hover:bg-mist' : 'text-white hover:bg-white/10'}`}
              aria-label={menu ? 'Close menu' : 'Open menu'}
              aria-expanded={menu}
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white lg:top-20 xl:hidden"
          >
            <nav className="container-x flex flex-col py-6" aria-label="Mobile">
              {[['/', 'Home'] as [string, string], ...NAV, ['/brochure', 'Download Brochure'] as [string, string], ['/partner-program', 'Partner Program'] as [string, string], ['/admin/login', 'Admin Login'] as [string, string]].map(([to, label], i) => (
                <motion.div key={to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => `flex items-center justify-between border-b border-line py-4 font-display text-[1.7rem] ${isActive ? 'text-brass' : 'text-navy'}`}
                  >
                    {label}
                    {label === 'Partner Program' && <span className="font-sans text-[10px] font-bold tracking-[0.16em] text-muted uppercase">Coming Soon</span>}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <a href={telHref(s.phone)} className="btn btn-outline">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a href={waHref(s.whatsapp, 'Hello Iston Builder Group, I would like to know more.')} target="_blank" rel="noreferrer" className="btn btn-primary">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
