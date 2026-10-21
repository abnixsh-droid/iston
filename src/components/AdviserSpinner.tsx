import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  User,
  PhoneCall,
  Sparkles,
  X,
} from 'lucide-react';

interface AdviserSpinnerProps {
  activeTab?: string;
  onSelectTab?: (tab: 'overview' | 'profile' | 'leads' | 'team' | 'payouts') => void;
}

export default function AdviserSpinner({ activeTab, onSelectTab }: AdviserSpinnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAction = (type: 'home' | 'dashboard' | 'profile' | 'contact') => {
    setIsOpen(false);
    if (type === 'home') {
      navigate('/');
    } else if (type === 'dashboard') {
      if (location.pathname === '/advisers/dashboard' && onSelectTab) {
        onSelectTab('overview');
      } else {
        window.open('/advisers/dashboard', '_blank');
      }
    } else if (type === 'profile') {
      if (location.pathname === '/advisers/dashboard' && onSelectTab) {
        onSelectTab('profile');
      } else {
        window.open('/advisers/dashboard?tab=profile', '_blank');
      }
    } else if (type === 'contact') {
      navigate('/contact');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Radial / Vertical Action Menu */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => handleAction('home')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#062f35]/95 backdrop-blur-xl border border-teal-500/30 text-teal-100 hover:border-teal-300 hover:text-white shadow-xl transition"
          >
            <span className="text-[11px] font-semibold text-teal-200/80 group-hover:text-white">Website Home</span>
            <span className="w-8 h-8 rounded-full bg-[#021f24] group-hover:bg-teal-500/20 grid place-items-center text-teal-300 transition border border-teal-500/20">
              <Home className="w-4 h-4" />
            </span>
          </button>

          {/* 2. Dashboard */}
          <button
            type="button"
            onClick={() => handleAction('dashboard')}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full font-bold text-xs shadow-xl border transition ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-teal-300 to-teal-400 text-[#022c33] border-transparent font-black shadow-teal-500/20'
                : 'bg-[#062f35]/95 backdrop-blur-xl border-teal-500/30 text-teal-100 hover:border-teal-300 hover:text-white'
            }`}
          >
            <span className="text-[11px]">Dashboard</span>
            <span
              className={`w-8 h-8 rounded-full grid place-items-center transition ${
                activeTab === 'overview'
                  ? 'bg-[#022c33] text-teal-300'
                  : 'bg-[#021f24] group-hover:bg-teal-500/20 text-teal-300 border border-teal-500/20'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </span>
          </button>

          {/* 3. Profile & KYC */}
          <button
            type="button"
            onClick={() => handleAction('profile')}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full font-bold text-xs shadow-xl border transition ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-teal-300 to-teal-400 text-[#022c33] border-transparent font-black shadow-teal-500/20'
                : 'bg-[#062f35]/95 backdrop-blur-xl border-teal-500/30 text-teal-100 hover:border-teal-300 hover:text-white'
            }`}
          >
            <span className="text-[11px]">Profile &amp; KYC</span>
            <span
              className={`w-8 h-8 rounded-full grid place-items-center transition ${
                activeTab === 'profile'
                  ? 'bg-[#022c33] text-teal-300'
                  : 'bg-[#021f24] group-hover:bg-teal-500/20 text-teal-300 border border-teal-500/20'
              }`}
            >
              <User className="w-4 h-4" />
            </span>
          </button>

          {/* 4. Contact */}
          <button
            type="button"
            onClick={() => handleAction('contact')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#062f35]/95 backdrop-blur-xl border border-teal-500/30 text-teal-100 hover:border-teal-300 hover:text-white shadow-xl transition"
          >
            <span className="text-[11px] font-semibold text-teal-200/80 group-hover:text-white">Contact Support</span>
            <span className="w-8 h-8 rounded-full bg-[#021f24] group-hover:bg-teal-500/20 grid place-items-center text-teal-300 transition border border-teal-500/20">
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
            ? 'bg-[#021f24] text-teal-300 ring-teal-400/40 rotate-90 scale-95 border border-teal-500/40'
            : 'bg-gradient-to-r from-teal-300 to-teal-400 hover:from-teal-200 hover:to-teal-300 text-[#022c33] ring-teal-300/30 hover:scale-105 shadow-teal-500/30'
        }`}
        title="Adviser Quick Menu (Home, Dashboard, Profile, Contact)"
        aria-label="Adviser Quick Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-spin [animation-duration:8s]" />
          </div>
        )}
      </button>
    </div>
  );
}
