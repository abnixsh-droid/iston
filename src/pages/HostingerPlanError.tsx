import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Database, HelpCircle, Server, ShieldAlert, X } from 'lucide-react';

const UPGRADE_URL =
  'https://cart.hostinger.com/pay/b3841117-56fc-4417-a61c-628fa8bf39d0';

const FEATURES = [
  'Node.js application support',
  'MySQL / PostgreSQL databases',
  'Free SSL, backups & priority support',
];

export default function HostingerPlanError() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    document.title = 'Website unavailable — Hostinger';
  }, []);

  const continueToCheckout = () => {
    window.location.assign(UPGRADE_URL);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f3ff] font-sans text-[#1d1d1f]">
      <header className="border-b border-[#e7e4f5] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#673de6] text-white shadow-sm"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M5 4h4v6h6V4h4v16h-4v-6H9v6H5V4Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="text-[22px] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
              hostinger
            </span>
          </div>

          <a
            href="https://hpanel.hostinger.com"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#673de6] hover:bg-[#f4f3ff]"
          >
            hPanel
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[720px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-36px_rgba(56,32,150,0.45)] ring-1 ring-black/5">
            <div className="border-b border-gray-100 bg-linear-to-r from-[#f7f5ff] via-white to-white px-6 py-6 sm:px-10">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#ede8ff] text-[#673de6]">
                  <Server className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#673de6]">
                    Hosting plan limitation
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f] sm:text-2xl">
                    This website is currently unavailable
                  </h1>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-10 sm:py-8">
              <p className="text-[15px] leading-7 text-gray-600">
                Your current hosting plan does not support{' '}
                <strong className="font-semibold text-gray-900">
                  Node.js applications
                </strong>{' '}
                and{' '}
                <strong className="font-semibold text-gray-900">
                  databases
                </strong>
                .
              </p>

              <p className="mt-3 text-[15px] leading-7 text-gray-600">
                This website requires backend services that are not included in
                your current plan. Please upgrade your hosting plan to use
                Node.js and database services with your site.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Current plan
                  </p>
                  <p className="mt-1.5 font-semibold text-gray-900">
                    Web Hosting
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Backend services not included
                  </p>
                </div>

                <div className="rounded-xl border border-[#dcd2ff] bg-[#faf8ff] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#673de6]">
                    Required for this site
                  </p>
                  <p className="mt-1.5 font-semibold text-gray-900">
                    Node.js + Database
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Application backend
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-[#f7f6fb] p-4">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#673de6]" />
                  <p className="text-sm leading-6 text-gray-600">
                    To restore your website, upgrade to a hosting plan that
                    supports Node.js and databases. Your files, domain and email
                    services will remain safe.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setShowUpgrade(true)}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#673de6] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b35cc] focus:outline-none focus:ring-4 focus:ring-[#673de6]/20"
                >
                  Upgrade hosting plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <a
                  href="https://www.hostinger.com/support"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <HelpCircle className="h-4 w-4" />
                  Contact support
                </a>
              </div>

              <p className="mt-7 border-t border-gray-100 pt-4 text-xs leading-5 text-gray-400">
                Error code:{' '}
                <span className="font-mono">
                  HTTP 503 · NODEJS_PLAN_REQUIRED
                </span>
                <br />
                If you are the website owner, log in to hPanel to manage your
                hosting plan.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Hostinger International Ltd. All
            rights reserved.
          </p>
        </div>
      </main>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#673de6]">
                  Upgrade required
                </p>
                <h2
                  id="upgrade-title"
                  className="mt-1 text-lg font-semibold tracking-[-0.01em] text-gray-900"
                >
                  Choose an upgrade to continue
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close upgrade dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-xl border border-[#dcd2ff] bg-[#faf8ff] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Hosting with Node.js
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      Everything this website needs to run
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#ede8ff] px-2.5 py-1 text-[11px] font-semibold text-[#673de6]">
                    Recommended
                  </span>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {FEATURES.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                <Database className="h-4 w-4 shrink-0 text-gray-400" />
                Database and backend support will be activated after purchase.
              </div>

              <button
                type="button"
                onClick={continueToCheckout}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#673de6] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b35cc] focus:outline-none focus:ring-4 focus:ring-[#673de6]/20"
              >
                Continue to secure checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="mt-2 h-10 w-full rounded-lg text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              >
                Maybe later
              </button>

              <p className="mt-3 text-center text-[11px] leading-5 text-gray-400">
                You will be redirected to Hostinger checkout to complete the
                upgrade.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
