import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Phone,
  Gift,
  Hash,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Building,
  Users,
  TrendingUp,
  Wallet,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { adviserService, type AdviserRecord, getStoredAdviserAuth, setStoredAdviserAuth } from '../../lib/adviserService';
import { useSeo } from '../../lib/seo';
import LanguageToggle from '../../components/LanguageToggle';

export default function AdvisersPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active view: 'login' | 'register' | 'locked_red' | 'approved_green'
  const [view, setView] = useState<'login' | 'register' | 'locked_red' | 'approved_green'>('login');

  // Login Form States
  const [loginType, setLoginType] = useState<'reg' | 'mobile'>('reg');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Register Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNo, setRegistrationNo] = useState(adviserService.generateRegistrationNo());
  const [referralNo, setReferralNo] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegRePassword, setShowRegRePassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Target Adviser (for Red Locked screen or Green Approved screen)
  const [targetAdviser, setTargetAdviser] = useState<AdviserRecord | null>(null);

  // Showcase Calculator & Filter States (replicating index.html showcase deck)
  const [calcPropertyVal, setCalcPropertyVal] = useState<number>(5000000);
  const [showcaseTab, setShowcaseTab] = useState<'all' | 'steps' | 'bonus' | 'ledger' | 'calculator' | 'tree' | 'why'>('all');

  const fmtCurrency = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtShort = (n: number) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  // Toast State
  const [toastMsg, setToastMsg] = useState('');

  useSeo('Adviser Portal — Iston Builder Group', 'Single number login · Secure & simple adviser registration and access.');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('sponsor');
    if (ref) {
      setReferralNo(ref.toUpperCase());
      setView('register');
    }

    const currentSession = getStoredAdviserAuth();
    if (currentSession && currentSession.status === 'active') {
      setTargetAdviser(currentSession);
    }
  }, [searchParams]);

  const handleRegenerateRegNo = () => {
    const newNo = adviserService.generateRegistrationNo();
    setRegistrationNo(newNo);
    showToast(`Generated ${newNo}`);
  };

  const copyText = (val: string, label = 'Copied!') => {
    navigator.clipboard.writeText(val);
    showToast(label);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      return setLoginError('Please enter both your identifier and token/password.');
    }

    setSubmittingLogin(true);
    try {
      const res = await adviserService.adviserLogin({
        identifier: loginIdentifier.trim(),
        tokenOrPassword: loginPassword.trim(),
      });

      if (res?.status === 'pending' && res.adviser) {
        setTargetAdviser(res.adviser);
        setView('locked_red');
      } else if (res?.ok && res.adviser) {
        const activeAdv = { ...res.adviser, status: 'active' as const };
        setStoredAdviserAuth(activeAdv);
        setTargetAdviser(activeAdv);
        setView('approved_green');
      } else {
        setLoginError(res?.error || 'Invalid credentials or registration not found.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Error during login.');
    } finally {
      setSubmittingLogin(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      return setRegError('Please enter your full name as per Aadhaar card.');
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return setRegError('Please enter a valid 10-digit mobile number.');
    }
    if (!password || password.length < 4) {
      return setRegError('Password must be at least 4 characters long.');
    }
    if (password !== rePassword) {
      return setRegError('Passwords do not match.');
    }

    setSubmittingReg(true);
    try {
      const res = await adviserService.customRegister({
        full_name: fullName.trim(),
        phone: cleanPhone,
        registration_no: registrationNo,
        referral_no: referralNo.trim() || undefined,
        password,
      });

      if (res?.ok && res.adviser) {
        setTargetAdviser(res.adviser);
        setView('locked_red');
      } else {
        setRegError(res?.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setRegError(err?.message || 'Error creating registration.');
    } finally {
      setSubmittingReg(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-[#011a1f] via-[#03343b] to-[#0d5f55] text-white select-none">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-teal-400/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-[-100px] w-[300px] h-[300px] rounded-full bg-amber-400/10 blur-[90px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 max-w-4xl w-full mx-auto flex items-center justify-between pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-100/70 hover:text-white transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
        </Link>
        <div className="scale-90 origin-right">
          <LanguageToggle variant="white" solid={false} />
        </div>
      </header>

      {/* Main Container Card */}
      <main className={`relative z-10 w-full mx-auto my-auto py-2 transition-all duration-300 ${view === 'locked_red' ? 'max-w-4xl lg:max-w-5xl' : 'max-w-md lg:max-w-lg'}`}>
        <div className="bg-[#062f35]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)] p-5 sm:p-8 lg:p-10 select-none">

          {/* Logo & Branding with Official Iston Favicon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl p-1.5 bg-white/10 border border-teal-500/30 shadow-lg shadow-teal-500/25 flex items-center justify-center">
              <img
                src="/favicon.png"
                alt="Iston Builder Group logo"
                className="w-13 h-13 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mt-3 tracking-tight">Adviser Portal</h1>
            <p className="text-teal-200/60 text-xs sm:text-sm mt-1">Single number login · Secure &amp; simple</p>
          </div>

          {/* ============================================================== */}
          {/* VIEW: RED SCREEN — LOCKED / PENDING CASH VERIFICATION          */}
          {/* ============================================================== */}
          {view === 'locked_red' && targetAdviser && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* TOP RED LOCKED CARD */}
              <div className="rounded-3xl bg-gradient-to-br from-rose-950/90 via-rose-900/60 to-[#041a1d] border-2 border-rose-500/40 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-rose-500/20 blur-3xl" />

                <div className="relative z-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 text-rose-300 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      Account Locked — Awaiting Office Cash Verification
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2">Registration Submitted Successfully</h2>
                    <p className="text-xs text-rose-200/80 max-w-md mx-auto mt-1 leading-relaxed">
                      Please deposit <b>₹1,100 cash</b> at our Iston Builder Group office. Once verified, our office will activate your account and issue your secret <b>Login Token Number</b>.
                    </p>
                  </div>

                  {/* Registration Number Highlight Box */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-rose-500/30 max-w-md mx-auto text-left space-y-2">
                    <div className="flex items-center justify-between text-rose-200/70 text-[11px]">
                      <span className="uppercase tracking-wider font-semibold">Your Registration Number</span>
                      <button
                        type="button"
                        onClick={() => copyText(targetAdviser.registration_no || targetAdviser.adviser_id)}
                        className="text-teal-300 hover:text-white font-bold flex items-center gap-1 transition text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Number
                      </button>
                    </div>
                    <p className="font-mono text-2xl sm:text-3xl font-black text-rose-300 tracking-wider">
                      {targetAdviser.registration_no || targetAdviser.adviser_id}
                    </p>
                    <div className="pt-2 border-t border-white/10 text-xs text-rose-100/80 grid grid-cols-2 gap-2">
                      <p><span className="text-rose-200/50">Name:</span> <b className="text-white">{targetAdviser.full_name}</b></p>
                      <p><span className="text-rose-200/50">Mobile:</span> <b className="text-white">{targetAdviser.phone}</b></p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier(targetAdviser.registration_no || targetAdviser.adviser_id);
                        setView('login');
                      }}
                      className="flex-1 bg-gradient-to-r from-teal-300 to-teal-400 hover:from-teal-200 hover:to-teal-300 text-[#022c33] font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5"
                    >
                      Have Your Token? Login Now <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationNo(adviserService.generateRegistrationNo());
                        setView('register');
                      }}
                      className="py-3 px-4 rounded-xl border border-white/15 hover:border-white/30 text-xs text-teal-100/70 hover:text-white transition"
                    >
                      Register Another
                    </button>
                  </div>
                </div>
              </div>

              {/* SHOWCASE OF THE ADVISER SYSTEM (MIRRORING DESIGN DECK) */}
              <div className="space-y-6 pt-4 border-t border-teal-500/20">
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
                    Iston Adviser Program Breakdown
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                    How The Earnings &amp; Commissions Work
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-200/70 mt-1 max-w-xl mx-auto">
                    100% transparent: Direct property commissions up to 10%, 5-tier joining rewards, and continuous network compounding.
                  </p>
                </div>

                {/* Filter Navigation Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                  {[
                    ['all', 'All Details'],
                    ['steps', '3 Steps to Join'],
                    ['bonus', 'Joining Bonus (5 Tiers)'],
                    ['ledger', 'Money Flow Example'],
                    ['calculator', 'Property Sales Calculator'],
                    ['tree', 'Compounding Tree'],
                    ['why', 'Why Join Now'],
                  ].map(([tabKey, label]) => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setShowcaseTab(tabKey as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border text-xs ${
                        showcaseTab === tabKey
                          ? 'bg-gradient-to-r from-teal-300 to-teal-400 text-[#022c33] border-transparent font-black shadow-md shadow-teal-500/20'
                          : 'bg-white/5 border-white/10 text-teal-100/70 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* 1. THREE STEPS TO JOIN */}
                {(showcaseTab === 'all' || showcaseTab === 'steps') && (
                  <div className="p-6 rounded-3xl bg-[#021f24]/90 border border-teal-500/30 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-300 tracking-widest uppercase">
                        Step-by-Step Activation
                      </span>
                      <span className="text-xs text-teal-200/60">Verified Office Process</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Step 1 */}
                      <div className="p-5 rounded-2xl bg-[#062f35]/80 border border-teal-500/20 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-teal-300 border border-teal-500/30 rounded-full px-2.5 py-0.5">
                              STEP 01
                            </span>
                            <Wallet className="w-5 h-5 text-teal-300" />
                          </div>
                          <h4 className="text-xl font-black text-white mt-4">Pay Cash</h4>
                          <p className="text-3xl font-black text-white mt-1">₹1,100</p>
                          <p className="text-xs text-teal-200/70 mt-2">
                            Pay offline cash at Iston Builder Group office. Immediate official registration.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-teal-500/20 text-[11px] text-teal-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Direct admin verification
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#062f35] to-[#021f24] border border-teal-400/40 flex flex-col justify-between shadow-lg shadow-teal-500/10">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-teal-300 border border-teal-400/40 rounded-full px-2.5 py-0.5">
                              STEP 02
                            </span>
                            <Hash className="w-5 h-5 text-teal-300" />
                          </div>
                          <h4 className="text-xl font-black text-white mt-4">Get Code &amp; Token</h4>
                          <div className="mt-2 inline-flex items-center gap-2 bg-[#011a1f] px-3 py-1 rounded-full border border-teal-500/40">
                            <span className="text-[10px] font-bold text-teal-300">TOKEN</span>
                            <span className="font-mono text-xs font-black text-white">TK-XXXX</span>
                          </div>
                          <p className="text-xs text-teal-200/70 mt-2">
                            Admin generates your Login Token and unique referral code. You are activated instantly.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-teal-500/20 text-[11px] text-teal-300 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Issued immediately after payment
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="p-5 rounded-2xl bg-[#062f35]/80 border border-amber-500/30 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-amber-300 border border-amber-500/30 rounded-full px-2.5 py-0.5">
                              STEP 03
                            </span>
                            <TrendingUp className="w-5 h-5 text-amber-300" />
                          </div>
                          <h4 className="text-xl font-black text-white mt-4">Earn Rewards</h4>
                          <p className="text-3xl font-black text-amber-300 mt-1">₹300 → ∞</p>
                          <p className="text-xs text-teal-200/70 mt-2">
                            Instant ₹300 welcome bonus in your dashboard + up to 10% direct property sales brokerage.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Direct bank account withdrawal
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#011a1f] border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-teal-200">
                        <Sparkles className="w-4 h-4 text-teal-300 shrink-0" />
                        <span><b>Included on Day 1:</b> Full earnings dashboard, training kit, personal referral code, property marketing kit.</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-teal-400">NO HIDDEN FEES</span>
                    </div>
                  </div>
                )}

                {/* 2. JOINING BONUS DISTRIBUTION */}
                {(showcaseTab === 'all' || showcaseTab === 'bonus') && (
                  <div className="p-6 rounded-3xl bg-[#021f24]/90 border border-teal-500/30 space-y-5 shadow-xl">
                    <div>
                      <span className="text-[10px] font-bold text-teal-300 tracking-widest uppercase">
                        Registration Distribution
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                        Every ₹1,100 Registration Pays Across 5 People
                      </h4>
                      <p className="text-xs text-teal-200/70 mt-1">
                        When an adviser joins, ₹700 is distributed across the chain. 100% disclosed.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      {/* Breakdown Table */}
                      <div className="border border-teal-500/30 rounded-2xl overflow-hidden bg-[#011a1f]">
                        <div className="grid grid-cols-[1.2fr_0.8fr] bg-[#062f35] px-4 py-3 text-[10px] font-bold tracking-wider text-teal-300 uppercase border-b border-teal-500/20">
                          <div>Level / Beneficiary</div>
                          <div className="text-right">Payout</div>
                        </div>
                        <div className="divide-y divide-teal-500/20 text-xs">
                          <div className="grid grid-cols-[1.2fr_0.8fr] px-4 py-3 items-center bg-teal-500/10">
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-teal-400 text-[#022c33] font-black text-[10px] grid place-items-center">★</span>
                                New Member (Self)
                              </p>
                              <p className="text-[10px] text-teal-300/80">Instant welcome bonus</p>
                            </div>
                            <div className="text-right font-black text-teal-300 text-sm">₹300</div>
                          </div>
                          <div className="grid grid-cols-[1.2fr_0.8fr] px-4 py-3 items-center">
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#062f35] border border-teal-400/40 text-teal-300 font-bold text-[10px] grid place-items-center">1</span>
                                Direct Referrer
                              </p>
                              <p className="text-[10px] text-teal-200/60">Your direct inviter</p>
                            </div>
                            <div className="text-right font-black text-white text-sm">₹200</div>
                          </div>
                          <div className="grid grid-cols-[1.2fr_0.8fr] px-4 py-3 items-center">
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#062f35] border border-teal-400/40 text-teal-300 font-bold text-[10px] grid place-items-center">2</span>
                                Level 2 Upline
                              </p>
                              <p className="text-[10px] text-teal-200/60">Referrer's referrer</p>
                            </div>
                            <div className="text-right font-black text-white text-sm">₹100</div>
                          </div>
                          <div className="grid grid-cols-[1.2fr_0.8fr] px-4 py-3 items-center">
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#062f35] border border-teal-400/40 text-teal-300 font-bold text-[10px] grid place-items-center">3</span>
                                Level 3 Upline
                              </p>
                              <p className="text-[10px] text-teal-200/60">Third level upline</p>
                            </div>
                            <div className="text-right font-black text-white text-sm">₹50</div>
                          </div>
                          <div className="grid grid-cols-[1.2fr_0.8fr] px-4 py-3 items-center bg-emerald-500/10">
                            <div>
                              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-[#022c33] font-black text-[10px] grid place-items-center">∞</span>
                                Level 4+ Upline
                              </p>
                              <p className="text-[10px] text-emerald-200/70">Passive team drip forever</p>
                            </div>
                            <div className="text-right font-black text-emerald-300 text-sm">₹50</div>
                          </div>
                        </div>
                      </div>

                      {/* Distribution Visual Pyramid */}
                      <div className="p-5 rounded-2xl bg-[#062f35]/60 border border-teal-500/20 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-teal-300/80 uppercase tracking-widest mb-4">
                          Visual Payout Ladder
                        </span>
                        <div className="w-full flex flex-col items-center gap-2 text-xs font-bold">
                          <div className="w-[45%] py-2 text-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                            ₹300 · New Member
                          </div>
                          <div className="w-[60%] py-2 text-center rounded-xl bg-teal-300 text-[#022c33] shadow-md">
                            ₹200 · Direct Referrer (L1)
                          </div>
                          <div className="w-[75%] py-2 text-center rounded-xl bg-teal-500/30 text-teal-100 border border-teal-400/30">
                            ₹100 · Level 2 Upline
                          </div>
                          <div className="w-[85%] py-2 text-center rounded-xl bg-[#011a1f] text-teal-200/80 border border-teal-500/30">
                            ₹50 · Level 3 Upline
                          </div>
                          <div className="w-full py-2 text-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                            ₹50 · Level 4+ Evergreen Passive
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-teal-500/20 w-full flex items-center justify-between text-xs text-teal-200/80">
                          <span>Total Distributed to Network: <b>₹700</b></span>
                          <span>Admin &amp; GST: <b>₹400</b></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. LIVE MONEY FLOW SIMULATION */}
                {(showcaseTab === 'all' || showcaseTab === 'ledger') && (
                  <div className="p-6 rounded-3xl bg-[#021f24]/90 border border-teal-500/30 space-y-5 shadow-xl">
                    <div>
                      <span className="text-[10px] font-bold text-teal-300 tracking-widest uppercase">
                        Real-Time Simulation
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                        Money Flow Ledger: What Happens When Member 'C' Joins
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                      {/* Node A */}
                      <div className="p-4 rounded-2xl bg-[#062f35]/80 border border-teal-500/30">
                        <div className="w-12 h-12 rounded-2xl bg-teal-400 text-[#022c33] font-black text-lg mx-auto flex items-center justify-center">
                          A
                        </div>
                        <h5 className="font-bold text-white text-sm mt-2">Aarav (You)</h5>
                        <p className="text-[10px] text-teal-200/60">Level 2 Upline</p>
                        <div className="mt-3 p-2 rounded-xl bg-[#011a1f] border border-teal-500/30">
                          <span className="text-[9px] uppercase tracking-wider text-teal-300 block">Earns</span>
                          <span className="text-base font-black text-emerald-300">+ ₹100</span>
                        </div>
                      </div>

                      {/* Node B */}
                      <div className="p-4 rounded-2xl bg-[#062f35]/80 border border-teal-500/30">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/40 text-teal-200 border border-teal-400/40 font-black text-lg mx-auto flex items-center justify-center">
                          B
                        </div>
                        <h5 className="font-bold text-white text-sm mt-2">Bhavya</h5>
                        <p className="text-[10px] text-teal-200/60">Direct Referrer (L1)</p>
                        <div className="mt-3 p-2 rounded-xl bg-[#011a1f] border border-teal-500/30">
                          <span className="text-[9px] uppercase tracking-wider text-teal-300 block">Earns</span>
                          <span className="text-base font-black text-teal-300">+ ₹200</span>
                        </div>
                      </div>

                      {/* Node C */}
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#062f35] to-[#021f24] border-2 border-amber-400/40">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg mx-auto flex items-center justify-center">
                          C
                        </div>
                        <h5 className="font-bold text-white text-sm mt-2">Chirag (New Member)</h5>
                        <p className="text-[10px] text-teal-200/60">Pays ₹1,100 Cash</p>
                        <div className="mt-3 p-2 rounded-xl bg-[#011a1f] border border-amber-400/30">
                          <span className="text-[9px] uppercase tracking-wider text-amber-300 block">Gets Back</span>
                          <span className="text-base font-black text-amber-300">+ ₹300 Welcome</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#011a1f] border border-teal-500/30 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between text-teal-200/70"><span>Chirag pays at office:</span> <b className="text-white">₹1,100</b></div>
                      <div className="flex justify-between text-amber-300"><span>↳ Chirag receives instant welcome bonus:</span> <b>+ ₹300</b></div>
                      <div className="flex justify-between text-teal-300"><span>↳ Bhavya receives direct referral bonus:</span> <b>+ ₹200</b></div>
                      <div className="flex justify-between text-emerald-300"><span>↳ Aarav receives L2 override bonus:</span> <b>+ ₹100</b></div>
                      <div className="flex justify-between text-teal-200/50 pt-1 border-t border-teal-500/20"><span>↳ Platform operations, checks &amp; GST:</span> <span>₹400</span></div>
                    </div>
                  </div>
                )}

                {/* 4. PROPERTY SALES COMMISSIONS & INTERACTIVE CALCULATOR */}
                {(showcaseTab === 'all' || showcaseTab === 'calculator') && (
                  <div className="p-6 rounded-3xl bg-[#021f24]/90 border border-teal-500/30 space-y-5 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-teal-300 tracking-widest uppercase">
                          Property Brokerage Pool (25% Total)
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                          Property Sales Commission Calculator
                        </h4>
                        <p className="text-xs text-teal-200/70 mt-1">
                          10% direct closer commission + 5 tiers of cascading overrides. Drag slider to test deal values.
                        </p>
                      </div>

                      {/* Interactive Slider Input */}
                      <div className="p-3 rounded-2xl bg-[#011a1f] border border-teal-500/30 w-full sm:w-64 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-teal-200/60 font-semibold">Deal Value:</span>
                          <span className="font-mono font-black text-teal-300">{fmtShort(calcPropertyVal)}</span>
                        </div>
                        <input
                          type="range"
                          min={1500000}
                          max={15000000}
                          step={100000}
                          value={calcPropertyVal}
                          onChange={(e) => setCalcPropertyVal(Number(e.target.value))}
                          className="w-full accent-teal-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-teal-200/50 font-mono">
                          <span>15L</span>
                          <span>75L</span>
                          <span>1.5Cr</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { lvl: 'Direct Closer (You)', pct: 10, bg: 'from-amber-400 to-amber-500 text-slate-950' },
                        { lvl: 'Level 1 Referrer', pct: 5, bg: 'from-teal-300 to-teal-400 text-[#022c33]' },
                        { lvl: 'Level 2 Upline', pct: 4, bg: 'bg-[#062f35] text-white border border-teal-500/30' },
                        { lvl: 'Level 3 Upline', pct: 3, bg: 'bg-[#062f35] text-white border border-teal-500/30' },
                        { lvl: 'Level 4 Upline', pct: 2, bg: 'bg-[#062f35] text-white border border-teal-500/30' },
                        { lvl: 'Level 5+ Deep Team', pct: 1, bg: 'from-emerald-400 to-emerald-500 text-slate-950' },
                      ].map((item, idx) => {
                        const amt = Math.round((calcPropertyVal * item.pct) / 100);
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl flex items-center justify-between shadow-md ${
                              item.bg.includes('from-') ? `bg-gradient-to-r ${item.bg}` : item.bg
                            }`}
                          >
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                                {item.pct}% Brokerage
                              </span>
                              <span className="font-bold text-sm block mt-0.5">{item.lvl}</span>
                            </div>
                            <span className="font-mono text-base font-black">{fmtCurrency(amt)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Pool Card */}
                    <div className="p-4 rounded-2xl bg-[#011a1f] border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-teal-200/70 font-semibold block">Total 25% Distributed Across Team on This Deal:</span>
                        <span className="text-xl sm:text-2xl font-black text-teal-300 font-mono">
                          {fmtCurrency(Math.round(calcPropertyVal * 0.25))}
                        </span>
                      </div>
                      <div className="text-right text-teal-200/60 text-[11px]">
                        Example: On a <b className="text-white">{fmtShort(calcPropertyVal)}</b> flat sale, direct closer earns <b className="text-amber-300">{fmtCurrency(Math.round(calcPropertyVal * 0.1))}</b>.
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. COMPOUNDING TREE */}
                {(showcaseTab === 'all' || showcaseTab === 'tree') && (
                  <div className="p-6 rounded-3xl bg-[#021f24]/90 border border-teal-500/30 space-y-5 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-teal-300 tracking-widest uppercase">
                          Compounding Growth
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                          Network Growth: 1 → 3 → 9 → 27 → 81
                        </h4>
                        <p className="text-xs text-teal-200/70 mt-1">
                          You only invite 3 active advisers. As they invite 3 each, your network scales exponentially.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#011a1f] border border-teal-500/30 text-center shrink-0">
                        <span className="text-[10px] uppercase text-teal-200/60 font-bold block">4 Levels Total</span>
                        <span className="text-2xl font-black text-teal-300 font-mono">120 Members</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-[#062f35]/80 border border-teal-500/20">
                        <span className="text-[10px] font-bold text-teal-300 uppercase">Level 1</span>
                        <p className="text-2xl font-black text-white mt-1">3</p>
                        <p className="text-[10px] text-teal-200/60 mt-0.5">₹200 each = ₹600</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#062f35]/80 border border-teal-500/20">
                        <span className="text-[10px] font-bold text-teal-300 uppercase">Level 2</span>
                        <p className="text-2xl font-black text-white mt-1">9</p>
                        <p className="text-[10px] text-teal-200/60 mt-0.5">₹100 each = ₹900</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#062f35]/80 border border-teal-500/20">
                        <span className="text-[10px] font-bold text-teal-300 uppercase">Level 3</span>
                        <p className="text-2xl font-black text-white mt-1">27</p>
                        <p className="text-[10px] text-teal-200/60 mt-0.5">₹50 each = ₹1,350</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase">Level 4+</span>
                        <p className="text-2xl font-black text-emerald-300 mt-1">81</p>
                        <p className="text-[10px] text-emerald-200/70 mt-0.5">₹50 each = ₹4,050</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#011a1f] border border-teal-500/30 flex items-center justify-between text-xs">
                      <span className="text-teal-200/80">
                        <b>Passive Math:</b> If those 120 members bring just 1 person each per month, you receive <b>₹6,000/month passive joining bonuses</b> — plus property sale commissions!
                      </span>
                    </div>
                  </div>
                )}

                {/* 6. WHY JOIN NOW */}
                {(showcaseTab === 'all' || showcaseTab === 'why') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-[#021f24]/90 border border-teal-500/30 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold shrink-0">
                        ✓
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm">Low One-Time Entry</h5>
                        <p className="text-xs text-teal-200/70 mt-1">
                          Just ₹1,100 once at the office. No monthly subscription or renewal fees.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#021f24]/90 border border-teal-500/30 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
                        ₹
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm">₹300 Instant Reward</h5>
                        <p className="text-xs text-teal-200/70 mt-1">
                          Get ₹300 back directly in your wallet on activation as your welcome bonus.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#021f24]/90 border border-teal-500/30 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                        🏢
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm">Real Property Portfolio</h5>
                        <p className="text-xs text-teal-200/70 mt-1">
                          Sell verified flats &amp; plots from Iston Builder Group with 10% direct closer commissions.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#021f24]/90 border border-teal-500/30 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold shrink-0">
                        🏦
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm">Direct Bank Withdrawals</h5>
                        <p className="text-xs text-teal-200/70 mt-1">
                          Withdraw your wallet earnings anytime via direct NEFT / UPI to your registered bank account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: GREEN SCREEN — APPROVED & TOKEN VERIFIED                 */}
          {/* ============================================================== */}
          {view === 'approved_green' && targetAdviser && (
            <div className="space-y-5 text-center animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-teal-400/20 border border-teal-300/40 text-teal-300 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-300/30 text-[10px] font-bold uppercase tracking-wider">
                  Verified &amp; Approved
                </span>
                <h2 className="text-xl font-bold text-white mt-2">Welcome, {targetAdviser.full_name}!</h2>
                <p className="text-xs text-teal-100/60 mt-0.5">Your adviser account is active.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left text-xs space-y-1">
                <p><span className="text-teal-100/50">Reg No:</span> <b className="font-mono text-teal-200">{targetAdviser.registration_no || targetAdviser.adviser_id}</b></p>
                <p><span className="text-teal-100/50">Mobile:</span> <b>{targetAdviser.phone}</b></p>
                {targetAdviser.token_number && (
                  <p><span className="text-teal-100/50">Token:</span> <b className="font-mono text-teal-200">{targetAdviser.token_number}</b></p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (targetAdviser) {
                    setStoredAdviserAuth({ ...targetAdviser, status: 'active' });
                  }
                  window.open('/advisers/dashboard', '_blank');
                  navigate('/advisers/dashboard');
                }}
                className="w-full bg-gradient-to-r from-teal-300 to-teal-400 hover:from-teal-200 hover:to-teal-300 text-[#022c33] font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/25 text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5"
              >
                Enter Adviser Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: LOGIN & REGISTER TABS                                    */}
          {/* ============================================================== */}
          {(view === 'login' || view === 'register') && (
            <div>
              {/* Tabs */}
              <div className="flex bg-white/[0.06] rounded-xl p-1 mb-6 border border-white/5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg transition-all duration-300 ${
                    view === 'login'
                      ? 'bg-gradient-to-r from-teal-300 to-teal-400 text-[#022c33] shadow-lg shadow-teal-500/20 font-bold'
                      : 'text-teal-100/60 hover:text-teal-100 hover:bg-white/5'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setRegError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg transition-all duration-300 ${
                    view === 'register'
                      ? 'bg-gradient-to-r from-teal-300 to-teal-400 text-[#022c33] shadow-lg shadow-teal-500/20 font-bold'
                      : 'text-teal-100/60 hover:text-teal-100 hover:bg-white/5'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* ---------------- LOGIN FORM ---------------- */}
              {view === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                  {/* Identifier Type Selector */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1.5">Login with</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginType('reg');
                          setLoginIdentifier('');
                        }}
                        className={`py-2 px-3 rounded-xl font-semibold border transition flex items-center justify-center gap-1.5 ${
                          loginType === 'reg'
                            ? 'bg-teal-400/15 border-teal-300/40 text-teal-100'
                            : 'border-white/10 text-teal-100/50 hover:bg-white/5 hover:text-teal-100/80'
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5" /> Registration No.
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginType('mobile');
                          setLoginIdentifier('');
                        }}
                        className={`py-2 px-3 rounded-xl font-semibold border transition flex items-center justify-center gap-1.5 ${
                          loginType === 'mobile'
                            ? 'bg-teal-400/15 border-teal-300/40 text-teal-100'
                            : 'border-white/10 text-teal-100/50 hover:bg-white/5 hover:text-teal-100/80'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" /> Mobile
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                      {loginError}
                    </div>
                  )}

                  {/* Identifier Input */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      {loginType === 'reg' ? 'Registration Number' : 'Mobile Number'}
                    </label>
                    <div className="relative group">
                      {loginType === 'reg' ? (
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                      ) : (
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                      )}
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => {
                          if (loginType === 'mobile') {
                            setLoginIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10));
                          } else {
                            setLoginIdentifier(e.target.value.toUpperCase().slice(0, 8));
                          }
                        }}
                        placeholder={loginType === 'reg' ? 'e.g. IB273872' : '10-digit mobile number'}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-teal-300/10 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Token / Password */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      Token Number / Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter token or password"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-teal-300/10 text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-teal-300/40 hover:text-teal-200 transition"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingLogin}
                    className="w-full mt-2 bg-gradient-to-r from-teal-300 to-teal-400 hover:from-teal-200 hover:to-teal-300 text-[#022c33] font-bold py-3 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-400/40 hover:-translate-y-0.5 transition-all duration-300 text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {submittingLogin ? 'Signing In...' : 'Sign In'}
                  </button>

                  <p className="text-center text-[11px] text-teal-100/40 pt-1">
                    Single number login with Registration No. or verified Mobile.
                  </p>
                </form>
              )}

              {/* ---------------- REGISTER FORM ---------------- */}
              {view === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5" autoComplete="off">
                  {regError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                      {regError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      Full Name <span className="text-teal-100/40">(as per Aadhaar card)</span> <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-teal-300/10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-teal-300/10 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      Registration Number
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40" />
                      <input
                        type="text"
                        readOnly
                        value={registrationNo}
                        className="w-full bg-white/[0.03] border border-dashed border-teal-300/30 rounded-xl pl-10 pr-14 py-2.5 text-teal-200 font-mono font-bold tracking-widest text-xs sm:text-sm select-none outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyText(registrationNo, 'Registration No. copied!')}
                        title="Copy Registration Number"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-300/70 hover:text-white transition px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Referral Number */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      Referral Number <span className="text-teal-100/40">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                      <input
                        type="text"
                        value={referralNo}
                        onChange={(e) => setReferralNo(e.target.value.toUpperCase())}
                        placeholder="e.g. IB123456"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-teal-300/10 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Password & Re-Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-teal-100/70 mb-1">
                        Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-9 py-2 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300/40 hover:text-teal-200 transition"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-100/70 mb-1">
                        Re-Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-300/40 group-focus-within:text-teal-300 transition" />
                        <input
                          type={showRegRePassword ? 'text' : 'password'}
                          required
                          value={rePassword}
                          onChange={(e) => setRePassword(e.target.value)}
                          placeholder="Re-enter"
                          className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-9 py-2 text-white placeholder-teal-100/25 outline-none transition focus:border-teal-300/50 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegRePassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300/40 hover:text-teal-200 transition"
                        >
                          {showRegRePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingReg}
                    className="w-full mt-3 bg-gradient-to-r from-teal-300 to-teal-400 hover:from-teal-200 hover:to-teal-300 text-[#022c33] font-bold py-3 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-400/40 hover:-translate-y-0.5 transition-all duration-300 text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {submittingReg ? 'Registering...' : 'Create Account'}
                  </button>

                  <p className="text-center text-[10px] text-teal-100/40 pt-1">
                    No online payment. Account activates upon cash receipt at office.
                  </p>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-teal-200/30 text-[11px] mt-4 tracking-wide">
          © {new Date().getFullYear()} Iston Builder Group · Adviser Portal
        </p>
      </main>

      {/* Floating Bottom Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#0d4a4e]/95 backdrop-blur-xl border border-teal-300/30 text-teal-50 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-300" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
