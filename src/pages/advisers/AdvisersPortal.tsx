import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Building,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Home,
  MapPin,
  Layers,
  Award,
  Wallet,
  PhoneCall,
  Clock,
  Check,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adviserService, type AdviserRecord } from '../../lib/adviserService';
import { inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';
import LanguageToggle from '../../components/LanguageToggle';

export default function AdvisersPortal() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [adviserAccount, setAdviserAccount] = useState<AdviserRecord | null>(null);
  const [loadingAdviser, setLoadingAdviser] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useSeo('Advisers Program — Iston Builder Group', 'Accredited real estate advisers network. Earn registration referral rewards and property sales commissions.');

  // Load adviser profile for logged in user
  useEffect(() => {
    if (!user) return;
    setLoadingAdviser(true);
    adviserService
      .getDashboard(user)
      .then((res) => {
        if (res?.ok && res.adviser) {
          setAdviserAccount(res.adviser);
        }
      })
      .catch(() => {
        /* Not yet registered */
      })
      .finally(() => {
        setLoadingAdviser(false);
      });
  }, [user]);

  const copyRefLink = () => {
    if (!adviserAccount?.referral_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/advisers-program?ref=${adviserAccount.referral_code}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isApprovedAdviser = adviserAccount?.status === 'active';
  const isVerificationPending = adviserAccount?.payment_status === 'pending_verification' && adviserAccount?.status === 'pending';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* MINIMAL TOP BAR */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 text-neutral-900 font-bold tracking-tight">
              <img
                src="/images/logo.jpg"
                alt="Iston Builder Group"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-neutral-200"
              />
              <span className="text-sm font-semibold tracking-wide uppercase text-neutral-800">
                Iston <span className="text-orange-600 font-bold">Advisers</span>
              </span>
            </Link>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-orange-600 transition"
            >
              ← Main Website
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* HINDI / ENGLISH TRANSLATE BUTTON */}
            <LanguageToggle solid={true} />

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-600 hidden md:inline truncate max-w-[140px]">{user.email}</span>
                {isApprovedAdviser ? (
                  <Link
                    to="/advisers/dashboard"
                    className="px-3.5 py-1.5 rounded-full bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 shadow-xs"
                  >
                    Dashboard
                  </Link>
                ) : isVerificationPending ? (
                  <Link
                    to="/advisers/apply"
                    className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold"
                  >
                    Under Verification
                  </Link>
                ) : (
                  <Link
                    to="/advisers/apply"
                    className="px-3.5 py-1.5 rounded-full bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 shadow-xs"
                  >
                    Apply Now
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ACTIVE ADVISER BANNER (IF APPROVED) */}
      {isApprovedAdviser && (
        <div className="bg-emerald-600 text-white px-4 py-3">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
              <span>
                You are an accredited active adviser: <b className="font-mono text-white">{adviserAccount?.adviser_id}</b>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyRefLink}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Link Copied!' : 'Copy Referral Link'}
              </button>
              <Link
                to="/advisers/dashboard"
                className="px-3 py-1 rounded-lg bg-white text-emerald-800 font-bold hover:bg-emerald-50"
              >
                Open Dashboard →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION WITH AUTHENTIC PROPERTY BACKDROP */}
      <header className="relative bg-white border-b border-neutral-200 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img src="/images/umroli-hero.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 relative text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold tracking-wider uppercase border border-orange-200">
            Accredited Real Estate Advisers Network
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Earn with <span className="text-orange-600">Iston Builder Group</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Partner with an established real estate developer. Earn dual income through structured registration referral rewards and up to 10% property sales commissions.
          </p>

          {/* DYNAMIC ACTION BUTTONS */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {isApprovedAdviser ? (
              <Link
                to="/advisers/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                Go to Adviser Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isVerificationPending ? (
              <Link
                to="/advisers/apply"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> View Pending Application
              </Link>
            ) : (
              <Link
                to="/advisers/apply"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                Become an Adviser <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-sm font-semibold transition text-center"
            >
              How the Hierarchy Works
            </a>
          </div>

          {/* KEY STATS PILLS */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Registration Fee</span>
              <p className="mt-1 text-2xl font-black text-orange-600">₹1,100</p>
              <span className="text-[10px] text-neutral-400">One-time UPI activation</span>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Direct Referral</span>
              <p className="mt-1 text-2xl font-black text-neutral-900">₹300</p>
              <span className="text-[10px] text-neutral-400">Instant registration reward</span>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Tiered Uplines</span>
              <p className="mt-1 text-2xl font-black text-neutral-900">₹200 / ₹100</p>
              <span className="text-[10px] text-neutral-400">Levels 2, 3 and higher</span>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Property Sales</span>
              <p className="mt-1 text-2xl font-black text-emerald-600">Up to 10%</p>
              <span className="text-[10px] text-neutral-400">Commission on company brokerage</span>
            </div>
          </div>
        </div>
      </header>

      {/* VISUAL REFERRAL & COMMISSION TREE DIAGRAM */}
      <section id="how-it-works" className="py-14 md:py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Structured Transparency</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-2">
            Referral & Earnings Tree Structure
          </h2>
          <p className="text-xs md:text-sm text-neutral-600 mt-2">
            See exactly how registration rewards and property commissions flow through your hierarchy. No hidden deductions.
          </p>
        </div>

        {/* TREE VISUALIZATION CARD */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-10 shadow-xs">
          {/* ROOT NODE (YOU) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-neutral-900 text-[10px] font-bold uppercase tracking-wider">
                Root Account
              </div>
              <p className="text-lg font-extrabold mt-1">You (Accredited Adviser)</p>
              <p className="text-xs text-orange-100">Adviser ID · Referral Code · Direct Dashboard</p>
            </div>

            {/* VERTICAL CONNECTOR */}
            <div className="w-0.5 h-8 bg-orange-300" />
          </div>

          {/* TIER NODES */}
          <div className="grid gap-4 md:grid-cols-3 pt-2">
            {/* LEVEL 1 */}
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50/50 p-5 relative flex flex-col justify-between">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold uppercase">
                Level 1 · Direct
              </div>
              <div>
                <p className="text-sm font-extrabold text-neutral-900 mt-2">Direct Referral</p>
                <p className="text-xs text-neutral-500 mt-0.5">Advisers who join directly via your referral link</p>
                <div className="mt-4 pt-3 border-t border-orange-200/70 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Registration Reward:</span>
                    <span className="font-extrabold text-orange-600 text-sm">₹300</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Property Brokerage:</span>
                    <span className="font-bold text-emerald-700">5% Share</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-2 rounded-xl bg-white border border-orange-100 text-[11px] text-neutral-600">
                💡 10 direct advisers = <b>₹3,000</b> direct reward
              </div>
            </div>

            {/* LEVEL 2 */}
            <div className="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-5 relative flex flex-col justify-between">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-neutral-800 text-white text-[10px] font-bold uppercase">
                Level 2 · 2nd Upline
              </div>
              <div>
                <p className="text-sm font-extrabold text-neutral-900 mt-2">Second Tier</p>
                <p className="text-xs text-neutral-500 mt-0.5">Advisers referred by your direct network</p>
                <div className="mt-4 pt-3 border-t border-neutral-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Registration Reward:</span>
                    <span className="font-extrabold text-neutral-900 text-sm">₹200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Property Brokerage:</span>
                    <span className="font-bold text-emerald-700">4% Share</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-2 rounded-xl bg-white border border-neutral-200 text-[11px] text-neutral-600">
                💡 25 team advisers = <b>₹5,000</b> passive reward
              </div>
            </div>

            {/* LEVEL 3 & HIGHER */}
            <div className="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-5 relative flex flex-col justify-between">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-neutral-700 text-white text-[10px] font-bold uppercase">
                Level 3 to 10+
              </div>
              <div>
                <p className="text-sm font-extrabold text-neutral-900 mt-2">Extended Network</p>
                <p className="text-xs text-neutral-500 mt-0.5">Deep upline network up to eligible caps</p>
                <div className="mt-4 pt-3 border-t border-neutral-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Level 3 Reward:</span>
                    <span className="font-extrabold text-neutral-900 text-sm">₹100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Level 4+ Reward:</span>
                    <span className="font-extrabold text-neutral-900 text-sm">₹100 / level</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Property Brokerage:</span>
                    <span className="font-bold text-emerald-700">3%, 2%, 1%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-2 rounded-xl bg-white border border-neutral-200 text-[11px] text-neutral-600">
                💡 Unlimited depth referral hierarchy tracking
              </div>
            </div>
          </div>

          {/* PROPERTY SELLER COMMISSION HIGHLIGHT */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                10%
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">Direct Property Seller Commission</p>
                <p className="text-[11px] text-emerald-800">
                  When you close a sale on any Iston property, you receive 10% of company brokerage in addition to referral points.
                </p>
              </div>
            </div>
            <Link
              to="/advisers/apply"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 text-center"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </section>

      {/* GENUINE PROPERTY ASSETS PORTFOLIO */}
      <section className="py-14 bg-white border-y border-neutral-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Real Estate Portfolio</span>
            <h2 className="text-3xl font-extrabold text-neutral-900 mt-1">Properties You Advise & Represent</h2>
            <p className="text-xs md:text-sm text-neutral-600 mt-2">
              Accredited advisers have exclusive access to refer verified residential flats, commercial plots, and society houses.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ITEM 1: UMROLI */}
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 group hover:shadow-md transition">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/umroli-hero.jpg"
                  alt="Umroli Project"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-neutral-900/80 text-white text-[10px] font-bold uppercase">
                  Flagship
                </span>
              </div>
              <div className="p-4">
                <p className="font-extrabold text-neutral-900 text-sm">Umroli Project</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-600" /> Umroli Station West
                </p>
                <p className="text-[11px] text-neutral-600 mt-2 font-medium">1 BHK & 2 BHK Modern Flats</p>
              </div>
            </div>

            {/* ITEM 2: RESIDENTIAL FLATS */}
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 group hover:shadow-md transition">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/building.jpg"
                  alt="Residential Buildings"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold uppercase">
                  Flats
                </span>
              </div>
              <div className="p-4">
                <p className="font-extrabold text-neutral-900 text-sm">Modern Towers</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <Building className="w-3 h-3 text-orange-600" /> Multi-Storey Living
                </p>
                <p className="text-[11px] text-neutral-600 mt-2 font-medium">Verified RERA Approved</p>
              </div>
            </div>

            {/* ITEM 3: PLOTS */}
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 group hover:shadow-md transition">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/plot.jpg"
                  alt="Land & Plots"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-neutral-900/80 text-white text-[10px] font-bold uppercase">
                  Land
                </span>
              </div>
              <div className="p-4">
                <p className="font-extrabold text-neutral-900 text-sm">Clear Title Plots</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <Layers className="w-3 h-3 text-orange-600" /> Commercial & Residential
                </p>
                <p className="text-[11px] text-neutral-600 mt-2 font-medium">Demarcated NA plots</p>
              </div>
            </div>

            {/* ITEM 4: SOCIETY HOUSES */}
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 group hover:shadow-md transition">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/house.jpg"
                  alt="Society Houses"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                  Independent
                </span>
              </div>
              <div className="p-4">
                <p className="font-extrabold text-neutral-900 text-sm">Society Houses</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <Home className="w-3 h-3 text-orange-600" /> Gated Communities
                </p>
                <p className="text-[11px] text-neutral-600 mt-2 font-medium">Ready & Under Construction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP PROFESSIONAL REGISTRATION PROCESS */}
      <section className="py-14 md:py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Simple Activation</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-1">How to Become an Adviser</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 relative">
            <span className="text-3xl font-black text-orange-600/30">01</span>
            <h3 className="text-sm font-extrabold text-neutral-900 mt-2">Sign In with Google</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Securely authenticate with your verified Google account. No manual password needed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 relative">
            <span className="text-3xl font-black text-orange-600/30">02</span>
            <h3 className="text-sm font-extrabold text-neutral-900 mt-2">Submit Details</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Provide your phone, legal name, payout details, and optional sponsor referral code.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 relative">
            <span className="text-3xl font-black text-orange-600/30">03</span>
            <h3 className="text-sm font-extrabold text-neutral-900 mt-2">UPI QR Payment (₹1,100)</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Pay via any UPI app and enter the 12-digit transaction UTR for administrator matching.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 relative">
            <span className="text-3xl font-black text-orange-600/30">04</span>
            <h3 className="text-sm font-extrabold text-neutral-900 mt-2">Active & Earn</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Once approved, your unique Adviser ID and referral links go live immediately.
            </p>
          </div>
        </div>

        {/* BOTTOM CTA BANNER */}
        <div className="mt-12 rounded-3xl bg-neutral-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold">Ready to Join the Network?</h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2">
              Start building your real estate adviser business today. Fast approval with dedicated admin support.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/advisers/apply"
                className="px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition"
              >
                Become an Adviser (₹1,100)
              </Link>
              <Link
                to="/"
                className="px-6 py-3.5 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 font-semibold text-xs transition"
              >
                Explore Properties First
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Iston Builder Group. All rights reserved.</span>
          <div className="flex gap-4 font-medium">
            <Link to="/" className="hover:text-orange-600">Home</Link>
            <Link to="/advisers-program" className="hover:text-orange-600">Advisers</Link>
            <Link to="/contact" className="hover:text-orange-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
