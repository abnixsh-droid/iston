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
} from 'lucide-react';
import { adviserService, type AdviserRecord, getStoredAdviserAuth } from '../../lib/adviserService';
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
        setTargetAdviser(res.adviser);
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
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-[#011a1f] via-[#03343b] to-[#0d5f55] text-white">
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
          <LanguageToggle solid />
        </div>
      </header>

      {/* Main Container Card */}
      <main className="relative z-10 w-full max-w-md lg:max-w-lg mx-auto my-auto py-2">
        <div className="bg-[#062f35]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10">

          {/* Logo & Branding */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-teal-500/30 ring-1 ring-white/20">
              <Sparkles className="w-7 h-7 text-[#022c33]" />
            </div>
            <h1 className="text-2xl font-bold text-white mt-3 tracking-tight">Adviser Portal</h1>
            <p className="text-teal-200/50 text-xs sm:text-sm mt-1">Single number login · Secure &amp; simple</p>
          </div>

          {/* ============================================================== */}
          {/* VIEW: RED SCREEN — LOCKED / PENDING CASH VERIFICATION          */}
          {/* ============================================================== */}
          {view === 'locked_red' && targetAdviser && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Verification Pending
                </span>
                <h2 className="text-lg font-bold text-white mt-1.5">Account Locked</h2>
                <p className="text-xs text-teal-100/60 mt-0.5">Pay ₹1,100 cash at office to receive your Token.</p>
              </div>

              {/* Registration Number Box */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-teal-100/60 text-[11px]">
                  <span>Your Registration Number:</span>
                  <button
                    type="button"
                    onClick={() => copyText(targetAdviser.registration_no || targetAdviser.adviser_id)}
                    className="text-teal-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="font-mono text-xl font-bold text-rose-400 tracking-wider">
                  {targetAdviser.registration_no || targetAdviser.adviser_id}
                </p>
                <div className="pt-2 border-t border-white/5 text-[11px] text-teal-100/70 space-y-0.5">
                  <p><span className="text-teal-100/40">Name:</span> {targetAdviser.full_name}</p>
                  <p><span className="text-teal-100/40">Mobile:</span> {targetAdviser.phone}</p>
                </div>
              </div>

              {/* Minimal 3-Step Offline Guide */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-bold text-teal-300 block">1. Pay Cash</span>
                  <span className="text-teal-100/40 mt-0.5 block">₹1,100 at office</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-bold text-teal-300 block">2. Approval</span>
                  <span className="text-teal-100/40 mt-0.5 block">Token issued</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-bold text-teal-300 block">3. Login</span>
                  <span className="text-teal-100/40 mt-0.5 block">Start earning</span>
                </div>
              </div>

              {/* 2 Ways to Earn Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1 text-teal-300 font-bold text-[11px] mb-0.5">
                    <Building className="w-3.5 h-3.5" /> Sell Property
                  </div>
                  <p className="text-[10px] text-teal-100/60 leading-tight">10% direct sales brokerage commission.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px] mb-0.5">
                    <Users className="w-3.5 h-3.5" /> Make a Team
                  </div>
                  <p className="text-[10px] text-teal-100/60 leading-tight">₹300 joining bonus for each member.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(targetAdviser.registration_no || targetAdviser.adviser_id);
                    setView('login');
                  }}
                  className="w-full bg-gradient-to-r from-teal-300 to-teal-400 hover:from-teal-200 hover:to-teal-300 text-[#022c33] font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 text-xs tracking-wider uppercase transition"
                >
                  Have Your Token? Login Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationNo(adviserService.generateRegistrationNo());
                    setView('register');
                  }}
                  className="w-full py-2.5 text-xs text-teal-100/60 hover:text-white transition"
                >
                  Register Another Account
                </button>
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
                onClick={() => navigate('/advisers/dashboard')}
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

                  {/* Registration Number (Auto-generated) */}
                  <div>
                    <label className="block text-xs font-medium text-teal-100/70 mb-1">
                      Registration Number
                      <span className="text-amber-300/80 text-[10px] ml-1.5 font-mono">
                        (Auto-generated)
                      </span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40" />
                      <input
                        type="text"
                        readOnly
                        value={registrationNo}
                        className="w-full bg-white/[0.03] border border-dashed border-teal-300/30 rounded-xl pl-10 pr-20 py-2.5 text-teal-200 font-mono font-bold tracking-widest text-xs sm:text-sm select-all outline-none"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRegenerateRegNo}
                          title="Generate new ID"
                          className="text-teal-300/60 hover:text-teal-100 transition p-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(registrationNo, 'Registration No. copied!')}
                          title="Copy ID"
                          className="text-teal-300/60 hover:text-teal-100 transition p-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
