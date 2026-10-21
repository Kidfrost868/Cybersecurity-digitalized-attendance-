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
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 text-slate-900 w-full backdrop-blur-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 w-full">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleMobileNav('student')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1 -m-1 transition-transform duration-200 active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                RUN CyberPass
              </span>
              <span className="hidden sm:inline text-xs text-slate-500 font-normal">
                Cybersecurity
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links (Clean white/blue theme) */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          <button
            onClick={() => onTabChange('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'student'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === 'student' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Check-In</span>
          </button>

          <button
            onClick={() => onTabChange('projector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'projector'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Hall Screen (PIN)</span>
          </button>

          <button
            onClick={() => onTabChange('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'roster' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Student Directory</span>
          </button>

          <button
            onClick={() => onTabChange('my-stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'my-stats'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'my-stats' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>My Attendance</span>
          </button>

          {isAdminAuthenticated && (
            <button
              onClick={() => onTabChange('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rep Dashboard</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Desktop Actions & Utilities */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-semibold whitespace-nowrap">
                {activeCourseCode || 'CYB'} Live
              </span>
            </div>
          )}

          <PWAInstallButton variant="nav" />

          <button
            onClick={onOpenSecurityModal}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition-colors cursor-pointer"
            title="Security Architecture"
            aria-label="View security details"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500 hover:text-blue-600 transition-colors" />
          </button>

          <button
            onClick={onOpenOnboarding}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition-colors cursor-pointer"
            title="User Guide"
            aria-label="View user guide"
          >
            <BookOpen className="w-4 h-4 text-slate-500 hover:text-blue-600 transition-colors" />
          </button>

          {isAdminAuthenticated ? (
            <button
              onClick={onAdminLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Lock Course Rep session"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Lock Rep</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              title="Course Rep Portal Login"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-200" />
              <span>Rep Login</span>
            </button>
          )}
        </div>

        {/* Mobile Header Right: Live Session Indicator & Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          {sessionActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-semibold">{activeCourseCode || 'Live'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-blue-600" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Drawer (White background with blue accents) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150 shadow-lg">
          {sessionActive && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    {activeCourseCode || 'CYB'} Attendance Active
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Sign in with your JAMB/Matric number & live PIN
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleMobileNav('student')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Check In
              </button>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2">
              Navigation
            </span>

            <button
              type="button"
              onClick={() => handleMobileNav('student')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'student' ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Student Check-In</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('projector')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'projector' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-blue-500" />
                <span>Hall Screen (Live PIN Projector)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('roster')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'roster' ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Student Directory & Lookup</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('my-stats')}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                activeTab === 'my-stats' ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>My Attendance Records</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => handleMobileNav('admin')}
                className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                  activeTab === 'admin' ? 'bg-blue-600 text-white font-semibold' : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Course Rep Command Hub</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2">
              System
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenModal(onOpenSecurityModal)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">Security Shield</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModal(onOpenOnboarding)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
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
                  className="w-full py-2.5 bg-slate-100 hover:bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-600" />
                  <span>Lock Course Rep Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenModal(onOpenAdminLogin)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-200" />
                  <span>Course Rep Portal Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Strip (Thumb-accessible, clean white with blue highlights) */}
      <nav className="lg:hidden grid grid-cols-5 border-t border-slate-200 bg-white text-slate-500 w-full select-none">
        <button
          type="button"
          onClick={() => handleMobileNav('student')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'student' ? 'text-blue-600 font-semibold bg-blue-50/60' : 'hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">Check-In</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('projector')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'projector' ? 'text-blue-600 font-semibold bg-blue-50/60' : 'hover:text-slate-900'
          }`}
        >
          <Monitor className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">PIN</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('roster')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'roster' ? 'text-blue-600 font-semibold bg-blue-50/60' : 'hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-[10px] truncate max-w-full px-0.5">Directory</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('my-stats')}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 cursor-pointer ${
            activeTab === 'my-stats' ? 'text-blue-600 font-semibold bg-blue-50/60' : 'hover:text-slate-900'
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
              activeTab === 'admin' ? 'text-blue-600 font-semibold bg-blue-50/60' : 'text-blue-600/80 hover:text-blue-700'
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
              isMobileMenuOpen ? 'text-blue-600 font-semibold bg-blue-50/60' : 'hover:text-slate-900'
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
