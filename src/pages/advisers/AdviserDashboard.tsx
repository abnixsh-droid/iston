import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LogOut,
  User,
  Upload,
  FileText,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  PhoneCall,
  Share2,
} from 'lucide-react';
import { adviserService, type AdviserRecord, getStoredAdviserAuth, setStoredAdviserAuth } from '../../lib/adviserService';
import { api } from '../../lib/api';
import { fmtDate, inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';

export default function AdviserDashboard() {
  const navigate = useNavigate();

  const [session, setSession] = useState<AdviserRecord | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Active tab: 'overview' (Ways to Earn: Sell Property & Make Team) | 'profile' | 'leads' | 'team' | 'payouts'
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'leads' | 'team' | 'payouts'>('overview');

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

  useSeo('Adviser Dashboard — Iston Builder Group', 'Adviser portal for property selling, team referral network, and earnings.');

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
    const currentAuth = getStoredAdviserAuth();
    if (!currentAuth || currentAuth.status !== 'active') {
      navigate('/advisers-program', { replace: true });
      return;
    }
    setSession(currentAuth);
    fetchDashboard(currentAuth);
  }, []);

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
        setDocsSuccess('Documents and Bank Details updated successfully. Visible to Admin Panel.');
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
      setLeadSuccess('Buyer lead submitted successfully! Sales team will follow up.');
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadNotes('');
      if (session) fetchDashboard(session);
      setTimeout(() => setLeadModal(false), 1800);
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
      setPayoutSuccess('Payout request submitted for admin review.');
      setPayoutAmount('');
      if (session) fetchDashboard(session);
      setTimeout(() => setPayoutModal(false), 1800);
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
        <p className="mt-3 text-sm font-semibold text-neutral-800">Loading Adviser Portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-neutral-50">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center border border-neutral-200 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900 mt-4">Dashboard Unavailable</h2>
          <p className="mt-2 text-xs text-neutral-500">{error}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button onClick={() => session && fetchDashboard(session)} className="btn btn-primary btn-sm">
              Retry
            </button>
            <button onClick={handleSignOut} className="btn btn-outline btn-sm">
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

  return (
    <div className="min-h-screen bg-neutral-100/70 py-6 md:py-10 text-neutral-900">
      <div className="container-x max-w-7xl">
        {/* TOP BRAND & PROFILE BAR */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 text-neutral-900 font-bold">
              <img
                src="/images/logo.jpg"
                alt="Iston Builder Group logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-neutral-200"
              />
              <span className="leading-tight">
                <span className="block text-base font-bold tracking-tight text-neutral-900">ISTON</span>
                <span className="block text-[8px] font-bold tracking-[0.25em] uppercase text-orange-600">Adviser Dashboard</span>
              </span>
            </Link>

            <span className="hidden sm:inline-block w-px h-6 bg-neutral-200 mx-1" />

            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Adviser
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition ${
                activeTab === 'profile' ? 'bg-orange-600 text-white border-orange-600' : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border-neutral-200'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Profile &amp; KYC
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-1 transition"
              title="Sign out of adviser session"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* TOP ADVISER IDENTITY HEADER */}
        <div className="rounded-[2.5rem] bg-neutral-900 p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                  Reg No: {adviser.registration_no || adviser.adviser_id}
                </span>
                {adviser.token_number && (
                  <span className="font-mono text-xs font-bold tracking-wider px-3 py-1 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                    Token: {adviser.token_number}
                  </span>
                )}
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Approved
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">{adviser.full_name}</h1>
              <p className="mt-1 text-xs text-neutral-400">
                Mobile: {adviser.phone} · Sponsor: {adviser.sponsor_id || 'Root'} · Joined {fmtDate(adviser.created_at)}
              </p>
            </div>

            {/* Shareable Referral Link Widget */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 max-w-md w-full">
              <p className="text-[11px] font-bold tracking-wider text-orange-400 uppercase flex items-center justify-between">
                <span>Your Shareable Referral Code</span>
                <span className="text-white font-mono text-xs font-black">{referralCode}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-black/40 text-white text-xs px-3 py-2 rounded-xl font-mono truncate border border-white/10 focus:outline-hidden select-all"
                />
                <button
                  onClick={copyReferralLink}
                  className="btn btn-sm shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-neutral-400">
                Earn ₹300 for every adviser who registers with your referral code.
              </p>
            </div>
          </div>
        </div>

        {/* DASHBOARD TABS NAVIGATION */}
        <div className="mt-8 border-b border-neutral-300 flex gap-2 overflow-x-auto pb-px">
          {[
            ['overview', 'Main Dashboard (Ways to Earn)'],
            ['profile', 'Profile & Upload Documents'],
            ['leads', `Property Leads & Sales (${data.leads?.length || 0})`],
            ['team', `Referral Team (${stats.totalTeam})`],
            ['payouts', `Payouts & Wallet (${inr(availableBalance)})`],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition border-b-2 ${
                activeTab === tab
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MAIN DASHBOARD — 2 BIG OPTIONS: SELL PROPERTY & MAKE TEAM */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="mt-8 space-y-8 animate-in fade-in duration-200">
            {/* FINANCIAL STATS SUMMARY ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-orange-600" /> Property Sold
                </span>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  {data.propertyCommissions?.length || 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Sales commission: {inr(commissionsSummary.approved + commissionsSummary.paid)}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" /> Team Joined
                </span>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  {stats.directCount}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {stats.totalTeam} total network members
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-orange-600" /> Joining Rewards
                </span>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  {inr(regRewardsSummary.approved + regRewardsSummary.paid)}
                </p>
                <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  ₹300 per active direct referral
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-orange-600 text-white shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-200">
                    Available Wallet Balance
                  </span>
                  <p className="text-2xl sm:text-3xl font-black mt-2">{inr(availableBalance)}</p>
                </div>
                <button
                  onClick={() => setPayoutModal(true)}
                  disabled={availableBalance <= 0}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-white text-orange-900 hover:bg-neutral-100 text-xs font-bold transition disabled:opacity-50"
                >
                  Request Payout
                </button>
              </div>
            </div>

            {/* 2 MAIN SCREEN PROMINENT OPTIONS */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* OPTION 1: WAYS TO EARN — SELL PROPERTY */}
              <div className="rounded-3xl border-2 border-orange-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-black uppercase tracking-wider">
                      Way to Earn #1
                    </span>
                    <span className="text-xs font-bold text-orange-600">10% Direct Commission</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3">
                    Sell Property
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Earn high-ticket commissions by introducing buyers for Iston residential apartments, flats, and commercial land parcels.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">Properties Sold by You</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1">{data.propertyCommissions?.length || 0}</p>
                      <span className="text-[10px] text-orange-700">Closed deals</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">Sales Commission</span>
                      <p className="text-2xl font-black text-orange-600 mt-1">{inr(commissionsSummary.approved + commissionsSummary.paid)}</p>
                      <span className="text-[10px] text-neutral-500">10% direct rate</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
                    <p className="font-bold text-neutral-800">Featured Properties Ready to Sell:</p>
                    <p className="text-neutral-600">• Umroli Project (1 BHK &amp; 2 BHK High-Efficiency Residences)</p>
                    <p className="text-neutral-600">• Clear Title Commercial &amp; Residential Plots</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => setLeadModal(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Submit Buyer Lead
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition"
                  >
                    View Sales &amp; Leads
                  </button>
                </div>
              </div>

              {/* OPTION 2: WAYS TO EARN — MAKE A TEAM */}
              <div className="rounded-3xl border-2 border-emerald-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                      Way to Earn #2
                    </span>
                    <span className="text-xs font-bold text-emerald-700">₹300 Joining Bonus</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3">
                    Make a Team
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Build your partner hierarchy by sharing your referral code. Earn instant ₹300 joining rewards for each directly registered adviser upon approval.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">Joined by Your Code</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1">{stats.directCount}</p>
                      <span className="text-[10px] text-emerald-700">Direct advisers</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">Joining Bonus Earned</span>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{inr(regRewardsSummary.approved + regRewardsSummary.paid)}</p>
                      <span className="text-[10px] text-neutral-500">₹300 / referral</span>
                    </div>
                  </div>

                  {/* Share Code Widget */}
                  <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase">Your Referral Code:</span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-emerald-800 tracking-wider">{referralCode}</span>
                      <button
                        onClick={copyReferralLink}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Share Link'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('team')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-4 h-4 text-emerald-400" /> View Team Network ({stats.totalTeam})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PROFILE MENU & DOCUMENT UPLOADS (AADHAAR, PAN, PHOTO)   */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm animate-in fade-in duration-200">
            <div className="max-w-3xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                KYC &amp; Verification
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-2">
                Adviser Profile &amp; Document Upload
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Upload your Aadhaar Card, PAN Card, Photo, and Bank Details. All uploaded documents are securely displayed in the Admin Panel for compliance and direct commission settlements.
              </p>

              {docsSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {docsSuccess}
                </div>
              )}

              <form onSubmit={handleSaveDocuments} className="mt-8 space-y-8 text-xs">
                {/* 1. PERSONAL INFORMATION SUMMARY */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <h3 className="font-bold text-sm text-neutral-900">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-600">
                    <p><b className="text-neutral-800">Name (as per Aadhaar):</b> {adviser.full_name}</p>
                    <p><b className="text-neutral-800">Mobile Number:</b> {adviser.phone}</p>
                    <p><b className="text-neutral-800">Registration Number:</b> <span className="font-mono text-orange-600 font-bold">{adviser.registration_no || adviser.adviser_id}</span></p>
                    <p><b className="text-neutral-800">Token Number:</b> <span className="font-mono text-neutral-900">{adviser.token_number || 'N/A'}</span></p>
                  </div>
                </div>

                {/* 2. DOCUMENT UPLOADS */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-600" /> Identity Documents (Aadhaar, PAN &amp; Photo)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Aadhaar Card */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-orange-500 transition text-center bg-neutral-50/50">
                      <span className="font-bold text-neutral-800 block mb-1">Aadhaar Card</span>
                      <p className="text-[10px] text-neutral-400 mb-3">Front or combined scan</p>
                      {docs.aadhar_front ? (
                        <div className="mb-3 relative group">
                          <img src={docs.aadhar_front} alt="Aadhaar" className="h-24 w-full object-cover rounded-lg border" />
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">✓ Document Selected</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer w-full text-[11px]">
                        Choose File
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhar_front')} />
                      </label>
                    </div>

                    {/* PAN Card */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-orange-500 transition text-center bg-neutral-50/50">
                      <span className="font-bold text-neutral-800 block mb-1">PAN Card</span>
                      <p className="text-[10px] text-neutral-400 mb-3">Clear photo of PAN</p>
                      {docs.pan_card ? (
                        <div className="mb-3 relative group">
                          <img src={docs.pan_card} alt="PAN Card" className="h-24 w-full object-cover rounded-lg border" />
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">✓ Document Selected</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                          <CreditCard className="w-5 h-5" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer w-full text-[11px]">
                        Choose File
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pan_card')} />
                      </label>
                    </div>

                    {/* Passport Photo */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-orange-500 transition text-center bg-neutral-50/50">
                      <span className="font-bold text-neutral-800 block mb-1">Adviser Photo</span>
                      <p className="text-[10px] text-neutral-400 mb-3">Passport size photo</p>
                      {docs.photo ? (
                        <div className="mb-3 relative group">
                          <img src={docs.photo} alt="Photo" className="h-24 w-24 mx-auto object-cover rounded-full border" />
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">✓ Photo Selected</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer w-full text-[11px]">
                        Choose File
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. BANK DETAILS */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" /> Bank &amp; UPI Details (For Payouts)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={bankDetails.account_holder_name || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, account_holder_name: e.target.value }))}
                        placeholder="Name as per bank account"
                        className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankDetails.bank_name || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, bank_name: e.target.value }))}
                        placeholder="e.g. State Bank of India, HDFC"
                        className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={bankDetails.account_number || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, account_number: e.target.value }))}
                        placeholder="Enter bank account number"
                        className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={bankDetails.ifsc || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-orange-500 uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-neutral-800 mb-1">UPI ID (Optional)</label>
                      <input
                        type="text"
                        value={bankDetails.upi_id || ''}
                        onChange={(e) => setBankDetails((b) => ({ ...b, upi_id: e.target.value }))}
                        placeholder="e.g. yourname@okhdfcbank"
                        className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingDocs}
                    className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingDocs ? 'Saving Details...' : 'Save Documents & Bank Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROPERTY LEADS & SALES                                   */}
        {/* ============================================================== */}
        {activeTab === 'leads' && (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Property Leads &amp; Sales Ledger</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Submit leads for interested buyers. When a deal closes, 10% direct sales brokerage is credited to you.
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
              <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
                No buyer leads submitted yet. Click "Submit Buyer Lead" to register interested buyers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Buyer Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Property Interested</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.leads.map((l: any) => (
                      <tr key={l.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4 font-mono text-neutral-500">{fmtDate(l.created_at)}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{l.lead_name}</td>
                        <td className="py-3 px-4 text-neutral-600">{l.lead_phone}</td>
                        <td className="py-3 px-4 text-neutral-800">{l.property_title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800">
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
        {/* TAB 4: REFERRAL TEAM NETWORK                                    */}
        {/* ============================================================== */}
        {activeTab === 'team' && (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Your Referral Hierarchy</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Advisers who joined using your referral code <b>{referralCode}</b>. Direct referrals earn you ₹300 joining reward upon approval.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                <span className="text-[10px] font-bold uppercase text-neutral-500">Direct Referrals (Level 1)</span>
                <p className="text-2xl font-black text-neutral-900 mt-1">{stats.directCount}</p>
                <span className="text-[10px] text-emerald-700 font-semibold">Earn ₹300 / each</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                <span className="text-[10px] font-bold uppercase text-neutral-500">Total Network Size</span>
                <p className="text-2xl font-black text-neutral-900 mt-1">{stats.totalTeam}</p>
                <span className="text-[10px] text-neutral-500">Across all downline levels</span>
              </div>
            </div>

            {stats.directCount === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
                No team members joined yet. Share your referral link to build your team.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Adviser Name</th>
                      <th className="py-3 px-4">Registration No</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Reward Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.registrationRewards.map((r: any) => (
                      <tr key={r.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4 font-mono text-neutral-500">{fmtDate(r.created_at)}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{r.source_adviser_name || 'Team Adviser'}</td>
                        <td className="py-3 px-4 font-mono text-neutral-700">{r.source_adviser_id}</td>
                        <td className="py-3 px-4 font-semibold text-neutral-800">Level {r.level}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            ₹{r.amount} {r.status}
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
        {/* TAB 5: PAYOUTS & WALLET                                         */}
        {/* ============================================================== */}
        {activeTab === 'payouts' && (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Wallet &amp; Payout Requests</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Withdraw earned property commissions and joining bonuses directly to your verified bank account.
                </p>
              </div>
              <button
                onClick={() => setPayoutModal(true)}
                disabled={availableBalance <= 0}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shadow-xs disabled:opacity-50"
              >
                Request Payout ({inr(availableBalance)})
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-900 uppercase">Available for Withdrawal:</span>
                <p className="text-2xl font-black text-orange-600">{inr(availableBalance)}</p>
              </div>
              <span className="text-xs text-neutral-500">Processed to bank within 24-48 business hours</span>
            </div>

            {data.payouts?.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
                No payout requests made yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.payouts.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-mono text-neutral-500">{fmtDate(p.created_at)}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{inr(p.amount)}</td>
                        <td className="py-3 px-4 uppercase">{p.payment_method}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800">
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

      {/* ---------------- SUBMIT LEAD MODAL ---------------- */}
      {leadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200">
            <h3 className="text-xl font-bold text-neutral-900">Submit Buyer Lead</h3>
            <p className="text-xs text-neutral-500 mt-1">Enter buyer information to log this client under your adviser code.</p>

            {leadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {leadSuccess}
              </div>
            )}

            <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Buyer Name *</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Full name of interested client"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Buyer Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Property Interested *</label>
                <select
                  value={leadPropertyTitle}
                  onChange={(e) => setLeadPropertyTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Umroli Project (Flats)">Umroli Project (Flats)</option>
                  <option value="Residential Plots">Residential Plots</option>
                  <option value="Commercial Land Parcels">Commercial Land Parcels</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes / Requirement</label>
                <textarea
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Budget, BHK requirement, preferred site visit time..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {submittingLead ? 'Submitting...' : 'Register Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeadModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-600 font-semibold text-xs hover:bg-neutral-50"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200">
            <h3 className="text-xl font-bold text-neutral-900">Request Wallet Withdrawal</h3>
            <p className="text-xs text-neutral-500 mt-1">Available balance: <b>{inr(availableBalance)}</b></p>

            {payoutSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {payoutSuccess}
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Payment Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500"
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
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {submittingPayout ? 'Submitting...' : 'Confirm Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-600 font-semibold text-xs hover:bg-neutral-50"
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
