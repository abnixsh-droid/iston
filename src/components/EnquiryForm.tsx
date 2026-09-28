import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { getReferral } from '../lib/referral';
import { waHref } from '../lib/format';
import { useSettings } from '../contexts/SettingsContext';
import type { EnquiryOpts } from '../contexts/EnquiryContext';

const INTERESTS = [
  'General enquiry',
  'Umroli project',
  'Flats / Apartments',
  'Plots',
  'Society Houses',
  'Site visit',
  'Brochure request',
  'Partner Program',
];

export default function EnquiryForm({ preset = {}, compact = false }: { preset?: EnquiryOpts; compact?: boolean }) {
  const { s } = useSettings();
  const initialInterest = preset.interest || (preset.item_title ? 'Specific listing' : 'General enquiry');
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '', interest: initialInterest, website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverErr, setServerErr] = useState('');

  const interests = INTERESTS.includes(initialInterest) ? INTERESTS : [initialInterest, ...INTERESTS];
  const set = (k: string, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Please enter your full name.';
    const d = f.phone.replace(/\D/g, '');
    if (d.length < 10 || d.length > 13) e.phone = 'Enter a valid 10-digit mobile number.';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerErr('');
    if (!validate()) return;
    setState('sending');
    try {
      await api('/api/enquiries', {
        method: 'POST',
        body: {
          ...f,
          item_type: preset.item_type,
          item_id: preset.item_id,
          item_title: preset.item_title,
          source_page: window.location.pathname,
          referral_code: getReferral(),
        },
      });
      setState('done');
    } catch (e) {
      setServerErr((e as Error).message || 'Something went wrong. Please try again or call us.');
      setState('idle');
    }
  };

  if (state === 'done') {
    const text = [
      'Hello Iston Builder Group, I have submitted an enquiry on your website.',
      `Name: ${f.name}`,
      `Phone: ${f.phone}`,
      f.email && `Email: ${f.email}`,
      `Interested in: ${f.interest}`,
      preset.item_title && `Listing: ${preset.item_title}`,
      f.message && `Message: ${f.message}`,
    ]
      .filter(Boolean)
      .join('\n');
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <p className="font-display text-2xl text-navy">Thank you, {f.name.split(' ')[0]}.</p>
        <p className="max-w-sm text-sm text-muted">Your enquiry has been received. Our team will reach out to you on {f.phone}.</p>
        <a href={waHref(s.whatsapp, text)} target="_blank" rel="noreferrer" className="btn btn-outline mt-2">
          <MessageCircle className="h-4 w-4" /> Also send on WhatsApp
        </a>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <input type="text" name="website" value={f.website} onChange={(e) => set('website', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label className="label" htmlFor="enq-name">Full name *</label>
          <input id="enq-name" className={`input ${errors.name ? 'invalid' : ''}`} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Your name" />
          {err('name')}
        </div>
        <div>
          <label className="label" htmlFor="enq-phone">Mobile number *</label>
          <input id="enq-phone" type="tel" inputMode="tel" className={`input ${errors.phone ? 'invalid' : ''}`} value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="+91" />
          {err('phone')}
        </div>
      </div>
      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label className="label" htmlFor="enq-email">Email (optional)</label>
          <input id="enq-email" type="email" className={`input ${errors.email ? 'invalid' : ''}`} value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@example.com" />
          {err('email')}
        </div>
        <div>
          <label className="label" htmlFor="enq-interest">Interested in</label>
          <select id="enq-interest" className="input" value={f.interest} onChange={(e) => set('interest', e.target.value)}>
            {interests.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="enq-msg">Message</label>
        <textarea id="enq-msg" rows={compact ? 3 : 4} className="input" value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us what you’re looking for" />
      </div>
      {serverErr && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{serverErr}</p>}
      <button type="submit" disabled={state === 'sending'} className="btn btn-primary w-full">
        {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {state === 'sending' ? 'Sending…' : 'Submit Enquiry'}
      </button>
      <p className="text-center text-[11px] text-muted">By submitting, you agree to be contacted by Iston Builder Group regarding your enquiry.</p>
    </form>
  );
}
