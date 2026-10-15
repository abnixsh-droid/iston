import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Wallet,
  Building,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { adviserService } from '../../lib/adviserService';
import { fmtDate, inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';

export default function AdviserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'commissions' | 'leads' | 'team' | 'payouts'>('rewards');

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

  useSeo('Adviser Dashboard — Iston Builder Group', 'Adviser portal for referral tracking, team hierarchy and commission earnings.');

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const res = await adviserService.getDashboard(user);
      if (res?.ok) {
        setData(res);
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
    if (!authLoading && !user) {
      navigate('/advisers/register', { replace: true });
      return;
    }
    if (user) {
      fetchDashboard();
    }
  }, [user, authLoading]);

  const copyReferralLink = () => {
    if (!data?.adviser?.referral_code) return;
    const url = `${window.location.origin}/advisers-program?ref=${data.adviser.referral_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    setLeadSuccess('');
    try {
      await api('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'submit_lead',
          lead_name: leadName,
          lead_phone: leadPhone,
          lead_email: leadEmail,
          property_type: leadPropertyType,
          property_title: leadPropertyTitle,
          notes: leadNotes,
        },
      });
      setLeadSuccess('Lead submitted successfully! Our sales team will follow up.');
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadNotes('');
      fetchDashboard();
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
        auth: true,
        body: {
          action: 'request_payout',
          amount: amt,
          payment_method: payoutMethod,
        },
      });
      setPayoutSuccess('Payout request submitted for admin review.');
      setPayoutAmount('');
      fetchDashboard();
      setTimeout(() => setPayoutModal(false), 1800);
    } catch (err: any) {
      alert(err.message || 'Error requesting payout');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-mist">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <p className="mt-3 text-sm font-semibold text-navy">Loading Adviser Dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-mist">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center border border-line shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="font-display text-2xl text-navy mt-4">Dashboard Unavailable</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button onClick={fetchDashboard} className="btn btn-primary mt-6">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { adviser, stats, regRewardsSummary, commissionsSummary, availableBalance } = data;
  const referralLink = `${window.location.origin}/advisers-program?ref=${adviser.referral_code}`;

  return (
    <div className="min-h-screen bg-mist py-8 md:py-12">
      <div className="container-x max-w-7xl">
        {/* TOP BRAND BAR */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-navy font-bold">
            <img
              src="/images/logo.jpg"
              alt="Iston Builder Group logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover ring-1 ring-line shadow-2xs"
            />
            <span className="leading-tight">
              <span className="block font-latin-display text-lg tracking-[0.12em] text-navy">ISTON</span>
              <span className="block text-[8px] font-bold tracking-[0.3em] uppercase text-orange-600">Adviser Portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/advisers-program" className="text-xs font-semibold text-muted hover:text-navy transition">
              Program Overview
            </Link>
            <Link to="/" className="text-xs font-semibold text-muted hover:text-navy transition">
              Main Website →
            </Link>
          </div>
        </div>

        {/* TOP ADVISER IDENTITY HEADER */}
        <div className="rounded-[2.5rem] bg-navy p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-brass/10 blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold tracking-wider px-3 py-1 rounded-full bg-white/10 text-brass-light uppercase">
                  {adviser.adviser_id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    adviser.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {adviser.status}
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl mt-3">{adviser.full_name}</h1>
              <p className="mt-1 text-xs text-white/60">
                Sponsor: {adviser.sponsor_id ? adviser.sponsor_id : 'Direct (Root)'} · Joined {fmtDate(adviser.created_at)}
              </p>
            </div>

            {/* Shareable Referral Link Widget */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 max-w-md w-full">
              <p className="text-[11px] font-bold tracking-wider text-brass-light uppercase flex items-center justify-between">
                <span>Your Shareable Referral Link</span>
                <span className="text-white/60 font-mono text-[10px]">{adviser.referral_code}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-black/25 text-white/90 text-xs px-3 py-2 rounded-xl font-mono truncate border border-white/10 focus:outline-hidden"
                />
                <button
                  onClick={copyReferralLink}
                  className="btn btn-sm shrink-0 bg-white text-navy hover:bg-brass-light flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-white/60">
                Invite channel partners or buyers. Tracks referrals across unlimited levels.
              </p>
            </div>
          </div>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-white border border-line p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-navy" /> Direct Referrals
            </span>
            <p className="font-display text-3xl text-navy mt-2">{stats.directCount}</p>
            <p className="text-[11px] text-muted mt-1">{stats.totalTeam} total network</p>
          </div>

          <div className="rounded-2xl bg-white border border-line p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brass" /> Registration Rewards
            </span>
            <p className="font-display text-3xl text-navy mt-2">{inr(regRewardsSummary.approved)}</p>
            <p className="text-[11px] text-amber-700 mt-1">{inr(regRewardsSummary.pending)} pending</p>
          </div>

          <div className="rounded-2xl bg-white border border-line p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-600" /> Property Commissions
            </span>
            <p className="font-display text-3xl text-navy mt-2">{inr(commissionsSummary.approved)}</p>
            <p className="text-[11px] text-amber-700 mt-1">{inr(commissionsSummary.pending)} pending</p>
          </div>

          <div className="rounded-2xl bg-white border border-line p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-brass" /> Total Paid Out
            </span>
            <p className="font-display text-3xl text-navy mt-2">{inr(regRewardsSummary.paid + commissionsSummary.paid)}</p>
            <p className="text-[11px] text-muted mt-1">Direct to bank/UPI</p>
          </div>

          <div className="col-span-2 lg:col-span-1 rounded-2xl bg-navy text-white p-5 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-xs font-bold tracking-wider text-brass-light uppercase">Available Balance</span>
              <p className="font-display text-3xl mt-2">{inr(availableBalance)}</p>
            </div>
            <button
              onClick={() => setPayoutModal(true)}
              disabled={availableBalance <= 0}
              className="btn btn-sm bg-white text-navy hover:bg-brass-light w-full mt-3 disabled:opacity-50"
            >
              Request Payout
            </button>
          </div>
        </div>

        {/* DASHBOARD TABS */}
        <div className="mt-10 border-b border-line flex gap-2 overflow-x-auto pb-px">
          {[
            ['rewards', `Registration Rewards (${data.registrationRewards?.length || 0})`],
            ['commissions', `Property Commissions (${data.propertyCommissions?.length || 0})`],
            ['leads', `Property Leads (${data.leads?.length || 0})`],
            ['team', `Referral Hierarchy (${stats.totalTeam})`],
            ['payouts', `Payout History (${data.payouts?.length || 0})`],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
                activeTab === tab
                  ? 'border-navy text-navy font-bold'
                  : 'border-transparent text-muted hover:text-navy hover:border-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: REGISTRATION REFERRAL REWARDS LEDGER */}
        {activeTab === 'rewards' && (
          <section className="mt-6 rounded-3xl bg-white border border-line p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl text-navy">Registration Referral Rewards Ledger</h2>
                <p className="text-xs text-muted mt-1">
                  Rewards distributed through your sponsor hierarchy upon verified ₹1,100 registrations (Level 1: ₹300, Level 2: ₹200, Level 3+: ₹100).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  Approved: {inr(regRewardsSummary.approved)}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  Pending: {inr(regRewardsSummary.pending)}
                </span>
              </div>
            </div>

            {data.registrationRewards.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm border border-dashed border-line rounded-2xl">
                No registration rewards yet. Share your referral link to earn rewards when new advisers register.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">New Adviser</th>
                      <th className="py-3 px-4">Upline Level</th>
                      <th className="py-3 px-4">Reward Amount</th>
                      <th className="py-3 px-4">Policy Ver</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.registrationRewards.map((r: any) => (
                      <tr key={r.idempotency_key || r.id} className="hover:bg-mist/30 transition">
                        <td className="py-3.5 px-4 font-mono">{fmtDate(r.created_at)}</td>
                        <td className="py-3.5 px-4 font-semibold text-navy">{r.new_adviser_id}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-navy/5 text-navy font-bold">
                            Level {r.level} {r.level === 1 ? '(Direct)' : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-navy text-sm">{inr(r.amount)}</td>
                        <td className="py-3.5 px-4 text-muted">v{r.policy_version}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              r.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'paid'
                                ? 'bg-blue-100 text-blue-800'
                                : r.status === 'reversed'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PROPERTY-SALE COMMISSIONS LEDGER */}
        {activeTab === 'commissions' && (
          <section className="mt-6 rounded-3xl bg-white border border-line p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl text-navy">Property-Sale Commissions Ledger</h2>
                <p className="text-xs text-muted mt-1">
                  Commissions earned from verified property sales closed by you or your team (Seller 10%, uplines 5%, 4%, 3%, 2%, 1%).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  Approved: {inr(commissionsSummary.approved)}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  Pending: {inr(commissionsSummary.pending)}
                </span>
              </div>
            </div>

            {/* COMMISSION STRUCTURE BREAKDOWN */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200">
                <span className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">Direct Seller</span>
                <p className="font-display text-2xl text-orange-600 font-black mt-0.5">10%</p>
                <span className="text-[9px] text-orange-800/80 font-medium">Direct sale by you</span>
              </div>
              <div className="p-3 rounded-2xl bg-mist border border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Level 1 Upline</span>
                <p className="font-display text-2xl text-navy font-bold mt-0.5">5%</p>
                <span className="text-[9px] text-muted">Direct team sale</span>
              </div>
              <div className="p-3 rounded-2xl bg-mist border border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Level 2 Upline</span>
                <p className="font-display text-2xl text-navy font-bold mt-0.5">4%</p>
                <span className="text-[9px] text-muted">Tier 2 team sale</span>
              </div>
              <div className="p-3 rounded-2xl bg-mist border border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Level 3 Upline</span>
                <p className="font-display text-2xl text-navy font-bold mt-0.5">3%</p>
                <span className="text-[9px] text-muted">Tier 3 team sale</span>
              </div>
              <div className="p-3 rounded-2xl bg-mist border border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Level 4 Upline</span>
                <p className="font-display text-2xl text-navy font-bold mt-0.5">2%</p>
                <span className="text-[9px] text-muted">Tier 4 team sale</span>
              </div>
              <div className="p-3 rounded-2xl bg-mist border border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Level 5+ Uplines</span>
                <p className="font-display text-2xl text-navy font-bold mt-0.5">1%</p>
                <span className="text-[9px] text-muted">Each higher upline</span>
              </div>
            </div>

            {data.propertyCommissions.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm border border-dashed border-line rounded-2xl">
                No property commissions yet. Submit leads for Iston properties to earn sale commissions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Role / Level</th>
                      <th className="py-3 px-4">Rate %</th>
                      <th className="py-3 px-4">Base Amount</th>
                      <th className="py-3 px-4">Commission</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.propertyCommissions.map((c: any) => (
                      <tr key={c.idempotency_key || c.id} className="hover:bg-mist/30 transition">
                        <td className="py-3.5 px-4 font-mono">{fmtDate(c.created_at)}</td>
                        <td className="py-3.5 px-4 font-semibold text-navy">{c.property_title}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-navy/5 text-navy font-bold uppercase text-[10px]">
                            {c.role_in_sale}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{c.rate_percent}%</td>
                        <td className="py-3.5 px-4 text-muted">{inr(c.commission_base_amount)}</td>
                        <td className="py-3.5 px-4 font-bold text-navy text-sm">{inr(c.amount)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              c.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'paid'
                                ? 'bg-blue-100 text-blue-800'
                                : c.status === 'reversed'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PROPERTY LEADS */}
        {activeTab === 'leads' && (
          <section className="mt-6 rounded-3xl bg-white border border-line p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl text-navy">Customer Property Leads</h2>
                <p className="text-xs text-muted mt-1">
                  Refer buyers for Iston projects, flats, and plots. Our sales team coordinates site visits and deals.
                </p>
              </div>
              <button onClick={() => setLeadModal(true)} className="btn btn-primary btn-sm flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" /> Submit Customer Lead
              </button>
            </div>

            {data.leads.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm border border-dashed border-line rounded-2xl">
                No customer leads submitted yet. Click "Submit Customer Lead" to register an interested buyer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Phone / Email</th>
                      <th className="py-3 px-4">Interested Property</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.leads.map((l: any) => (
                      <tr key={l.id} className="hover:bg-mist/30 transition">
                        <td className="py-3.5 px-4 font-mono">{fmtDate(l.created_at)}</td>
                        <td className="py-3.5 px-4 font-semibold text-navy">{l.lead_name}</td>
                        <td className="py-3.5 px-4 text-muted">
                          {l.lead_phone} {l.lead_email ? `· ${l.lead_email}` : ''}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-navy">{l.property_title}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-mist text-navy font-bold uppercase text-[10px]">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: REFERRAL HIERARCHY & TEAM COUNTS */}
        {activeTab === 'team' && (
          <section className="mt-6 rounded-3xl bg-white border border-line p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">Unlimited-Depth Referral Hierarchy</h2>
            <p className="text-xs text-muted mt-1">
              Your network breakdown across all levels. You earn registration rewards and override commissions from eligible downlines.
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(stats.levelCounts || {}).map(([lvl, count]) => (
                <div key={lvl} className="p-4 rounded-2xl bg-mist border border-line text-center">
                  <p className="text-[11px] font-bold uppercase text-muted">Level {lvl}</p>
                  <p className="font-display text-2xl text-navy mt-1">{count as number}</p>
                  <p className="text-[10px] text-muted">{lvl === '1' ? 'Direct Referrals' : `Upline Level ${lvl}`}</p>
                </div>
              ))}
              {Object.keys(stats.levelCounts || {}).length === 0 && (
                <div className="col-span-full py-8 text-center text-muted text-xs">
                  No network team members yet. Share your referral link to build your team.
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 5: PAYOUT HISTORY */}
        {activeTab === 'payouts' && (
          <section className="mt-6 rounded-3xl bg-white border border-line p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl text-navy">Payout Requests & History</h2>
                <p className="text-xs text-muted mt-1">
                  Withdrawals processed to your registered bank account or UPI ID.
                </p>
              </div>
              <button
                onClick={() => setPayoutModal(true)}
                disabled={availableBalance <= 0}
                className="btn btn-primary btn-sm"
              >
                Request Payout ({inr(availableBalance)} available)
              </button>
            </div>

            {data.payouts.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm border border-dashed border-line rounded-2xl">
                No payout requests made yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.payouts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-mist/30 transition">
                        <td className="py-3.5 px-4 font-mono">{fmtDate(p.created_at)}</td>
                        <td className="py-3.5 px-4 font-bold text-navy text-sm">{inr(p.amount)}</td>
                        <td className="py-3.5 px-4 uppercase">{p.payment_method}</td>
                        <td className="py-3.5 px-4 font-mono text-muted">{p.transaction_reference || 'Processing'}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              p.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* SUBMIT LEAD MODAL */}
      {leadModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-line">
            <h3 className="font-display text-2xl text-navy">Submit Property Customer Lead</h3>
            <p className="text-xs text-muted mt-1">
              Refer a buyer for Iston Builder Group properties. Verified sales yield up to 10% seller commission.
            </p>

            {leadSuccess ? (
              <div className="my-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" /> {leadSuccess}
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="label">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Ramesh Patel"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      className="input"
                      placeholder="9876543210"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="buyer@gmail.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Interested Property / Project</label>
                  <select
                    className="input"
                    value={leadPropertyTitle}
                    onChange={(e) => setLeadPropertyTitle(e.target.value)}
                  >
                    <option value="Umroli Project (Flats & Residential)">Umroli Project (Flats & Residential)</option>
                    <option value="Iston Luxury Plots">Iston Luxury Plots</option>
                    <option value="Iston Society Houses">Iston Society Houses</option>
                    <option value="General Residential Enquiry">General Residential Enquiry</option>
                  </select>
                </div>
                <div>
                  <label className="label">Notes / Customer Requirements</label>
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="Budget, configuration preference, preferred site visit time..."
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setLeadModal(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="btn btn-primary flex-1"
                  >
                    {submittingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Lead'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REQUEST PAYOUT MODAL */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-line">
            <h3 className="font-display text-2xl text-navy">Request Payout</h3>
            <p className="text-xs text-muted mt-1">
              Available approved balance: <b>{inr(availableBalance)}</b>
            </p>

            {payoutSuccess ? (
              <div className="my-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" /> {payoutSuccess}
              </div>
            ) : (
              <form onSubmit={handlePayoutSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="label">Withdrawal Amount (₹) *</label>
                  <input
                    type="number"
                    max={availableBalance}
                    min={1}
                    required
                    className="input text-lg font-bold"
                    placeholder="Enter amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Payout Method</label>
                  <select
                    className="input"
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="upi">UPI Transfer</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setPayoutModal(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayout}
                    className="btn btn-primary flex-1"
                  >
                    {submittingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
