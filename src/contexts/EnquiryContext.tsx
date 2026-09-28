import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import EnquiryForm from '../components/EnquiryForm';

export type EnquiryOpts = { interest?: string; item_type?: string; item_id?: number; item_title?: string; heading?: string };
const Ctx = createContext<{ open: (o?: EnquiryOpts) => void }>({ open: () => {} });

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<EnquiryOpts | null>(null);

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpts(null);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [opts]);

  return (
    <Ctx.Provider value={{ open: (o) => setOpts(o || {}) }}>
      {children}
      <AnimatePresence>
        {opts && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-navy-deep/60 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpts(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Enquiry form"
              className="relative max-h-[92svh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 sm:max-w-lg sm:rounded-[2rem] sm:p-8"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setOpts(null)} className="absolute top-5 right-5 rounded-full p-2 text-muted hover:bg-mist" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <p className="eyebrow mb-3">Enquire</p>
              <h3 className="font-display pr-10 text-3xl leading-tight text-navy">{opts.heading || opts.item_title || 'Speak with Iston Builder Group'}</h3>
              <p className="mt-2 mb-6 text-sm text-muted">Share your details and our team will get in touch with you.</p>
              <EnquiryForm preset={opts} compact />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export const useEnquiry = () => useContext(Ctx);
