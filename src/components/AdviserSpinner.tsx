import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  User,
  PhoneCall,
  Sparkles,
  X,
  ChevronUp,
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
        navigate('/advisers/dashboard');
      }
    } else if (type === 'profile') {
      if (location.pathname === '/advisers/dashboard' && onSelectTab) {
        onSelectTab('profile');
      } else {
        navigate('/advisers/dashboard?tab=profile');
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
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white text-navy font-bold text-xs shadow-lg border border-line hover:border-orange-500 hover:text-orange-600 transition"
          >
            <span className="text-[11px] font-semibold text-muted group-hover:text-orange-600">Website Home</span>
            <span className="w-8 h-8 rounded-full bg-mist group-hover:bg-orange-50 grid place-items-center text-navy group-hover:text-orange-600 transition">
              <Home className="w-4 h-4" />
            </span>
          </button>

          {/* 2. Dashboard */}
          <button
            type="button"
            onClick={() => handleAction('dashboard')}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full font-bold text-xs shadow-lg border transition ${
              activeTab === 'overview'
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-navy border-line hover:border-orange-500 hover:text-orange-600'
            }`}
          >
            <span className="text-[11px]">Dashboard</span>
            <span className={`w-8 h-8 rounded-full grid place-items-center transition ${
              activeTab === 'overview' ? 'bg-orange-600 text-white' : 'bg-mist group-hover:bg-orange-50 text-navy group-hover:text-orange-600'
            }`}>
              <LayoutDashboard className="w-4 h-4" />
            </span>
          </button>

          {/* 3. Profile & KYC */}
          <button
            type="button"
            onClick={() => handleAction('profile')}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full font-bold text-xs shadow-lg border transition ${
              activeTab === 'profile'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-navy border-line hover:border-orange-500 hover:text-orange-600'
            }`}
          >
            <span className="text-[11px]">Profile &amp; KYC</span>
            <span className={`w-8 h-8 rounded-full grid place-items-center transition ${
              activeTab === 'profile' ? 'bg-white text-orange-600' : 'bg-mist group-hover:bg-orange-50 text-navy group-hover:text-orange-600'
            }`}>
              <User className="w-4 h-4" />
            </span>
          </button>

          {/* 4. Contact */}
          <button
            type="button"
            onClick={() => handleAction('contact')}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white text-navy font-bold text-xs shadow-lg border border-line hover:border-orange-500 hover:text-orange-600 transition"
          >
            <span className="text-[11px] font-semibold text-muted group-hover:text-orange-600">Contact Support</span>
            <span className="w-8 h-8 rounded-full bg-mist group-hover:bg-orange-50 grid place-items-center text-navy group-hover:text-orange-600 transition">
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
            ? 'bg-navy text-white ring-orange-500/30 rotate-90 scale-95'
            : 'bg-orange-600 hover:bg-orange-700 text-white ring-orange-600/20 hover:scale-105'
        }`}
        title="Adviser Quick Menu (Home, Dashboard, Profile, Contact)"
        aria-label="Adviser Quick Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-spin [animation-duration:6s]" />
          </div>
        )}
      </button>
    </div>
  );
}
