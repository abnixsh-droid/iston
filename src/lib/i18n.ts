import { HI } from './hi-dictionary';

export type Lang = 'en' | 'hi';
const LS_LANG = 'iston_lang';
const LS_CACHE = 'iston_hi_cache_v1';

const ATTRS = ['placeholder', 'aria-label', 'title'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'TEXTAREA', 'SVG', 'PATH']);

let lang: Lang = 'en';
let overrides: Record<string, string> = {};
let cache: Record<string, string> = {};
const origText = new WeakMap<Text, string>();
const appliedText = new WeakMap<Text, string>();
const origAttr = new WeakMap<Element, Record<string, string>>();
const appliedAttr = new WeakMap<Element, Record<string, string>>();
const pending = new Map<string, Set<Text | [Element, string]>>();
let timer: number | null = null;
let observer: MutationObserver | null = null;
const listeners = new Set<(l: Lang) => void>();

try {
  cache = JSON.parse(localStorage.getItem(LS_CACHE) || '{}');
  const saved = localStorage.getItem(LS_LANG);
  const qp = new URLSearchParams(window.location.search).get('lang');
  lang = qp === 'hi' || qp === 'en' ? qp : saved === 'hi' ? 'hi' : 'en';
} catch {
  /* ignore */
}

export const getLang = () => lang;
export const onLangChange = (fn: (l: Lang) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Admin-editable overrides, one per line: "English text = हिंदी पाठ" */
export function setOverrides(raw: string) {
  const o: Record<string, string> = {};
  for (const line of (raw || '').split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (k && v) o[k] = v;
    }
  }
  overrides = o;
  if (lang === 'hi') translateTree(document.documentElement, true);
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const needs = (s: string) => /[A-Za-z]{2}/.test(s) && !/^(https?:|www\.|[\w.+-]+@[\w-]+\.)/.test(s) && !/^[A-Z0-9]{2,5}$/.test(s);

function lookup(key: string): string | undefined {
  if (overrides[key]) return overrides[key];
  if (HI[key]) return HI[key];
  if (cache[key]) return cache[key];
  // "Demo" suffix, e.g. "Sample Row House (Demo)" is left to the machine pass.
  return undefined;
}

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName.toUpperCase())) return true;
    if (e.hasAttribute('data-no-translate')) return true;
  }
  return false;
}

function queue(key: string, target: Text | [Element, string]) {
  if (key.length > 1500) return;
  let set = pending.get(key);
  if (!set) pending.set(key, (set = new Set()));
  set.add(target);
  if (timer === null) timer = window.setTimeout(flush, 120);
}

async function flush() {
  timer = null;
  const keys = Array.from(pending.keys()).slice(0, 60);
  if (!keys.length) return;
  const targets = keys.map((k) => pending.get(k)!);
  keys.forEach((k) => pending.delete(k));
  try {
    const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: keys }) });
    const d = await r.json();
    const out: string[] = Array.isArray(d?.t) ? d.t : [];
    keys.forEach((k, i) => {
      if (out[i]) cache[k] = out[i];
    });
    try {
      localStorage.setItem(LS_CACHE, JSON.stringify(cache).length < 1_500_000 ? JSON.stringify(cache) : '{}');
    } catch {
      /* quota */
    }
    if (lang === 'hi')
      targets.forEach((set) =>
        set.forEach((t) => {
          if (Array.isArray(t)) translateAttr(t[0], t[1]);
          else translateText(t);
        })
      );
  } catch {
    /* offline — keep English */
  }
  if (pending.size) timer = window.setTimeout(flush, 50);
}

function translateText(node: Text) {
  const cur = node.nodeValue || '';
  if (appliedText.get(node) === cur) return;
  origText.set(node, cur);
  if (lang !== 'hi') return;
  const key = norm(cur);
  if (!key || !needs(key) || skipped(node.parentElement)) return;
  const hi = lookup(key);
  if (hi === undefined) return queue(key, node);
  const lead = cur.match(/^\s*/)![0];
  const trail = cur.match(/\s*$/)![0];
  const next = lead + hi + trail;
  appliedText.set(node, next);
  node.nodeValue = next;
}

function translateAttr(el: Element, attr: string) {
  const cur = el.getAttribute(attr);
  if (cur === null) return;
  const applied = appliedAttr.get(el) || {};
  if (applied[attr] === cur) return;
  const orig = origAttr.get(el) || {};
  orig[attr] = cur;
  origAttr.set(el, orig);
  if (lang !== 'hi') return;
  const key = norm(cur);
  if (!key || !needs(key) || skipped(el)) return;
  const hi = lookup(key);
  if (hi === undefined) return queue(key, [el, attr]);
  applied[attr] = hi;
  appliedAttr.set(el, applied);
  el.setAttribute(attr, hi);
}

function translateTree(root: Node, force = false) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (force) appliedText.delete(root as Text);
    return translateText(root as Text);
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = root;
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      if (force && appliedText.get(t) === t.nodeValue) t.nodeValue = origText.get(t) ?? t.nodeValue;
      translateText(t);
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as Element;
      for (const a of ATTRS) if (el.hasAttribute(a)) translateAttr(el, a);
    }
    n = walker.nextNode();
  }
}

function restoreEnglish() {
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      if (appliedText.get(t) === t.nodeValue && origText.has(t)) {
        const o = origText.get(t)!;
        appliedText.delete(t);
        t.nodeValue = o;
      }
    } else {
      const el = n as Element;
      const applied = appliedAttr.get(el);
      const orig = origAttr.get(el);
      if (applied && orig)
        for (const [a, v] of Object.entries(applied)) if (el.getAttribute(a) === v && orig[a] !== undefined) el.setAttribute(a, orig[a]);
      appliedAttr.delete(el);
    }
    n = walker.nextNode();
  }
}

function applyDocLang() {
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  document.documentElement.classList.toggle('lang-hi', lang === 'hi');
}

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(LS_LANG, next);
  } catch {
    /* ignore */
  }
  applyDocLang();
  if (lang === 'hi') translateTree(document.documentElement);
  else {
    pending.clear();
    restoreEnglish();
  }
  listeners.forEach((fn) => fn(lang));
}

export function initI18n() {
  if (observer) return;
  applyDocLang();
  observer = new MutationObserver((muts) => {
    if (lang !== 'hi') {
      // Still record originals so switching languages later is instant and accurate.
      for (const m of muts) if (m.type === 'characterData') origText.set(m.target as Text, (m.target as Text).nodeValue || '');
      return;
    }
    for (const m of muts) {
      if (m.type === 'characterData') translateText(m.target as Text);
      else if (m.type === 'attributes' && m.attributeName) translateAttr(m.target as Element, m.attributeName);
      else m.addedNodes.forEach((n) => translateTree(n));
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  if (lang === 'hi') translateTree(document.documentElement);
}
