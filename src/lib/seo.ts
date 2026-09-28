import { useEffect } from 'react';

const BRAND = 'Iston Builder Group';
const DEFAULT_DESC =
  'Iston Builder Group — builder & developer. Explore our current project Umroli, flats, plots, society houses and upcoming developments.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo(title: string, description?: string, image?: string | null, noindex = false) {
  useEffect(() => {
    const full = title ? `${title} | ${BRAND}` : `${BRAND} — Building Better Spaces. Creating Better Futures.`;
    const desc = (description || DEFAULT_DESC).slice(0, 300);
    document.title = full;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', window.location.href);
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', desc);
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).href);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = window.location.origin + window.location.pathname;
  }, [title, description, image, noindex]);
}
