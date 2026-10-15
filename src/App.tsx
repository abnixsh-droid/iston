import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
import { About, Brochure, Contact, NotFound, TermsAndConditions } from './pages/StaticPages';
import { PageLoader } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import PageProgressBar from './components/PageProgressBar';
import CookieConsent from './components/CookieConsent';

const AdvisersPortal = lazy(() => import('./pages/advisers/AdvisersPortal'));
const AdviserRegistration = lazy(() => import('./pages/advisers/AdviserRegistration'));
const AdviserDashboard = lazy(() => import('./pages/advisers/AdviserDashboard'));

const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AdvisersAdmin = lazy(() => import('./admin/AdvisersAdmin'));
const CrudPage = lazy(() => import('./admin/CrudPage'));
const Enquiries = lazy(() => import('./admin/Enquiries'));
const AccountPage = lazy(() => import('./admin/SettingsPages').then((m) => ({ default: m.AccountPage })));
const BrochurePage = lazy(() => import('./admin/SettingsPages').then((m) => ({ default: m.BrochurePage })));
const SettingsPage = lazy(() => import('./admin/SettingsPages').then((m) => ({ default: m.SettingsPage })));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
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
          <PageProgressBar />
          <ScrollTop />
          <CookieConsent />
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
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
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
                  <Route path="/advisers/dashboard" element={<AdviserDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                {/* Dedicated Minimal White & Orange Advisers Environment */}
                <Route path="/advisers-program" element={<AdvisersPortal />} />
                <Route path="/advisers" element={<Navigate to="/advisers-program" replace />} />
                <Route path="/advisers/apply" element={<AdviserRegistration />} />
                <Route path="/advisers/register" element={<AdviserRegistration />} />
                <Route path="/partner-program" element={<Navigate to="/advisers-program" replace />} />
                <Route path="/partner" element={<Navigate to="/advisers-program" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="advisers" element={<AdvisersAdmin />} />
                  <Route path="enquiries" element={<Enquiries />} />
                  <Route path="brochure" element={<BrochurePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path=":entity" element={<CrudPage key="crud" />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
