import React, { useState } from 'react';
import {
  ShieldCheck,
  Monitor,
  Users,
  CheckCircle2,
  Lock,
  KeyRound,
  GraduationCap,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNav = (tab: ActiveTab) => {
    setIsMobileMenuOpen(false);
    onTabChange(tab);
  };

  const handleOpenModal = (openFn: () => void) => {
    setIsMobileMenuOpen(false);
    openFn();
  };

  return (
    <header className="sticky top-0 z-50 glass-nav text-[#F9FAFB] w-full transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 w-full">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleMobileNav('student')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-lg p-1 -m-1 transition-transform duration-200 active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/20 transition-all duration-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                RUN CyberPass
              </span>
              <span className="hidden sm:inline text-xs text-slate-500 font-normal">
                Cybersecurity
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links (Clean single-line controls, no pill clutter) */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          <button
            onClick={() => onTabChange('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'student'
                ? 'bg-slate-800/90 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === 'student' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Check-In</span>
          </button>

          <button
            onClick={() => onTabChange('projector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'projector'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Hall Screen (PIN)</span>
          </button>

          <button
            onClick={() => onTabChange('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-slate-800/90 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'roster' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Student Directory</span>
          </button>

          <button
            onClick={() => onTabChange('my-stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'my-stats'
                ? 'bg-slate-800/90 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'my-stats' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>My Attendance</span>
          </button>

          {isAdminAuthenticated && (
            <button
              onClick={() => onTabChange('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rep Dashboard</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Desktop Actions & Utilities */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold whitespace-nowrap">
                {activeCourseCode || 'CYB'} Live
              </span>
            </div>
          )}

          <PWAInstallButton variant="nav" />

          <button
            onClick={onOpenSecurityModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-colors cursor-pointer"
            title="Security Architecture"
            aria-label="View security details"
          >
            <ShieldCheck className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={onOpenOnboarding}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-colors cursor-pointer"
            title="User Guide"
            aria-label="View user guide"
          >
            <BookOpen className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
          </button>

          {isAdminAuthenticated ? (
            <button
              onClick={onAdminLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/70 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Lock Course Rep session"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock Rep</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-[#111827] hover:bg-slate-800 rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
              title="Course Rep Portal Login"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rep Login</span>
            </button>
          )}
        </div>

        {/* Mobile Header Right: Live Session Indicator & Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{activeCourseCode || 'Live'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#111827] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Drawer (Glassmorphic obsidian overlay) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0B0F17]/98 backdrop-blur-2xl px-4 py-4 space-y-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150 shadow-2xl">
          {sessionActive && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    {activeCourseCode || 'CYB'} Attendance Active
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Sign in with your JAMB number & live PIN
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleMobileNav('student')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Check In
              </button>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2">
              Navigation
            </span>

            <button
              type="button"
              onClick={() => handleMobileNav('student')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'student' ? 'bg-[#161F30] text-white font-semibold border border-white/10' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Student Check-In</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('projector')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'projector' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span>Hall Screen (Live PIN Projector)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('roster')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'roster' ? 'bg-[#161F30] text-white font-semibold border border-white/10' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Student Directory & JAMB Lookup</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('my-stats')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'my-stats' ? 'bg-[#161F30] text-white font-semibold border border-white/10' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>My Attendance Records</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => handleMobileNav('admin')}
                className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                  activeTab === 'admin' ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-emerald-400 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Course Rep Command Hub</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2">
              System
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenModal(onOpenSecurityModal)}
                className="p-2.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-white/10 text-xs text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Security Shield</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModal(onOpenOnboarding)}
                className="p-2.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-white/10 text-xs text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">User Guide</span>
              </button>
            </div>

            <div className="pt-2">
              {isAdminAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onAdminLogout();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-red-950/30 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Lock Course Rep Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenModal(onOpenAdminLogin)}
                  className="w-full py-2.5 bg-[#111827] hover:bg-slate-800 border border-white/10 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Course Rep Portal Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Strip (Thumb-accessible navigation bar, sleek obsidian design) */}
      <nav className="lg:hidden grid grid-cols-5 border-t border-white/[0.08] bg-[#0B0F17]/95 backdrop-blur-md text-slate-400 w-full select-none">
        <button
          type="button"
          onClick={() => handleMobileNav('student')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'student' ? 'text-emerald-400 font-semibold bg-white/[0.04]' : 'hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">Check-In</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('projector')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'projector' ? 'text-emerald-400 font-semibold bg-white/[0.04]' : 'hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">PIN</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('roster')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'roster' ? 'text-emerald-400 font-semibold bg-white/[0.04]' : 'hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">Directory</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('my-stats')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'my-stats' ? 'text-emerald-400 font-semibold bg-white/[0.04]' : 'hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">Stats</span>
        </button>

        {isAdminAuthenticated ? (
          <button
            type="button"
            onClick={() => handleMobileNav('admin')}
            className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
              activeTab === 'admin' ? 'text-emerald-400 font-semibold bg-white/[0.04]' : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full px-0.5">Rep Hub</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
              isMobileMenuOpen ? 'text-emerald-400 font-semibold bg-white/[0.04]' : 'hover:text-white'
            }`}
          >
            <Menu className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full px-0.5">More</span>
          </button>
        )}
      </nav>
    </header>
  );
};
