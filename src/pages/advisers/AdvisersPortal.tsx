import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Check,
  Copy,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Phone,
  Gift,
  ArrowRight,
  ShieldCheck,
  Building,
  Users,
  TrendingUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import Logo from '../../components/Logo';
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

  // Toast State
  const [toastMsg, setToastMsg] = useState('');

  useSeo('Adviser Portal — Iston Builder Group', 'Single number login · Minimalist luxury portal for authorized Iston real estate advisers.');

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

  const copyText = (val: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(val);
    showToast(label);
  };

  const openPlanNewWindow = () => {
    window.open('/advisers/plan', '_blank', 'noopener,noreferrer');
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
    <div className="min-h-screen relative flex flex-col justify-between bg-[#faf8f5] text-[#121212] select-none font-sans">
      {/* Background Architectural Grid Accent */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5dfd3_1px,transparent_1px),linear-gradient(to_bottom,#e5dfd3_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

      {/* Full-Width Main Website Style Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#ded8cc] bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Logo />
            <span className="hidden md:inline-block w-px h-6 bg-[#ded8cc]" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f0e4] text-[#96742e] text-[11px] font-bold border border-[#ded5c0]">
              <Sparkles className="w-3.5 h-3.5" /> Adviser Portal
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={openPlanNewWindow}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#96742e] hover:text-[#7d5f22] bg-[#f5f0e4] border border-[#ded5c0] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition shadow-xs whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Adviser</span> Plan ↗
            </button>
            <div className="scale-90 origin-right hidden md:block">
              <LanguageToggle solid={true} />
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#555] hover:text-[#121212] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full border border-[#ded8cc] hover:bg-[#f5f2ea] transition whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back to</span> Website
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form & Content Area */}
      <main className={`relative z-10 w-full mx-auto my-auto px-4 py-8 sm:py-12 transition-all duration-300 ${
        view === 'locked_red' ? 'max-w-3xl' : 'max-w-md sm:max-w-lg'
      }`}>
        <div className="bg-white border border-[#ded8cc] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] p-6 sm:p-10 select-none">

          {/* Logo & Header Inside Card */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl p-2 bg-[#f5f2ea] border border-[#ded8cc] shadow-xs flex items-center justify-center">
              <img
                src="/images/logo.jpg"
                alt="Iston Builder Group"
                className="w-12 h-12 object-cover rounded-xl"
              />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#121212] mt-4 tracking-tight">
              Adviser Login
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[#96742e] font-semibold mt-1.5">
              Single Number Login · Private Network
            </p>
          </div>

          {/* ============================================================== */}
          {/* VIEW: RED SCREEN — LOCKED / PENDING CASH VERIFICATION          */}
          {/* ============================================================== */}
          {view === 'locked_red' && targetAdviser && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rounded-3xl bg-[#fff7f7] border-2 border-rose-300 p-6 sm:p-8 text-[#121212] text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Account Locked — Awaiting Office Cash Verification
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                    Registration Submitted
                  </h2>
                  <p className="text-xs sm:text-sm text-[#555] max-w-md mx-auto mt-2 leading-relaxed">
                    Please deposit <b>₹1,100 cash</b> at our Iston Builder Group office. Once verified, our team will activate your profile and issue your secret <b>Login Token Number</b>.
                  </p>
                </div>

                {/* Registration Number Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e5dfd3] max-w-md mx-auto text-left space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#777]">
                    <span className="uppercase tracking-wider font-semibold">Your Registration Number</span>
                    <button
                      type="button"
                      onClick={() => copyText(targetAdviser.registration_no || targetAdviser.adviser_id)}
                      className="text-[#96742e] hover:text-[#7d5f22] font-bold flex items-center gap-1 transition text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-black text-[#121212] tracking-wider select-all">
                    {targetAdviser.registration_no || targetAdviser.adviser_id}
                  </p>
                  <div className="pt-2 border-t border-[#f0ece1] text-xs text-[#555] grid grid-cols-2 gap-2">
                    <p><span className="text-[#888]">Name:</span> <b className="text-[#121212]">{targetAdviser.full_name}</b></p>
                    <p><span className="text-[#888]">Mobile:</span> <b className="text-[#121212]">{targetAdviser.phone}</b></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier(targetAdviser.registration_no || targetAdviser.adviser_id);
                      setView('login');
                    }}
                    className="flex-1 bg-[#121212] hover:bg-black text-[#faf8f5] font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    Have Your Token? Login <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={openPlanNewWindow}
                    className="py-3 px-4 rounded-xl border border-[#ded8cc] bg-white hover:bg-[#f5f2ea] text-xs font-semibold text-[#121212] transition flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#96742e]" /> View Plan ↗
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationNo(adviserService.generateRegistrationNo());
                    setView('register');
                  }}
                  className="text-xs text-[#777] hover:text-[#121212] font-semibold transition underline decoration-[#ded8cc]"
                >
                  Register Another Adviser Account
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: APPROVED GREEN SCREEN (WELCOME)                         */}
          {/* ============================================================== */}
          {view === 'approved_green' && targetAdviser && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="rounded-3xl bg-[#f4fbf7] border-2 border-emerald-300 p-6 sm:p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Verified &amp; Active Adviser
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-3">
                    Welcome, {targetAdviser.full_name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#555] max-w-sm mx-auto mt-1">
                    Your account is fully activated. Access your commissions, property leads, and network.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#e5dfd3] max-w-sm mx-auto flex items-center justify-between text-xs">
                  <span className="text-[#777]">Adviser ID</span>
                  <span className="font-mono font-bold text-[#121212] text-sm">
                    {targetAdviser.registration_no || targetAdviser.adviser_id}
                  </span>
                </div>

                {/* Primary Button to Open Dashboard in new window */}
                <div className="pt-2 flex flex-col gap-2.5 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      window.open('/advisers/dashboard', '_blank');
                    }}
                    className="w-full bg-[#121212] hover:bg-black text-[#faf8f5] font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open Adviser Dashboard ↗
                  </button>
                  <button
                    type="button"
                    onClick={openPlanNewWindow}
                    className="w-full py-3 rounded-xl border border-[#ded8cc] bg-white hover:bg-[#f5f2ea] text-xs font-semibold text-[#121212] transition flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#96742e]" /> View Plan &amp; Commission Deck ↗
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-4 text-xs text-[#777]">
                <button
                  type="button"
                  onClick={() => {
                    setStoredAdviserAuth(null);
                    setTargetAdviser(null);
                    setView('login');
                  }}
                  className="hover:text-[#121212] transition underline decoration-[#ded8cc]"
                >
                  Sign Out
                </button>
                <span>•</span>
                <Link to="/" className="hover:text-[#121212] transition underline decoration-[#ded8cc]">
                  Back to Website
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: LOGIN FORM                                               */}
          {/* ============================================================== */}
          {view === 'login' && (
            <div className="space-y-6">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#f5f2ea] border border-[#ded8cc] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginType('reg');
                    setLoginError('');
                  }}
                  className={`py-2 rounded-lg transition ${
                    loginType === 'reg'
                      ? 'bg-white text-[#121212] shadow-xs'
                      : 'text-[#666] hover:text-[#121212]'
                  }`}
                >
                  Registration Number
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginType('mobile');
                    setLoginError('');
                  }}
                  className={`py-2 rounded-lg transition ${
                    loginType === 'mobile'
                      ? 'bg-white text-[#121212] shadow-xs'
                      : 'text-[#666] hover:text-[#121212]'
                  }`}
                >
                  Mobile Number
                </button>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Identifier Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                    {loginType === 'reg' ? 'Registration Number' : 'Registered Mobile Number'}
                  </label>
                  <div className="relative">
                    <input
                      type={loginType === 'reg' ? 'text' : 'tel'}
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={loginType === 'reg' ? 'e.g. IB928371' : 'e.g. 9876543210'}
                      className="w-full px-4 py-3 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                {/* Password / Token Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                    Password / Office Token Number
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your secret token or password"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#121212]"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#777] mt-1.5">
                    Approved advisers can log in using their office token or set password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingLogin}
                  className="w-full bg-[#121212] hover:bg-black text-[#faf8f5] font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingLogin ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-[#f0ece1] text-center space-y-3">
                <p className="text-xs text-[#666]">
                  Not an adviser yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setLoginError('');
                    }}
                    className="font-bold text-[#121212] hover:text-[#96742e] underline transition"
                  >
                    Register New Adviser
                  </button>
                </p>
                <div>
                  <button
                    type="button"
                    onClick={openPlanNewWindow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#96742e] hover:text-[#7d5f22] transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> View Commission &amp; Growth Plan ↗
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: REGISTER FORM                                            */}
          {/* ============================================================== */}
          {view === 'register' && (
            <div className="space-y-6">
              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                    Full Name (As Per Aadhaar Card)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition"
                    required
                  />
                </div>

                {/* Registration Number (Display with Copy) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider">
                      Assigned Registration No.
                    </label>
                    <button
                      type="button"
                      onClick={() => copyText(registrationNo, 'Registration number copied!')}
                      className="text-xs font-semibold text-[#96742e] hover:text-[#7d5f22] flex items-center gap-1 transition"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-[#f5f2ea] border border-[#ded8cc] text-[#121212] font-mono text-base font-bold tracking-wider select-all">
                    {registrationNo}
                  </div>
                </div>

                {/* Referral Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                    Sponsor / Referral Code <span className="text-[#888] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralNo}
                    onChange={(e) => setReferralNo(e.target.value.toUpperCase())}
                    placeholder="e.g. IB100001"
                    className="w-full px-4 py-3 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition uppercase font-mono"
                  />
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 4 chars"
                        className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#121212]"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#121212] uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegRePassword ? 'text' : 'password'}
                        value={rePassword}
                        onChange={(e) => setRePassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[#121212] placeholder-[#999] text-sm focus:outline-none focus:border-[#121212] focus:bg-white transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegRePassword(!showRegRePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#121212]"
                      >
                        {showRegRePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ded8cc] text-[11px] text-[#666] leading-relaxed">
                  Joining involves an office deposit of <b>₹1,100 cash</b>. Upon office verification, you receive an instant <b>₹300 joining welcome bonus</b> credited to your wallet.
                </div>

                <button
                  type="submit"
                  disabled={submittingReg}
                  className="w-full bg-[#121212] hover:bg-black text-[#faf8f5] font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingReg ? 'Submitting...' : 'Complete Registration'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-[#f0ece1] text-center">
                <p className="text-xs text-[#666]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setRegError('');
                    }}
                    className="font-bold text-[#121212] hover:text-[#96742e] underline transition"
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 max-w-7xl w-full mx-auto text-center py-6 px-4 border-t border-[#e5dfd3] flex flex-col sm:flex-row items-center justify-between text-xs text-[#777] gap-3">
        <p>© {new Date().getFullYear()} Iston Builder Group. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openPlanNewWindow}
            className="hover:text-[#121212] transition underline decoration-[#ded8cc]"
          >
            Adviser Growth Plan ↗
          </button>
          <span>•</span>
          <Link to="/contact" className="hover:text-[#121212] transition underline decoration-[#ded8cc]">
            Office Support
          </Link>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#121212] text-[#faf8f5] text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-[#333] animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
