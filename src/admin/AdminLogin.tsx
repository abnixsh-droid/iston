import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, firebaseReady } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSeo } from '../lib/seo';
import { DEMO_EMAIL, DEMO_PASSWORD, demoLogin } from '../lib/demoSession';
import { LogoMark } from '../components/Logo';

const fbMsg = (e: unknown) => {
  const code = (e as { code?: string })?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Incorrect email or password.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
  if (code.includes('popup-closed')) return 'Sign-in popup was closed.';
  return (e as Error)?.message || 'Sign-in failed.';
};

export default function AdminLogin() {
  const { user, isAdmin, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'err' | 'ok'; text: string } | null>(null);
  useSeo('Admin Login', undefined, null, true);

  useEffect(() => {
    if (!user) return;
    const email = (user.email || '').toLowerCase();
    const isKnownAdmin =
      email === 'abnixsh@gmail.com' ||
      email === 'sitaramchaurasiya8@gmail.com' ||
      !!user.demo ||
      !!isAdmin;

    if (isKnownAdmin) {
      navigate('/admin', { replace: true });
    } else {
      setMsg({
        type: 'err',
        text: `Signed in as ${user.email}. This account does not have administrator privileges. Only authorized Iston administrators (e.g. abnixsh@gmail.com, sitaramchaurasiya8@gmail.com) can access the Admin Panel.`,
      });
    }
  }, [user, isAdmin, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (mode === 'signin' && email.trim().toLowerCase() === DEMO_EMAIL) return enterDemo(email, password);
    if (!auth) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg({ type: 'err', text: 'Enter a valid email address.' });
    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMsg({ type: 'ok', text: 'If this email is registered, a password reset link has been sent.' });
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          await signOut(auth);
          setMsg({ type: 'ok', text: 'Please verify your email first — a verification link has been sent. Then sign in again.' });
        }
      }
    } catch (err) {
      setMsg({ type: 'err', text: fbMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const [demoBusy, setDemoBusy] = useState(false);
  const enterDemo = async (e = DEMO_EMAIL, p = DEMO_PASSWORD) => {
    setMsg(null);
    setDemoBusy(true);
    try {
      await demoLogin(e, p);
      navigate('/admin', { replace: true });
    } catch (err) {
      setMsg({ type: 'err', text: (err as Error).message });
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <div data-no-translate className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <img src="/images/umroli-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-deep to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-md text-white">
          <p className="eyebrow !text-brass-light">Iston Builder Group</p>
          <p className="font-display mt-4 text-5xl leading-tight">Building Better Spaces. Creating Better Futures.</p>
        </div>
      </div>
      <div className="flex flex-col justify-center p-6 md:p-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-navy">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
          <LogoMark className="h-14 w-14" />
          <h1 className="font-display mt-6 text-4xl text-navy">{mode === 'reset' ? 'Reset password' : 'Admin login'}</h1>
          <p className="mt-2 text-sm text-muted">Restricted to authorised Iston Builder Group administrators. Secured by Firebase Authentication.</p>

          <div className="mt-8 rounded-2xl border border-line bg-mist p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Eye className="h-4 w-4 text-brass" /> Demo admin access (read-only)
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted">Email</dt>
              <dd className="font-mono font-semibold break-all text-navy select-all">{DEMO_EMAIL}</dd>
              <dt className="text-muted">Password</dt>
              <dd className="font-mono font-semibold text-navy select-all">{DEMO_PASSWORD}</dd>
            </dl>
            <button onClick={() => enterDemo()} disabled={demoBusy} className="btn btn-primary btn-sm mt-4 w-full">
              {demoBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Log in as demo admin
            </button>
            <p className="mt-2 text-[11px] text-muted">Explore every section. Changes are disabled and customer details are masked.</p>
            {!firebaseReady && msg && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{msg.text}</p>}
          </div>

          {!firebaseReady ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-semibold">Firebase login is not configured yet.</p>
              <p className="mt-2">Add these environment variables and redeploy:</p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 font-mono text-xs">
                <li>VITE_FIREBASE_API_KEY</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>VITE_FIREBASE_PROJECT_ID</li>
                <li>VITE_FIREBASE_APP_ID</li>
              </ul>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                <div>
                  <label className="label" htmlFor="a-email">Email</label>
                  <input id="a-email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {mode === 'signin' && (
                  <div>
                    <label className="label" htmlFor="a-pass">Password</label>
                    <input id="a-pass" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                )}
                {msg && <p className={`rounded-xl px-4 py-3 text-sm ${msg.type === 'err' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{msg.text}</p>}
                <button className="btn btn-primary w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === 'reset' ? 'Send reset link' : 'Log in'}
                </button>
              </form>
              <button onClick={() => (setMode(mode === 'signin' ? 'reset' : 'signin'), setMsg(null))} className="mt-6 text-xs font-semibold text-navy hover:underline">
                {mode === 'signin' ? 'Forgot password?' : '← Back to login'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
