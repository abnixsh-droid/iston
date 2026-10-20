import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Copy,
  Check,
  TrendingUp,
  Wallet,
  Building,
  PlusCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Upload,
  FileText,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  PhoneCall,
  Share2,
  Home,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { adviserService, type AdviserRecord, getStoredAdviserAuth, setStoredAdviserAuth } from '../../lib/adviserService';
import { api } from '../../lib/api';
import { fmtDate, inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';
import AdviserSpinner from '../../components/AdviserSpinner';

export default function AdviserDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [session, setSession] = useState<AdviserRecord | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Active tab: 'overview' | 'profile' | 'leads' | 'team' | 'payouts'
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'leads' | 'team' | 'payouts'>('overview');

  // Interactive Tree Expansion State
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Submit Lead Modal state
  const [leadModal, setLeadModal] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPropertyType, setLeadPropertyType] = useState('properties');
  const [leadPropertyTitle, setLeadPropertyTitle] = useState('Umroli Project (Flats)');
  const [leadNotes, setLeadNotes] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState('');

  // Payout Request Modal state
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState('');

  // Profile Documents State
  const [docs, setDocs] = useState<{
    aadhar_front?: string;
    aadhar_back?: string;
    pan_card?: string;
    photo?: string;
    bank_passbook?: string;
  }>({});
  const [bankDetails, setBankDetails] = useState<{
    account_holder_name?: string;
    account_number?: string;
    ifsc?: string;
    bank_name?: string;
    upi_id?: string;
  }>({});
  const [savingDocs, setSavingDocs] = useState(false);
  const [docsSuccess, setDocsSuccess] = useState('');

  useSeo('Adviser Dashboard — Iston Builder Group', 'Adviser portal for property sales, team referral network, and earnings.');

  const fetchDashboard = async (auth: AdviserRecord) => {
    try {
      setLoading(true);
      setError('');
      const res = await adviserService.getDashboard(auth);
      if (res?.ok) {
        setData(res);
        setDocs(res.adviser?.documents || {});
        setBankDetails(res.adviser?.bank_details || {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load adviser dashboard');
      if (err.status === 404 || err.message?.includes('No adviser account')) {
        navigate('/advisers-program', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'profile' || tabParam === 'team' || tabParam === 'leads' || tabParam === 'payouts') {
      setActiveTab(tabParam as any);
    }

    const currentAuth = getStoredAdviserAuth();
    if (!currentAuth || currentAuth.status !== 'active') {
      navigate('/advisers-program', { replace: true });
      return;
    }
    setSession(currentAuth);
    fetchDashboard(currentAuth);
  }, [searchParams]);

  const handleSignOut = () => {
    setStoredAdviserAuth(null);
    navigate('/advisers-program', { replace: true });
  };

  const copyReferralLink = () => {
    const code = data?.adviser?.referral_code || data?.adviser?.registration_no || data?.adviser?.adviser_id;
    if (!code) return;
    const url = `${window.location.origin}/advisers-program?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setDocs((prev) => ({ ...prev, [docKey]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.adviser?.adviser_id) return;
    setSavingDocs(true);
    setDocsSuccess('');
    try {
      const res = await adviserService.updateDocuments(data.adviser.adviser_id, {
        documents: docs,
        bank_details: bankDetails,
      });
      if (res?.ok) {
        setDocsSuccess('Profile & KYC documents saved successfully.');
        setTimeout(() => setDocsSuccess(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update documents');
    } finally {
      setSavingDocs(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    setLeadSuccess('');
    try {
      await api('/api/advisers', {
        method: 'POST',
        body: {
          action: 'submit_lead',
          lead_name: leadName,
          lead_phone: leadPhone,
          lead_email: leadEmail,
          property_type: leadPropertyType,
          property_title: leadPropertyTitle,
          notes: leadNotes,
          adviser_id: data?.adviser?.adviser_id,
        },
      });
      setLeadSuccess('Buyer lead registered successfully! Sales team will follow up.');
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadNotes('');
      if (session) fetchDashboard(session);
      setTimeout(() => setLeadModal(false), 1600);
    } catch (err: any) {
      alert(err.message || 'Error submitting lead');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0 || amt > (data?.availableBalance || 0)) {
      alert('Please enter a valid amount within your available balance.');
      return;
    }
    setSubmittingPayout(true);
    try {
      await api('/api/advisers', {
        method: 'POST',
        body: {
          action: 'request_payout',
          amount: amt,
          payment_method: payoutMethod,
          adviser_id: data?.adviser?.adviser_id,
        },
      });
      setPayoutSuccess('Payout request submitted for verification.');
      setPayoutAmount('');
      if (session) fetchDashboard(session);
      setTimeout(() => setPayoutModal(false), 1600);
    } catch (err: any) {
      alert(err.message || 'Error requesting payout');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-neutral-50 text-neutral-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <p className="mt-3 text-xs font-semibold text-neutral-600">Loading Adviser Portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-neutral-50">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center border border-line shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-navy mt-4">Dashboard Unavailable</h2>
          <p className="mt-1 text-xs text-muted">{error}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button onClick={() => session && fetchDashboard(session)} className="btn btn-primary btn-sm text-xs">
              Retry
            </button>
            <button onClick={handleSignOut} className="btn btn-outline btn-sm text-xs">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { adviser, stats, regRewardsSummary, commissionsSummary, availableBalance } = data;
  const referralCode = adviser.referral_code || adviser.registration_no || adviser.adviser_id;
  const referralLink = `${window.location.origin}/advisers-program?ref=${referralCode}`;
  const teamTree = stats?.teamTree || {
    adviser_id: adviser.adviser_id,
    registration_no: adviser.registration_no || adviser.adviser_id,
    full_name: adviser.full_name,
    directCount: stats.directCount,
    totalTeam: stats.totalTeam,
    children: [],
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-6 md:py-10 text-neutral-900">
      <div className="container-x max-w-6xl">
        {/* TOP BRAND HEADER & SPINNER SHORTCUTS */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-line shadow-xs">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/images/logo.jpg"
                alt="Iston Builder Group logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-line"
              />
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-tight text-navy">ISTON BUILDER GROUP</span>
                <span className="block text-[9px] font-bold tracking-[0.2em] uppercase text-orange-600">Adviser Portal</span>
              </span>
            </Link>

            <span className="hidden sm:inline-block w-px h-5 bg-line mx-1" />

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Adviser
            </span>
          </div>

          {/* QUICK ACTION BAR (Home, Dashboard, Profile, Contact) */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto text-xs">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-xl border border-line hover:border-navy text-neutral-700 font-semibold hover:text-navy transition flex items-center gap-1 text-[11px]"
              title="Go to Home"
            >
              <Home className="w-3.5 h-3.5" /> <span className="hidden md:inline">Home</span>
            </Link>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1 text-[11px] ${
                activeTab === 'overview'
                  ? 'bg-navy text-white border-navy'
                  : 'border-line text-neutral-700 hover:border-navy'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1 text-[11px] ${
                activeTab === 'profile'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'border-line text-neutral-700 hover:border-orange-500 hover:text-orange-600'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Profile &amp; KYC
            </button>
            <Link
              to="/contact"
              className="px-3 py-1.5 rounded-xl border border-line hover:border-navy text-neutral-700 font-semibold hover:text-navy transition flex items-center gap-1 text-[11px]"
            >
              <PhoneCall className="w-3.5 h-3.5" /> <span className="hidden md:inline">Contact</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 rounded-xl border border-line hover:bg-rose-50 text-rose-600 font-semibold transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* HERO ADVISER PROFILE BANNER */}
        <section className="rounded-3xl bg-navy p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Reg No: {adviser.registration_no || adviser.adviser_id}
                </span>
                {adviser.token_number && (
                  <span className="font-mono text-xs font-bold px-3 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                    Token: {adviser.token_number}
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Verified
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold mt-2.5 tracking-tight">{adviser.full_name}</h1>
              <p className="mt-1 text-xs text-neutral-400">
                Mobile: {adviser.phone} · Sponsor: {adviser.sponsor_id || 'Direct'}
              </p>
            </div>

            {/* Quick Share Referral Box */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 max-w-sm w-full">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 font-medium">Your Referral Code:</span>
                <span className="font-mono font-black text-white text-sm bg-black/30 px-2 py-0.5 rounded border border-white/10">
                  {referralCode}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-black/40 text-neutral-200 text-xs px-2.5 py-1.5 rounded-xl font-mono truncate border border-white/10 focus:outline-hidden select-all"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-400">
                Earn ₹300 for every adviser who registers using your code.
              </p>
            </div>
          </div>
        </section>

        {/* COMPACT KPI METRICS ROW */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Available Balance
            </span>
            <p className="text-xl sm:text-2xl font-black text-navy mt-1.5">{inr(availableBalance)}</p>
            <button
              onClick={() => setActiveTab('payouts')}
              className="text-[11px] text-orange-600 font-bold hover:underline mt-1 inline-block"
            >
              Withdraw Funds →
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-orange-600" /> Properties Sold
            </span>
            <p className="text-xl sm:text-2xl font-black text-navy mt-1.5">{data.propertyCommissions?.length || 0}</p>
            <span className="text-[11px] text-muted">
              Earned: {inr(commissionsSummary.approved + commissionsSummary.paid)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Team Joined
            </span>
            <p className="text-xl sm:text-2xl font-black text-navy mt-1.5">{stats.directCount}</p>
            <span className="text-[11px] text-muted">Total Network: {stats.totalTeam}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Joining Rewards
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1.5">
              {inr(regRewardsSummary.approved + regRewardsSummary.paid)}
            </p>
            <span className="text-[11px] text-muted">₹300 per active member</span>
          </div>
        </div>

        {/* CLEAN TAB NAVIGATION */}
        <div className="mt-8 border-b border-line flex gap-2 overflow-x-auto pb-px">
          {[
            ['overview', 'Overview & Ways to Earn'],
            ['team', `Referral Tree (${stats.totalTeam})`],
            ['leads', `Property Leads (${data.leads?.length || 0})`],
            ['profile', 'Profile & KYC Upload'],
            ['payouts', 'Wallet & Payouts'],
          ].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition border-b-2 ${
                activeTab === t
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-muted hover:text-navy hover:border-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW — 2 PRIMARY WAYS TO EARN & VISUAL TREE         */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="mt-6 space-y-8 animate-in fade-in duration-200">
            {/* 2 MAIN CARDS: SELL PROPERTY & MAKE A TEAM */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* WAY 1: SELL PROPERTY */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold uppercase">
                      Way to Earn #1
                    </span>
                    <span className="text-xs font-black text-orange-600">10% Direct Sales Brokerage</span>
                  </div>

                  <h3 className="text-xl font-bold text-navy mt-3">Sell Property</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Refer clients for flats and plots. When a deal is closed, 10% direct commission from company brokerage is instantly credited to your wallet.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-mist/60 border border-line grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold">Properties Closed</span>
                      <p className="text-xl font-black text-navy mt-0.5">{data.propertyCommissions?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold">Commissions</span>
                      <p className="text-xl font-black text-orange-600 mt-0.5">
                        {inr(commissionsSummary.approved + commissionsSummary.paid)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line flex gap-2">
                  <button
                    onClick={() => setLeadModal(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Submit Buyer Lead
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="py-2 px-3 rounded-xl border border-line hover:border-navy text-navy font-semibold text-xs"
                  >
                    View Leads
                  </button>
                </div>
              </div>

              {/* WAY 2: MAKE A TEAM */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                      Way to Earn #2
                    </span>
                    <span className="text-xs font-black text-emerald-700">₹300 Joining Bonus</span>
                  </div>

                  <h3 className="text-xl font-bold text-navy mt-3">Make a Team</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Build your partnership tree. Every member who joins using your referral code earns you ₹300 joining rewards upon approval.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold">Joined by You</span>
                      <p className="text-xl font-black text-navy mt-0.5">{stats.directCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold">Rewards Earned</span>
                      <p className="text-xl font-black text-emerald-700 mt-0.5">
                        {inr(regRewardsSummary.approved + regRewardsSummary.paid)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line flex gap-2">
                  <button
                    onClick={copyReferralLink}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Share Referral Link'}
                  </button>
                  <button
                    onClick={() => setActiveTab('team')}
                    className="py-2 px-3 rounded-xl border border-line hover:border-navy text-navy font-semibold text-xs"
                  >
                    Inspect Tree
                  </button>
                </div>
              </div>
            </div>

            {/* VISUAL HIERARCHY TREE COMPONENT */}
            <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-navy">Your Direct Referral Tree</h3>
                  <p className="text-xs text-muted">Members joined under your code and how many members they have recruited.</p>
                </div>
                <button
                  onClick={() => setActiveTab('team')}
                  className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  Full Network View →
                </button>
              </div>

              {/* Tree Render */}
              <div className="pt-2">
                <ReferralTreeCanvas
                  root={teamTree}
                  referralCode={referralCode}
                  copyReferralLink={copyReferralLink}
                  copied={copied}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: REFERRAL TREE FULL NETWORK                              */}
        {/* ============================================================== */}
        {activeTab === 'team' && (
          <div className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-navy">Complete Referral Network Tree</h2>
                <p className="text-xs text-muted mt-0.5">
                  Visual hierarchy showing every adviser registered under you and their downline counts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-navy bg-mist px-2.5 py-1 rounded-lg">
                  {referralCode}
                </span>
                <button
                  onClick={copyReferralLink}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shadow-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>

            <ReferralTreeCanvas
              root={teamTree}
              referralCode={referralCode}
              copyReferralLink={copyReferralLink}
              copied={copied}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />

            {/* Direct Members Table */}
            {data.registrationRewards?.length > 0 && (
              <div className="pt-4 border-t border-line">
                <h3 className="font-bold text-navy text-sm mb-3">Joining Bonus Ledgers (₹300 / Member)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Member Name</th>
                        <th className="py-2.5 px-3">Registration No</th>
                        <th className="py-2.5 px-3">Level</th>
                        <th className="py-2.5 px-3">Reward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.registrationRewards.map((r: any) => (
                        <tr key={r.id} className="hover:bg-mist/30">
                          <td className="py-2.5 px-3 font-mono text-muted">{fmtDate(r.created_at)}</td>
                          <td className="py-2.5 px-3 font-semibold text-navy">{r.source_adviser_name || 'Member'}</td>
                          <td className="py-2.5 px-3 font-mono text-muted">{r.source_adviser_id}</td>
                          <td className="py-2.5 px-3">Level {r.level}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ₹{r.amount} {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROPERTY LEADS & SALES                                   */}
        {/* ============================================================== */}
        {activeTab === 'leads' && (
          <div className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-navy">Property Leads &amp; Sales</h2>
                <p className="text-xs text-muted mt-0.5">
                  Submit prospective buyers. When a deal closes, 10% direct sales commission is credited.
                </p>
              </div>
              <button
                onClick={() => setLeadModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Submit Buyer Lead
              </button>
            </div>

            {data.leads?.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted border border-dashed border-line rounded-2xl">
                No buyer leads registered yet. Click "Submit Buyer Lead" to log interested clients.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-mist/60 text-muted font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Buyer Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.leads.map((l: any) => (
                      <tr key={l.id} className="hover:bg-mist/30">
                        <td className="py-3 px-4 font-mono text-muted">{fmtDate(l.created_at)}</td>
                        <td className="py-3 px-4 font-bold text-navy">{l.lead_name}</td>
                        <td className="py-3 px-4 text-muted">{l.lead_phone}</td>
                        <td className="py-3 px-4 text-navy">{l.property_title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-mist text-navy">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PROFILE & KYC DOCUMENT UPLOADS                           */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-10 shadow-xs animate-in fade-in duration-200">
            <div className="max-w-3xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                KYC &amp; Verification
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mt-2">
                Adviser Profile &amp; KYC Upload
              </h2>
              <p className="mt-1 text-xs text-muted">
                Upload your Aadhaar Card, PAN Card, Photo, and Bank Details. All documents are securely stored and verified in the Admin Panel.
              </p>

              {docsSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {docsSuccess}
                </div>
              )}

              <form onSubmit={handleSaveDocuments} className="mt-6 space-y-6 text-xs">
                {/* 1. Profile Summary Card */}
                <div className="p-4 rounded-2xl bg-mist/60 border border-line grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted text-[10px] uppercase font-bold">Name</span>
                    <p className="font-bold text-navy truncate">{adviser.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase font-bold">Mobile</span>
                    <p className="font-bold text-navy">{adviser.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase font-bold">Reg No</span>
                    <p className="font-mono font-bold text-orange-600">{adviser.registration_no || adviser.adviser_id}</p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase font-bold">Login Token</span>
                    <p className="font-mono font-bold text-navy">{adviser.token_number || 'N/A'}</p>
                  </div>
                </div>

                {/* 2. Upload Document Cards */}
                <div>
                  <h3 className="font-bold text-sm text-navy mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-600" /> Identity Documents
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Aadhaar Card */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-line hover:border-orange-500 transition text-center bg-mist/20">
                      <span className="font-bold text-navy block text-xs mb-1">Aadhaar Card</span>
                      {docs.aadhar_front ? (
                        <div className="mb-2">
                          <img src={docs.aadhar_front} alt="Aadhaar" className="h-20 w-full object-cover rounded-lg border border-line" />
                          <span className="text-[10px] text-emerald-700 font-bold block mt-1">✓ Uploaded</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-mist text-muted grid place-items-center mx-auto mb-2">
                          <Upload className="w-4 h-4" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer w-full text-[11px]">
                        Choose File
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhar_front')} />
                      </label>
                    </div>

                    {/* PAN Card */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-line hover:border-orange-500 transition text-center bg-mist/20">
                      <span className="font-bold text-navy block text-xs mb-1">PAN Card</span>
                      {docs.pan_card ? (
                        <div className="mb-2">
                          <img src={docs.pan_card} alt="PAN Card" className="h-20 w-full object-cover rounded-lg border border-line" />
                          <span className="text-[10px] text-emerald-700 font-bold block mt-1">✓ Uploaded</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-mist text-muted grid place-items-center mx-auto mb-2">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer w-full text-[11px]">
                        Choose File
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pan_card')} />
                      </label>
                    </div>

                    {/* Passport Photo */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-line hover:border-orange-500 transition text-center bg-mist/20">
                      <span className="font-bold text-navy block text-xs mb-1">Adviser Photo</span>
                      {docs.photo ? (
                        <div className="mb-2">
                          <img src={docs.photo} alt="Photo" className="h-20 w-20 mx-auto object-cover rounded-full border border-line" />
                          <span className="text-[10px] text-emerald-700 font-bold block mt-1">✓ Uploaded</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-mist text-muted grid place-items-center mx-auto mb-2">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer w-full text-[11px]">
                        Choose File
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Bank & Payout Details */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-sm text-navy flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" /> Bank &amp; Payout Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-navy mb-1 text-[11px]">Account Holder Name</label>
                      <input
                        type="text"
                        value={bankDetails.account_holder_name || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, account_holder_name: e.target.value }))}
                        placeholder="Name as per bank account"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-navy mb-1 text-[11px]">Bank Name</label>
                      <input
                        type="text"
                        value={bankDetails.bank_name || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, bank_name: e.target.value }))}
                        placeholder="e.g. State Bank of India, HDFC"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-navy mb-1 text-[11px]">Account Number</label>
                      <input
                        type="text"
                        value={bankDetails.account_number || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, account_number: e.target.value }))}
                        placeholder="Enter account number"
                        className="input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-navy mb-1 text-[11px]">IFSC Code</label>
                      <input
                        type="text"
                        value={bankDetails.ifsc || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        className="input text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-navy mb-1 text-[11px]">UPI ID (Optional)</label>
                      <input
                        type="text"
                        value={bankDetails.upi_id || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, upi_id: e.target.value }))}
                        placeholder="e.g. username@okhdfcbank"
                        className="input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingDocs}
                    className="btn btn-primary text-xs font-bold flex items-center gap-2"
                  >
                    {savingDocs ? 'Saving Details...' : 'Save Profile & KYC Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: WALLET & PAYOUTS                                         */}
        {/* ============================================================== */}
        {activeTab === 'payouts' && (
          <div className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-navy">Wallet &amp; Payouts</h2>
                <p className="text-xs text-muted mt-0.5">
                  Direct withdrawal of earned referral bonuses and property commissions to your bank account.
                </p>
              </div>
              <button
                onClick={() => setPayoutModal(true)}
                disabled={availableBalance <= 0}
                className="btn btn-primary text-xs font-bold disabled:opacity-50"
              >
                Request Withdrawal ({inr(availableBalance)})
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-orange-900 uppercase">Available for Withdrawal:</span>
                <p className="text-2xl font-black text-orange-700">{inr(availableBalance)}</p>
              </div>
              <span className="text-xs text-muted">Settled via NEFT / UPI to registered bank</span>
            </div>

            {data.payouts?.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted border border-dashed border-line rounded-2xl">
                No withdrawal requests submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-mist/60 text-muted font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.payouts.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-mono text-muted">{fmtDate(p.created_at)}</td>
                        <td className="py-3 px-4 font-bold text-navy">{inr(p.amount)}</td>
                        <td className="py-3 px-4 uppercase">{p.payment_method}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-mist text-navy">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADVISER FLOATING SPINNER MENU (Home, Dashboard, Profile, Contact) */}
      <AdviserSpinner activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* ---------------- SUBMIT LEAD MODAL ---------------- */}
      {leadModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-line">
            <h3 className="text-xl font-bold text-navy">Submit Buyer Lead</h3>
            <p className="text-xs text-muted mt-0.5">Enter client information to register this buyer under your code.</p>

            {leadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {leadSuccess}
              </div>
            )}

            <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-navy mb-1">Buyer Name *</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Full name of interested client"
                  className="input text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-navy mb-1">Buyer Mobile *</label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="input text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-navy mb-1">Property Requirement *</label>
                <select
                  value={leadPropertyTitle}
                  onChange={(e) => setLeadPropertyTitle(e.target.value)}
                  className="input text-xs"
                >
                  <option value="Umroli Project (Flats)">Umroli Project (Flats)</option>
                  <option value="Residential Plots">Residential Plots</option>
                  <option value="Commercial Land Parcels">Commercial Land Parcels</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-navy mb-1">Notes (Optional)</label>
                <textarea
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Budget, preferred visit date..."
                  rows={2}
                  className="input text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="btn btn-primary flex-1 text-xs font-bold"
                >
                  {submittingLead ? 'Submitting...' : 'Register Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeadModal(false)}
                  className="btn btn-outline text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- PAYOUT REQUEST MODAL ---------------- */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-line">
            <h3 className="text-xl font-bold text-navy">Request Withdrawal</h3>
            <p className="text-xs text-muted mt-0.5">Available balance: <b>{inr(availableBalance)}</b></p>

            {payoutSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {payoutSuccess}
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-navy mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter withdrawal amount"
                  className="input text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-navy mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="input text-xs"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI Transfer</option>
                  <option value="cash">Cash Collection at Office</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="btn btn-primary flex-1 text-xs font-bold"
                >
                  {submittingPayout ? 'Submitting...' : 'Confirm Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutModal(false)}
                  className="btn btn-outline text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Clean, interactive Tree Canvas showing:
 * 1. Root Leader (You)
 * 2. Everyone joined under you (Level 1)
 * 3. Exact count of how many members each person has joined under them!
 * 4. Expandable Level 2 nodes
 */
function ReferralTreeCanvas({
  root,
  referralCode,
  copyReferralLink,
  copied,
  expandedNodes,
  toggleNode,
}: {
  root: any;
  referralCode: string;
  copyReferralLink: () => void;
  copied: boolean;
  expandedNodes: Record<string, boolean>;
  toggleNode: (id: string) => void;
}) {
  const children = root?.children || [];

  return (
    <div className="rounded-3xl bg-neutral-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-neutral-800">
      {/* Tree Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30">
            Adviser Tree
          </span>
          <h3 className="text-xl font-bold mt-1.5">Network Downline</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-400">
            Direct Members: <b className="text-emerald-400 font-mono">{root?.directCount || 0}</b>
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400">
            Total Team: <b className="text-white font-mono">{root?.totalTeam || 0}</b>
          </span>
        </div>
      </div>

      {/* Visual Tree Layout */}
      <div className="mt-8 flex flex-col items-center">
        {/* ROOT NODE: You */}
        <div className="w-full max-w-xs p-4 rounded-2xl bg-white/10 border-2 border-orange-500 text-center relative shadow-lg">
          <span className="inline-block px-2 py-0.5 rounded-full bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider mb-1">
            You (Root)
          </span>
          <h4 className="text-sm font-bold text-white">{root?.full_name}</h4>
          <p className="font-mono text-xs text-orange-400 font-bold">{root?.registration_no}</p>
          <div className="mt-2 pt-2 border-t border-white/10 flex justify-around text-xs">
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">Direct Joined</span>
              <span className="font-black text-emerald-400 text-xs">{root?.directCount || 0}</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">Total Network</span>
              <span className="font-black text-white text-xs">{root?.totalTeam || 0}</span>
            </div>
          </div>
        </div>

        {/* Stem Line down from root */}
        <div className="w-0.5 h-6 bg-orange-500" />

        {/* EMPTY STATE */}
        {children.length === 0 ? (
          <div className="w-full max-w-sm p-5 rounded-2xl bg-white/5 border border-dashed border-white/20 text-center text-xs text-neutral-400 space-y-2.5">
            <p className="font-semibold text-white">No members have joined under you yet.</p>
            <p className="text-[11px] text-neutral-400">
              Share your referral code <b className="text-orange-400 font-mono">{referralCode}</b> with advisers to build your team.
            </p>
            <button
              onClick={copyReferralLink}
              className="btn btn-sm btn-primary text-xs inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Referral Link'}
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Horizontal branch line */}
            <div className="hidden sm:block w-3/4 max-w-xl h-0.5 bg-neutral-700 mx-auto" />

            {/* LEVEL 1 CARDS */}
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((c: any) => {
                const isExpanded = !!expandedNodes[c.adviser_id];
                const subChildren = c.children || [];
                const hasSub = subChildren.length > 0;

                return (
                  <div
                    key={c.adviser_id}
                    className="p-3.5 rounded-2xl bg-white/10 border border-white/15 hover:border-orange-400 transition shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase">
                          Direct Member
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <h5 className="font-bold text-white text-sm mt-1.5">{c.full_name}</h5>
                      <p className="font-mono text-xs text-neutral-300">{c.registration_no || c.adviser_id}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Mobile: {c.phone}</p>

                      {/* HOW MANY MEMBERS JOINED UNDER HIM */}
                      <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400">Members under him:</span>
                        <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          {c.directCount || 0} members
                        </span>
                      </div>
                    </div>

                    {/* DOWNLINE EXPANDER */}
                    {hasSub && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => toggleNode(c.adviser_id)}
                          className="w-full text-center py-1 rounded-lg bg-white/5 hover:bg-white/10 text-orange-400 font-bold text-[10px] transition flex items-center justify-center gap-1"
                        >
                          {isExpanded ? 'Hide' : 'View'} Downline ({subChildren.length})
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 pl-2.5 border-l-2 border-orange-500/40">
                            {subChildren.map((sub: any) => (
                              <div key={sub.adviser_id} className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-[10px]">
                                <div className="flex justify-between font-semibold text-white">
                                  <span>{sub.full_name}</span>
                                  <span className="font-mono text-orange-400">{sub.registration_no}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400 text-[9px]">
                                  <span>{sub.phone}</span>
                                  <span>Team: {sub.directCount || 0}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
