import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { getLang, onLangChange, setLang } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

export function useLang() {
  const [lang, set] = useState<Lang>(getLang());
  useEffect(() => {
    const off = onLangChange(set);
    return () => {
      off();
    };
  }, []);
  return lang;
}

/** Compact header pill: shows "हिंदी" in English mode and "English" in Hindi mode. */
export default function LanguageToggle({ solid = true, full = false }: { solid?: boolean; full?: boolean }) {
  const lang = useLang();
  const toHindi = lang === 'en';
  const label = toHindi ? 'Translate to Hindi — हिंदी में देखें' : 'Switch to English — अंग्रेज़ी में देखें';

  if (full) {
    return (
      <button data-no-translate onClick={() => setLang(toHindi ? 'hi' : 'en')} className="btn btn-outline w-full" aria-label={label}>
        <Languages className="h-4 w-4" />
        {toHindi ? (
          <span>
            Translate to Hindi · <span className="font-hindi">हिंदी में देखें</span>
          </span>
        ) : (
          <span>
            <span className="font-hindi">अंग्रेज़ी में देखें</span> · View in English
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      data-no-translate
      onClick={() => setLang(toHindi ? 'hi' : 'en')}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition ${
        solid ? 'border-line text-navy hover:border-navy' : 'border-white/30 text-white hover:bg-white/10'
      }`}
    >
      <Languages className="h-4 w-4" />
      {toHindi ? <span className="font-hindi text-[14px]">हिंदी</span> : <span>English</span>}
    </button>
  );
}
