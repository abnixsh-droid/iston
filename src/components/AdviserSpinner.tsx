import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  User,
  PhoneCall,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';

export default function AdviserSpinner() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (type: 'home' | 'dashboard' | 'profile' | 'plan' | 'contact') => {
    setIsOpen(false);
    if (type === 'home') {
      window.open('/', '_blank');
    } else if (type === 'dashboard') {
      window.open('/advisers/dashboard', '_blank');
    } else if (type === 'profile') {
      window.open('/advisers/dashboard?view=profile', '_blank');
    } else if (type === 'plan') {
      window.open('/advisers/plan', '_blank');
    } else if (type === 'contact') {
      navigate('/contact');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none font-sans">
      {/* Expanded Radial / Vertical Action Menu */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* 1. Website Home */}
          <button
            type="button"
            onClick={() => handleAction('home')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-[#ded8cc] text-[#121212] hover:border-[#96742e] shadow-lg transition"
          >
            <span className="text-[11px] font-semibold text-[#555] group-hover:text-[#121212]">Website Home ↗</span>
            <span className="w-8 h-8 rounded-full bg-[#f5f2ea] group-hover:bg-[#ede7d8] grid place-items-center text-[#96742e] transition border border-[#ded5c0]">
              <Home className="w-4 h-4" />
            </span>
          </button>

          {/* 2. Adviser Dashboard */}
          <button
            type="button"
            onClick={() => handleAction('dashboard')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-[#ded8cc] text-[#121212] hover:border-[#96742e] shadow-lg transition"
          >
            <span className="text-[11px] font-semibold text-[#555] group-hover:text-[#121212]">Dashboard ↗</span>
            <span className="w-8 h-8 rounded-full bg-[#f5f2ea] group-hover:bg-[#ede7d8] grid place-items-center text-[#96742e] transition border border-[#ded5c0]">
              <LayoutDashboard className="w-4 h-4" />
            </span>
          </button>

          {/* 3. View Adviser Plan */}
          <button
            type="button"
            onClick={() => handleAction('plan')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#f5f0e4] backdrop-blur-xl border border-[#ded5c0] text-[#96742e] hover:border-[#96742e] shadow-lg transition"
          >
            <span className="text-[11px] font-bold text-[#96742e]">Adviser Plan Deck ↗</span>
            <span className="w-8 h-8 rounded-full bg-white grid place-items-center text-[#96742e] transition border border-[#ded5c0]">
              <BookOpen className="w-4 h-4" />
            </span>
          </button>

          {/* 4. Profile & KYC */}
          <button
            type="button"
            onClick={() => handleAction('profile')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-[#ded8cc] text-[#121212] hover:border-[#96742e] shadow-lg transition"
          >
            <span className="text-[11px] font-semibold text-[#555] group-hover:text-[#121212]">Profile &amp; KYC ↗</span>
            <span className="w-8 h-8 rounded-full bg-[#f5f2ea] group-hover:bg-[#ede7d8] grid place-items-center text-[#96742e] transition border border-[#ded5c0]">
              <User className="w-4 h-4" />
            </span>
          </button>

          {/* 5. Contact Support */}
          <button
            type="button"
            onClick={() => handleAction('contact')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-[#ded8cc] text-[#121212] hover:border-[#96742e] shadow-lg transition"
          >
            <span className="text-[11px] font-semibold text-[#555] group-hover:text-[#121212]">Contact Support</span>
            <span className="w-8 h-8 rounded-full bg-[#f5f2ea] group-hover:bg-[#ede7d8] grid place-items-center text-[#96742e] transition border border-[#ded5c0]">
              <PhoneCall className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

      {/* Main Trigger Spinner Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ring-4 ${
          isOpen
            ? 'bg-[#121212] text-[#faf8f5] ring-[#c5a059]/40 rotate-90 scale-95 border border-[#333]'
            : 'bg-[#121212] hover:bg-black text-[#c5a059] ring-[#c5a059]/30 hover:scale-105 shadow-xl border border-[#2a2a2a]'
        }`}
        title="Adviser Quick Menu (Home, Dashboard, Plan, Profile, Contact)"
        aria-label="Adviser Quick Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-spin [animation-duration:8s]" />
          </div>
        )}
      </button>
    </div>
  );
}
