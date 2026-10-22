import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Building,
  CheckCircle2,
  ArrowRight,
  Gift,
  ArrowLeft,
  Sparkles,
  Zap,
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
      {/* Responsive Mobile-Ready Full-Width Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#ded8cc] bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Logo />
            <span className="hidden md:inline-block w-px h-6 bg-[#ded8cc]" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f0e4] text-[#96742e] text-[11px] font-bold border border-[#ded5c0]">
              <Sparkles className="w-3.5 h-3.5" /> Official Compensation Deck
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/advisers-program"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-[#121212] hover:text-[#96742e] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-[#ded8cc] hover:bg-[#f5f2ea] transition whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Adviser</span> Portal
            </Link>
            <div className="scale-90 origin-right hidden md:block">
              <LanguageToggle solid={true} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-[#ded8cc] bg-gradient-to-b from-[#f5f0e4] via-[#faf8f5] to-[#faf8f5] py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#ded5c0] text-[#96742e] text-xs font-bold tracking-[0.2em] uppercase shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
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

      {/* Main Content: Vibrant, Full-Color Seamless Stacked Presentation */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 sm:space-y-16">
        
        {/* ============================================================== */}
        {/* SECTION 1: 04. JOINING BONUS STRUCTURE (VIBRANT COLORS)        */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#96742e] bg-[#f5f0e4] px-3 py-1 rounded-full border border-[#ded5c0]">
                04 — JOINING BONUS STRUCTURE
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                Every New Member Rewards the Whole Chain
              </h2>
            </div>
            <span className="text-xs font-bold text-[#777] uppercase tracking-wider self-start sm:self-auto">
              ₹1,100 Registration Fee
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6 items-stretch">
            {/* Left: Colorful Progress Bars */}
            <div className="space-y-4 bg-[#faf8f5] p-5 sm:p-7 rounded-2xl border border-[#e8e3d8]">
              {/* New Member */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#121212] text-[#e4b755] font-black grid place-items-center text-xs shadow-xs">
                      ₹
                    </span>
                    <div>
                      <p className="font-bold text-[#121212]">New Member</p>
                      <p className="text-[10px] text-[#787267]">Bonus on joining (Self Welcome)</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-lg text-[#121212]">₹300</span>
                </div>
                <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#c5a059] shadow-sm flex items-center justify-end pr-3" style={{ width: '100%' }}>
                    <span className="text-[10px] font-black text-[#121212] uppercase tracking-wider">₹300 Instant</span>
                  </div>
                </div>
              </div>

              {/* Direct Referrer */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#d4af37] text-[#121212] font-black grid place-items-center text-xs shadow-xs">
                      ₹
                    </span>
                    <div>
                      <p className="font-bold text-[#121212]">Direct Referrer</p>
                      <p className="text-[10px] text-[#787267]">Who shared the code (Level 1)</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-lg text-[#d4af37]">₹200</span>
                </div>
                <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-[#d4af37] shadow-sm flex items-center justify-end pr-3" style={{ width: '66%' }}>
                    <span className="text-[10px] font-black text-[#121212]">₹200</span>
                  </div>
                </div>
              </div>

              {/* Level 2 */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#2a5bd7] text-white font-black grid place-items-center text-xs shadow-xs">
                      ₹
                    </span>
                    <div>
                      <p className="font-bold text-[#121212]">Level 2</p>
                      <p className="text-[10px] text-[#787267]">Referrer's referrer</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-lg text-[#2a5bd7]">₹100</span>
                </div>
                <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#2a5bd7] shadow-sm flex items-center justify-end pr-3" style={{ width: '33%' }}>
                    <span className="text-[10px] font-black text-white">₹100</span>
                  </div>
                </div>
              </div>

              {/* Level 3 */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#168853] text-white font-black grid place-items-center text-xs shadow-xs">
                      ₹
                    </span>
                    <div>
                      <p className="font-bold text-[#121212]">Level 3</p>
                      <p className="text-[10px] text-[#787267]">One level further up</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-lg text-[#168853]">₹50</span>
                </div>
                <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#168853] shadow-sm flex items-center justify-end pr-2" style={{ width: '16.7%' }}>
                    <span className="text-[9px] font-black text-white">₹50</span>
                  </div>
                </div>
              </div>

              {/* Level 4+ */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#1b9a5f] text-white font-black grid place-items-center text-xs shadow-xs">
                      ₹
                    </span>
                    <div>
                      <p className="font-bold text-[#121212]">Level 4+</p>
                      <p className="text-[10px] text-[#787267]">Deeper upline (Evergreen)</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-lg text-[#1b9a5f]">₹50</span>
                </div>
                <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-[#1b9a5f] shadow-sm flex items-center justify-end pr-2" style={{ width: '16.7%' }}>
                    <span className="text-[9px] font-black text-white">₹50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Vibrant Dark Callout Card */}
            <div className="bg-[#121212] text-white p-7 rounded-2xl flex flex-col justify-between shadow-xl border border-amber-500/30 relative overflow-hidden">
              <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-500/15 blur-2xl" />
              <div className="relative z-10 space-y-2">
                <span className="text-4xl sm:text-5xl font-black text-[#e4b755] font-serif block tracking-tight">
                  ₹300
                </span>
                <p className="text-xs text-[#d1cbc1] font-medium">
                  Back to you the moment your account is activated.
                </p>
              </div>

              <div className="relative z-10 my-6 border-t border-white/15 pt-6 space-y-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#4d7ef2] block tracking-tight">
                  5 levels
                </span>
                <p className="text-xs text-[#d1cbc1]">
                  Rewarded every single time someone joins under your referral chain.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/15 text-[11px] text-[#a09a8e] leading-relaxed">
                Total distributed: <b className="text-white">₹700 of ₹1,100</b>. Remaining ₹400 covers verified registration processing, KYC checks, and platform operations.
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: 05. THREE INSTANT PAYOUTS EXAMPLE (VIBRANT COLORS)  */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-800 bg-[#f4fbf7] px-3 py-1 rounded-full border border-emerald-200">
                05 — JOINING BONUS EXAMPLE
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                One New Member. Three Instant Payouts.
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider self-start sm:self-auto">
              ₹600 Instant Payout
            </span>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#faf8f5] border border-[#e8e3d8]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Node A (Royal Blue) */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border-2 border-[#2a5bd7] shadow-sm">
                <span className="text-[10px] font-bold tracking-widest text-[#787267] uppercase mb-3">
                  Level 2 Referrer
                </span>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#f0f4ff] border-2 border-[#2a5bd7] shadow-sm flex items-center justify-center font-serif text-3xl font-black text-[#2a5bd7]">
                  A
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-[#2a5bd7] mt-3">
                  +₹100
                </span>
                <span className="text-xs text-[#787267] mt-0.5">Level 2 bonus</span>
              </div>

              {/* Node B (Rich Dark with Gold Accent) */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border-2 border-[#121212] shadow-sm">
                <span className="text-[10px] font-bold tracking-widest text-[#787267] uppercase mb-3">
                  Direct Referrer
                </span>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#121212] border-2 border-[#121212] shadow-sm flex items-center justify-center font-serif text-3xl font-black text-[#e4b755]">
                  B
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-[#121212] mt-3">
                  +₹200
                </span>
                <span className="text-xs text-[#787267] mt-0.5">Direct referral bonus</span>
              </div>

              {/* Node C (Vibrant Gold & Emerald) */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border-2 border-[#c5a059] shadow-sm">
                <span className="text-[10px] font-bold tracking-widest text-[#96742e] uppercase mb-3">
                  New Member
                </span>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#fdf9ef] border-2 border-[#c5a059] shadow-sm flex items-center justify-center font-serif text-3xl font-black text-[#96742e]">
                  C
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 mt-3">
                  +₹300
                </span>
                <span className="text-xs text-[#787267] mt-0.5">Instant joining bonus</span>
              </div>
            </div>

            {/* Bottom Colorful Banner */}
            <div className="mt-8 p-4 rounded-xl bg-[#121212] text-white flex flex-col sm:flex-row items-center justify-between text-xs text-center sm:text-left gap-3 shadow-md border border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059] animate-pulse" />
                <span className="font-medium text-[#d1cbc1]">Bonuses flow upline instantly upon office activation</span>
              </div>
              <div className="font-mono font-black text-base text-[#e4b755]">
                ₹600 paid out from a single join
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: 06. PROPERTY SALES COMMISSION (INVERTED FUNNEL)     */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-md space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0ece1]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#96742e] bg-[#f5f0e4] px-3 py-1 rounded-full border border-[#ded5c0]">
                06 — PROPERTY SALES COMMISSION
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
                Earn on Every Property Sale
              </h2>
            </div>
            <span className="text-xs font-bold text-[#96742e] uppercase tracking-wider self-start sm:self-auto">
              Up to 10% Direct Commission
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            {/* Colorful Inverted Funnel Graphic */}
            <div className="flex flex-col items-center gap-2 p-6 sm:p-8 bg-[#faf8f5] rounded-2xl border border-[#e8e3d8]">
              {/* Level 1: Gold */}
              <div className="w-[100%] py-3 rounded-t-xl bg-[#c5a059] text-[#121212] font-black text-sm sm:text-base grid place-items-center shadow-md">
                10% <span className="text-xs font-semibold uppercase tracking-wider ml-2">LEVEL 1 (Direct Closer)</span>
              </div>
              {/* Level 2: Amber Gold */}
              <div className="w-[86%] py-3 bg-[#d4af37] text-[#121212] font-bold text-xs sm:text-sm grid place-items-center shadow-xs">
                5% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 2 (Direct Sponsor)</span>
              </div>
              {/* Level 3: Royal Blue */}
              <div className="w-[74%] py-3 bg-[#2a5bd7] text-white font-bold text-xs sm:text-sm grid place-items-center shadow-xs">
                4% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 3</span>
              </div>
              {/* Level 4: Cobalt Blue */}
              <div className="w-[62%] py-3 bg-[#3b6fe8] text-white font-bold text-xs sm:text-sm grid place-items-center shadow-xs">
                3% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 4</span>
              </div>
              {/* Level 5: Forest Green */}
              <div className="w-[52%] py-3 bg-[#168853] text-white font-bold text-xs sm:text-sm grid place-items-center shadow-xs">
                2% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 5</span>
              </div>
              {/* Level 6+: Vibrant Emerald */}
              <div className="w-[44%] py-3 rounded-b-xl bg-[#1b9a5f] text-white font-bold text-xs sm:text-sm grid place-items-center shadow-md">
                1% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 6+</span>
              </div>
            </div>

            {/* Right Callout in Rich Black with Glowing Accents */}
            <div className="p-7 bg-[#121212] text-white rounded-2xl flex flex-col justify-between shadow-xl space-y-4 border border-amber-500/30 relative overflow-hidden">
              <div className="pointer-events-none absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-blue-500/15 blur-2xl" />
              <div className="relative z-10 space-y-2">
                <span className="text-4xl sm:text-5xl font-black text-[#e4b755] font-serif block tracking-tight">
                  Up to 10%
                </span>
                <p className="text-xs text-[#d1cbc1] font-medium leading-relaxed">
                  Commission paid directly to you when your network closes a verified property sale.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/15 space-y-2.5 text-xs text-[#d1cbc1]">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#c5a059] shrink-0" />
                  <span>Direct bank transfer upon property registration.</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4d7ef2] shrink-0" />
                  <span>Override commissions paid on all downline deals.</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No limits on the number of property closures.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Property Valuation Calculator (Vibrant Outputs) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#f5f0e4] to-[#ede7d8] border border-[#ded5c0] space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#96742e]">
                  Interactive Valuation Calculator
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#121212] mt-1">
                  Estimate Your Real Estate Brokerage
                </h4>
              </div>
              <div className="sm:text-right">
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
                className="w-full h-3 bg-white rounded-lg appearance-none cursor-pointer accent-[#121212] shadow-inner"
              />
              <div className="flex justify-between text-[11px] text-[#777] font-mono">
                <span>₹15 Lakh</span>
                <span>₹50 Lakh</span>
                <span>₹1.00 Crore</span>
                <span>₹1.50 Crore</span>
              </div>
            </div>

            {/* Colorful Dynamic Earnings Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs">
                <span className="text-[10px] text-emerald-800 uppercase block font-bold">Direct Seller (10%)</span>
                <p className="font-mono font-black text-2xl text-emerald-700 mt-1">
                  {fmtCurrency(calcPropertyVal * 0.02 * 0.10)}
                </p>
                <span className="text-[10px] text-[#777]">Direct deal closing commission</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border-2 border-blue-300 shadow-xs">
                <span className="text-[10px] text-blue-800 uppercase block font-bold">Level 2 Upline (5%)</span>
                <p className="font-mono font-black text-2xl text-[#2a5bd7] mt-1">
                  {fmtCurrency(calcPropertyVal * 0.02 * 0.05)}
                </p>
                <span className="text-[10px] text-[#777]">Passive direct sponsor override</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border-2 border-purple-300 shadow-xs">
                <span className="text-[10px] text-purple-800 uppercase block font-bold">Level 3 Upline (4%)</span>
                <p className="font-mono font-black text-2xl text-[#7c3aed] mt-1">
                  {fmtCurrency(calcPropertyVal * 0.02 * 0.04)}
                </p>
                <span className="text-[10px] text-[#777]">Compound network override</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: COMPOUNDING NETWORK TREE SIMULATION (VIBRANT)       */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ded8cc] shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0ece1]">
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
            <div className="p-4 rounded-2xl bg-[#faf8f5] border-2 border-[#c5a059]">
              <span className="text-[10px] text-[#96742e] font-bold uppercase block">Tier 1</span>
              <p className="font-mono font-black text-2xl text-[#121212] mt-1">3</p>
              <span className="text-[10px] text-emerald-700 font-bold">₹600 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border-2 border-[#d4af37]">
              <span className="text-[10px] text-[#96742e] font-bold uppercase block">Tier 2</span>
              <p className="font-mono font-black text-2xl text-[#121212] mt-1">9</p>
              <span className="text-[10px] text-emerald-700 font-bold">₹900 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border-2 border-[#2a5bd7]">
              <span className="text-[10px] text-[#2a5bd7] font-bold uppercase block">Tier 3</span>
              <p className="font-mono font-black text-2xl text-[#121212] mt-1">27</p>
              <span className="text-[10px] text-emerald-700 font-bold">₹1,350 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border-2 border-[#3b6fe8]">
              <span className="text-[10px] text-[#3b6fe8] font-bold uppercase block">Tier 4</span>
              <p className="font-mono font-black text-2xl text-[#121212] mt-1">81</p>
              <span className="text-[10px] text-emerald-700 font-bold">₹4,050 Bonus</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f5] border-2 border-[#168853] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#168853] font-bold uppercase block">Tier 5</span>
              <p className="font-mono font-black text-2xl text-[#121212] mt-1">243</p>
              <span className="text-[10px] text-emerald-700 font-bold">₹12,150 Bonus</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#121212] to-[#222] text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
            <span className="text-[#d1cbc1]">
              Total team of <b className="text-white text-sm">363 partners</b>, generating continuous passive overrides every time any property deal closes.
            </span>
            <Link
              to="/advisers-program"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-[#c5a059] text-[#121212] font-black uppercase tracking-wider text-xs transition shrink-0 shadow-md hover:scale-105"
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
