// Adviser referral capture. Any visit with ?ref=CODE or ?sponsor=CODE stores the code
// and it is attached to adviser registrations and enquiries automatically.
const KEY = 'iston_ref';

export function captureReferral() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('sponsor');
    if (ref && /^[a-zA-Z0-9_-]{2,40}$/.test(ref)) {
      localStorage.setItem(KEY, JSON.stringify({ code: ref.toUpperCase(), at: Date.now() }));
    }
  } catch {
    /* ignore */
  }
}

export function getReferral(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw);
    if (Date.now() - at > 1000 * 60 * 60 * 24 * 60) return null;
    return code;
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
