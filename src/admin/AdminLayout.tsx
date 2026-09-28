import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building,
  Building2,
  ExternalLink,
  FileDown,
  Home,
  Inbox,
  KeyRound,
  LandPlot,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  ShieldAlert,
  TrendingUp,
  Warehouse,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import type { Row } from '../lib/api';
import { useSeo } from '../lib/seo';
import { LogoMark } from '../components/Logo';
import { PageLoader } from '../components/ui';

const NAV = [
  ['/admin', 'Dashboard', LayoutDashboard],
  ['/admin/enquiries', 'Enquiries', Inbox],
  ['/admin/projects', 'Projects', Building2],
  ['/admin/buildings', 'Buildings', Building],
  ['/admin/properties', 'Properties / Flats', Home],
  ['/admin/plots', 'Plots', LandPlot],
  ['/admin/society_houses', 'Society Houses', Warehouse],
  ['/admin/progress_updates', 'Progress Updates', TrendingUp],
  ['/admin/promotions', 'Promotions', Megaphone],
  ['/admin/brochure', 'Brochure', FileDown],
  ['/admin/settings', 'Site Settings', Settings],
  ['/admin/account', 'Account', KeyRound],
] as const;

export type AdminCtx = { me: Row; refreshMe: () => void };

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [me, setMe] = useState<Row | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [nav, setNav] = useState(false);
  const [tick, setTick] = useState(0);
  useSeo('Admin', 'Admin panel', null, true);

  useEffect(() => {
    if (!user) return;
    setDenied(null);
    api<Row>('/api/admin', { auth: true })
      .then(setMe)
      .catch((e) => setDenied(e.message));
  }, [user, tick]);
  useEffect(() => setNav(false), [pathname]);

  if (loading) return <PageLoader label="Checking session" />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const signOut = async () => {
    if (auth) await fbSignOut(auth);
    navigate('/admin/login');
  };

  if (denied)
    return (
      <div className="grid min-h-screen place-items-center bg-mist p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <ShieldAlert className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="font-display mt-4 text-3xl text-navy">Access restricted</h1>
          <p className="mt-2 text-sm text-muted">{denied}</p>
          <p className="mt-1 text-xs text-muted">Signed in as {user.email}</p>
          <button onClick={signOut} className="btn btn-primary mt-6">
            Sign out
          </button>
        </div>
      </div>
    );
  if (!me) return <PageLoader label="Loading admin" />;

  const sidebar = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/admin'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-white text-navy' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
          }
        >
          <Icon className="h-4 w-4" /> {label}
          {to === '/admin/enquiries' && me.stats?.new_enquiries > 0 && (
            <span className="ml-auto rounded-full bg-brass px-2 py-0.5 text-[10px] text-white">{me.stats.new_enquiries}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <LogoMark className="h-9 w-9" />
          <div className="leading-none text-white">
            <p className="font-display text-lg tracking-[0.12em]">ISTON</p>
            <p className="text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase">Admin Panel</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
        <div className="border-t border-white/10 p-4 text-xs text-white/60">
          <p className="truncate">{me.email}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/" target="_blank" className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20">
              <ExternalLink className="h-3 w-3" /> Site
            </Link>
            <button onClick={signOut} className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20">
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy px-4 text-white lg:hidden">
        <button onClick={() => setNav(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
        <p className="font-display text-lg tracking-[0.12em]">ISTON Admin</p>
        <button onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 hover:bg-white/10">
          <LogOut className="h-4 w-4" />
        </button>
      </header>
      {nav && (
        <div className="fixed inset-0 z-50 bg-navy-deep/60 lg:hidden" onClick={() => setNav(false)}>
          <div className="h-full w-72 overflow-y-auto bg-navy" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 text-white">
              <p className="font-display text-lg tracking-[0.12em]">ISTON Admin</p>
              <button onClick={() => setNav(false)} aria-label="Close menu" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
            <Link to="/" className="mx-6 mt-4 flex items-center gap-2 text-xs text-white/60">
              <ExternalLink className="h-3 w-3" /> View website
            </Link>
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 lg:ml-64">
        <Outlet context={{ me, refreshMe: () => setTick((t) => t + 1) } satisfies AdminCtx} />
      </main>
    </div>
  );
}
