import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Logo from './Logo';
import { useSettings } from '../contexts/SettingsContext';
import { has, telHref, waHref } from '../lib/format';
import { Soon } from './ui';

export default function Footer() {
  const { s } = useSettings();
  const socials = [
    ['Instagram', s.instagram_url],
    ['Facebook', s.facebook_url],
    ['YouTube', s.youtube_url],
    ['LinkedIn', s.linkedin_url],
  ].filter(([, u]) => has(u));

  const col = (title: string, links: [string, string][]) => (
    <div>
      <p className="mb-5 text-[10px] font-bold tracking-[0.24em] text-brass-light uppercase">{title}</p>
      <ul className="space-y-3">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-white/70 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="relative overflow-hidden bg-navy-deep pb-24 text-white md:pb-0">
      <div className="grid-lines absolute inset-0 opacity-60" />
      <div className="container-x relative">
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 md:flex-row md:items-end md:justify-between md:py-20">
          <h2 className="font-display max-w-2xl text-4xl leading-[1.02] md:text-6xl">
            Building Better Spaces.
            <br />
            <em className="text-brass-light">Creating Better Futures.</em>
          </h2>
          <div className="flex flex-wrap gap-3">
            <a href={telHref(s.phone)} className="btn btn-light">
              <Phone className="h-4 w-4" /> {s.phone}
            </a>
            <a href={waHref(s.whatsapp, 'Hello Iston Builder Group')} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              {s.company_name} — builder &amp; developer. {s.tagline}
            </p>
            {socials.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socials.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-white/40 hover:text-white">
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            {col('Explore', [
              ['/projects', 'Projects'],
              ['/buildings', 'Buildings'],
              ['/properties', 'Flats'],
              ['/plots', 'Plots'],
              ['/society-houses', 'Society Houses'],
            ])}
          </div>
          <div className="lg:col-span-2">
            {col('Company', [
              ['/about', 'About Us'],
              ['/under-development', 'Construction Progress'],
              ['/brochure', 'Download Brochure'],
              ['/partner-program', 'Partner Program'],
              ['/contact', 'Contact'],
            ])}
          </div>
          <div className="space-y-4 text-sm lg:col-span-4">
            <p className="mb-5 text-[10px] font-bold tracking-[0.24em] text-brass-light uppercase">Get in touch</p>
            <a href={telHref(s.phone)} className="flex items-start gap-3 text-white/80 hover:text-white">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brass-light" /> {s.phone}
            </a>
            <div className="flex items-start gap-3 text-white/80">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brass-light" />
              {has(s.email) ? <a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a> : <span className="text-white/45 italic">sitaramchaurasiya8@gmaill.com</span>}
            </div>
            <div className="flex items-start gap-3 text-white/80">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-light" />
              {has(s.office_address) ? <span className="whitespace-pre-line">{s.office_address}</span> : <span className="text-white/45 italic">Office address coming soon</span>}
            </div>
            {has(s.rera_info) && <p className="text-xs whitespace-pre-line text-white/50">{s.rera_info}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-8 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {s.company_name}. All rights reserved.</p>
          <p className="max-w-xl md:text-right">
            {has(s.footer_disclaimer) ? s.footer_disclaimer : 'Images are representative. Project details, availability and pricing are subject to change — please confirm with our team.'}
          </p>
          <Link to="/admin" className="inline-flex items-center gap-1 text-white/35 hover:text-white/70">
            Admin Login <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <span className="sr-only">
        <Soon />
      </span>
    </footer>
  );
}
