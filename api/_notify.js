import { readConfig } from './_lib.js';

// Enquiry notifications.
// Email    -> Resend (set RESEND_API_KEY; optional RESEND_FROM, e.g. "Iston Website <enquiry@yourdomain.com>")
// WhatsApp -> CallMeBot (set CALLMEBOT_API_KEY, obtained by messaging CallMeBot from the WhatsApp number)
const DEFAULT_EMAIL = 'istonbuildergroup@gmail.com';
const DEFAULT_WA = '918484843391';

const withTimeout = (p, ms = 6000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export async function notifyEnquiry(e) {
  const cfg = await readConfig('settings.json', {}).catch(() => ({}));
  const to = (cfg.notify_email || DEFAULT_EMAIL).trim();
  let wa = String(cfg.notify_whatsapp || DEFAULT_WA).replace(/\D/g, '');
  if (wa.length === 10) wa = '91' + wa;

  const lines = [
    ['Name', e.name],
    ['Phone', e.phone],
    ['Email', e.email],
    ['Interested in', e.interest],
    ['Listing', e.item_title],
    ['Message', e.message],
    ['Page', e.source_page],
    ['Referral code', e.referral_code],
  ].filter(([, v]) => v);

  const jobs = [];

  if (process.env.RESEND_API_KEY && to) {
    const html = `<h2 style="font-family:Georgia,serif;color:#0b1d3f">New website enquiry</h2><table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${lines
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5d6a80">${esc(k)}</td><td style="padding:6px 0;color:#0e1726"><b>${esc(v)}</b></td></tr>`)
      .join('')}</table>`;
    jobs.push(
      withTimeout(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Iston Builder Group Website <onboarding@resend.dev>',
            to: [to],
            reply_to: e.email || undefined,
            subject: `New enquiry: ${e.name}${e.item_title ? ` — ${e.item_title}` : ''}`,
            html,
            text: lines.map(([k, v]) => `${k}: ${v}`).join('\n'),
          }),
        }).then((r) => (r.ok ? 'email-sent' : r.text().then((t) => Promise.reject(new Error('email: ' + t)))))
      )
    );
  }

  if (process.env.CALLMEBOT_API_KEY && wa) {
    const text = `*New Iston enquiry*\n${lines.map(([k, v]) => `${k}: ${v}`).join('\n')}`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${wa}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(process.env.CALLMEBOT_API_KEY)}`;
    jobs.push(withTimeout(fetch(url).then((r) => (r.ok ? 'whatsapp-sent' : Promise.reject(new Error('whatsapp: ' + r.status))))));
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === 'rejected') console.error('notify failed:', r.reason?.message);
  return results;
}
