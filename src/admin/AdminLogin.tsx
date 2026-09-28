import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';
import { useSeo } from '../lib/seo';
import { LogoMark } from '../components/Logo';

export default function AdminLogin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'err' | 'ok'; text: string } | null>(null);
  useSeo('Admin Sign In', undefined, null, true);

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg({ type: 'err', text: 'Enter a valid email address.' });
    setBusy(true);
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/account` });
        if (error) throw error;
        setMsg({ type: 'ok', text: 'If this email is registered, a password reset link has been sent.' });
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ type: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
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
          <LogoMark className="h-11 w-11 text-navy" />
          <h1 className="font-display mt-6 text-4xl text-navy">{mode === 'reset' ? 'Reset password' : 'Admin sign in'}</h1>
          <p className="mt-2 text-sm text-muted">Restricted to authorised Iston Builder Group administrators.</p>

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
              {mode === 'reset' ? 'Send reset link' : 'Sign in'}
            </button>
          </form>

          {mode === 'signin' && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
              <button onClick={() => signInWithGoogle('Iston Builder Group Admin')} className="btn btn-outline w-full">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Continue with Google
              </button>
            </>
          )}
          <button onClick={() => (setMode(mode === 'signin' ? 'reset' : 'signin'), setMsg(null))} className="mt-6 text-xs font-semibold text-navy hover:underline">
            {mode === 'signin' ? 'Forgot password?' : '← Back to sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
