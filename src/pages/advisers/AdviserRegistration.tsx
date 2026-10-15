import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  QrCode,
  ShieldCheck,
  Building,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adviserService, type AdviserRecord } from '../../lib/adviserService';
import { getReferral, captureReferral } from '../../lib/referral';
import { useSeo } from '../../lib/seo';
import LanguageToggle from '../../components/LanguageToggle';

export default function AdviserRegistration() {
  const { user, isAdviser, signInWithGoogle, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Step state: 1 = Details, 2 = UPI Payment, 3 = Under Process
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sponsorCode, setSponsorCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  // Sponsor validation
  const [sponsorInfo, setSponsorInfo] = useState<{ adviser_id: string; full_name: string; isActive?: boolean } | null>(null);
  const [checkingSponsor, setCheckingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');

  // Payment states
  const [transactionId, setTransactionId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // General states
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [adviser, setAdviser] = useState<AdviserRecord | null>(null);

  useSeo('Apply to Become an Adviser — Iston Builder Group', 'Official adviser registration and ₹1,100 UPI payment portal.');

  // Pre-fill sponsor code from URL query or localStorage
  useEffect(() => {
    captureReferral();
    const querySponsor = searchParams.get('ref') || searchParams.get('sponsor');
    const storedSponsor = querySponsor || getReferral();
    if (storedSponsor) {
      setSponsorCode(storedSponsor.toUpperCase());
    }
  }, [searchParams]);

  // Pre-fill full name from Google profile
  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [user, fullName]);

  // Guarantee scroll is never frozen when visiting or revisiting this page
  useEffect(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [step]);

  // Check if user already has an adviser account
  useEffect(() => {
    if (!user) return;
    adviserService
      .getDashboard(user)
      .then((res) => {
        if (res?.ok && res.adviser) {
          setAdviser(res.adviser);
          if (res.adviser.status === 'active') {
            navigate('/advisers/dashboard', { replace: true });
          } else if (res.adviser.payment_status === 'pending_verification') {
            setStep(3);
          } else if (res.adviser.payment_status === 'pending_payment') {
            setStep(2);
          }
        }
      })
      .catch(() => {
        /* Not yet registered */
      });
  }, [user, navigate]);

  // Live validate sponsor code
  useEffect(() => {
    const code = sponsorCode.trim().toUpperCase();
    if (!code) {
      setSponsorInfo(null);
      setSponsorError('');
      return;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      setCheckingSponsor(true);
      setSponsorError('');
      const res = await adviserService.getSponsor(code);
      if (alive) {
        if (res.ok && res.sponsor) {
          setSponsorInfo(res.sponsor);
          setSponsorError('');
        } else {
          setSponsorInfo(null);
          setSponsorError(res.error || 'Invalid sponsor referral code.');
        }
        setCheckingSponsor(false);
      }
    }, 400);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [sponsorCode]);

  // Handle Step 1 form submission
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      return setError('Please sign in with Google to continue.');
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      return setError('Please enter your full legal name.');
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      return setError('Please enter a valid 10-12 digit mobile phone number.');
    }

    setBusy(true);
    try {
      const res = await adviserService.register(
        {
          full_name: fullName.trim(),
          phone: phone.trim(),
          sponsor_code: sponsorCode.trim().toUpperCase() || undefined,
          bank_details: {
            upi_id: upiId.trim() || undefined,
            account_number: accountNumber.trim() || undefined,
            ifsc: ifsc.trim().toUpperCase() || undefined,
            bank_name: bankName.trim() || undefined,
          },
        },
        user
      );

      if (res?.ok && res.adviser) {
        setAdviser(res.adviser);
        setStep(2);
        await refreshUser();
      } else {
        setError(res?.error || 'Registration failed. Please check your information and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Handle Step 2 UPI Payment submission
  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!user) return;
    const utr = transactionId.trim();
    if (!utr || utr.length < 4) {
      return setPaymentError('Please enter a valid UPI Transaction ID / UTR number.');
    }

    setSubmittingPayment(true);
    try {
      const res = await adviserService.submitPayment(utr, user);
      if (res?.ok && res.adviser) {
        setAdviser(res.adviser);
        setStep(3);
        await refreshUser();
      } else {
        setPaymentError(res?.error || 'Could not verify payment reference. Please try again.');
      }
    } catch (err: any) {
      setPaymentError(err?.message || 'Error submitting transaction ID. Please retry.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('918484843391@okbizaxis');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const upiPayUrl = `upi://pay?pa=918484843391@okbizaxis&pn=Iston+Builder+Group&am=1100&cu=INR&tn=Adviser+Registration`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* MINIMAL TOP BAR */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/advisers-program" className="flex items-center gap-2 text-neutral-900 font-bold tracking-tight">
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
              to="/advisers-program"
              className="text-xs font-semibold text-neutral-500 hover:text-orange-600 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Advisers Overview</span>
              <span className="sm:hidden">Overview</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle solid={true} />
            {user ? (
              <span className="text-xs font-medium text-neutral-600 hidden md:inline truncate max-w-[150px]">
                {user.email}
              </span>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="px-3.5 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-14">
        {/* PROGRESS STEPPER */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div
              className={`p-2.5 rounded-xl border transition ${
                step === 1
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : step > 1
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-neutral-200 bg-white text-neutral-400'
              }`}
            >
              <span className="inline-block mr-1">1.</span> Personal Details
            </div>
            <div
              className={`p-2.5 rounded-xl border transition ${
                step === 2
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : step > 2
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-neutral-200 bg-white text-neutral-400'
              }`}
            >
              <span className="inline-block mr-1">2.</span> Pay ₹1,100 (UPI)
            </div>
            <div
              className={`p-2.5 rounded-xl border transition ${
                step === 3
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-neutral-200 bg-white text-neutral-400'
              }`}
            >
              <span className="inline-block mr-1">3.</span> Verification
            </div>
          </div>
        </div>

        {/* STEP 1: AUTHENTICATION & PERSONAL DETAILS */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-10 shadow-xs">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold tracking-wider uppercase mb-2">
                Step 1 of 2
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Adviser Registration</h1>
              <p className="text-neutral-500 text-xs md:text-sm mt-1">
                Enter your official information to establish your accredited adviser record.
              </p>
            </div>


            {!user ? (
              <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-2xl p-6">
                <ShieldCheck className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-neutral-900">Sign In with Google Required</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
                  To safeguard referral earnings and ensure legal compliance, adviser accounts are securely linked to your verified Google email.
                </p>
                <button
                  onClick={() => signInWithGoogle()}
                  className="px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.290-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                    <path fill="#ffffff" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                    <path fill="#ffffff" d="M12 5.38c1.620 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                  </svg>
                  Sign in with Google to Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Mobile Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Verified Google Email</label>
                  <input
                    type="email"
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-600 text-xs cursor-not-allowed"
                    value={user.email || ''}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Locked to your verified Google authentication.</p>
                </div>

                {/* Sponsor code */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-700">Sponsor Referral Code (Optional)</label>
                    {checkingSponsor && <span className="text-[10px] text-orange-600">Checking...</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. ADV1001"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs uppercase font-mono tracking-wider"
                    value={sponsorCode}
                    onChange={(e) => setSponsorCode(e.target.value.toUpperCase())}
                  />
                  {sponsorInfo && (
                    <p className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Sponsor: {sponsorInfo.full_name} ({sponsorInfo.adviser_id})
                    </p>
                  )}
                  {sponsorError && <p className="text-rose-600 text-[11px] mt-1">{sponsorError}</p>}
                </div>

                {/* Payout Details */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800">Payout Details (For Receiving Your Rewards)</h4>
                    <p className="text-[11px] text-neutral-500">You can also update this later in your dashboard.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. name@okhdfcbank"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-600 mb-1">Bank Account No.</label>
                      <input
                        type="text"
                        placeholder="Account Number"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-600 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="IFSC"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs uppercase"
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Payment (₹1,100)'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: UPI PAYMENT & UTR SUBMISSION */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-10 shadow-xs">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold tracking-wider uppercase mb-2">
                Step 2 of 2
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Complete Registration Payment</h2>
              <p className="text-xs md:text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                Scan the dynamic UPI QR code with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay the registration fee of ₹1,100.
              </p>
            </div>

            {/* QR CODE CARD */}
            <div className="bg-gradient-to-b from-orange-50 to-white rounded-3xl border-2 border-orange-200 p-6 text-center max-w-sm mx-auto shadow-sm">
              <div className="inline-block p-3 rounded-2xl bg-white border border-orange-200 shadow-sm mb-3">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-52 h-52 mx-auto" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-orange-950 uppercase tracking-wider">Registration Amount</span>
                <p className="text-3xl font-extrabold text-orange-600">₹1,100</p>
                <p className="text-xs text-neutral-600 font-medium">Payee: Iston Builder Group</p>
              </div>

              {/* COPY UPI ID */}
              <div className="mt-4 pt-4 border-t border-orange-100 flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-semibold text-neutral-800 select-all truncate">
                  918484843391@okbizaxis
                </span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 font-semibold text-xs transition flex items-center gap-1 shrink-0"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>

              <a
                href={upiPayUrl}
                className="mt-3 w-full py-2.5 rounded-xl bg-orange-100 text-orange-900 font-bold text-xs hover:bg-orange-200 transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in UPI App
              </a>
            </div>

            {/* SUBMIT TRANSACTION ID */}
            <form onSubmit={handlePaymentSubmit} className="mt-8 max-w-md mx-auto space-y-4">
              {paymentError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  UPI Transaction ID / UTR Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit UTR from your payment receipt"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Found in your GPay / PhonePe / Paytm / Bank payment details screen.
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: UNDER PROCESS / VERIFICATION PENDING */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-12 shadow-xs text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wider uppercase mb-2">
              Application Under Process
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Verification Pending</h2>
            <p className="text-xs md:text-sm text-neutral-600 mt-2 max-w-md mx-auto">
              Your registration application and payment reference have been received and submitted to the administration team.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Applicant:</span>
                <span className="font-semibold text-neutral-900">{adviser?.full_name || fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Verified Email:</span>
                <span className="font-semibold text-neutral-900">{adviser?.email || user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Submitted UTR:</span>
                <span className="font-mono font-bold text-orange-600">{adviser?.payment_reference || transactionId}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Fee Amount:</span>
                <span className="font-bold text-neutral-900">₹1,100</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-left">
              <p className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-600" /> What happens next?
              </p>
              <p className="text-[11px] text-orange-900 mt-1 leading-relaxed">
                Our administration team matches incoming bank credits with submitted UTRs within 2-4 hours. Once verified and approved, your unique Adviser ID, referral code, and shareable link will become active immediately.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/advisers-program"
                className="px-6 py-2.5 rounded-full border border-neutral-300 font-semibold text-xs hover:bg-neutral-50 text-neutral-700"
              >
                Back to Advisers Overview
              </Link>
              <Link
                to="/"
                className="px-6 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs"
              >
                Go to Main Website
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
