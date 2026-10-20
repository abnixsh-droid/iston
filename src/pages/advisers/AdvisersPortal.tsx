import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Building,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Phone,
  FileText,
  BadgeAlert,
  ArrowLeft,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { adviserService, type AdviserRecord, getStoredAdviserAuth, setStoredAdviserAuth } from '../../lib/adviserService';
import { inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';
import LanguageToggle from '../../components/LanguageToggle';

export default function AdvisersPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active view: 'register' | 'login' | 'locked_red' | 'approved_green'
  const [view, setView] = useState<'register' | 'login' | 'locked_red' | 'approved_green'>('register');

  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNo, setRegistrationNo] = useState(adviserService.generateRegistrationNo());
  const [referralNo, setReferralNo] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [regError, setRegError] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Login Form Fields (-- single number login --)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginTokenOrPassword, setLoginTokenOrPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Target Adviser Record (for Red Locked screen or Green Approved screen)
  const [targetAdviser, setTargetAdviser] = useState<AdviserRecord | null>(null);
  const [copiedRegNo, setCopiedRegNo] = useState(false);

  useSeo('Adviser Login & Registration — Iston Builder Group', 'Official adviser registration and single number token login portal.');

  // Pre-fill referral code from query param if available
  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('sponsor');
    if (ref) {
      setReferralNo(ref.toUpperCase());
    }

    // Check if user already has an active session
    const currentSession = getStoredAdviserAuth();
    if (currentSession && currentSession.status === 'active') {
      setTargetAdviser(currentSession);
    }
  }, [searchParams]);

  const handleRegenerateRegNo = () => {
    setRegistrationNo(adviserService.generateRegistrationNo());
  };

  const copyRegistrationNo = (no?: string) => {
    const val = no || registrationNo;
    navigator.clipboard.writeText(val);
    setCopiedRegNo(true);
    setTimeout(() => setCopiedRegNo(false), 2000);
  };

  // Handle Adviser Registration Submit
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
      return setRegError('Password and Re-Password do not match.');
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
      setRegError(err?.message || 'Error creating adviser registration.');
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Adviser Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      return setLoginError('Please enter your Registration Number or Mobile number.');
    }
    if (!loginTokenOrPassword.trim()) {
      return setLoginError('Please enter your Token Number or Password.');
    }

    setSubmittingLogin(true);
    try {
      const res = await adviserService.adviserLogin({
        identifier: loginIdentifier.trim(),
        tokenOrPassword: loginTokenOrPassword.trim(),
      });

      if (res?.status === 'pending' && res.adviser) {
        // Pending approval -> Show RED SCREEN
        setTargetAdviser(res.adviser);
        setView('locked_red');
      } else if (res?.ok && res.adviser) {
        // Approved -> Show GREEN SCREEN
        setTargetAdviser(res.adviser);
        setView('approved_green');
      } else {
        setLoginError(res?.error || 'Invalid credentials or registration not found.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Error during adviser login.');
    } finally {
      setSubmittingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* TOP BRAND BAR */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 text-neutral-900 font-bold tracking-tight">
              <img
                src="/images/logo.jpg"
                alt="Iston Builder Group logo"
                width={34}
                height={34}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover ring-1 ring-neutral-200 shadow-2xs"
              />
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-wide uppercase text-neutral-900">
                  Iston <span className="text-orange-600 font-bold">Advisers</span>
                </span>
                <span className="block text-[8px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                  Adviser Login &amp; Portal
                </span>
              </span>
            </Link>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-orange-600 transition"
            >
              ← Main Website
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle solid={true} />
            {targetAdviser?.status === 'active' && (
              <Link
                to="/advisers/dashboard"
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="py-8 md:py-14 px-4">
        <div className="max-w-4xl mx-auto">
          {/* ============================================================== */}
          {/* VIEW: RED SCREEN — ACCOUNT LOCKED / PENDING CASH VERIFICATION   */}
          {/* ============================================================== */}
          {view === 'locked_red' && targetAdviser && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rounded-3xl border-2 border-rose-500 bg-white p-6 md:p-8 shadow-lg text-center relative overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-7 h-7" />
                </div>

                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold uppercase tracking-wider">
                  <BadgeAlert className="w-3.5 h-3.5 text-rose-600" /> Account Locked · Cash Verification Pending
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy mt-2">
                  Verification Pending
                </h1>

                <p className="mt-1 text-xs text-muted max-w-md mx-auto">
                  Your registration is recorded. Complete the offline cash payment at the office to receive your Login Token.
                </p>

                {/* REGISTRATION DETAILS CARD */}
                <div className="mt-5 max-w-sm mx-auto p-4 rounded-2xl bg-mist/60 border border-line text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
                    <span className="text-muted font-medium text-[11px]">Your Registration Number:</span>
                    <button
                      type="button"
                      onClick={() => copyRegistrationNo(targetAdviser.registration_no || targetAdviser.adviser_id)}
                      className="text-[11px] text-orange-600 font-bold hover:underline flex items-center gap-1"
                    >
                      {copiedRegNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedRegNo ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-xl font-black text-rose-700 tracking-wider mt-2 select-all">
                    {targetAdviser.registration_no || targetAdviser.adviser_id}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-line text-xs space-y-1 text-neutral-700">
                    <p><b className="text-navy">Name:</b> {targetAdviser.full_name}</p>
                    <p><b className="text-navy">Mobile:</b> {targetAdviser.phone}</p>
                    {targetAdviser.sponsor_id && (
                      <p><b className="text-navy">Sponsor No:</b> {targetAdviser.sponsor_id}</p>
                    )}
                  </div>
                </div>

                {/* 3-STEP OFFLINE CASH ACTIVATION */}
                <div className="mt-5 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs">
                  <div className="p-3 rounded-xl bg-mist/40 border border-line">
                    <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold grid place-items-center mb-1.5">1</span>
                    <p className="font-bold text-navy text-[11px]">Pay ₹1,100 Cash</p>
                    <p className="text-[10px] text-muted mt-0.5">Submit registration fee in cash at the Iston office.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mist/40 border border-line">
                    <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold grid place-items-center mb-1.5">2</span>
                    <p className="font-bold text-navy text-[11px]">Admin Approval</p>
                    <p className="text-[10px] text-muted mt-0.5">Admin verifies cash and issues your Login Token.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mist/40 border border-line">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold grid place-items-center mb-1.5">3</span>
                    <p className="font-bold text-navy text-[11px]">Login with Token</p>
                    <p className="text-[10px] text-muted mt-0.5">Access your dashboard with your Reg No &amp; Token.</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier(targetAdviser.registration_no || targetAdviser.adviser_id);
                      setView('login');
                    }}
                    className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" /> Have Your Token? Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setRegistrationNo(adviserService.generateRegistrationNo());
                    }}
                    className="btn btn-outline text-xs"
                  >
                    Register Another Account
                  </button>
                </div>
              </div>

              {/* 2 WAYS TO EARN COMPACT PREVIEW */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-line shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 grid place-items-center">
                      <Building className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-navy text-sm">Sell Property</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Earn <b>10% direct sales commission</b> on company brokerage for every flat or residential plot buyer you introduce.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-line shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 grid place-items-center">
                      <Users className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-navy text-sm">Make a Team</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Earn <b>₹300 instant joining reward</b> credited to your wallet for every adviser registered under your referral code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: GREEN SCREEN — ACCOUNT APPROVED & TOKEN VERIFIED          */}
          {/* ============================================================== */}
          {view === 'approved_green' && targetAdviser && (
            <div className="rounded-3xl border-2 border-emerald-500 bg-linear-to-b from-emerald-500/10 via-emerald-500/5 to-white p-8 md:p-12 shadow-xl text-center max-w-xl mx-auto animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Account Approved &amp; Verified
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 mt-3">
                Welcome, {targetAdviser.full_name}!
              </h1>

              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Your cash registration has been verified by admin and your Login Token has been authenticated.
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-white border border-emerald-200 text-left text-xs space-y-1.5 shadow-xs">
                <p><b className="text-neutral-800">Registration No:</b> <span className="font-mono text-emerald-800 font-bold">{targetAdviser.registration_no || targetAdviser.adviser_id}</span></p>
                <p><b className="text-neutral-800">Mobile Number:</b> {targetAdviser.phone}</p>
                {targetAdviser.token_number && (
                  <p><b className="text-neutral-800">Verified Token:</b> <span className="font-mono text-neutral-900">{targetAdviser.token_number}</span></p>
                )}
                <p><b className="text-neutral-800">Status:</b> <span className="font-bold text-emerald-700 uppercase">Active Adviser</span></p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/advisers/dashboard')}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  Enter Adviser Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: MAIN TABS (REGISTRATION & SINGLE NUMBER LOGIN)           */}
          {/* ============================================================== */}
          {(view === 'register' || view === 'login') && (
            <div className="max-w-xl mx-auto space-y-6">
              {/* TAB SELECTOR */}
              <div className="p-1 rounded-2xl bg-neutral-200/80 flex items-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setRegError('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition text-center ${
                    view === 'register' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Register as Adviser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition text-center ${
                    view === 'login' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Adviser Login (-- single number login --)
                </button>
              </div>

              {/* ---------------- REGISTER FORM ---------------- */}
              {view === 'register' && (
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      Step 1 of 2 · Application
                    </span>
                    <h1 className="text-2xl font-black text-neutral-900 mt-2">
                      Adviser Registration
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                      Fill out your details to generate your registration number. No online payment required.
                    </p>
                  </div>

                  {regError && (
                    <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {regError}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                    {/* Name: (as per aadhar card) */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Name: <span className="font-normal text-neutral-500">(as per aadhar card)</span> <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name matching your Aadhaar card"
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    {/* Mobile no: */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Mobile no: <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-300 bg-neutral-100 text-neutral-600 text-xs font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit mobile number"
                          className="w-full h-11 px-3.5 rounded-r-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    {/* Registration no: auto generate i.e ( IB273872 ) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-neutral-800">
                          Registration no: <span className="font-normal text-neutral-500">(auto generated)</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleRegenerateRegNo}
                          className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                          title="Generate a different registration number"
                        >
                          <RotateCcw className="w-3 h-3" /> Regenerate
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          readOnly
                          value={registrationNo}
                          className="w-full h-11 px-3.5 pr-20 rounded-xl border border-neutral-300 bg-neutral-100/80 font-mono font-bold text-neutral-900 text-sm focus:outline-hidden select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyRegistrationNo()}
                          className="absolute right-2 px-2.5 py-1 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-[10px] font-bold text-neutral-700 flex items-center gap-1"
                        >
                          {copiedRegNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedRegNo ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        This is your permanent Adviser ID. Keep this number safe.
                      </p>
                    </div>

                    {/* Referal No: */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Referral No: <span className="font-normal text-neutral-400">(optional sponsor registration code)</span>
                      </label>
                      <input
                        type="text"
                        value={referralNo}
                        onChange={(e) => setReferralNo(e.target.value.toUpperCase())}
                        placeholder="e.g. IB123456 or sponsor code"
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100 uppercase"
                      />
                    </div>

                    {/* Password & Re-Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-bold text-neutral-800 mb-1">
                          Password: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create password"
                          className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-800 mb-1">
                          Re-Password: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={rePassword}
                          onChange={(e) => setRePassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={submittingReg}
                        className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingReg ? 'Registering...' : 'Register & Lock My Adviser ID'}
                      </button>
                    </div>

                    <p className="text-center text-[11px] text-neutral-400 pt-2">
                      After registration, your account will be locked pending offline cash verification. Management will approve and issue your login token.
                    </p>
                  </form>
                </div>
              )}

              {/* ---------------- LOGIN FORM (-- single number login --) ---------------- */}
              {view === 'login' && (
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      Adviser Login
                    </span>
                    <h1 className="text-2xl font-black text-neutral-900 mt-2">
                      Single Number Login
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                      Enter your Registration Number (or Mobile) and the Token Number provided after cash approval.
                    </p>
                  </div>

                  {loginError && (
                    <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {loginError}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Registration Number or Mobile: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value.toUpperCase())}
                        placeholder="e.g. IB273872 or 10-digit mobile"
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 font-mono text-sm text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Token Number or Password: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={loginTokenOrPassword}
                        onChange={(e) => setLoginTokenOrPassword(e.target.value)}
                        placeholder="Enter token number (issued after cash approval)"
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingLogin}
                        className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingLogin ? 'Verifying...' : 'Login with Token Number'}
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setView('register');
                          setRegError('');
                        }}
                        className="text-xs text-neutral-600 hover:text-orange-600 font-semibold transition"
                      >
                        Don’t have a Registration Number yet? <span className="underline text-orange-600">Register Here</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
