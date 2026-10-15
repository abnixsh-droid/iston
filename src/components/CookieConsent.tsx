import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'iston_cookie_consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Delay slightly for natural entrance
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleConsent = (choice: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="rounded-3xl border border-navy/15 bg-white/95 p-5 shadow-[0_20px_50px_rgba(11,29,63,0.22)] backdrop-blur-xl text-ink">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-navy font-display text-base font-bold">
            <ShieldCheck className="h-5 w-5 text-orange-600 shrink-0" />
            <span>Privacy &amp; Cookie Preferences</span>
          </div>
          <button
            onClick={() => handleConsent('essential')}
            className="text-muted hover:text-navy rounded-full p-1 transition"
            aria-label="Close cookie banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-muted">
          We use cookies and secure local storage to preserve your preferences (such as Hindi/English language selection), protect authentication sessions, and deliver a seamless experience on Iston Builder Group.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-line text-xs">
          <Link
            to="/terms"
            onClick={() => handleConsent('essential')}
            className="text-[11px] font-semibold text-navy underline hover:text-orange-600 transition"
          >
            Terms &amp; Policies
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleConsent('essential')}
              className="px-3 py-1.5 rounded-full border border-line text-xs font-semibold text-muted hover:text-navy hover:bg-mist transition"
            >
              Essential Only
            </button>
            <button
              onClick={() => handleConsent('accepted')}
              className="px-4 py-1.5 rounded-full bg-navy text-white text-xs font-semibold hover:bg-navy-deep shadow-xs transition"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
