import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Building,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { getReferral, captureReferral } from '../../lib/referral';
import { inr } from '../../lib/format';
import { useSeo } from '../../lib/seo';

export default function AdvisersPortal() {
  const { user, isAdviser, signInWithGoogle, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Application form states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sponsorCode, setSponsorCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Sponsor validation
  const [sponsorInfo, setSponsorInfo] = useState<{ adviser_id: string; full_name: string } | null>(null);
  const [checkingSponsor, setCheckingSponsor] = useState(false);

  // Payment states
  const [transactionId, setTransactionId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Adviser account details
  const [adviserAccount, setAdviserAccount] = useState<any>(null);
  const [loadingAdviser, setLoadingAdviser] = useState(false);

  useSeo('Advisers Program — Iston Builder Group', 'Earn tiered referral rewards and property sales commissions with Iston Builder Group.');

  // Pre-fill sponsor code
  useEffect(() => {
    captureReferral();
    const querySponsor = searchParams.get('ref') || searchParams.get('sponsor');
    const storedSponsor = querySponsor || getReferral();
    if (storedSponsor) {
      setSponsorCode(storedSponsor.toUpperCase());
    }
  }, [searchParams]);

  // Pre-fill user name from Google
  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [user, fullName]);

  // Check sponsor code validity
  useEffect(() => {
    const code = sponsorCode.trim().toUpperCase();
    if (!code) {
      setSponsorInfo(null);
      return;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      setCheckingSponsor(true);
      try {
        const res = await api<{ ok: boolean; sponsor: any }>(`/api/advisers?action=get_sponsor&code=${encodeURIComponent(code)}`);
        if (alive && res.ok && res.sponsor) {
          setSponsorInfo(res.sponsor);
        }
      } catch {
        if (alive) setSponsorInfo(null);
      } finally {
        if (alive) setCheckingSponsor(false);
      }
    }, 400);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [sponsorCode]);

  // Fetch adviser status for logged in user
  const loadAdviserStatus = async () => {
    if (!user) return;
    try {
      setLoadingAdviser(true);
      const res = await api<any>('/api/advisers?action=get_dashboard', { auth: true });
      if (res?.ok && res.adviser) {
        setAdviserAccount(res.adviser);
      }
    } catch {
      // Not yet an adviser or pending
      if (user.adviser) {
        setAdviserAccount(user.adviser);
      }
    } finally {
      setLoadingAdviser(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAdviserStatus();
    }
  }, [user]);

  // Handle Application Submit
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      return setApplyError('Please enter your full legal name.');
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      return setApplyError('Please enter a valid 10-12 digit mobile phone number.');
    }

    setApplying(true);
    try {
      const res = await api<{ ok: boolean; adviser: any }>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'register',
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
      });

      if (res.ok && res.adviser) {
        setAdviserAccount(res.adviser);
        setShowApplyModal(false);
        await refreshUser();
      }
    } catch (err: any) {
      setApplyError(err.message || 'Application failed. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Handle Transaction ID Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentMsg(null);
    const utr = transactionId.trim();
    if (!utr || utr.length < 4) {
      return setPaymentMsg({ type: 'err', text: 'Please enter a valid UPI Transaction ID / UTR.' });
    }

    setSubmittingPayment(true);
    try {
      const res = await api<{ ok: boolean; adviser: any }>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'submit_payment',
          transaction_id: utr,
        },
      });

      if (res.ok && res.adviser) {
        setAdviserAccount(res.adviser);
        setPaymentMsg({
          type: 'ok',
          text: 'Payment details submitted successfully! Your account will be activated once verified by admin.',
        });
        await refreshUser();
      }
    } catch (err: any) {
      setPaymentMsg({ type: 'err', text: err.message || 'Error submitting transaction ID' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('918484843391@okbizaxis');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyRefLink = () => {
    if (!adviserAccount?.referral_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/advisers-program?ref=${adviserAccount.referral_code}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const upiPayUrl = `upi://pay?pa=918484843391@okbizaxis&pn=Iston+Builder+Group&am=1100&cu=INR&tn=Adviser+Registration`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const isApprovedAdviser = adviserAccount?.status === 'active';
  const isPaymentPending = adviserAccount && (!adviserAccount.payment_reference || adviserAccount.payment_status === 'pending_payment');
  const isVerificationPending = adviserAccount?.payment_status === 'pending_verification' && adviserAccount?.status === 'pending';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* MINIMAL TOP BAR */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-neutral-900 font-bold tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-orange-600 text-white font-display text-lg flex items-center justify-center shadow-xs">
                I
              </span>
              <span className="text-sm font-semibold tracking-wide uppercase text-neutral-800">
                Iston <span className="text-orange-600 font-bold">Advisers</span>
              </span>
            </Link>
            <Link to="/" className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-orange-600 transition">
              ← Main Website
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-600 hidden sm:inline">{user.email}</span>
                {isApprovedAdviser ? (
                  <Link
                    to="/advisers/dashboard"
                    className="px-3.5 py-1.5 rounded-full bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 shadow-xs"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
                    {isVerificationPending ? 'Under Verification' : 'Applicant'}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="py-12 md:py-20 px-4 text-center bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold tracking-wider uppercase border border-orange-200">
            Official Real Estate Network
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
            Earn with <span className="text-orange-600">Iston Builder Group</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-neutral-600 max-w-2xl mx-auto font-normal">
            Join our accredited advisers network. Build your referral hierarchy, earn instant registration rewards, and secure up to 10% property sales commissions.
          </p>

          {/* DYNAMIC ACTION BUTTON */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!user ? (
              <button
                onClick={() => signInWithGoogle()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.290-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#ffffff" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#ffffff" d="M12 5.38c1.620 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Sign in with Google to Start
              </button>
            ) : isApprovedAdviser ? (
              <Link
                to="/advisers/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                Go to Adviser Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isVerificationPending ? (
              <a
                href="#payment-status"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> Payment Under Verification
              </a>
            ) : isPaymentPending ? (
              <a
                href="#payment-section"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                Complete ₹1,100 UPI Payment <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                Become an Adviser (Apply Now) <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CORE HIGHLIGHTS GRID (MINIMAL & SHARP) */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Registration</span>
            <p className="mt-2 text-3xl font-extrabold text-neutral-900">₹1,100</p>
            <p className="mt-1 text-xs text-neutral-500">One-time registration fee for official adviser credential & tracking link.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Referral Rewards</span>
            <p className="mt-2 text-3xl font-extrabold text-neutral-900">₹300 / ₹200</p>
            <p className="mt-1 text-xs text-neutral-500">₹300 direct sponsor, ₹200 2nd upline, and ₹100 for level 3 & higher.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Sales Commission</span>
            <p className="mt-2 text-3xl font-extrabold text-neutral-900">Up to 10%</p>
            <p className="mt-1 text-xs text-neutral-500">10% seller commission + 5%, 4%, 3%, 2%, 1% upline overrides on verified deals.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Hierarchy</span>
            <p className="mt-2 text-3xl font-extrabold text-neutral-900">Unlimited</p>
            <p className="mt-1 text-xs text-neutral-500">Deep downline referral tree with automated calculation engines.</p>
          </div>
        </div>
      </section>

      {/* ACTIVE ADVISER CARD (IF ALREADY ACTIVE) */}
      {isApprovedAdviser && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-orange-500 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase">
                  Active Adviser
                </span>
                <h3 className="text-2xl font-bold text-neutral-900 mt-2">{adviserAccount.full_name}</h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">Adviser ID: {adviserAccount.adviser_id}</p>
              </div>
              <Link
                to="/advisers/dashboard"
                className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 shadow-xs text-center"
              >
                Open Full Dashboard
              </Link>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-orange-50 border border-orange-200">
              <p className="text-xs font-bold text-orange-900 uppercase tracking-wider">Your Referral Link</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/advisers-program?ref=${adviserAccount.referral_code}`}
                  className="w-full bg-white text-neutral-800 text-xs px-3 py-2 rounded-lg font-mono border border-orange-200"
                />
                <button
                  onClick={copyRefLink}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: QR CODE PAYMENT SECTION (FOR PENDING PAYMENT APPLICANTS) */}
      {user && isPaymentPending && (
        <section id="payment-section" className="max-w-2xl mx-auto px-4 pb-16">
          <div className="p-6 md:p-10 rounded-3xl bg-white border border-neutral-200 shadow-md">
            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider">
                Step 2 of 2: Activation Payment
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mt-3">Scan UPI QR to Pay ₹1,100</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Pay via GPay, PhonePe, Paytm, or any UPI app. Then submit your transaction reference below.
              </p>
            </div>

            {/* QR CODE CONTAINER */}
            <div className="mt-8 flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl border-2 border-neutral-200 shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt="Iston UPI QR Code"
                  className="w-48 h-48 md:w-56 md:h-56 object-contain"
                />
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs text-neutral-500">UPI ID (VPA):</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="font-mono font-bold text-neutral-900 text-sm">918484843391@okbizaxis</span>
                  <button
                    onClick={copyUpiId}
                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">Payee: Iston Builder Group</p>

                <a
                  href={upiPayUrl}
                  className="mt-4 inline-flex sm:hidden items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-xs"
                >
                  Pay ₹1,100 via Installed UPI App
                </a>
              </div>
            </div>

            {/* TRANSACTION ID SUBMISSION FORM */}
            <form onSubmit={handlePaymentSubmit} className="mt-8 pt-6 border-t border-neutral-200">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Enter UPI Transaction ID / UTR (12 Digits) *
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. 428712345678"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-sm font-mono focus:outline-hidden focus:border-orange-500"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
                </button>
              </div>

              {paymentMsg && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    paymentMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{paymentMsg.text}</span>
                </div>
              )}
            </form>
          </div>
        </section>
      )}

      {/* STEP 4: UNDER VERIFICATION BANNER */}
      {user && isVerificationPending && (
        <section id="payment-status" className="max-w-2xl mx-auto px-4 pb-16">
          <div className="p-8 rounded-3xl bg-white border border-amber-300 shadow-md text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Verification in Progress
            </span>
            <h2 className="text-2xl font-bold text-neutral-900 mt-3">Payment Submitted for Approval</h2>
            <p className="mt-2 text-xs text-neutral-600 max-w-md mx-auto">
              Our administration team has received your registration details. We are matching your Transaction ID with our bank records.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left max-w-sm mx-auto space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Applicant:</span>
                <span className="font-semibold text-neutral-900">{adviserAccount.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Transaction ID (UTR):</span>
                <span className="font-mono font-bold text-neutral-900">{adviserAccount.payment_reference || 'Submitted'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Amount:</span>
                <span className="font-bold text-neutral-900">₹1,100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-bold text-amber-600 uppercase">Under Process</span>
              </div>
            </div>

            <p className="mt-6 text-[11px] text-neutral-400">
              Need urgent activation? Call or WhatsApp our support desk at +91 84848 43391.
            </p>
          </div>
        </section>
      )}

      {/* THREE STEP HOW IT WORKS (NO BULK TEXT) */}
      <section className="py-12 bg-white border-t border-neutral-200 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Simple Process</p>
            <h2 className="text-3xl font-extrabold text-neutral-900 mt-1">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mt-4">Sign in & Apply</h3>
              <p className="text-xs text-neutral-600 mt-2">
                Authenticate with your Google email. Enter your basic details and submit your application.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mt-4">₹1,100 UPI Payment</h3>
              <p className="text-xs text-neutral-600 mt-2">
                Scan the official UPI QR code and submit your 12-digit UPI Transaction ID / UTR.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mt-4">Admin Match & Activation</h3>
              <p className="text-xs text-neutral-600 mt-2">
                Admin verifies the payment. Your Adviser ID, referral code, and dashboard are activated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* APPLICATION MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">Become an Adviser</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="mt-5 space-y-4 text-xs">
              {applyError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  {applyError}
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:border-orange-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:border-orange-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Google Email Address</label>
                <input
                  type="email"
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-600 text-sm cursor-not-allowed"
                  value={user?.email || ''}
                />
                <p className="text-[10px] text-neutral-400 mt-1">Locked to your verified Google authentication.</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <label className="block font-bold text-neutral-700">Sponsor Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ADV1001"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs uppercase font-mono"
                  value={sponsorCode}
                  onChange={(e) => setSponsorCode(e.target.value.toUpperCase())}
                />
                {sponsorInfo && (
                  <p className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sponsor: {sponsorInfo.full_name} ({sponsorInfo.adviser_id})
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <p className="font-bold text-neutral-800">Payout Details (For Receiving Earnings)</p>
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="name@upi"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account No."
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="IFSC"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs uppercase"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-semibold hover:bg-neutral-50 text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center gap-1.5"
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Payment (₹1,100)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
