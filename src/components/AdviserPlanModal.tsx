import { useState } from 'react';
import { X, TrendingUp, Users, Building, Sparkles, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';

interface AdviserPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdviserPlanModal({ isOpen, onClose }: AdviserPlanModalProps) {
  const [calcPropertyVal, setCalcPropertyVal] = useState<number>(5000000);
  const [activeTab, setActiveTab] = useState<'bonus' | 'example' | 'property' | 'tree' | 'all'>('all');

  if (!isOpen) return null;

  const fmtCurrency = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtShort = (n: number) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' Lakh';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#faf8f5] text-[#121212] rounded-3xl w-full max-w-4xl shadow-2xl border border-[#ded8cc] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#f5f2ea] border-b border-[#e5dfd3] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#96742e] bg-[#ede7d8] px-2.5 py-0.5 rounded-full border border-[#ded5c0]">
              Official Transparency Deck
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-1">
              Adviser Growth &amp; Commission Plan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#ded8cc] hover:bg-[#ede8dc] text-[#121212] grid place-items-center transition text-sm font-bold shadow-xs"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Navigation Pills */}
        <div className="px-6 py-3 bg-[#fdfcf9] border-b border-[#e5dfd3] flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          {[
            ['all', 'All Plans'],
            ['bonus', '04. Joining Bonus Structure'],
            ['example', '05. Three Instant Payouts'],
            ['property', '06. Property Sales Commission'],
            ['tree', 'Compounding Tree'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setActiveTab(k as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                activeTab === k
                  ? 'bg-[#121212] text-white border-[#121212] shadow-xs font-bold'
                  : 'bg-white text-[#555047] border-[#ded8cc] hover:text-[#121212] hover:bg-[#f5f2ea]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-sm">
          
          {/* SECTION 1: JOINING BONUS STRUCTURE (IMAGE 1) */}
          {(activeTab === 'all' || activeTab === 'bonus') && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5dfd3] shadow-xs space-y-6">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-[#96742e] uppercase">
                <span className="w-5 h-0.5 bg-[#96742e]" />
                04 — JOINING BONUS STRUCTURE
              </div>
              <h4 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#121212] tracking-tight">
                Every New Member Rewards the Whole Chain
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
                {/* Horizontal Progress Bars */}
                <div className="space-y-4 bg-[#faf8f5] p-5 sm:p-6 rounded-2xl border border-[#e8e3d8]">
                  {/* New Member */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-[#121212] text-white font-bold grid place-items-center text-xs">₹</span>
                        <div>
                          <p className="font-bold text-[#121212]">New Member</p>
                          <p className="text-[10px] text-[#787267]">Bonus on joining (Self Welcome)</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-lg text-[#121212]">₹300</span>
                    </div>
                    <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-[#c5a059] shadow-xs" style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Direct Referrer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-[#121212] text-white font-bold grid place-items-center text-xs">₹</span>
                        <div>
                          <p className="font-bold text-[#121212]">Direct Referrer</p>
                          <p className="text-[10px] text-[#787267]">Who shared the code (Level 1)</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-lg text-[#121212]">₹200</span>
                    </div>
                    <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-[#d4af37]" style={{ width: '66%' }} />
                    </div>
                  </div>

                  {/* Level 2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-[#2a5bd7] text-white font-bold grid place-items-center text-xs">₹</span>
                        <div>
                          <p className="font-bold text-[#121212]">Level 2</p>
                          <p className="text-[10px] text-[#787267]">Referrer's referrer</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-lg text-[#121212]">₹100</span>
                    </div>
                    <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-[#2a5bd7]" style={{ width: '33%' }} />
                    </div>
                  </div>

                  {/* Level 3 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-[#168853] text-white font-bold grid place-items-center text-xs">₹</span>
                        <div>
                          <p className="font-bold text-[#121212]">Level 3</p>
                          <p className="text-[10px] text-[#787267]">One level further up</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-lg text-[#121212]">₹50</span>
                    </div>
                    <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-[#168853]" style={{ width: '16%' }} />
                    </div>
                  </div>

                  {/* Level 4+ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-[#168853] text-white font-bold grid place-items-center text-xs">₹</span>
                        <div>
                          <p className="font-bold text-[#121212]">Level 4+</p>
                          <p className="text-[10px] text-[#787267]">Deeper upline (Evergreen)</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-lg text-[#168853]">₹50</span>
                    </div>
                    <div className="w-full h-7 rounded-full bg-[#ede8dc] overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-[#168853]" style={{ width: '16%' }} />
                    </div>
                  </div>
                </div>

                {/* Right Callout Box */}
                <div className="bg-[#121212] text-white p-7 rounded-2xl flex flex-col justify-between shadow-md">
                  <div>
                    <span className="text-4xl sm:text-5xl font-black text-[#e4b755] font-serif block">
                      ₹300
                    </span>
                    <p className="text-xs text-[#d1cbc1] mt-1 font-medium">
                      Back to you the moment your account is activated.
                    </p>
                  </div>

                  <div className="my-6 border-t border-white/15 pt-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#4d7ef2] block">
                      5 levels
                    </span>
                    <p className="text-xs text-[#d1cbc1] mt-1">
                      Rewarded every single time someone joins under your referral chain.
                    </p>
                  </div>

                  <p className="text-[11px] text-[#a09a8e] leading-relaxed">
                    Total distributed: <b>₹700 of ₹1,100</b>. Remaining ₹400 covers verified registration processing, KYC checks, and platform operations.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: ONE NEW MEMBER THREE INSTANT PAYOUTS (IMAGE 2) */}
          {(activeTab === 'all' || activeTab === 'example') && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5dfd3] shadow-xs space-y-6">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-[#96742e] uppercase">
                <span className="w-5 h-0.5 bg-[#96742e]" />
                05 — JOINING BONUS EXAMPLE
              </div>
              <h4 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#121212] tracking-tight">
                One New Member. Three Instant Payouts.
              </h4>

              {/* 3 Nodes Flow Graphic */}
              <div className="p-6 sm:p-8 rounded-2xl bg-[#faf8f5] border border-[#e8e3d8]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  {/* Node A */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold tracking-widest text-[#787267] uppercase mb-3">
                      Level 2 Referrer
                    </span>
                    <div className="w-24 h-24 rounded-full bg-white border-2 border-[#2a5bd7] shadow-sm flex items-center justify-center font-serif text-3xl font-black text-[#121212]">
                      A
                    </div>
                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#121212] mt-4">
                      +₹100
                    </span>
                    <span className="text-xs text-[#787267] mt-0.5">Level 2 bonus</span>
                  </div>

                  {/* Node B */}
                  <div className="flex flex-col items-center text-center relative">
                    <span className="text-[10px] font-bold tracking-widest text-[#787267] uppercase mb-3">
                      Direct Referrer
                    </span>
                    <div className="w-24 h-24 rounded-full bg-[#121212] border-2 border-[#121212] shadow-sm flex items-center justify-center font-serif text-3xl font-black text-white">
                      B
                    </div>
                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#121212] mt-4">
                      +₹200
                    </span>
                    <span className="text-xs text-[#787267] mt-0.5">Direct referral bonus</span>
                  </div>

                  {/* Node C */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold tracking-widest text-[#96742e] uppercase mb-3">
                      New Member
                    </span>
                    <div className="w-24 h-24 rounded-full bg-white border-2 border-[#c5a059] shadow-sm flex items-center justify-center font-serif text-3xl font-black text-[#121212]">
                      C
                    </div>
                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#96742e] mt-4">
                      +₹300
                    </span>
                    <span className="text-xs text-[#787267] mt-0.5">Joining bonus</span>
                  </div>
                </div>

                {/* Bottom Banner */}
                <div className="mt-8 p-3.5 rounded-xl bg-[#121212] text-white flex flex-col sm:flex-row items-center justify-between text-xs text-center sm:text-left gap-2 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#c5a059] animate-pulse" />
                    <span>Bonuses flow upline instantly</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-[#e4b755]">
                    ₹600 paid out from a single join
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: PROPERTY SALES COMMISSION FUNNEL (IMAGE 3) */}
          {(activeTab === 'all' || activeTab === 'property') && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5dfd3] shadow-xs space-y-6">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-[#96742e] uppercase">
                <span className="w-5 h-0.5 bg-[#96742e]" />
                06 — PROPERTY SALES COMMISSION
              </div>
              <h4 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#121212] tracking-tight">
                Earn on Every Property Sale
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
                {/* Inverted Funnel Graphic */}
                <div className="flex flex-col items-center gap-1.5 p-6 bg-[#faf8f5] rounded-2xl border border-[#e8e3d8]">
                  <div className="w-[100%] py-2.5 rounded-t-xl bg-[#c5a059] text-[#121212] font-black text-sm sm:text-base grid place-items-center shadow-xs">
                    10% <span className="text-xs font-semibold uppercase tracking-wider ml-2">LEVEL 1 (Direct Closer)</span>
                  </div>
                  <div className="w-[85%] py-2.5 bg-[#d4af37] text-[#121212] font-bold text-xs sm:text-sm grid place-items-center">
                    5% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 2 (Direct Sponsor)</span>
                  </div>
                  <div className="w-[72%] py-2.5 bg-[#2a5bd7] text-white font-bold text-xs sm:text-sm grid place-items-center">
                    4% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 3</span>
                  </div>
                  <div className="w-[60%] py-2.5 bg-[#3b6fe8] text-white font-bold text-xs sm:text-sm grid place-items-center">
                    3% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 4</span>
                  </div>
                  <div className="w-[50%] py-2.5 bg-[#168853] text-white font-bold text-xs sm:text-sm grid place-items-center">
                    2% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 5</span>
                  </div>
                  <div className="w-[42%] py-2.5 rounded-b-xl bg-[#1b9a5f] text-white font-bold text-xs sm:text-sm grid place-items-center shadow-xs">
                    1% <span className="text-[11px] font-medium uppercase tracking-wider ml-2">LEVEL 6+</span>
                  </div>
                </div>

                {/* Right Callout */}
                <div className="p-7 bg-[#121212] text-white rounded-2xl flex flex-col justify-between shadow-md space-y-4">
                  <div>
                    <span className="text-4xl sm:text-5xl font-black text-[#e4b755] font-serif block">
                      Up to 10%
                    </span>
                    <p className="text-xs text-[#d1cbc1] mt-1 font-medium leading-relaxed">
                      Commission paid directly to you when your network closes a verified property sale.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/15 space-y-2 text-xs text-[#d1cbc1]">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#c5a059] shrink-0" />
                      <span>Direct bank transfer upon property registration.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#c5a059] shrink-0" />
                      <span>Applies to all Iston verified flats, buildings &amp; plots.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#c5a059] shrink-0" />
                      <span>No monthly caps or hidden deductions.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Range Slider Calculator */}
              <div className="mt-6 p-6 rounded-2xl bg-[#f5f2ea] border border-[#e5dfd3] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-[#121212] text-base">Live Commission Simulator</h5>
                    <p className="text-xs text-[#666158]">Slide to see commissions calculated on any property valuation.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#787267] block">Selected Property Value</span>
                    <span className="font-mono text-2xl font-black text-[#121212]">{fmtShort(calcPropertyVal)}</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={1500000}
                  max={15000000}
                  step={100000}
                  value={calcPropertyVal}
                  onChange={(e) => setCalcPropertyVal(Number(e.target.value))}
                  className="w-full accent-[#121212] cursor-pointer"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 text-center text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#ded8cc]">
                    <span className="text-[10px] text-[#787267] block uppercase font-bold">Direct Closer (10%)</span>
                    <span className="font-mono font-bold text-[#96742e] text-sm mt-0.5 block">{fmtCurrency(calcPropertyVal * 0.1)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ded8cc]">
                    <span className="text-[10px] text-[#787267] block uppercase font-bold">Referrer (5%)</span>
                    <span className="font-mono font-bold text-[#121212] text-sm mt-0.5 block">{fmtCurrency(calcPropertyVal * 0.05)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ded8cc]">
                    <span className="text-[10px] text-[#787267] block uppercase font-bold">Level 3 (4%)</span>
                    <span className="font-mono font-bold text-[#121212] text-sm mt-0.5 block">{fmtCurrency(calcPropertyVal * 0.04)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ded8cc]">
                    <span className="text-[10px] text-[#787267] block uppercase font-bold">Level 4 (3%)</span>
                    <span className="font-mono font-bold text-[#121212] text-sm mt-0.5 block">{fmtCurrency(calcPropertyVal * 0.03)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ded8cc]">
                    <span className="text-[10px] text-[#787267] block uppercase font-bold">Level 5 (2%)</span>
                    <span className="font-mono font-bold text-[#121212] text-sm mt-0.5 block">{fmtCurrency(calcPropertyVal * 0.02)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ded8cc]">
                    <span className="text-[10px] text-[#787267] block uppercase font-bold">Level 6+ (1%)</span>
                    <span className="font-mono font-bold text-[#168853] text-sm mt-0.5 block">{fmtCurrency(calcPropertyVal * 0.01)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4: COMPOUNDING TREE */}
          {(activeTab === 'all' || activeTab === 'tree') && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5dfd3] shadow-xs space-y-5">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-[#96742e] uppercase">
                <span className="w-5 h-0.5 bg-[#96742e]" />
                NETWORK COMPOUNDING
              </div>
              <h4 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#121212]">
                Exponential Growth: 1 → 3 → 9 → 27 → 81
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8e3d8]">
                  <span className="text-[10px] font-bold text-[#787267] uppercase block">Level 1</span>
                  <p className="text-2xl font-black text-[#121212] mt-1">3</p>
                  <p className="text-[11px] text-[#666158]">₹200 each = ₹600</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8e3d8]">
                  <span className="text-[10px] font-bold text-[#787267] uppercase block">Level 2</span>
                  <p className="text-2xl font-black text-[#121212] mt-1">9</p>
                  <p className="text-[11px] text-[#666158]">₹100 each = ₹900</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8e3d8]">
                  <span className="text-[10px] font-bold text-[#787267] uppercase block">Level 3</span>
                  <p className="text-2xl font-black text-[#121212] mt-1">27</p>
                  <p className="text-[11px] text-[#666158]">₹50 each = ₹1,350</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8e3d8]">
                  <span className="text-[10px] font-bold text-[#787267] uppercase block">Level 4+</span>
                  <p className="text-2xl font-black text-[#168853] mt-1">81</p>
                  <p className="text-[11px] text-[#168853]">₹50 each = ₹4,050</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] text-white flex items-center justify-between text-xs font-medium">
                <span>Total 4-Tier Network: <b>120 Members</b></span>
                <span className="text-[#e4b755] font-bold">₹6,000/mo passive joining rewards potential</span>
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#f5f2ea] border-t border-[#e5dfd3] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#121212] hover:bg-black text-white font-medium text-xs shadow-sm transition"
          >
            Close Plan Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
