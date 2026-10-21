import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ProjectorView } from './components/ProjectorView.tsx';
import { RosterManager } from './components/RosterManager.tsx';
import { StudentAttendanceStats } from './components/StudentAttendanceStats.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { SecurityModal } from './components/SecurityModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { AttendanceApiService } from './services/api.ts';
import { SessionPublicInfo } from './types/attendance.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('student');
  const [publicSession, setPublicSession] = useState<SessionPublicInfo | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [selectedJambForCheckIn, setSelectedJambForCheckIn] = useState<string>('');
  const [selectedJambForStats, setSelectedJambForStats] = useState<string>('');
  const [targetTabAfterLogin, setTargetTabAfterLogin] = useState<ActiveTab | null>(null);

  // Check existing session auth, wipe legacy mock students, and first-visit onboarding on initial mount
  useEffect(() => {
    setIsAdminAuthenticated(AttendanceApiService.isAdminAuthenticated());
    try {
      // Seed 79 accredited students into roster cache
      const rosterVersion = localStorage.getItem('unipass_roster_79_v1');
      if (!rosterVersion) {
        localStorage.removeItem('unipass_students');
        localStorage.setItem('unipass_roster_79_v1', 'true');
      }

      const seen = localStorage.getItem('run_cyberpass_onboarding_seen');
      if (!seen) {
        setIsOnboardingOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll public session state for active indicator
  const syncSession = async () => {
    try {
      const res = await AttendanceApiService.getActiveSession();
      if (res.active && res.session) {
        setPublicSession({
          id: res.session.id,
          courseId: res.session.courseId,
          lectureNumber: res.session.lectureNumber,
          courseCode: res.session.courseCode,
          courseTitle: res.session.courseTitle,
          hallLocation: res.session.hallLocation,
          status: res.session.status,
          startTime: res.session.startTime,
          expiresAt: res.session.expiresAt,
          remainingMs: Math.max(0, res.session.expiresAt - Date.now()),
        });
      } else {
        setPublicSession(null);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    syncSession();
    const unsubscribe = AttendanceApiService.subscribeToActiveSession((session) => {
      if (session && session.status === 'active' && Date.now() <= session.expiresAt) {
        setPublicSession({
          id: session.id,
          courseId: session.courseId,
          lectureNumber: session.lectureNumber,
          courseCode: session.courseCode,
          courseTitle: session.courseTitle,
          hallLocation: session.hallLocation,
          status: session.status,
          startTime: session.startTime,
          expiresAt: session.expiresAt,
          remainingMs: Math.max(0, session.expiresAt - Date.now()),
        });
      } else {
        setPublicSession(null);
      }
    });
    const interval = setInterval(syncSession, 3000);
    return () => {
      clearInterval(interval);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleRequireAdminAuth = (target?: ActiveTab) => {
    setTargetTabAfterLogin(target || activeTab);
    setIsLoginModalOpen(true);
  };

  // Tab change handler: only Course Rep Hub requires password authentication
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'admin' && !isAdminAuthenticated) {
      handleRequireAdminAuth('admin');
      return;
    }
    setActiveTab(tab);
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsLoginModalOpen(false);
    if (targetTabAfterLogin) {
      setActiveTab(targetTabAfterLogin);
      setTargetTabAfterLogin(null);
    } else {
      setActiveTab('admin');
    }
  };

  const handleAdminLogout = () => {
    AttendanceApiService.logoutAdmin();
    setIsAdminAuthenticated(false);
    setActiveTab('student');
  };

  const handleSelectStudentForCheckIn = (jamb: string) => {
    setSelectedJambForCheckIn(jamb);
    setActiveTab('student');
  };

  const handleNavigateToStats = (jamb?: string) => {
    if (jamb) setSelectedJambForStats(jamb);
    setActiveTab('my-stats');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 antialiased">
      {/* Hide navbar only in projector mode for clean lecture hall projection */}
      {activeTab !== 'projector' && (
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sessionActive={publicSession !== null && publicSession.status === 'active'}
          activeCourseCode={publicSession?.courseCode}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          onAdminLogout={handleAdminLogout}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />
      )}

      {/* Network Offline Alert */}
      <OfflineIndicator />

      {/* Main Content Router */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* 1. Student Check-In (Public) */}
        {activeTab === 'student' && (
          <StudentPortal
            activeSession={publicSession}
            onGoToProjector={() => setActiveTab('projector')}
            onGoToDirectory={() => setActiveTab('roster')}
            onGoToMyStats={handleNavigateToStats}
            onOpenAdminLogin={() => setIsLoginModalOpen(true)}
            isAdminAuthenticated={isAdminAuthenticated}
            prefilledJamb={selectedJambForCheckIn}
          />
        )}

        {/* 2. Lecture Hall Projector / PIN Screen (Public) */}
        {activeTab === 'projector' && (
          <ProjectorView
            onBackToDashboard={() => setActiveTab(isAdminAuthenticated ? 'admin' : 'student')}
            onOpenCheckInTab={() => setActiveTab('student')}
            isAdminAuthenticated={isAdminAuthenticated}
          />
        )}

        {/* 3. Student Directory (Public read-only lookup with guarded Rep enrollment) */}
        {activeTab === 'roster' && (
          <RosterManager
            onBackToDashboard={() => setActiveTab(isAdminAuthenticated ? 'admin' : 'student')}
            isAdminAuthenticated={isAdminAuthenticated}
            onRequireAdminAuth={() => handleRequireAdminAuth('roster')}
            onSelectStudentForCheckIn={handleSelectStudentForCheckIn}
          />
        )}

        {/* 4. Dedicated My Attendance & Course Analytics Tab (Public) */}
        {activeTab === 'my-stats' && (
          <StudentAttendanceStats
            onGoToCheckIn={() => setActiveTab('student')}
            activeCourseCode={publicSession?.status === 'active' ? publicSession.courseCode : undefined}
            initialJambQuery={selectedJambForStats}
          />
        )}

        {/* 5. Course Rep Command Center (Protected by password) */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onOpenProjector={() => setActiveTab('projector')}
            onOpenRoster={() => setActiveTab('roster')}
            onRefreshSessionState={syncSession}
            onLockAdmin={handleAdminLogout}
          />
        )}
      </main>

      {/* Course Rep Authentication Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Security & Anti-Tamper Shield Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* First-Visit Onboarding & Student Guide Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
