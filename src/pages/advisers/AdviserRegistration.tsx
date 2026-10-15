import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, AlertCircle, Loader2, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { getReferral, captureReferral } from '../../lib/referral';
import { useSeo } from '../../lib/seo';

export default function AdviserRegistration() {
  const { user, isAdviser, signInWithGoogle, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sponsorCode, setSponsorCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  const [sponsorInfo, setSponsorInfo] = useState<{ adviser_id: string; full_name: string; isActive: boolean } | null>(null);
  const [checkingSponsor, setCheckingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredAdviser, setRegisteredAdviser] = useState<any>(null);

  useSeo('Become an Adviser — Iston Builder Group', 'Register as an official Iston Builder Group adviser.');

  // Pre-fill sponsor code
  useEffect(() => {
    captureReferral();
    const querySponsor = searchParams.get('ref') || searchParams.get('sponsor');
    const storedSponsor = querySponsor || getReferral();
    if (storedSponsor) {
      setSponsorCode(storedSponsor.toUpperCase());
    }
  }, [searchParams]);

  // Pre-fill user data
  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [user, fullName]);

  // If already an adviser, redirect to dashboard
  useEffect(() => {
    if (isAdviser && !success) {
      navigate('/advisers/dashboard', { replace: true });
    }
  }, [isAdviser, success, navigate]);

  // Validate sponsor whenever code changes
  useEffect(() => {
    const code = sponsorCode.trim().toUpperCase();
    if (!code) {
      setSponsorInfo(null);
      setSponsorError('');
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setCheckingSponsor(true);
      setSponsorError('');
      try {
        const res = await api<{ ok: boolean; sponsor: any }>(`/api/advisers?action=get_sponsor&code=${encodeURIComponent(code)}`);
        if (active && res.ok && res.sponsor) {
          setSponsorInfo(res.sponsor);
        }
      } catch (err: any) {
        if (active) {
          setSponsorInfo(null);
          setSponsorError(err.message || 'Invalid sponsor code');
        }
      } finally {
        if (active) setCheckingSponsor(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sponsorCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      return setError('Please enter your full legal name.');
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      return setError('Please enter a valid 10-12 digit mobile phone number.');
    }

    setBusy(true);
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
        setSuccess(true);
        setRegisteredAdviser(res.adviser);
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-mist">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 shadow-xl border border-line text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center text-navy mb-5">
            <UserCheck className="w-7 h-7 text-brass" />
          </div>
          <h1 className="font-display text-3xl text-navy">Sign in to Apply</h1>
          <p className="mt-2 text-sm text-muted">
            To register as an accredited Iston Builder Group Adviser, please sign in with your verified Google account.
          </p>
          <div className="mt-8">
            <button
              onClick={() => signInWithGoogle()}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.290-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.620 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Sign in with Google
            </button>
          </div>
          <Link to="/advisers-program" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Advisers Program
          </Link>
        </div>
      </div>
    );
  }

  if (success && registeredAdviser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-mist">
        <div className="max-w-lg w-full rounded-3xl bg-white p-8 md:p-10 shadow-xl border border-line text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <p className="eyebrow !text-emerald-700">Application Submitted</p>
          <h1 className="font-display text-4xl text-navy mt-2">Welcome, {registeredAdviser.full_name}!</h1>
          <p className="mt-3 text-sm text-muted">
            Your adviser account has been created. Use your assigned Adviser ID and referral link to invite partners and submit property buyers.
          </p>

          <div className="mt-6 rounded-2xl bg-mist border border-line p-5 text-left space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Adviser ID:</span>
              <span className="font-mono font-bold text-navy text-base">{registeredAdviser.adviser_id}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Referral Code:</span>
              <span className="font-mono font-bold text-navy">{registeredAdviser.referral_code}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Account Status:</span>
              <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 uppercase">
                {registeredAdviser.status}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => navigate('/advisers/dashboard')}
              className="btn btn-primary w-full"
            >
              Go to Adviser Dashboard
            </button>
            <Link to="/" className="btn btn-outline w-full">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-mist">
      <div className="container-x max-w-3xl">
        <Link to="/advisers-program" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Advisers Program
        </Link>

        <div className="rounded-[2rem] bg-white p-8 md:p-12 shadow-xl border border-line">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-white">
              <Sparkles className="h-6 w-6 text-brass-light" />
            </span>
            <div>
              <p className="eyebrow">Iston Builder Group</p>
              <h1 className="font-display text-3xl md:text-4xl text-navy">Adviser Registration</h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted">
            Apply to become an authorized adviser. Each adviser receives a unique ID, referral code, and shareable link with unlimited-depth referral tracking.
          </p>

          <div className="mt-6 rounded-2xl bg-navy text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-brass-light uppercase">Registration Fee</span>
              <p className="font-display text-3xl text-white mt-1">₹1,100 <span className="text-xs font-sans text-white/60 font-normal">one-time</span></p>
              <p className="text-xs text-white/70 mt-1">Eligible for upline tier referral rewards distribution (₹300/₹200/₹100).</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block rounded-full bg-brass/20 text-brass-light px-3 py-1 text-xs font-bold uppercase">
                Demo Activation Enabled
              </span>
              <p className="text-[11px] text-white/60 mt-1">Test mode for platform development</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="full_name">Full Legal Name *</label>
                <input
                  id="full_name"
                  type="text"
                  className="input"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="phone">Mobile Phone (WhatsApp) *</label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="email">Verified Email Address</label>
              <input
                id="email"
                type="email"
                className="input bg-mist/60 cursor-not-allowed"
                value={user.email || ''}
                readOnly
              />
              <p className="mt-1 text-[11px] text-muted">Secured via your verified authentication provider.</p>
            </div>

            {/* Sponsor referral code section */}
            <div className="rounded-2xl border border-line bg-mist/50 p-5">
              <label className="label" htmlFor="sponsor_code">Sponsor Referral Code (Optional)</label>
              <div className="relative">
                <input
                  id="sponsor_code"
                  type="text"
                  className="input uppercase font-mono tracking-wider"
                  placeholder="e.g. ADV1001 or IST-ADV-1001"
                  value={sponsorCode}
                  onChange={(e) => setSponsorCode(e.target.value.toUpperCase())}
                />
                {checkingSponsor && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="w-5 h-5 animate-spin text-navy" />
                  </div>
                )}
              </div>

              {sponsorInfo && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sponsor Verified: <b>{sponsorInfo.full_name}</b> ({sponsorInfo.adviser_id})</span>
                </div>
              )}
              {sponsorError && (
                <p className="mt-2 text-xs text-rose-600 font-medium">{sponsorError}</p>
              )}
              <p className="mt-2 text-[11px] text-muted">
                If someone referred you, enter their referral code. Leave blank to register directly with company sponsorship.
              </p>
            </div>

            {/* Optional payout info */}
            <div className="rounded-2xl border border-line p-5 space-y-4">
              <p className="font-semibold text-navy text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brass" /> Payout Information (Optional — can be added later)
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label" htmlFor="upi_id">UPI ID</label>
                  <input
                    id="upi_id"
                    type="text"
                    className="input"
                    placeholder="yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="account_num">Bank Account Number</label>
                  <input
                    id="account_num"
                    type="text"
                    className="input"
                    placeholder="e.g. 501002345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="ifsc">IFSC Code</label>
                  <input
                    id="ifsc"
                    type="text"
                    className="input uppercase"
                    placeholder="HDFC0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="bank_name">Bank Name</label>
                  <input
                    id="bank_name"
                    type="text"
                    className="input"
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || checkingSponsor}
              className="btn btn-primary w-full py-3.5 text-base"
            >
              {busy && <Loader2 className="w-5 h-5 animate-spin" />}
              Complete Registration (Demo Payment ₹1,100)
            </button>
            <p className="text-center text-xs text-muted">
              By registering, you agree to the Advisers Program terms, code of conduct, and tiered reward policies.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
