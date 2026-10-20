import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Monitor,
  Download,
  Users,
  Search,
  CheckCircle,
  Clock,
  Unlock,
  Building,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import {
  AttendanceSession,
  AttendanceRecord,
  FlaggedProxyAttempt,
  Student,
  Course,
} from '../types/attendance.ts';
import { CourseLedgerView } from './CourseLedgerView.tsx';

interface AdminDashboardProps {
  onOpenProjector: () => void;
  onOpenRoster: () => void;
  onRefreshSessionState?: () => void;
  onLockAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenProjector,
  onOpenRoster,
  onRefreshSessionState,
  onLockAdmin,
}) => {
  // Session Configuration Form State
  const [selectedCourseId, setSelectedCourseId] = useState('course-cyb201');
  const [courseCode, setCourseCode] = useState('CYB 201');
  const [courseTitle, setCourseTitle] = useState('Introduction to Cybersecurity & Information Assurance');
  const [hallLocation, setHallLocation] = useState('Faculty of Computing & Digital Tech Lab 1');
  const [lecturerName, setLecturerName] = useState('Dr. E. O. Babalola');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [passcodeIntervalSeconds, setPasscodeIntervalSeconds] = useState(60);

  // Active Session & Live Data
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [flaggedAttempts, setFlaggedAttempts] = useState<FlaggedProxyAttempt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'ledger' | 'security' | 'config'>('attendance');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // In-App Confirmation Modal for Ending Session
  const [showStopConfirmModal, setShowStopConfirmModal] = useState<boolean>(false);

  // Unlock Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideDeviceId, setOverrideDeviceId] = useState('');
  const [overrideReason, setOverrideReason] = useState('Student verified physically present in class');

  // Load and poll data
  const refreshData = async () => {
    try {
      const proj = await AttendanceApiService.getProjectorData();
      if (proj.session) {
        setActiveSession(proj.session);
      } else {
        setActiveSession(null);
      }
      setRecords(proj.records);
      const allStudents = await AttendanceApiService.getStudents();
      setStudents(allStudents);

      const courseRes = await AttendanceApiService.getCourses();
      if (courseRes.courses) setCourses(courseRes.courses);

      const recordsRes = await fetch('/api/records');
      if (recordsRes.ok) {
        const json = await recordsRes.json();
        if (json.flagged) setFlaggedAttempts(json.flagged);
      }
    } catch {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  // When course dropdown changes in config form
  const handleCourseSelectionChange = (cId: string) => {
    setSelectedCourseId(cId);
    if (cId === 'NEW') {
      setCourseCode('');
      setCourseTitle('');
      setLecturerName('');
      setHallLocation("Redeemer's Cyber Range Lab");
      return;
    }

    const found = courses.find(c => c.id === cId);
    if (found) {
      setCourseCode(found.code);
      setCourseTitle(found.title);
      setLecturerName(found.lecturerName);
      setHallLocation(found.hallLocation);
    }
  };

  // Launch lecture for a course from the ledger view
  const handleStartLectureForCourse = (course: Course) => {
    setSelectedCourseId(course.id);
    setCourseCode(course.code);
    setCourseTitle(course.title);
    setLecturerName(course.lecturerName);
    setHallLocation(course.hallLocation);
    setActiveTab('config');
  };

  // Start Session Handler
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActionSuccess(null);

    try {
      const session = await AttendanceApiService.startSession({
        courseId: selectedCourseId !== 'NEW' ? selectedCourseId : undefined,
        courseCode,
        courseTitle,
        hallLocation,
        lecturerName,
        durationMinutes,
        passcodeIntervalSeconds,
      });

      setActiveSession(session);
      setActionSuccess(`Lecture #${session.lectureNumber || 1} for ${courseCode} launched successfully.`);
      setActiveTab('attendance');
      if (onRefreshSessionState) onRefreshSessionState();
      refreshData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch {
      alert('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Session Handler
  const executeStopSession = async () => {
    if (!activeSession) return;
    setIsLoading(true);
    try {
      await AttendanceApiService.stopSession();
      setActiveSession(null);
      setShowStopConfirmModal(false);
      setActionSuccess('Attendance session concluded and permanently archived to course ledger.');
      if (onRefreshSessionState) onRefreshSessionState();
      refreshData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch {
      alert('Failed to stop session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Grant One-Time Exemption for Single-Device Lock
  const handleGrantOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDeviceId.trim()) return;

    try {
      await AttendanceApiService.grantDeviceOverride(
        overrideDeviceId.trim(),
        overrideReason
      );
      setActionSuccess(`Exemption granted for device signature ${overrideDeviceId.substring(0, 8)}...`);
      setOverrideModalOpen(false);
      setOverrideDeviceId('');
      refreshData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // Error
    }
  };

  // Export CSV Direct Download
  const handleDownloadCsv = () => {
    if (typeof window === 'undefined') return;
    const session = activeSession;
    const sessionInfo = session
      ? `Institutional Attendance Report\nCourse Code: ${session.courseCode}\nCourse Title: ${session.courseTitle}\nLecture Number: ${session.lectureNumber || 1}\nVenue: ${session.hallLocation}\nLecturer: ${session.lecturerName}\nSession Date: ${new Date(session.startTime).toLocaleDateString()}\nTotal Verified: ${records.length} of ${students.length} (${((records.length / (students.length || 1)) * 100).toFixed(1)}%)\n\n`
      : 'Attendance Report\n\n';

    const headers = 'S/N,JAMB Registration No,Matric No,Student Full Name,Department,Check-In Time,Status,Device ID\n';
    const rows = records
      .map((r, i) => {
        return `${i + 1},"${r.jambRegNo}","${r.matricNo}","${r.studentName}","${r.department}","${new Date(r.timestamp).toLocaleTimeString()}","${r.status}","${r.deviceId.substring(0, 10)}"`;
      })
      .join('\n');

    const csvBlob = new Blob([sessionInfo + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_${activeSession?.courseCode || 'Course'}_Lec${activeSession?.lectureNumber || 1}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.jambRegNo.toLowerCase().includes(q) ||
      r.matricNo.toLowerCase().includes(q)
    );
  });

  const isSessionRunning = activeSession && activeSession.status === 'active' && activeSession.expiresAt > Date.now();
  const sessionSecondsLeft = activeSession ? Math.max(0, Math.ceil((activeSession.expiresAt - Date.now()) / 1000)) : 0;
  const minsLeft = Math.floor(sessionSecondsLeft / 60);
  const secsLeft = sessionSecondsLeft % 60;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden bg-[#0B0F17] text-[#F9FAFB] py-5 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 w-full">

        {/* Top Header & Integrated Actions (Clean Top Bar, No Off-Screen Floating Buttons) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-medium">
                Course Representative Console
              </span>
              <span className="text-xs text-slate-500">· Multi-Session Continuity</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Attendance Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch dynamic PIN sessions, inspect cumulative matrices, and authorize physical device exemptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {isSessionRunning ? (
              <button
                onClick={onOpenProjector}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
              >
                <Monitor className="w-4 h-4" />
                <span>Open Projector View</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('config')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                <span>Configure & Start Session</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ledger')}
              className="px-3.5 py-2 bg-[#111827] hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ledgers</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={records.length === 0}
              className="px-3.5 py-2 bg-[#111827] hover:bg-slate-800 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              title="Download attendance list for active lecture"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenRoster}
              className="px-3.5 py-2 bg-[#111827] hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-medium border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Roster ({students.length})</span>
            </button>

            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                className="px-3 py-2 bg-[#111827] hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Lock Course Rep session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Success Notification */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Live Active Session HUD Card */}
        {isSessionRunning ? (
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-xl">
            {/* Course & Lecture Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Live Attendance Active
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Lecture #{activeSession.lectureNumber || 1}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeSession.courseCode}
              </h2>
              <p className="text-xs text-slate-300 truncate font-medium">
                {activeSession.courseTitle}
              </p>
              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 pt-1">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-emerald-400" />
                  <span>{activeSession.hallLocation}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Single-Device Lock</span>
                </span>
              </div>
            </div>

            {/* Countdown Metric */}
            <div className="p-4 bg-[#0B0F17] border border-white/[0.06] rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Session Countdown</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {minsLeft.toString().padStart(2, '0')}:{secsLeft.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 05:00</span>
              </div>
              <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (sessionSecondsLeft / 300) * 100))}%` }}
                />
              </div>
            </div>

            {/* Attendance Count Metric */}
            <div className="p-4 bg-[#0B0F17] border border-white/[0.06] rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified Students</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {records.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {students.length} ({((records.length / (students.length || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                {students.length - records.length} remaining
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={onOpenProjector}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Projector View</span>
              </button>
              <button
                onClick={() => setShowStopConfirmModal(true)}
                className="w-full py-2 bg-[#0B0F17] hover:bg-red-950/40 hover:text-red-300 text-slate-300 rounded-xl text-xs font-medium border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
              >
                End Session & Archive
              </button>
            </div>
          </div>
        ) : (
          /* Session Inactive Banner */
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B0F17] border border-white/10 flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  No Active Attendance Window
                </h3>
                <p className="text-xs text-slate-400">
                  Ready to launch a new attendance window. Verified entries will automatically accumulate into course archives.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('ledger')}
                className="px-3.5 py-2 bg-[#0B0F17] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              >
                View Cumulative Ledgers
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
              >
                Configure & Start Session
              </button>
            </div>
          </div>
        )}

        {/* Tab Selection (Clean Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-white/[0.08] rounded-xl w-full max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Roster ({records.length})
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Cumulative Ledgers & Matrices</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security & Anti-Proxy ({flaggedAttempts.length})
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'config'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Launch Class Session
          </button>
        </div>

        {/* TAB 1: VERIFIED ATTENDANCE LIST (Current Lecture) */}
        {activeTab === 'attendance' && (
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-4 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06] text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Live Attendance Register
                </span>
                <span className="hidden sm:inline text-slate-600">·</span>
                <span className="text-slate-400">
                  Showing {filteredRecords.length} of {records.length} checked-in students
                </span>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, JAMB or matric..."
                  className="w-full h-8 pl-8 pr-3 bg-[#0B0F17] border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="w-full max-w-full overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[11px] font-mono bg-[#0B0F17]/60">
                    <th className="py-2.5 px-3">S/N</th>
                    <th className="py-2.5 px-3">Student Full Name</th>
                    <th className="py-2.5 px-3">JAMB Reg No</th>
                    <th className="py-2.5 px-3">Matric No</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Check-In Time</th>
                    <th className="py-2.5 px-3">Device Signature</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium text-white whitespace-nowrap">
                          {r.studentName}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-medium whitespace-nowrap">
                          {r.jambRegNo}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {r.matricNo}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {r.department}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap" title={r.deviceId}>
                          {r.deviceId.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="text-[11px] font-mono text-emerald-400">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                        {records.length === 0
                          ? 'No attendance records logged for this session yet. Students will appear here in real time.'
                          : 'No students matched your search criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CUMULATIVE MULTI-SESSION COURSE LEDGER */}
        {activeTab === 'ledger' && (
          <CourseLedgerView
            onStartLectureForCourse={handleStartLectureForCourse}
            activeSession={activeSession}
          />
        )}

        {/* TAB 3: SECURITY & ANTI-PROXY AUDIT */}
        {activeTab === 'security' && (
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-4 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06] text-xs">
              <div>
                <span className="font-semibold text-white uppercase tracking-wider block text-[11px]">
                  Anti-Proxy & Security Audit
                </span>
                <span className="text-slate-400 text-xs">
                  Enforces 1-device-per-student limit and blocks remote attendance fraud.
                </span>
              </div>
              <button
                onClick={() => setOverrideModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Grant Device Exemption</span>
              </button>
            </div>

            <div className="w-full max-w-full overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[11px] font-mono bg-[#0B0F17]/60">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Flagged Target</th>
                    <th className="py-2.5 px-3">Device Signature</th>
                    <th className="py-2.5 px-3">Blocked Violation Type</th>
                    <th className="py-2.5 px-3 text-right">Defense Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {flaggedAttempts.length > 0 ? (
                    flaggedAttempts.slice().reverse().map((f) => (
                      <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-medium text-white">
                          <div>{f.studentName || f.jambRegNo}</div>
                          <div className="text-[11px] font-mono text-slate-500">{f.jambRegNo}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {f.deviceId.substring(0, 10)}...
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-rose-400 text-xs">
                            {f.reason.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-[11px] font-mono text-amber-400">
                            BLOCKED
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No security violations flagged. Zero proxy submissions detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SESSION CONFIGURATION & LAUNCH */}
        {activeTab === 'config' && (
          <form
            onSubmit={handleStartSession}
            className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  Course Continuation & Auto-Increment
                </span>
                <span className="text-xs text-slate-500">· Links to historical lecture records</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Launch Attendance Session
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select an existing registered course to automatically continue from the previous lecture, or register a new course code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Existing Course to Continue */}
              <div className="sm:col-span-2 space-y-2 bg-[#0B0F17] p-4 rounded-xl border border-white/[0.06]">
                <label className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>Select Course to Continue</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Auto-accumulates with previous sessions
                  </span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelectionChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#111827] border border-white/10 text-white text-sm focus:border-emerald-500 transition-colors"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title} (Currently has {c.totalLectures} lectures held)
                    </option>
                  ))}
                  <option value="NEW">+ Register New Course Code</option>
                </select>
                <p className="text-[11px] text-slate-400 pt-1">
                  {selectedCourseId !== 'NEW' ? (
                    <span className="text-emerald-400 font-medium">
                      ✓ Continuation Mode: The system will automatically link this session and record it as the next continuous lecture for this course.
                    </span>
                  ) : (
                    <span>Enter new course details below to begin Lecture #1 for this course.</span>
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Course Code
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CYB 401"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F17] border border-white/10 text-white font-mono text-sm focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Session Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F17] border border-white/10 text-white text-sm focus:border-emerald-500 transition-colors"
                >
                  <option value={5}>5 Minutes (Standard Policy)</option>
                  <option value={3}>3 Minutes (Rapid Check)</option>
                  <option value={10}>10 Minutes (Extended Lecture)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Distributed Computing & Cloud Architecture"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F17] border border-white/10 text-white text-sm focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Lecture Hall / Venue
                </label>
                <input
                  type="text"
                  value={hallLocation}
                  onChange={(e) => setHallLocation(e.target.value)}
                  placeholder="e.g. ETF Lecture Theatre 1"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F17] border border-white/10 text-white text-sm focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Lecturer / Invigilator
                </label>
                <input
                  type="text"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  placeholder="e.g. Dr. E. O. Babalola"
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F17] border border-white/10 text-white text-sm focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Attendance Verification & Security Policy Card */}
              <div className="sm:col-span-2 space-y-3 bg-[#0B0F17] p-4 rounded-xl border border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Attendance Verification Protocol Active</h4>
                    <p className="text-[11px] text-slate-400">1-Minute Live Rolling Passcode & Single-Device Anti-Proxy Lock</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#111827] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 font-mono block">PASSCODE POLICY</span>
                    <span className="font-mono text-emerald-400 font-medium">1-Minute Dynamic Rolling PIN</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Projected in class so only students physically present can view it.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111827] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 font-mono block">DEVICE SECURITY</span>
                    <span className="font-mono text-white font-medium">Hardware Fingerprint Locked</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Strictly blocks a single smartphone from checking in for classmates.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                <span>Launch Attendance Session Now</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className="px-4 py-2.5 bg-[#0B0F17] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

      </div>

      {/* End Session Confirmation Modal */}
      {showStopConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">End Attendance Session?</h3>
                <p className="text-xs text-slate-400">
                  {activeSession?.courseCode} · Lecture #{activeSession?.lectureNumber || 1}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#0B0F17] p-3.5 rounded-xl border border-white/[0.06]">
              Are you sure you want to conclude this lecture attendance? The 4-digit PIN will immediately deactivate and all verified check-ins will be permanently archived into the Course Ledger.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowStopConfirmModal(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-[#0B0F17] hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Continue Session
              </button>
              <button
                type="button"
                onClick={executeStopSession}
                disabled={isLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{isLoading ? 'Concluding...' : 'Yes, End Session & Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Device Exception Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleGrantOverride}
            className="bg-[#111827] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-white/[0.06]">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-amber-400" />
                Course Rep Device Exemption
              </span>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If a student's phone battery died or they cannot access their personal device, you can authorize a one-time check-in from another device after physical in-person verification.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Device UUID Fingerprint
              </label>
              <input
                type="text"
                value={overrideDeviceId}
                onChange={(e) => setOverrideDeviceId(e.target.value)}
                placeholder="Enter or paste device ID"
                required
                className="w-full h-9 px-3 rounded-lg bg-[#0B0F17] border border-white/10 text-white font-mono text-xs focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Verification Rationale
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Student verified physically in hall"
                required
                className="w-full h-9 px-3 rounded-lg bg-[#0B0F17] border border-white/10 text-white text-xs focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-3.5 py-1.5 bg-[#0B0F17] hover:bg-slate-800 border border-white/10 text-slate-400 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Authorize Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
