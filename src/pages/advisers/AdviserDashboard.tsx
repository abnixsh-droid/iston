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
  AlertCircle,
  Loader2,
  LogOut,
  User,
  Upload,
  FileText,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { adviserService, type AdviserRecord, getStoredAdviserAuth, setStoredAdviserAuth } from '../../lib/adviserService';
import { api } from '../../lib/api';
import { inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';
import AdviserSpinner from '../../components/AdviserSpinner';
import AdviserPlanModal from '../../components/AdviserPlanModal';

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

  // Plan Deck Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);

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
      } else {
        // Safe fallback from local session auth so user is NEVER logged out
        setData({
          ok: true,
          adviser: auth,
          stats: {
            directCount: 0,
            totalTeam: 0,
            levelCounts: {},
            teamTree: {
              adviser_id: auth.adviser_id,
              registration_no: auth.registration_no || auth.adviser_id,
              full_name: auth.full_name,
              directCount: 0,
              totalTeam: 0,
              children: [],
            },
          },
          regRewardsSummary: { pending: 0, approved: 0, paid: 0, reversed: 0, total: 0 },
          commissionsSummary: { pending: 0, approved: 0, paid: 0, reversed: 0, total: 0 },
          availableBalance: 0,
          registrationRewards: [],
          propertyCommissions: [],
          leads: [],
          payouts: [],
        });
        setDocs(auth.documents || {});
        setBankDetails(auth.bank_details || {});
      }
    } catch (err: any) {
      setData({
        ok: true,
        adviser: auth,
        stats: {
          directCount: 0,
          totalTeam: 0,
          levelCounts: {},
          teamTree: {
            adviser_id: auth.adviser_id,
            registration_no: auth.registration_no || auth.adviser_id,
            full_name: auth.full_name,
            directCount: 0,
            totalTeam: 0,
            children: [],
          },
        },
        regRewardsSummary: { pending: 0, approved: 0, paid: 0, reversed: 0, total: 0 },
        commissionsSummary: { pending: 0, approved: 0, paid: 0, reversed: 0, total: 0 },
        availableBalance: 0,
        registrationRewards: [],
        propertyCommissions: [],
        leads: [],
        payouts: [],
      });
      setDocs(auth.documents || {});
      setBankDetails(auth.bank_details || {});
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
    if (!currentAuth) {
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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#faf8f5] text-[#121212]">
        <Loader2 className="h-9 w-9 animate-spin text-[#96742e]" />
        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-[#777] uppercase">Loading Adviser Portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf8f5]">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center border border-[#ded8cc] shadow-xl text-[#121212]">
          <AlertCircle className="w-10 h-10 text-[#96742e] mx-auto" />
          <h2 className="font-serif text-2xl font-bold mt-4">Dashboard Unavailable</h2>
          <p className="mt-1 text-xs text-[#666]">{error}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button
              onClick={() => session && fetchDashboard(session)}
              className="px-5 py-2.5 rounded-xl bg-[#121212] text-[#faf8f5] font-bold text-xs uppercase tracking-wider"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-xl border border-[#ded8cc] text-[#121212] hover:bg-[#f5f2ea] font-semibold text-xs"
            >
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
    <div className="min-h-screen bg-[#faf8f5] py-6 md:py-10 text-[#121212] relative overflow-hidden font-sans select-none">
      {/* Subtle architectural background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5dfd3_1px,transparent_1px),linear-gradient(to_bottom,#e5dfd3_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />

      <div className="container-x max-w-6xl relative z-10 px-4 sm:px-6 mx-auto">
        {/* TOP BRAND HEADER */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-[#ded8cc] shadow-xs">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="Iston Builder Group logo"
                className="h-10 w-10 rounded-xl object-contain ring-1 ring-[#ded8cc] p-1 bg-[#f5f2ea]"
              />
              <div className="leading-tight">
                <span className="block text-sm font-serif font-black tracking-tight text-[#121212]">ISTON BUILDER GROUP</span>
                <span className="block text-[9px] font-bold tracking-[0.2em] uppercase text-[#96742e]">Private Adviser Portal</span>
              </div>
            </Link>

            <span className="hidden sm:inline-block w-px h-6 bg-[#ded8cc] mx-2" />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4fbf7] text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Adviser
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#96742e] hover:text-[#7d5f22] bg-[#f5f0e4] border border-[#ded5c0] px-3.5 py-2 rounded-full transition shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" /> View Adviser Plan
            </button>
            <Link
              to="/"
              className="text-xs font-semibold text-[#555] hover:text-[#121212] px-3 py-2 rounded-full border border-[#ded8cc] hover:bg-[#f5f2ea] transition"
            >
              Back to Site
            </Link>
          </div>
        </header>

        {/* HERO ADVISER PROFILE BANNER */}
        <section className="rounded-3xl bg-white border border-[#ded8cc] p-6 sm:p-8 text-[#121212] shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider px-3 py-1 rounded-full bg-[#f5f2ea] text-[#121212] border border-[#ded8cc]">
                  Reg No: {adviser.registration_no || adviser.adviser_id}
                </span>
                {adviser.token_number && (
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#faf8f5] text-[#555] border border-[#ded8cc]">
                    Token: {adviser.token_number}
                  </span>
                )}
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Verified Adviser
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-bold mt-3 tracking-tight text-[#121212]">
                {adviser.full_name}
              </h1>
              <p className="mt-1 text-xs text-[#666]">
                Mobile: <span className="text-[#121212] font-semibold">{adviser.phone}</span> · Sponsor:{' '}
                <span className="text-[#96742e] font-semibold">{adviser.sponsor_id || 'Direct'}</span>
              </p>
            </div>

            {/* Quick Share Referral Box */}
            <div className="rounded-2xl border border-[#ded8cc] bg-[#faf8f5] p-4 max-w-sm w-full">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666] font-medium">Your Referral Code:</span>
                <span className="font-mono font-black text-[#121212] text-sm bg-white px-2.5 py-0.5 rounded border border-[#ded8cc]">
                  {referralCode}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-white text-[#121212] text-xs px-3 py-2 rounded-xl font-mono truncate border border-[#ded8cc] focus:outline-hidden select-all"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-3.5 py-2 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#777]">
                Earn ₹200 direct referral rewards for every active adviser who joins under your code.
              </p>
            </div>
          </div>
        </section>

        {/* 4 KPI METRICS ROW */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-5 rounded-2xl bg-white border border-[#ded8cc] shadow-xs">
            <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#96742e]" /> Available Balance
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#121212] mt-2">{inr(availableBalance)}</p>
            <button
              onClick={() => setActiveTab('payouts')}
              className="text-xs text-[#96742e] hover:text-[#7d5f22] font-bold hover:underline mt-2 inline-flex items-center gap-1"
            >
              Withdraw Funds <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#ded8cc] shadow-xs">
            <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#96742e]" /> Properties Sold
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#121212] mt-2">{data.propertyCommissions?.length || 0}</p>
            <span className="text-xs text-[#666] block mt-1">
              Earned: <b className="text-[#121212]">{inr(commissionsSummary.approved + commissionsSummary.paid)}</b>
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#ded8cc] shadow-xs">
            <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#96742e]" /> Direct Members
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#121212] mt-2">{stats.directCount}</p>
            <span className="text-xs text-[#666] block mt-1">Total Network: <b className="text-[#121212]">{stats.totalTeam}</b></span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#ded8cc] shadow-xs">
            <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Joining Rewards
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              {inr(regRewardsSummary.approved + regRewardsSummary.paid)}
            </p>
            <span className="text-xs text-[#666] block mt-1">₹300 self + ₹200/referral</span>
          </div>
        </div>

        {/* TAB NAVIGATION PILLS */}
        <div className="mt-8 border-b border-[#ded8cc] flex gap-2 overflow-x-auto pb-3">
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
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition rounded-xl ${
                activeTab === t
                  ? 'bg-[#121212] text-[#faf8f5] shadow-xs'
                  : 'bg-white hover:bg-[#f5f2ea] text-[#666] hover:text-[#121212] border border-[#ded8cc]'
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
              <div className="rounded-3xl border border-[#ded8cc] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#f5f2ea] text-[#96742e] border border-[#ded5c0] text-[10px] font-bold uppercase tracking-wider">
                      Way to Earn #1
                    </span>
                    <span className="text-xs font-black text-[#96742e]">10% Direct Sales Brokerage</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#121212] mt-3">Sell Property</h3>
                  <p className="text-xs text-[#666] mt-1 leading-relaxed">
                    Refer buyers for premium flats and plots. When a deal is closed, 10% direct brokerage commission is credited to your wallet, with multi-level overrides up to Level 6.
                  </p>

                  <div className="mt-4 p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#777] uppercase font-semibold">Properties Closed</span>
                      <p className="text-xl font-black text-[#121212] mt-0.5">{data.propertyCommissions?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777] uppercase font-semibold">Commissions</span>
                      <p className="text-xl font-black text-[#96742e] mt-0.5">
                        {inr(commissionsSummary.approved + commissionsSummary.paid)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f0ece1] flex gap-2">
                  <button
                    onClick={() => setLeadModal(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Submit Buyer Lead
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="py-2.5 px-4 rounded-xl border border-[#ded8cc] hover:bg-[#f5f2ea] text-[#121212] font-semibold text-xs transition"
                  >
                    View Leads
                  </button>
                </div>
              </div>

              {/* WAY 2: MAKE A TEAM */}
              <div className="rounded-3xl border border-[#ded8cc] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#f4fbf7] text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                      Way to Earn #2
                    </span>
                    <span className="text-xs font-black text-emerald-700">₹200 Referral + Tier Overrides</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#121212] mt-3">Make a Team</h3>
                  <p className="text-xs text-[#666] mt-1 leading-relaxed">
                    Build your partnership network. Direct recruits earn you ₹200, Level 2 recruits earn you ₹100, and Level 3+ earn you ₹50 automatically.
                  </p>

                  <div className="mt-4 p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#777] uppercase font-semibold">Direct Recruits</span>
                      <p className="text-xl font-black text-[#121212] mt-0.5">{stats.directCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777] uppercase font-semibold">Rewards Earned</span>
                      <p className="text-xl font-black text-emerald-700 mt-0.5">
                        {inr(regRewardsSummary.approved + regRewardsSummary.paid)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f0ece1] flex gap-2">
                  <button
                    onClick={copyReferralLink}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied Link' : 'Share Referral Link'}
                  </button>
                  <button
                    onClick={() => setActiveTab('team')}
                    className="py-2.5 px-4 rounded-xl border border-[#ded8cc] hover:bg-[#f5f2ea] text-[#121212] font-semibold text-xs transition"
                  >
                    Inspect Tree
                  </button>
                </div>
              </div>
            </div>

            {/* VISUAL HIERARCHY TREE COMPONENT */}
            <div className="rounded-3xl border border-[#ded8cc] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#121212]">Your Direct Referral Network</h3>
                  <p className="text-xs text-[#666] mt-1">Partners joined under your code and downline branches.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlanModalOpen(true)}
                    className="text-xs font-bold text-[#96742e] hover:text-[#7d5f22] bg-[#f5f0e4] border border-[#ded5c0] px-3 py-1.5 rounded-full transition flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Commission Rules
                  </button>
                  <button
                    onClick={() => setActiveTab('team')}
                    className="text-xs font-bold text-[#121212] hover:underline flex items-center gap-1"
                  >
                    Full View →
                  </button>
                </div>
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
        {/* TAB 2: TEAM / NETWORK (TREE FULL VIEW)                         */}
        {/* ============================================================== */}
        {activeTab === 'team' && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-[#ded8cc] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f0ece1]">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#121212]">Complete Network Tree</h3>
                  <p className="text-xs text-[#666] mt-1">
                    Multi-level transparency down your entire team. Expand any partner to inspect their direct recruits.
                  </p>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs flex items-center gap-2 self-start"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Share Referral Link'}
                </button>
              </div>

              <div className="pt-6">
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
        {/* TAB 3: LEADS (SUBMIT BUYER LEAD & VIEW STATUS)                 */}
        {/* ============================================================== */}
        {activeTab === 'leads' && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-[#ded8cc] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f0ece1]">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#121212]">Registered Property Leads</h3>
                  <p className="text-xs text-[#666] mt-1">
                    Register prospective property buyers. Once the deal concludes, your 10% brokerage is credited automatically.
                  </p>
                </div>
                <button
                  onClick={() => setLeadModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" /> Submit Buyer Lead
                </button>
              </div>

              <div className="mt-6">
                {(!data.leads || data.leads.length === 0) ? (
                  <div className="py-12 text-center text-xs text-[#777] space-y-3">
                    <Building className="w-10 h-10 text-[#ded8cc] mx-auto" />
                    <p className="font-semibold text-[#121212]">No property leads registered yet.</p>
                    <p>Submit client details to ensure you receive your sales brokerage upon closure.</p>
                    <button
                      onClick={() => setLeadModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#121212] text-[#faf8f5] font-bold text-xs inline-block"
                    >
                      Register First Lead
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#ded8cc] text-[#777] uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-3">Client Name</th>
                          <th className="py-3 px-3">Contact</th>
                          <th className="py-3 px-3">Property Interest</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ece1]">
                        {data.leads.map((l: any) => (
                          <tr key={l.lead_id} className="hover:bg-[#faf8f5]">
                            <td className="py-3 px-3 font-bold text-[#121212]">{l.lead_name}</td>
                            <td className="py-3 px-3 text-[#555]">{l.lead_phone}</td>
                            <td className="py-3 px-3 text-[#121212]">{l.property_title || 'General Enquiry'}</td>
                            <td className="py-3 px-3">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#f5f2ea] text-[#96742e] border border-[#ded5c0] font-bold text-[10px] uppercase">
                                {l.status || 'Received'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#777]">{l.created_at?.split('T')[0] || 'Recent'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PROFILE & KYC UPLOAD                                    */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ded8cc] shadow-xs">
              <div className="pb-6 border-b border-[#f0ece1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#121212]">Profile &amp; KYC Verification</h3>
                  <p className="text-xs text-[#666] mt-1">
                    Upload official government identity and bank details for smooth direct payouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 self-start transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>

              {docsSuccess && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                  {docsSuccess}
                </div>
              )}

              <form onSubmit={handleSaveDocuments} className="mt-6 space-y-6">
                {/* 1. Basic Info Readonly */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] text-xs">
                  <div>
                    <span className="text-[#888] uppercase text-[10px] font-semibold block">Full Name</span>
                    <span className="font-bold text-[#121212] text-sm">{adviser.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[#888] uppercase text-[10px] font-semibold block">Registration No.</span>
                    <span className="font-mono font-bold text-[#121212] text-sm">{adviser.registration_no || adviser.adviser_id}</span>
                  </div>
                  <div>
                    <span className="text-[#888] uppercase text-[10px] font-semibold block">Mobile Number</span>
                    <span className="font-bold text-[#121212] text-sm">{adviser.phone}</span>
                  </div>
                </div>

                {/* 2. Document Uploads */}
                <h4 className="font-serif text-lg font-bold text-[#121212] pt-2">KYC Documents</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Aadhaar Front */}
                  <div className="p-4 rounded-2xl border border-[#ded8cc] bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#121212] block">Aadhaar Card (Front)</span>
                      <p className="text-[11px] text-[#777] mt-0.5">Clear photo or scan</p>
                      {docs.aadhar_front ? (
                        <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-[#ded8cc]">
                          <img src={docs.aadhar_front} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="mt-3 h-28 rounded-xl border border-dashed border-[#ded8cc] flex items-center justify-center text-[#999] text-xs">
                          No file selected
                        </div>
                      )}
                    </div>
                    <label className="mt-3 block text-center py-2 px-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2ea] border border-[#ded8cc] text-xs font-semibold text-[#121212] cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhar_front')} />
                      Upload Aadhaar Front
                    </label>
                  </div>

                  {/* Aadhaar Back */}
                  <div className="p-4 rounded-2xl border border-[#ded8cc] bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#121212] block">Aadhaar Card (Back)</span>
                      <p className="text-[11px] text-[#777] mt-0.5">Address side scan</p>
                      {docs.aadhar_back ? (
                        <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-[#ded8cc]">
                          <img src={docs.aadhar_back} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="mt-3 h-28 rounded-xl border border-dashed border-[#ded8cc] flex items-center justify-center text-[#999] text-xs">
                          No file selected
                        </div>
                      )}
                    </div>
                    <label className="mt-3 block text-center py-2 px-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2ea] border border-[#ded8cc] text-xs font-semibold text-[#121212] cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhar_back')} />
                      Upload Aadhaar Back
                    </label>
                  </div>

                  {/* PAN Card */}
                  <div className="p-4 rounded-2xl border border-[#ded8cc] bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#121212] block">PAN Card</span>
                      <p className="text-[11px] text-[#777] mt-0.5">For tax and TDS clearance</p>
                      {docs.pan_card ? (
                        <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-[#ded8cc]">
                          <img src={docs.pan_card} alt="PAN Card" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="mt-3 h-28 rounded-xl border border-dashed border-[#ded8cc] flex items-center justify-center text-[#999] text-xs">
                          No file selected
                        </div>
                      )}
                    </div>
                    <label className="mt-3 block text-center py-2 px-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2ea] border border-[#ded8cc] text-xs font-semibold text-[#121212] cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'pan_card')} />
                      Upload PAN Card
                    </label>
                  </div>

                  {/* Passport Photo */}
                  <div className="p-4 rounded-2xl border border-[#ded8cc] bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#121212] block">Passport Photo</span>
                      <p className="text-[11px] text-[#777] mt-0.5">Recent portrait image</p>
                      {docs.photo ? (
                        <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-[#ded8cc]">
                          <img src={docs.photo} alt="Photo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="mt-3 h-28 rounded-xl border border-dashed border-[#ded8cc] flex items-center justify-center text-[#999] text-xs">
                          No file selected
                        </div>
                      )}
                    </div>
                    <label className="mt-3 block text-center py-2 px-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2ea] border border-[#ded8cc] text-xs font-semibold text-[#121212] cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                      Upload Photo
                    </label>
                  </div>

                  {/* Bank Passbook / Cheque */}
                  <div className="p-4 rounded-2xl border border-[#ded8cc] bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#121212] block">Bank Passbook / Cheque</span>
                      <p className="text-[11px] text-[#777] mt-0.5">Proof of account number</p>
                      {docs.bank_passbook ? (
                        <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-[#ded8cc]">
                          <img src={docs.bank_passbook} alt="Passbook" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="mt-3 h-28 rounded-xl border border-dashed border-[#ded8cc] flex items-center justify-center text-[#999] text-xs">
                          No file selected
                        </div>
                      )}
                    </div>
                    <label className="mt-3 block text-center py-2 px-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2ea] border border-[#ded8cc] text-xs font-semibold text-[#121212] cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'bank_passbook')} />
                      Upload Passbook
                    </label>
                  </div>
                </div>

                {/* 3. Bank Account Details */}
                <h4 className="font-serif text-lg font-bold text-[#121212] pt-2">Bank Payout Information</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankDetails.account_holder_name || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                      placeholder="As per bank passbook"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.account_number || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                      placeholder="Bank account number"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifsc || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212] uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">UPI ID (Optional)</label>
                    <input
                      type="text"
                      value={bankDetails.upi_id || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                      placeholder="e.g. mobile@upi"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f0ece1] flex justify-end">
                  <button
                    type="submit"
                    disabled={savingDocs}
                    className="px-6 py-3 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider shadow-xs transition disabled:opacity-50"
                  >
                    {savingDocs ? 'Saving Details...' : 'Save Profile & KYC Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: WALLET & PAYOUTS                                        */}
        {/* ============================================================== */}
        {activeTab === 'payouts' && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ded8cc] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f0ece1]">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#777] font-semibold">Available for Withdrawal</span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-black text-[#121212] mt-1">{inr(availableBalance)}</h3>
                </div>
                <button
                  onClick={() => setPayoutModal(true)}
                  disabled={availableBalance <= 0}
                  className="px-5 py-3 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider shadow-xs transition disabled:opacity-40 self-start"
                >
                  Request Bank Payout
                </button>
              </div>

              {/* Joining Bonus Breakdown Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f2ea] border border-[#ded8cc] text-[#96742e] grid place-items-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#121212]">Instant Multi-Tier Joining Payouts</h5>
                    <p className="text-[#666] text-[11px]">Direct L1: ₹200 · Level 2: ₹100 · Level 3+: ₹50</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#ded8cc] text-xs font-semibold text-[#96742e] hover:text-[#7d5f22] transition"
                >
                  Inspect Plan Deck →
                </button>
              </div>

              {/* Payout History */}
              <div className="mt-6">
                <h4 className="font-serif text-lg font-bold text-[#121212] mb-3">Withdrawal Requests</h4>
                {(!data.payouts || data.payouts.length === 0) ? (
                  <p className="text-xs text-[#777] py-4">No payout requests submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#ded8cc] text-[#777] uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ece1]">
                        {data.payouts.map((p: any) => (
                          <tr key={p.payout_id} className="hover:bg-[#faf8f5]">
                            <td className="py-2.5 px-3 font-bold text-[#121212]">{inr(p.amount)}</td>
                            <td className="py-2.5 px-3 text-[#555] uppercase">{p.payment_method?.replace('_', ' ')}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-[#f5f2ea] text-[#96742e] border border-[#ded5c0]'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#777]">{p.created_at?.split('T')[0] || 'Recent'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Floating Action Spinner */}
      <AdviserSpinner activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Full Plan Showcase Modal */}
      <AdviserPlanModal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} />

      {/* Lead Submission Modal */}
      {leadModal && (
        <div className="fixed inset-0 z-50 bg-[#121212]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#ded8cc] shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-serif text-xl font-bold text-[#121212]">Submit Buyer Lead</h3>
            <p className="text-xs text-[#666] mt-1">Register client interest to secure your 10% direct commission.</p>

            {leadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {leadSuccess}
              </div>
            )}

            <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[#555] font-semibold mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Anand Verma"
                  className="w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212]"
                />
              </div>

              <div>
                <label className="block text-[#555] font-semibold mb-1">Client Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212]"
                />
              </div>

              <div>
                <label className="block text-[#555] font-semibold mb-1">Project Preference</label>
                <select
                  value={leadPropertyTitle}
                  onChange={(e) => setLeadPropertyTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#faf8f5] text-[#121212]"
                >
                  <option value="Umroli Project (Flats)">Umroli Luxury Residential (Flats)</option>
                  <option value="Boisar Plots (NA Lands)">Boisar Residential &amp; Commercial Plots</option>
                  <option value="Palghar Villas">Palghar Gated Community Villas</option>
                  <option value="Commercial Shops">Commercial Retail &amp; Showrooms</option>
                </select>
              </div>

              <div>
                <label className="block text-[#555] font-semibold mb-1">Notes / Budget (Optional)</label>
                <textarea
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Budget range, requirements..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#faf8f5] text-[#121212]"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setLeadModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ded8cc] text-[#555] hover:bg-[#f5f2ea] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider"
                >
                  {submittingLead ? 'Submitting...' : 'Register Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-[#121212]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#ded8cc] shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-serif text-xl font-bold text-[#121212]">Request Bank Withdrawal</h3>
            <p className="text-xs text-[#666] mt-1">Available balance: <b className="text-[#121212]">{inr(availableBalance)}</b></p>

            {payoutSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {payoutSuccess}
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[#555] font-semibold mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={`Max ${availableBalance}`}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#faf8f5] focus:bg-white text-[#121212] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[#555] font-semibold mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#faf8f5] text-[#121212]"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI Instant Transfer</option>
                  <option value="office_cash">Office Cash Disbursement</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPayoutModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ded8cc] text-[#555] hover:bg-[#f5f2ea] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold text-xs uppercase tracking-wider"
                >
                  {submittingPayout ? 'Submitting...' : 'Submit Request'}
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
 * Clean Luxury Cream & Black Referral Tree Canvas
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
    <div className="rounded-3xl bg-[#faf8f5] text-[#121212] p-6 sm:p-8 relative overflow-hidden border border-[#ded8cc]">
      {/* Tree Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#e5dfd3]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#96742e] bg-[#f5f0e4] px-2.5 py-0.5 rounded-full border border-[#ded5c0]">
            Adviser Network Tree
          </span>
          <h3 className="font-serif text-xl font-bold mt-1.5 text-[#121212]">Downline Structure</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#666]">
            Direct Recruits: <b className="text-[#121212] font-mono">{root?.directCount || 0}</b>
          </span>
          <span className="text-[#ccc]">|</span>
          <span className="text-[#666]">
            Total Team: <b className="text-[#121212] font-mono">{root?.totalTeam || 0}</b>
          </span>
        </div>
      </div>

      {/* Visual Tree Layout */}
      <div className="mt-8 flex flex-col items-center">
        {/* ROOT NODE: You */}
        <div className="w-full max-w-xs p-4 rounded-2xl bg-white border-2 border-[#121212] text-center relative shadow-sm">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#121212] text-[#faf8f5] text-[9px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
            You (Root Adviser)
          </span>
          <h4 className="font-serif text-sm font-bold text-[#121212]">{root?.full_name}</h4>
          <p className="font-mono text-xs text-[#96742e] font-bold">{root?.registration_no}</p>
          <div className="mt-2.5 pt-2 border-t border-[#f0ece1] flex justify-around text-xs">
            <div>
              <span className="text-[9px] text-[#777] block uppercase">Direct Recruits</span>
              <span className="font-black text-[#121212] text-xs">{root?.directCount || 0}</span>
            </div>
            <div className="w-px h-5 bg-[#e5dfd3]" />
            <div>
              <span className="text-[9px] text-[#777] block uppercase">Total Network</span>
              <span className="font-black text-[#121212] text-xs">{root?.totalTeam || 0}</span>
            </div>
          </div>
        </div>

        {/* Stem Line down from root */}
        <div className="w-0.5 h-6 bg-[#121212]" />

        {/* EMPTY STATE */}
        {children.length === 0 ? (
          <div className="w-full max-w-sm p-5 rounded-2xl bg-white border border-dashed border-[#ded8cc] text-center text-xs text-[#666] space-y-2.5">
            <p className="font-semibold text-[#121212]">No advisers have joined under you yet.</p>
            <p className="text-[11px] text-[#777]">
              Share your referral code <b className="text-[#96742e] font-mono">{referralCode}</b> with partners to build your team.
            </p>
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 rounded-xl bg-[#121212] text-[#faf8f5] font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Referral Link'}
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Horizontal branch line */}
            <div className="hidden sm:block w-3/4 max-w-xl h-0.5 bg-[#ded8cc] mx-auto" />

            {/* LEVEL 1 CARDS */}
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((c: any) => {
                const isExpanded = !!expandedNodes[c.adviser_id];
                const subChildren = c.children || [];
                const hasSub = subChildren.length > 0;

                return (
                  <div
                    key={c.adviser_id}
                    className="p-4 rounded-2xl bg-white border border-[#ded8cc] hover:border-[#121212] transition shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#f5f2ea] text-[#96742e] border border-[#ded5c0] text-[9px] font-bold uppercase">
                          Direct Member (L1)
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <h5 className="font-serif font-bold text-[#121212] text-sm mt-2">{c.full_name}</h5>
                      <p className="font-mono text-xs text-[#96742e]">{c.registration_no || c.adviser_id}</p>
                      <p className="text-[11px] text-[#777] mt-0.5">Mobile: {c.phone}</p>

                      {/* HOW MANY MEMBERS JOINED UNDER HIM */}
                      <div className="mt-3 p-2 rounded-xl bg-[#faf8f5] border border-[#ded8cc] flex items-center justify-between">
                        <span className="text-[10px] text-[#666]">Recruits under him:</span>
                        <span className="font-mono font-bold text-xs text-[#121212] bg-white px-2 py-0.5 rounded border border-[#ded8cc]">
                          {c.directCount || 0} members
                        </span>
                      </div>
                    </div>

                    {/* DOWNLINE EXPANDER */}
                    {hasSub && (
                      <div className="mt-3 pt-2.5 border-t border-[#f0ece1]">
                        <button
                          type="button"
                          onClick={() => toggleNode(c.adviser_id)}
                          className="w-full text-center py-1.5 rounded-lg bg-[#faf8f5] hover:bg-[#f5f2ea] text-[#121212] font-bold text-[10px] transition flex items-center justify-center gap-1 border border-[#ded8cc]"
                        >
                          {isExpanded ? 'Hide' : 'View'} Downline ({subChildren.length})
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 pl-2.5 border-l-2 border-[#96742e]">
                            {subChildren.map((sub: any) => (
                              <div key={sub.adviser_id} className="p-2 rounded-lg bg-[#faf8f5] border border-[#ded8cc] text-[10px]">
                                <div className="flex justify-between font-semibold text-[#121212]">
                                  <span>{sub.full_name}</span>
                                  <span className="font-mono text-[#96742e]">{sub.registration_no}</span>
                                </div>
                                <div className="flex justify-between text-[#777] text-[9px] mt-0.5">
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
