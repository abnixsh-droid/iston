// Future-ready partner / referral capture. Any visit with ?ref=CODE stores the code
// and it is attached to enquiries automatically.
const KEY = 'iston_ref';

export function captureReferral() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && /^[a-zA-Z0-9_-]{2,40}$/.test(ref)) {
      localStorage.setItem(KEY, JSON.stringify({ code: ref, at: Date.now() }));
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
