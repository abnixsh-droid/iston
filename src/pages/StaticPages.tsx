import { useEffect, useRef } from 'react';
import { BROCHURE_FILENAME, brochureDownloadUrl } from '../lib/brochure';
import BrochureButton from '../components/BrochureButton';
import { Link } from 'react-router-dom';
import { Clock, Download, FileText, Handshake, Mail, MapPin, MessageCircle, Phone, Sparkles, Users, Wallet } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { has, telHref, waHref } from '../lib/format';
import { useSettings } from '../contexts/SettingsContext';
import { useEnquiry } from '../contexts/EnquiryContext';
import EnquiryForm from '../components/EnquiryForm';
import { PageHero, Soon } from '../components/ui';

export function About() {
  const { s } = useSettings();
  useSeo('About Us', `About ${s.company_name} — builder & developer. ${s.tagline}`);
  const blocks: [string, string | undefined, string][] = [
    [
      'Our Story',
      s.about_story,
      `${s.company_name} was founded with a clear conviction: that buying a home should be an inspiring, secure, and transparent milestone in every family’s journey. Originating with strategic developments in prime emerging suburban corridors like Umroli, we design living spaces that harmonize modern engineering standards with peaceful natural environments. Our projects reflect precision planning, robust earthquake-resistant RCC construction, and uncompromising attention to ventilation, natural lighting, and long-term asset value.`,
    ],
    [
      'Our Mission',
      s.mission,
      'To build enduring, environmentally mindful residential and commercial spaces that elevate the quality of everyday life, while providing homebuyers, investors, and certified advisers with complete legal transparency, on-time project execution, and unmatched architectural value.',
    ],
    [
      'Our Vision',
      s.vision,
      'To be recognized as a benchmark real estate developer known for architectural distinction, clear land titles, customer-first delivery, and an empowered network of collaborative real estate advisers across the region.',
    ],
  ];
  return (
    <>
      <PageHero eyebrow="About Us" title={s.company_name} text={s.tagline} crumbs={[['About']]} />
      <section className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <img src="/images/building.jpg" alt="Iston Builder Group architectural quality" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl" loading="lazy" />
          <div className="mt-6 rounded-2xl border border-line bg-mist p-5">
            <p className="text-[10px] font-bold tracking-[0.2em] text-brass uppercase">RERA &amp; Quality Guarantee</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Every Iston residential project adheres strictly to statutory regulatory requirements, RERA guidelines, and approved municipal development plans.
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">Who we are</p>
          <h2 className="font-display text-4xl leading-tight text-navy md:text-5xl">Building Better Spaces. Creating Better Futures.</h2>
          <p className="mt-5 text-[15px] leading-[1.85] whitespace-pre-line text-ink/80">
            {has(s.about_intro)
              ? s.about_intro
              : `${s.company_name} is an established builder and developer committed to raising the standard of contemporary housing. By combining seasoned civil engineering expertise with modern urban architecture, we create well-planned residential societies, high-efficiency flats, and lucrative investment plots designed for generations of peaceful living.`}
          </p>
          <div className="mt-10 space-y-8">
            {blocks.map(([t, v, fb]) => (
              <div key={t} className="border-t border-line pt-6">
                <h3 className="font-display text-2xl md:text-3xl text-navy">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-muted">{has(v) ? v : fb}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['/properties', 'Flats & Apartments'],
              ['/plots', 'Residential Plots'],
              ['/society-houses', 'Society Houses'],
            ].map(([to, l]) => (
              <Link key={to} to={to} className="rounded-2xl border border-line p-5 transition hover:border-navy hover:shadow-xs bg-white">
                <p className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase">We offer</p>
                <p className="mt-1 font-display text-xl text-navy">{l}</p>
              </Link>
            ))}
          </div>
          {has(s.rera_info) && <p className="mt-10 rounded-2xl bg-mist p-5 text-sm whitespace-pre-line text-muted">{s.rera_info}</p>}
        </div>
      </section>
    </>
  );
}

export function Contact() {
  const { s } = useSettings();
  useSeo('Contact', `Contact ${s.company_name}. Call or WhatsApp ${s.phone}.`);
  const cards = [
    { icon: Phone, t: 'Call us', v: s.phone, href: telHref(s.phone) },
    { icon: MessageCircle, t: 'WhatsApp', v: s.phone, href: waHref(s.whatsapp, 'Hello Iston Builder Group, I would like to know more.') },
    { icon: Mail, t: 'Email', v: s.email, href: has(s.email) ? `mailto:${s.email}` : undefined },
    { icon: Clock, t: 'Office hours', v: s.office_hours },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title="Let’s talk." text="Call, WhatsApp or send an enquiry — our team will get back to you." crumbs={[['Contact']]} />
      <section className="container-x grid gap-10 py-14 md:py-20 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {cards.map(({ icon: Icon, t, v, href }) => {
              const inner = (
                <>
                  <Icon className="h-5 w-5 text-brass" />
                  <p className="mt-4 text-[10px] font-bold tracking-[0.18em] text-muted uppercase">{t}</p>
                  <p className="mt-1 font-semibold break-words text-navy">{has(v) ? v : <Soon />}</p>
                </>
              );
              return href ? (
                <a key={t} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="rounded-[1.5rem] border border-line p-5 transition hover:border-navy">
                  {inner}
                </a>
              ) : (
                <div key={t} className="rounded-[1.5rem] border border-line p-5">
                  {inner}
                </div>
              );
            })}
          </div>
          <div className="rounded-[1.5rem] border border-line p-5">
            <MapPin className="h-5 w-5 text-brass" />
            <p className="mt-4 text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Office address</p>
            <p className="mt-1 font-semibold whitespace-pre-line text-navy">{has(s.office_address) ? s.office_address : <Soon />}</p>
          </div>
          {has(s.map_embed_url) ? (
            <iframe title="Office location map" src={s.map_embed_url} className="aspect-[4/3] w-full rounded-[1.5rem] border border-line" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="grid aspect-[16/9] place-items-center rounded-[1.5rem] bg-mist text-sm text-muted italic">Location map coming soon</div>
          )}
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-[2rem] border border-line p-6 md:p-10">
            <p className="eyebrow mb-3">Enquiry</p>
            <h2 className="font-display mb-8 text-4xl text-navy">Send us a message</h2>
            <EnquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}

export function Brochure() {
  const { s } = useSettings();
  const { open } = useEnquiry();
  useSeo('Download Brochure', 'Download the Iston Builder Group brochure.');
  const ready = has(s.brochure_url);
  const started = useRef(false);
  useEffect(() => {
    // Visiting /brochure (e.g. from the footer or menu) starts the download straight away.
    if (!ready || started.current) return;
    started.current = true;
    const link = document.createElement('a');
    link.href = brochureDownloadUrl(s.brochure_url);
    link.download = BROCHURE_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [ready, s.brochure_url]);
  return (
    <>
      <PageHero eyebrow="Brochure" title="Download brochure" crumbs={[['Brochure']]} />
      <section className="container-x py-14 md:py-20">
        <div className="mx-auto grid max-w-4xl items-center gap-10 rounded-[2rem] border border-line p-6 md:grid-cols-2 md:p-12">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl bg-navy text-white shadow-2xl shadow-navy/30">
            <img src="/images/umroli-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="relative flex h-full flex-col justify-between p-6">
              <FileText className="h-6 w-6 text-brass-light" />
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-brass-light uppercase">{s.company_name}</p>
                <p className="font-display mt-2 text-3xl leading-tight">{s.brochure_title || 'Project Brochure'}</p>
              </div>
            </div>
          </div>
          <div>
            {ready ? (
              <>
                <h2 className="font-display text-4xl text-navy">{s.brochure_title || 'Project Brochure'}</h2>
                {has(s.brochure_updated) && <p className="mt-2 text-sm text-muted">Updated {s.brochure_updated}</p>}
                <p className="mt-4 text-[15px] text-muted">Your download should start automatically. If it doesn’t, use the button below.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <BrochureButton className="btn btn-primary">Download PDF</BrochureButton>
                  <a href={waHref(s.whatsapp, 'Hello Iston Builder Group, please share the brochure.')} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <MessageCircle className="h-4 w-4" /> Get on WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <>
                <span className="rounded-full bg-mist px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-navy uppercase">Coming Soon</span>
                <h2 className="font-display mt-4 text-4xl text-navy">Our brochure is being prepared.</h2>
                <p className="mt-4 text-[15px] text-muted">Request a copy and we’ll share it with you as soon as it is available.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => open({ interest: 'Brochure request', heading: 'Request the brochure' })} className="btn btn-primary">
                    Request brochure
                  </button>
                  <a href={waHref(s.whatsapp, 'Hello Iston Builder Group, please share the brochure when available.')} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export function AdvisersProgramPage() {
  const { s } = useSettings();
  useSeo('Advisers Program — Iston Builder Group', 'Join the Iston Builder Group Advisers Program. Become an adviser, build your network, and earn tiered referral rewards and property commissions.');
  const items = [
    { icon: Users, t: 'Refer & Sponsor', d: 'Invite partners to become advisers with your unique Adviser ID and shareable referral link.' },
    { icon: Sparkles, t: 'Adviser Dashboard', d: 'Track your unlimited-depth referral network, customer leads, and separate financial ledgers in real time.' },
    { icon: Wallet, t: 'Dual Earnings', d: 'Earn registration referral rewards (₹300/₹200/₹100) and property-sale commissions up to multiple upline levels.' },
  ];
  return (
    <section className="grid-lines relative min-h-[85svh] overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-navy-soft blur-3xl" />
      <div className="container-x relative grid gap-12 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-brass-light uppercase">
            <Handshake className="h-3.5 w-3.5" /> Official Advisers Network · Verified Program
          </span>
          <h1 className="font-display mt-6 text-5xl leading-[0.98] md:text-7xl">
            Advisers <em className="text-brass-light">Program</em>
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/70">
            {has(s.adviser_program_text || s.partner_program_text)
              ? (s.adviser_program_text || s.partner_program_text)
              : 'Join the Iston Builder Group Advisers Program. Become an accredited real estate adviser, refer verified properties, and build a lasting business with structured referral rewards.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link to="/advisers/register" className="btn btn-primary">
              Become an Adviser
            </Link>
            <Link to="/advisers/dashboard" className="btn btn-outline border-white/30 text-white hover:bg-white/10">
              Adviser Dashboard
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {items.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="h-5 w-5 text-brass-light" />
                <p className="mt-3 font-display text-2xl">{t}</p>
                <p className="mt-1 text-xs text-white/55">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-brass/30 bg-brass/10 p-5 text-xs text-brass-light space-y-2">
            <p className="font-semibold text-white text-sm">Program Structure &amp; Guidelines:</p>
            <p>• <b>Adviser Registration:</b> One-time onboarding fee of ₹1,100 verified via official UPI / bank reference.</p>
            <p>• <b>Registration Rewards:</b> Direct referrer earns ₹300, 2nd upline ₹200, 3rd upline ₹100, 4th &amp; higher levels ₹100/level.</p>
            <p>• <b>Property Commissions:</b> Performance commission on verified property sales (Direct Seller 10%, uplines 5%, 4%, 3%, 2%, 1%).</p>
            <p className="text-white/60">Payouts are settled directly to registered bank accounts and UPI IDs following admin approval.</p>
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 text-ink md:p-10">
          <p className="eyebrow mb-3">Adviser Registration &amp; Enquiry</p>
          <h2 className="font-display mb-6 text-3xl text-navy">Register your interest</h2>
          <EnquiryForm preset={{ interest: 'Advisers Program' }} compact />
        </div>
      </div>
    </section>
  );
}

export const Partner = AdvisersProgramPage;

export function TermsAndConditions() {
  const { s } = useSettings();
  useSeo('Terms & Conditions — Iston Builder Group', `Terms of Service and Advisers Program guidelines for ${s.company_name}.`);

  return (
    <>
      <PageHero eyebrow="Legal" title="Terms &amp; Conditions" text="Policies, booking terms, and guidelines governing the Iston Builder Group website and Advisers Program." crumbs={[['Terms']]} />
      <section className="container-x py-14 md:py-20 max-w-4xl">
        <div className="space-y-8 text-sm leading-relaxed text-ink/80">
          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">1. Acceptance of Terms</h2>
            <p className="mt-3 text-muted">
              By accessing or using the website of {s.company_name} or applying to the Advisers Program, you confirm that you have read, understood, and agreed to be bound by these Terms and Conditions and applicable Indian real estate laws, including the Real Estate (Regulation and Development) Act (RERA).
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">2. Property Listings &amp; Representation</h2>
            <p className="mt-3 text-muted">
              All architectural renderings, photographic assets, floor plans, dimensions, and specifications displayed on this website are indicative and artistic representations. While {s.company_name} strives for absolute precision, actual site measurements, amenities, and delivery schedules are subject to final municipal clearances, sanctioned building plans, and standard construction variations.
            </p>
            <p className="mt-2 text-muted">
              Pricing, availability of units, and payment schemes are subject to revision without prior notice until an official agreement for sale has been executed and stamped.
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">3. Iston Advisers Program Guidelines</h2>
            <div className="mt-3 space-y-3 text-muted">
              <p>
                The Iston Advisers Program is a licensed real estate referral and channel agency structure designed to reward authenticated partners for bona fide property lead generation and customer introductions.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-ink/75">
                <li><b>Adviser Onboarding:</b> Registration requires verified Google authentication, genuine KYC/bank details, and a one-time administrative activation fee of ₹1,100 submitted via verified UPI/banking channels and approved by management.</li>
                <li><b>Direct Referral Bonus:</b> An approved active sponsor earns a registration referral reward of ₹300 for each directly referred adviser upon administrative approval.</li>
                <li><b>Property Sales Brokerage:</b> Property sales commissions are calculated on company brokerage received: Direct Seller Adviser earns 10%, Level 1 upline earns 5%, Level 2 upline earns 4%, Level 3 upline earns 3%, Level 4 upline earns 2%, and Level 5 &amp; higher eligible uplines earn 1% each, subject to program rules and caps.</li>
                <li><b>Ethical Conduct:</b> Advisers must present authentic project facts and may not make unauthorized warranties or collect client funds directly. Any fraudulent claims or circular referral manipulation results in immediate suspension and forfeiture of unpaid rewards.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">4. Privacy &amp; Data Protection</h2>
            <p className="mt-3 text-muted">
              We respect your digital privacy. Personal data collected during Google sign-in, enquiry submissions, or adviser onboarding is encrypted and utilized solely for authentication, account servicing, regulatory compliance, and commission disbursement. We do not sell or lease personal contact details to third-party telemarketers.
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">5. Governing Law &amp; Jurisdiction</h2>
            <p className="mt-3 text-muted">
              These terms are governed by and construed in accordance with the laws of India. Any disputes arising in connection with the website, property transactions, or the Advisers Program shall be subject to the exclusive jurisdiction of the competent courts in the jurisdiction of the company’s registered headquarters.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export function NotFound() {
  useSeo('Page not found', undefined, null, true);
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-8xl text-navy">404</p>
      <p className="mt-2 text-muted">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </section>
  );
}
