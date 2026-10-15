import LanguageToggle from './LanguageToggle';
import BrochureButton from '../components/BrochureButton';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, Menu, MessageCircle, Phone, ShieldCheck, UserCheck, X } from 'lucide-react';
import Logo from './Logo';
import { useEnquiry } from '../contexts/EnquiryContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { telHref, waHref } from '../lib/format';

export const NAV: [string, string][] = [
  ['/projects', 'Projects'],
  ['/buildings', 'Buildings'],
  ['/properties', 'Flats'],
  ['/plots', 'Plots'],
  ['/society-houses', 'Society Houses'],
  ['/under-development', 'Progress'],
  ['/advisers-program', 'Advisers'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Header() {
  const { pathname } = useLocation();
  const { open } = useEnquiry();
  const { s } = useSettings();
  const { user, isAdmin, isAdviser, signInWithGoogle, signOut } = useAuth();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/advisers-program"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold border-0 shadow-xs flex items-center gap-1 rounded-full px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 transition"
            >
              Advisers
            </Link>
            <LanguageToggle solid={solid} />
            <BrochureButton className={`hidden items-center gap-1.5 px-2 text-[13px] font-semibold md:flex ${solid ? 'text-navy' : 'text-white'}`}>Brochure</BrochureButton>
            <a href={telHref(s.phone)} className={`hidden btn btn-sm lg:inline-flex ${solid ? 'btn-outline' : 'btn-ghost'}`}>
              <Phone className="h-3.5 w-3.5" /> {s.phone}
            </a>

            {/* Auth button and context actions */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown((d) => !d)}
                  className={`btn btn-sm h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-full ${solid ? 'btn-outline' : 'btn-ghost'}`}
                  title={user.displayName || user.email || 'User Account'}
                >
                  {isAdmin ? <ShieldCheck className="h-4 w-4 text-brass" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
                  <span className="hidden sm:inline max-w-[90px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                </button>
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-xl text-ink z-50">
                    <div className="px-3 py-2 border-b border-line text-xs">
                      <p className="font-semibold text-navy truncate">{user.displayName || 'Signed in'}</p>
                      <p className="text-muted truncate">{user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isAdmin ? 'bg-navy text-white' : 'bg-mist text-navy'}`}>
                        {user.role}
                      </span>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-navy hover:bg-mist rounded-xl mt-1"
                      >
                        <ShieldCheck className="h-4 w-4 text-brass" /> Admin Panel
                      </Link>
                    )}
                    {isAdviser ? (
                      <Link
                        to="/advisers/dashboard"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-navy hover:bg-mist rounded-xl mt-1"
                      >
                        <UserCheck className="h-4 w-4 text-emerald-600" /> Adviser Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/advisers-program"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-navy hover:bg-mist rounded-xl mt-1"
                      >
                        Become an Adviser
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        signOut();
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl mt-1"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className={`btn btn-sm h-8 px-2.5 sm:h-9 sm:px-3 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold ${solid ? 'btn-outline' : 'btn-ghost'}`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}

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
              {[
                ['/', 'Home'] as [string, string],
                ...NAV,
                ['/brochure', 'Download Brochure'] as [string, string],
                ['/advisers-program', 'Advisers Program'] as [string, string],
                ...(isAdmin ? ([['/admin', 'Admin Panel'] as [string, string]]) : []),
                ...(isAdviser ? ([['/advisers/dashboard', 'Adviser Dashboard'] as [string, string]]) : []),
                ...(!user ? ([['/admin/login', 'Admin Login'] as [string, string]]) : []),
              ].map(([to, label], i) => (
                <motion.div key={to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => `flex items-center justify-between border-b border-line py-4 font-display text-[1.7rem] ${isActive ? 'text-orange-600' : 'text-navy'}`}
                  >
                    {label}
                  </NavLink>
                </motion.div>
              ))}

              {user ? (
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-mist p-4">
                  <div className="text-xs">
                    <p className="font-semibold text-navy">{user.displayName || user.email}</p>
                    <p className="text-muted">{user.role === 'admin' ? 'Administrator' : isAdviser ? 'Adviser' : 'Standard User'}</p>
                  </div>
                  <button onClick={() => signOut()} className="btn btn-sm btn-outline text-rose-600">
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <button onClick={() => signInWithGoogle()} className="btn btn-outline w-full flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" /> Sign in with Google
                  </button>
                </div>
              )}

              <div className="mt-8">
                <LanguageToggle full />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
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
