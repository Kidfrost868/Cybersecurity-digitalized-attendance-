import React, { useState } from 'react';
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
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Cloud,
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
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white w-full max-w-full">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 w-full">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <button
            onClick={() => handleMobileNav('student')}
            className="text-left group cursor-pointer focus:outline-none min-w-0"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white block group-hover:text-emerald-400 transition-colors truncate">
                RUN CyberPass
              </span>
              <span className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shrink-0">
                CYBERSECURITY
              </span>
            </div>
            <span className="text-[10px] text-slate-400 -mt-0.5 block tracking-wide truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              Redeemer's University · Computing
            </span>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 text-sm font-medium">
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

          <button
            onClick={onOpenOnboarding}
            className="px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs"
            title="Read Guide: How RUN CyberPass works"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Guide</span>
          </button>
        </nav>

        {/* Zone 3: Desktop Action & Auth Controls */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono tabular-nums">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold whitespace-nowrap">
                {activeCourseCode || 'CYB 201'} Live
              </span>
            </div>
          )}

          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs font-mono"
            title="Connected to Centralized Google Cloud Firestore database. Syncs across all devices in real-time."
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium text-[11px]">Cloud Synced</span>
          </div>

          <PWAInstallButton variant="nav" />

          <button
            onClick={onOpenSecurityModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Inspect 6-Layer Security & Anti-Tamper Shield"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline text-emerald-400 font-semibold">Security</span>
          </button>

          {isAdminAuthenticated ? (
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

        {/* Mobile Header Right Controls: Live status + Hamburger menu toggle */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold truncate max-w-[70px]">
                {activeCourseCode || 'Live'}
              </span>
            </div>
          )}

          {isAdminAuthenticated && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              REP
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
            aria-label="Toggle mobile navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-4 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150 shadow-2xl">
          {sessionActive && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-xs font-semibold text-emerald-300 block">
                    {activeCourseCode || 'CYB 201'} Attendance Live
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Enter the rolling 4-digit PIN to mark presence
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleMobileNav('student')}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Check In
              </button>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2">
              Navigation
            </span>

            <button
              type="button"
              onClick={() => handleMobileNav('student')}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'student' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Student Check-In</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('projector')}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
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
              onClick={() => handleMobileNav('my-stats')}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'my-stats' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>My Attendance & Senate Eligibility</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('roster')}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'roster' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Student Directory & JAMB Lookup</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isAdminAuthenticated ? (
              <button
                type="button"
                onClick={() => handleMobileNav('admin')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                  activeTab === 'admin' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-emerald-400 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4" />
                  <span>Course Rep Command Hub</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ) : null}
          </div>

          {/* Tools & Utilities */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2">
              System & Tools
            </span>

            {/* Install PWA Button in Mobile Menu */}
            <div className="px-1">
              <PWAInstallButton variant="banner" className="w-full justify-center" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenModal(onOpenSecurityModal)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Security Shield</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModal(onOpenOnboarding)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Student Guide</span>
              </button>
            </div>

            {/* Course Rep Session Control */}
            <div className="pt-2">
              {isAdminAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onAdminLogout();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Lock Course Rep Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenModal(onOpenAdminLogin)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Course Rep Portal Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Primary Tab Strip (Strictly bounded, touch targets, zero side-scrolling) */}
      <nav className="md:hidden grid grid-cols-5 border-t border-slate-800/80 bg-slate-950 text-slate-400 w-full max-w-full overflow-hidden select-none">
        <button
          type="button"
          onClick={() => handleMobileNav('student')}
          className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 ${
            activeTab === 'student' ? 'text-emerald-400 font-semibold bg-slate-900/50' : 'hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-1">Check-In</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('projector')}
          className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 ${
            activeTab === 'projector' ? 'text-emerald-400 font-semibold bg-slate-900/50' : 'hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-1">Hall PIN</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('my-stats')}
          className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 ${
            activeTab === 'my-stats' ? 'text-emerald-400 font-semibold bg-slate-900/50' : 'hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-1">My Stats</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('roster')}
          className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 ${
            activeTab === 'roster' ? 'text-emerald-400 font-semibold bg-slate-900/50' : 'hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-1">Directory</span>
        </button>

        {isAdminAuthenticated ? (
          <button
            type="button"
            onClick={() => handleMobileNav('admin')}
            className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 ${
              activeTab === 'admin' ? 'text-emerald-400 font-semibold bg-slate-900/50' : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Radio className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full px-1">Rep Hub</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 ${
              isMobileMenuOpen ? 'text-emerald-400 font-semibold bg-slate-900/50' : 'hover:text-white'
            }`}
          >
            <Menu className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full px-1">More</span>
          </button>
        )}
      </nav>
    </header>
  );
};
