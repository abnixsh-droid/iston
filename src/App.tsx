import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { EnquiryProvider } from './contexts/EnquiryContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileBar from './components/MobileBar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import { BuildingDetail, Buildings } from './pages/Buildings';
import Listings from './pages/Listings';
import ItemDetail from './pages/ItemDetail';
import Progress from './pages/Progress';
import { About, Brochure, Contact, NotFound, Partner } from './pages/StaticPages';
import { PageLoader } from './components/ui';

const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const CrudPage = lazy(() => import('./admin/CrudPage'));
const Enquiries = lazy(() => import('./admin/Enquiries'));
const AccountPage = lazy(() => import('./admin/SettingsPages').then((m) => ({ default: m.AccountPage })));
const BrochurePage = lazy(() => import('./admin/SettingsPages').then((m) => ({ default: m.BrochurePage })));
const SettingsPage = lazy(() => import('./admin/SettingsPages').then((m) => ({ default: m.SettingsPage })));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <EnquiryProvider>
      <Header />
      {pathname !== '/' && <div className="h-16 lg:h-20" aria-hidden="true" />}
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
      <MobileBar />
    </EnquiryProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <ScrollTop />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/buildings" element={<Buildings />} />
              <Route path="/buildings/:slug" element={<BuildingDetail />} />
              <Route path="/properties" element={<Listings key="properties" kind="properties" />} />
              <Route path="/properties/:slug" element={<ItemDetail key="p" kind="properties" />} />
              <Route path="/plots" element={<Listings key="plots" kind="plots" />} />
              <Route path="/plots/:slug" element={<ItemDetail key="pl" kind="plots" />} />
              <Route path="/society-houses" element={<Listings key="houses" kind="society_houses" />} />
              <Route path="/society-houses/:slug" element={<ItemDetail key="h" kind="society_houses" />} />
              <Route path="/under-development" element={<Progress />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/brochure" element={<Brochure />} />
              <Route path="/partner-program" element={<Partner />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="brochure" element={<BrochurePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path=":entity" element={<CrudPage key="crud" />} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
