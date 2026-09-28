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
    ['Our Story', s.about_story, 'The story of Iston Builder Group will be shared here soon.'],
    ['Mission', s.mission, 'Our mission statement is coming soon.'],
    ['Vision', s.vision, 'Our vision statement is coming soon.'],
  ];
  return (
    <>
      <PageHero eyebrow="About Us" title={s.company_name} text={s.tagline} crumbs={[['About']]} />
      <section className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <img src="/images/building.jpg" alt="Residential architecture (representative image)" className="aspect-[4/5] w-full rounded-[2rem] object-cover" loading="lazy" />
        </div>
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">Who we are</p>
          <h2 className="font-display text-4xl leading-tight text-navy md:text-5xl">Builder &amp; developer.</h2>
          <p className="mt-5 text-[15px] leading-[1.85] whitespace-pre-line text-ink/80">
            {has(s.about_intro) ? s.about_intro : <Soon>A detailed company profile will be published here soon.</Soon>}
          </p>
          <div className="mt-10 space-y-8">
            {blocks.map(([t, v, fb]) => (
              <div key={t} className="border-t border-line pt-6">
                <h3 className="font-display text-3xl text-navy">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-muted">{has(v) ? v : <Soon>{fb}</Soon>}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['/properties', 'Flats'],
              ['/plots', 'Plots'],
              ['/society-houses', 'Society Houses'],
            ].map(([to, l]) => (
              <Link key={to} to={to} className="rounded-2xl border border-line p-5 transition hover:border-navy">
                <p className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase">We offer</p>
                <p className="mt-1 font-display text-2xl text-navy">{l}</p>
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

export function Partner() {
  const { s } = useSettings();
  useSeo('Partner Program — Coming Soon', 'The Iston Builder Group Partner Program is coming soon. Register your interest.');
  const items = [
    { icon: Users, t: 'Refer', d: 'Introduce buyers to Iston Builder Group projects.' },
    { icon: Sparkles, t: 'Track', d: 'A partner dashboard to follow your referrals.' },
    { icon: Wallet, t: 'Earn', d: 'Program terms will be announced at launch.' },
  ];
  return (
    <section className="grid-lines relative min-h-[85svh] overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-navy-soft blur-3xl" />
      <div className="container-x relative grid gap-12 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-brass-light uppercase">
            <Handshake className="h-3.5 w-3.5" /> Coming Soon
          </span>
          <h1 className="font-display mt-6 text-5xl leading-[0.98] md:text-7xl">
            Partner <em className="text-brass-light">Program</em>
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/70">
            {has(s.partner_program_text)
              ? s.partner_program_text
              : 'We are preparing a partner & referral program for channel partners, brokers and friends of Iston Builder Group. Register your interest and we will notify you when it launches.'}
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {items.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="h-5 w-5 text-brass-light" />
                <p className="mt-3 font-display text-2xl">{t}</p>
                <p className="mt-1 text-xs text-white/55">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 text-ink md:p-10">
          <p className="eyebrow mb-3">Register interest</p>
          <h2 className="font-display mb-6 text-3xl text-navy">Be the first to know</h2>
          <EnquiryForm preset={{ interest: 'Partner Program' }} compact />
        </div>
      </div>
    </section>
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
