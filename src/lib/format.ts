export const COMING = 'Coming Soon';

export const has = (v: unknown) => !(v === null || v === undefined || String(v).trim() === '');
export const show = (v: unknown, fb = COMING) => (has(v) ? String(v) : fb);
export const price = (v: unknown) => (has(v) ? String(v) : 'Price on Request');

export const PROJECT_STATUS: Record<string, string> = {
  current: 'Current',
  upcoming: 'Upcoming',
  under_development: 'Under Development',
  completed: 'Completed',
};
export const LISTING_STATUS: Record<string, string> = {
  available: 'Available',
  booked: 'Booked',
  sold: 'Sold Out',
  coming_soon: 'Coming Soon',
};
export const statusLabel = (s?: string | null) => (s ? PROJECT_STATUS[s] || LISTING_STATUS[s] || s : COMING);

export const arr = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter(Boolean).map(String)
    : typeof v === 'string' && v.trim()
      ? v.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

export const telHref = (p: string) => 'tel:' + p.replace(/[^\d+]/g, '');
export const waHref = (num: string, text: string) => `https://wa.me/${num.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

export const fmtDate = (d?: string | null) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
