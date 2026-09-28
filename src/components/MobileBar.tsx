import { MessageCircle, Phone, Send } from 'lucide-react';
import { useEnquiry } from '../contexts/EnquiryContext';
import { useSettings } from '../contexts/SettingsContext';
import { telHref, waHref } from '../lib/format';

export default function MobileBar() {
  const { open } = useEnquiry();
  const { s } = useSettings();
  const wa = waHref(s.whatsapp, 'Hello Iston Builder Group, I would like to know more about your projects.');
  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-3">
          <a href={telHref(s.phone)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-navy">
            <Phone className="h-5 w-5" strokeWidth={1.7} /> Call
          </a>
          <a href={wa} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 border-x border-line py-2.5 text-[11px] font-semibold text-emerald-700">
            <MessageCircle className="h-5 w-5" strokeWidth={1.7} /> WhatsApp
          </a>
          <button onClick={() => open()} className="flex flex-col items-center gap-1 bg-navy py-2.5 text-[11px] font-semibold text-white">
            <Send className="h-5 w-5" strokeWidth={1.7} /> Enquire
          </button>
        </div>
      </div>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-6 bottom-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/25 transition hover:scale-105 md:grid"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
}
