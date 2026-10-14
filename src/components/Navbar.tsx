import React from 'react';
import {
  ShieldCheck,
  Monitor,
  Users,
  CheckCircle,
  Radio,
  Lock,
  KeyRound,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

export type ActiveTab = 'student' | 'admin' | 'projector' | 'roster' | 'my-stats';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  sessionActive: boolean;
  activeCourseCode?: string;
  isAdminAuthenticated: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onOpenSecurityModal: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  sessionActive,
  activeCourseCode,
  isAdminAuthenticated,
  onOpenAdminLogin,
  onAdminLogout,
  onOpenSecurityModal,
  onOpenOnboarding,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <button
            onClick={() => onTabChange('student')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white block group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                RUN CyberPass
              </span>
              <span className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                CYBERSECURITY
              </span>
            </div>
            <span className="text-[10px] text-slate-400 -mt-0.5 block tracking-wide truncate max-w-[170px] sm:max-w-none">
              Redeemer's University · Computing & Digital Technology
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Public Tabs + Authenticated Rep Hub) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 text-sm font-medium">
          {/* 1. Student Check-In (Public) */}
          <button
            onClick={() => onTabChange('student')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Check-In</span>
          </button>

          {/* 2. Hall Screen / Live Passcode Display (Public) */}
          <button
            onClick={() => onTabChange('projector')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'projector'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Hall Screen (Live PIN)</span>
          </button>

          {/* 3. Student Directory (Public read-only lookup) */}
          <button
            onClick={() => onTabChange('roster')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Directory</span>
          </button>

          {/* 4. My Attendance (Public student course history & stats) */}
          <button
            onClick={() => onTabChange('my-stats')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'my-stats'
                ? 'bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>My Attendance</span>
          </button>

          {/* 5. Course Rep Hub (Protected - visible when Rep is logged in) */}
          {isAdminAuthenticated && (
            <button
              onClick={() => onTabChange('admin')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Course Rep Hub</span>
            </button>
          )}

          {/* 6. Onboarding Guide Modal Trigger */}
          <button
            onClick={onOpenOnboarding}
            className="px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs"
            title="Read Guide: How RUN CyberPass works"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Guide</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono tabular-nums">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold whitespace-nowrap">
                {activeCourseCode || 'CYB 201'} Live
              </span>
            </div>
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton variant="nav" />

          {/* Security Shield Modal Trigger */}
          <button
            onClick={onOpenSecurityModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Inspect 6-Layer Security & Anti-Tamper Shield"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline text-emerald-400 font-semibold">Security</span>
          </button>

          {isAdminAuthenticated ? (
            /* Logged in Rep controls */
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Rep Active
              </span>
              <button
                onClick={onAdminLogout}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Lock admin session and return to public view"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lock Admin</span>
              </button>
            </div>
          ) : (
            /* Course Rep Login button */
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Course Rep Portal Login (Password: rep2026)"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Rep Login</span>
              <span className="sm:hidden">Rep</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 text-xs">
        <button
          onClick={() => onTabChange('student')}
          className={`px-2 py-1.5 rounded-md flex items-center gap-1 ${
            activeTab === 'student' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Check-In</span>
        </button>
        <button
          onClick={() => onTabChange('projector')}
          className={`px-2 py-1.5 rounded-md flex items-center gap-1 ${
            activeTab === 'projector' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Hall PIN</span>
        </button>
        <button
          onClick={() => onTabChange('my-stats')}
          className={`px-2 py-1.5 rounded-md flex items-center gap-1 ${
            activeTab === 'my-stats' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span>My Stats</span>
        </button>
        <button
          onClick={() => onTabChange('roster')}
          className={`px-2 py-1.5 rounded-md flex items-center gap-1 ${
            activeTab === 'roster' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Directory</span>
        </button>

        <button
          onClick={onOpenOnboarding}
          className="px-2 py-1.5 text-slate-400 hover:text-white flex items-center gap-1"
          title="RUN CyberPass Onboarding Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Guide</span>
        </button>

        {isAdminAuthenticated ? (
          <button
            onClick={() => onTabChange('admin')}
            className={`px-2 py-1.5 rounded-md flex items-center gap-1 ${
              activeTab === 'admin' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-emerald-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Rep Hub</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="px-2 py-1.5 text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rep</span>
          </button>
        )}
      </div>
    </header>
  );
};
