import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Gift,
  Coins,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Logo from '../../components/Logo';
import LanguageToggle from '../../components/LanguageToggle';
import { useSeo } from '../../lib/seo';

export default function AdviserPlanPage() {
  useSeo('Adviser Growth & Commission Plan — Iston Builder Group', 'Official compensation plan, joining bonuses, and multi-tier property sales brokerage.');

  const [calcPropertyVal, setCalcPropertyVal] = useState<number>(5000000);

  const fmtCurrency = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtShort = (n: number) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' Lakh';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#121212] select-none font-sans">
      {/* Full-Width Main Website Style Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#ded8cc] bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline-block w-px h-6 bg-[#ded8cc]" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f0e4] text-[#96742e] text-[11px] font-bold border border-[#ded5c0]">
              <Sparkles className="w-3.5 h-3.5" /> Official Compensation Deck
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/advisers-program"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121212] hover:text-[#96742e] px-3.5 py-2 rounded-full border border-[#ded8cc] hover:bg-[#f5f2ea] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Adviser Portal
            </Link>
            <div className="scale-90 origin-right hidden sm:block">
              <LanguageToggle solid={true} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-[#ded8cc] bg-[#f5f2ea]/70 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white border border-[#ded5c0] text-[#96742e] text-xs font-bold tracking-[0.2em] uppercase shadow-xs">
            100% Transparent Real Estate Distribution
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-[#121212] tracking-tight">
            Iston Adviser Growth &amp; Commission Plan
          </h1>
          <p className="text-xs sm:text-base text-[#666] max-w-2xl mx-auto leading-relaxed">
            Every rupee earned and distributed is clear, instant, and verified through our automated ledger. Explore our joining bonus model and multi-tier property sales brokerage below.
          </p>
        </div>
      </section>

      {/* Main Content: Seamless Stacked Presentation (No Filter Buttons) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 sm:space-y-16">
        
        {/* ============================================================== */}
        {/* SECTION 1: 04. JOINING BONUS STRUCTURE                        */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#96742e] bg-[#f5f0e4] px-3 py-1 rounded-full border border-[#ded5c0]">
                Slide 04 · Registration Bonus
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                Joining Bonus Structure
              </h2>
            </div>
            <span className="text-xs font-bold text-[#666] uppercase tracking-wider hidden sm:block">
              ₹1,100 Registration Fee
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Progress Bars Breakdown */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#121212] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    New Member (Self Welcome Bonus)
                  </span>
                  <span className="text-emerald-700 font-mono font-black text-sm">₹300</span>
                </div>
                <div className="h-3 w-full bg-[#f0ece1] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-[11px] text-[#777]">Credited instantly to the new member wallet upon activation.</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#121212] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#96742e] inline-block" />
                    Direct Referrer (Level 1 Upline)
                  </span>
                  <span className="text-[#96742e] font-mono font-black text-sm">₹200</span>
                </div>
                <div className="h-3 w-full bg-[#f0ece1] rounded-full overflow-hidden">
                  <div className="h-full bg-[#96742e] rounded-full" style={{ width: '66.7%' }} />
                </div>
                <p className="text-[11px] text-[#777]">Immediate cash commission for the direct sponsor.</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#121212] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#666] inline-block" />
                    Level 2 Upline
                  </span>
                  <span className="text-[#121212] font-mono font-black text-sm">₹100</span>
                </div>
                <div className="h-3 w-full bg-[#f0ece1] rounded-full overflow-hidden">
                  <div className="h-full bg-[#666] rounded-full" style={{ width: '33.3%' }} />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#121212] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#999] inline-block" />
                    Level 3 Upline
                  </span>
                  <span className="text-[#121212] font-mono font-black text-sm">₹50</span>
                </div>
                <div className="h-3 w-full bg-[#f0ece1] rounded-full overflow-hidden">
                  <div className="h-full bg-[#999] rounded-full" style={{ width: '16.7%' }} />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#121212] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ccc] inline-block" />
                    Level 4+ Uplines
                  </span>
                  <span className="text-[#121212] font-mono font-black text-sm">₹50</span>
                </div>
                <div className="h-3 w-full bg-[#f0ece1] rounded-full overflow-hidden">
                  <div className="h-full bg-[#bbb] rounded-full" style={{ width: '16.7%' }} />
                </div>
              </div>
            </div>

            {/* Right: Gold Callout Card */}
            <div className="rounded-3xl bg-[#f5f2ea] border border-[#ded5c0] p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#ded5c0] grid place-items-center text-[#96742e] shadow-xs">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#96742e]">
                  Instant Welcome Cashback
                </span>
                <h3 className="font-serif text-3xl font-black text-[#121212] mt-1">
                  ₹300 Back to You
                </h3>
                <p className="text-xs text-[#555] mt-2 leading-relaxed">
                  The moment you join with the one-time ₹1,100 registration fee, <b>₹300 is automatically credited back</b> to your wallet as your welcome bonus. Your net effective registration cost is just ₹800.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ded5c0] grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#e5dfd3]">
                  <span className="text-[10px] text-[#777] uppercase block">Joining Fee</span>
                  <span className="font-mono font-bold text-sm text-[#121212]">₹1,100</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#e5dfd3]">
                  <span className="text-[10px] text-[#777] uppercase block">Instant Cashback</span>
                  <span className="font-mono font-bold text-sm text-emerald-700">₹300</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: 05. THREE INSTANT PAYOUTS EXAMPLE                   */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-800 bg-[#f4fbf7] px-3 py-1 rounded-full border border-emerald-200">
                Slide 05 · Transparent Example
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                One New Member. Three Instant Payouts.
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider hidden sm:block">
              ₹600 Total Instant Distribution
            </span>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] text-xs text-[#555] leading-relaxed">
            <b>Scenario:</b> Adviser <b>A</b> invited Adviser <b>B</b>. Now Adviser <b>B</b> invites new member <b>Person C</b>. The exact moment <b>Person C</b> pays and is activated, all three wallets receive their rewards instantly:
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Member A */}
            <div className="p-5 rounded-2xl bg-white border-2 border-[#e5dfd3] space-y-3 relative">
              <span className="px-2.5 py-0.5 rounded-full bg-[#f5f2ea] text-[#96742e] border border-[#ded5c0] text-[10px] font-bold uppercase">
                Level 2 Upline
              </span>
              <h4 className="font-serif text-lg font-bold text-[#121212]">Adviser A</h4>
              <div className="pt-1">
                <span className="text-2xl font-black text-[#121212] font-mono">+ ₹100</span>
                <p className="text-[11px] text-[#777] mt-1">Earns indirect Level 2 override reward.</p>
              </div>
            </div>

            {/* Member B */}
            <div className="p-5 rounded-2xl bg-white border-2 border-[#96742e] space-y-3 relative shadow-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#f5f0e4] text-[#96742e] border border-[#ded5c0] text-[10px] font-bold uppercase">
                Direct Referrer (L1)
              </span>
              <h4 className="font-serif text-lg font-bold text-[#121212]">Adviser B</h4>
              <div className="pt-1">
                <span className="text-2xl font-black text-[#96742e] font-mono">+ ₹200</span>
                <p className="text-[11px] text-[#777] mt-1">Earns direct recruitment commission.</p>
              </div>
            </div>

            {/* Member C */}
            <div className="p-5 rounded-2xl bg-white border-2 border-emerald-500 space-y-3 relative shadow-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                New Joining Member
              </span>
              <h4 className="font-serif text-lg font-bold text-[#121212]">Person C</h4>
              <div className="pt-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">+ ₹300</span>
                <p className="text-[11px] text-[#777] mt-1">Earns instant welcome cashback to wallet.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f2ea] border border-[#ded5c0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#121212]">
              Total paid out automatically from a single join: <span className="font-mono text-emerald-800 font-black text-sm">₹600</span>
            </span>
            <span className="text-[#666] text-[11px]">Instant wallet credit · Zero pending waiting periods</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: 06. PROPERTY SALES COMMISSION                       */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#96742e] bg-[#f5f0e4] px-3 py-1 rounded-full border border-[#ded5c0]">
                Slide 06 · Real Estate Sales
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                Property Sales Commission Structure
              </h2>
            </div>
            <span className="text-xs font-bold text-[#96742e] uppercase tracking-wider hidden sm:block">
              10% Direct Sales Brokerage
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#666] leading-relaxed">
            When you or your network downline closes a property deal (flats, plots, or villas), company brokerage is distributed throughout the line as follows:
          </p>

          {/* Inverted Funnel Commission Tiers */}
          <div className="space-y-3">
            {[
              { level: 'Level 1 (Direct Seller)', pct: 10, bg: 'bg-[#121212]', text: 'text-white', sub: 'The adviser who directly refers and closes the buyer.' },
              { level: 'Level 2 Upline', pct: 5, bg: 'bg-[#2a2a2a]', text: 'text-white', sub: 'Direct sponsor of the seller.' },
              { level: 'Level 3 Upline', pct: 4, bg: 'bg-[#444]', text: 'text-white', sub: 'Second generation sponsor.' },
              { level: 'Level 4 Upline', pct: 3, bg: 'bg-[#666]', text: 'text-white', sub: 'Third generation sponsor.' },
              { level: 'Level 5 Upline', pct: 2, bg: 'bg-[#888]', text: 'text-white', sub: 'Fourth generation sponsor.' },
              { level: 'Level 6+ Uplines', pct: 1, bg: 'bg-[#aaa]', text: 'text-[#121212]', sub: 'Extended network override.' },
            ].map((tier) => (
              <div
                key={tier.level}
                className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-12 h-10 rounded-xl ${tier.bg} ${tier.text} font-black font-mono text-sm grid place-items-center shadow-xs`}>
                    {tier.pct}%
                  </span>
                  <div>
                    <h5 className="font-bold text-[#121212] text-sm">{tier.level}</h5>
                    <p className="text-[11px] text-[#777]">{tier.sub}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-[#96742e] sm:text-right">
                  {tier.pct}% of total brokerage
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Property Valuation Calculator */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#f5f2ea] border border-[#ded5c0] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#96742e]">
                  Interactive Deal Calculator
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#121212] mt-1">
                  Estimate Your Property Earnings
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#777] block">Selected Property Value</span>
                <span className="font-mono font-black text-2xl text-[#121212]">
                  {fmtShort(calcPropertyVal)}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={1500000}
                max={15000000}
                step={250000}
                value={calcPropertyVal}
                onChange={(e) => setCalcPropertyVal(Number(e.target.value))}
                className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#121212]"
              />
              <div className="flex justify-between text-[11px] text-[#777] font-mono">
                <span>₹15 Lakh</span>
                <span>₹50 Lakh</span>
                <span>₹1.00 Crore</span>
                <span>₹1.50 Crore</span>
              </div>
            </div>

            {/* Dynamic Earnings Outputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#ded5c0]">
                <span className="text-[10px] text-[#777] uppercase block font-semibold">Direct Seller (10%)</span>
                <p className="font-mono font-black text-xl text-emerald-700 mt-1">
                  {fmtCurrency(calcPropertyVal * 0.02 * 0.10)}
                </p>
                <span className="text-[10px] text-[#888]">From standard 2% deal brokerage</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#ded5c0]">
                <span className="text-[10px] text-[#777] uppercase block font-semibold">Level 2 Upline (5%)</span>
                <p className="font-mono font-black text-xl text-[#121212] mt-1">
                  {fmtCurrency(calcPropertyVal * 0.02 * 0.05)}
                </p>
                <span className="text-[10px] text-[#888]">Passive network override</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#ded5c0] col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#777] uppercase block font-semibold">Level 3 Upline (4%)</span>
                <p className="font-mono font-black text-xl text-[#121212] mt-1">
                  {fmtCurrency(calcPropertyVal * 0.02 * 0.04)}
                </p>
                <span className="text-[10px] text-[#888]">Compound network override</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: COMPOUNDING NETWORK TREE SIMULATION                 */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#96742e] bg-[#f5f0e4] px-3 py-1 rounded-full border border-[#ded5c0]">
                Compounding Power
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                The 3×3 Growth Example
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#666] leading-relaxed">
            If you recruit just 3 advisers, and each recruit helps 3 others do the same across 5 tiers, your network expands to:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc]">
              <span className="text-[10px] text-[#777] uppercase block">Tier 1</span>
              <p className="font-mono font-black text-xl text-[#121212] mt-1">3</p>
              <span className="text-[10px] text-emerald-700 font-semibold">₹600 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc]">
              <span className="text-[10px] text-[#777] uppercase block">Tier 2</span>
              <p className="font-mono font-black text-xl text-[#121212] mt-1">9</p>
              <span className="text-[10px] text-emerald-700 font-semibold">₹900 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc]">
              <span className="text-[10px] text-[#777] uppercase block">Tier 3</span>
              <p className="font-mono font-black text-xl text-[#121212] mt-1">27</p>
              <span className="text-[10px] text-emerald-700 font-semibold">₹1,350 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc]">
              <span className="text-[10px] text-[#777] uppercase block">Tier 4</span>
              <p className="font-mono font-black text-xl text-[#121212] mt-1">81</p>
              <span className="text-[10px] text-emerald-700 font-semibold">₹4,050 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#777] uppercase block">Tier 5</span>
              <p className="font-mono font-black text-xl text-[#121212] mt-1">243</p>
              <span className="text-[10px] text-emerald-700 font-semibold">₹12,150 Bonus</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cc] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#666]">
              Total team of <b>363 partners</b>, generating continuous passive overrides every time any property deal closes.
            </span>
            <Link
              to="/advisers-program"
              className="px-5 py-2.5 rounded-xl bg-[#121212] hover:bg-black text-[#faf8f5] font-bold uppercase tracking-wider text-xs transition shrink-0"
            >
              Join Adviser Program →
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#ded8cc] bg-white py-8 px-4 sm:px-6 text-center text-xs text-[#777] space-y-2">
        <p>© {new Date().getFullYear()} Iston Builder Group. All rights reserved.</p>
        <p>Private compensation deck for authorized real estate partners.</p>
      </footer>
    </div>
  );
}
