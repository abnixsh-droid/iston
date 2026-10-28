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
import { getStoredAdviserAuth } from '../lib/adviserService';

export const NAV: [string, string][] = [
  ['/projects', 'Projects'],
  ['/buildings', 'Buildings'],
  ['/properties', 'Flats'],
  ['/plots', 'Plots'],
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
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu]);

  const solid = !isHome || scrolled || menu;
  const adviserAuth = getStoredAdviserAuth();
  const isAdviserLoggedIn = Boolean(adviserAuth);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid ? 'border-b border-line/80 bg-white/92 shadow-[0_8px_30px_-20px_rgba(11,29,63,0.35)] backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="container-x flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-20">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to={isAdviserLoggedIn ? '/advisers/dashboard' : '/advisers-program'}
              target="_blank"
              rel="noopener noreferrer"
              className={
                isAdviserLoggedIn
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-[#022c33] font-black border-0 shadow-md shadow-teal-500/25 flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10.5px] sm:text-xs transition shrink-0 ring-1.5 sm:ring-2 ring-teal-300/40'
                  : 'bg-orange-600 hover:bg-orange-700 text-white font-bold border-0 shadow-xs flex items-center gap-1 rounded-full px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10.5px] sm:text-xs transition shrink-0'
              }
            >
              {isAdviserLoggedIn && <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#022c33] animate-pulse" />}
              {isAdviserLoggedIn ? 'Adviser' : 'Adviser Login'}
            </Link>
            {(isAdmin || user?.email?.toLowerCase() === 'sitaramchaurasiya8@gmail.com') && (
              <Link
                to="/admin"
                className="bg-navy text-amber-300 hover:text-white font-bold border border-amber-400/40 shadow-xs flex items-center gap-1 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10.5px] sm:text-xs transition shrink-0"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin Panel</span>
              </Link>
            )}
            <div className="hidden sm:block">
              <LanguageToggle solid={solid} />
            </div>
            <BrochureButton className={`hidden items-center gap-1.5 px-2 text-[13px] font-semibold md:flex ${solid ? 'text-navy' : 'text-white'}`}>Brochure</BrochureButton>
            <a href={telHref(s.phone)} className={`hidden btn btn-sm lg:inline-flex ${solid ? 'btn-outline' : 'btn-ghost'}`}>
              <Phone className="h-3.5 w-3.5" /> {s.phone}
            </a>

            {/* Auth button and context actions — visible on desktop (hidden on mobile, inside slider menu) */}
            <div className="hidden xl:block">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdown((d) => !d)}
                    className={`btn btn-sm inline-flex items-center gap-1.5 ${solid ? 'btn-outline' : 'btn-ghost'}`}
                    title={user.displayName || user.email || 'User Account'}
                  >
                    {isAdmin ? <ShieldCheck className="h-4 w-4 text-brass" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
                    <span className="max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
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
              ) : null}
            </div>

            <button onClick={() => open()} className={`btn btn-sm hidden xl:inline-flex ${solid ? 'btn-primary' : 'btn-light'}`}>
              Enquire
            </button>

            {/* Slider menu button (opens drawer with user profile and full options on mobile) */}
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
                (isAdviserLoggedIn ? ['/advisers/dashboard', 'Adviser'] : ['/advisers-program', 'Adviser Login']) as [string, string],
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

              {user && (
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-mist p-4">
                  <div className="text-xs">
                    <p className="font-semibold text-navy">{user.displayName || user.email}</p>
                    <p className="text-muted">{user.role === 'admin' ? 'Administrator' : isAdviser ? 'Adviser' : 'Standard User'}</p>
                  </div>
                  <button onClick={() => signOut()} className="btn btn-sm btn-outline text-rose-600">
                    Sign out
                  </button>
                </div>
              )}
              {(isAdmin || user?.email?.toLowerCase() === 'sitaramchaurasiya8@gmail.com') && (
                <div className="mt-4">
                  <Link
                    to="/admin"
                    onClick={() => setMenu(false)}
                    className="btn btn-outline w-full flex items-center justify-center gap-2 font-bold text-navy border-navy"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-600" /> Admin Panel
                  </Link>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => {
                    setMenu(false);
                    open();
                  }}
                  className="btn btn-primary w-full"
                >
                  Enquire Now
                </button>
              </div>
              <div className="mt-6">
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
