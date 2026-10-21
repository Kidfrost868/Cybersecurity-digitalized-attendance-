import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  ShieldCheck,
  Maximize2,
  Minimize2,
  QrCode,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { AttendanceRecord, AttendanceSession } from '../types/attendance.ts';

interface ProjectorViewProps {
  onBackToDashboard: () => void;
  onOpenCheckInTab?: () => void;
  isAdminAuthenticated?: boolean;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  onBackToDashboard,
  isAdminAuthenticated,
}) => {
  const [data, setData] = useState<{
    session: (AttendanceSession & { sessionSecondsRemaining: number; passcodeSecondsRemaining: number }) | null;
    records: AttendanceRecord[];
    recentRecords: AttendanceRecord[];
    flaggedCount: number;
    stats: { total: number; checkedIn: number; percentage: string };
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [secondsRemainingInPasscode, setSecondsRemainingInPasscode] = useState<number>(60);
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState<number>(300);

  // Poll projector data every 1 second for smooth countdown and live attendee list
  useEffect(() => {
    let active = true;

    const fetchProjectorData = async () => {
      try {
        const res = await AttendanceApiService.getProjectorData();
        if (active) {
          setData(res);
          if (res.session) {
            setSecondsRemainingInPasscode(res.session.passcodeSecondsRemaining);
            setSessionSecondsRemaining(res.session.sessionSecondsRemaining);
          }
        }
      } catch {
        // Handle error silently during polling
      }
    };

    fetchProjectorData();
    const interval = setInterval(fetchProjectorData, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const session = data?.session;
  const isSessionActive = session && session.status === 'active' && sessionSecondsRemaining > 0;

  // Format mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalInterval = session?.passcodeIntervalMs ? Math.max(1, Math.round(session.passcodeIntervalMs / 1000)) : 60;
  const progressRatio = Math.max(0, Math.min(1, secondsRemainingInPasscode / totalInterval));

  // Current app URL for QR code
  const checkInUrl = typeof window !== 'undefined' ? window.location.origin : 'https://unipass.ng';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden font-sans w-full max-w-full">
      {/* Top Projector Bar */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md w-full max-w-full gap-3 overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isAdminAuthenticated ? 'Rep Hub' : 'Check-In'}</span>
          </button>

          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-blue-600 font-mono font-medium block truncate">
              Lecture Projector Screen
            </span>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 flex items-center gap-2 min-w-0 truncate">
              <span className="shrink-0">{session?.courseCode || 'CYB 201'}</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-slate-600 font-normal text-xs sm:text-sm truncate">
                {session?.courseTitle || 'Cybersecurity Lecture'}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs text-blue-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            title="Toggle QR Code for mobile cameras"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* Main High-Contrast Center Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto w-full overflow-x-hidden">
        {isSessionActive ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left 7 Columns: Giant 4-Digit Passcode & Timers */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">

              {/* Master Session Window */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-slate-600">Session Window:</span>
                <span className="font-mono font-semibold text-blue-700 tabular-nums text-sm">
                  {formatTime(sessionSecondsRemaining)}
                </span>
                <span className="text-slate-400">/ 05:00</span>
              </div>

              {/* The Giant Passcode Presentation Box */}
              <div className="w-full p-6 sm:p-10 rounded-2xl bg-slate-50 border-2 border-blue-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-xs text-slate-600 font-mono pb-3 border-b border-slate-200">
                  <span className="text-slate-700 font-semibold tracking-wider uppercase text-[11px]">Rolling Passcode</span>
                  <span className="text-blue-600 flex items-center gap-1.5 text-xs font-medium">
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Live ({totalInterval >= 60 ? `${Math.round(totalInterval / 60)}m` : `${totalInterval}s`})</span>
                  </span>
                </div>

                {/* The Responsive Passcode */}
                <div className="my-6 sm:my-8">
                  <span className="font-mono text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-widest text-blue-600 select-all">
                    {session?.currentPasscode || '----'}
                  </span>
                </div>

                {/* Radial Indicator & Countdown Bar */}
                <div className="w-full flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    {/* SVG Radial Countdown Ring */}
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className="stroke-slate-200"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className={`${
                            secondsRemainingInPasscode <= 5 ? 'stroke-amber-500' : 'stroke-blue-600'
                          } transition-all duration-1000 ease-linear`}
                          strokeWidth="3"
                          strokeDasharray={100}
                          strokeDashoffset={100 * (1 - progressRatio)}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <span className="absolute font-mono font-bold text-xs text-slate-900 tabular-nums">
                        {secondsRemainingInPasscode}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-slate-900 font-semibold block">
                        Rotates in {secondsRemainingInPasscode}s
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Previous PIN remains valid for {totalInterval}s
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">Venue</span>
                    <span className="text-slate-800 font-medium text-xs">
                      {session?.hallLocation || 'Main Hall'}
                    </span>
                    <span className="text-blue-600 font-mono text-[10px] block mt-0.5">
                      Single-Device Lock
                    </span>
                  </div>
                </div>
              </div>

              {/* Anti-Proxy Guard Notice */}
              <div className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Anti-Proxy Active: 1 phone per student · Dynamic PIN rotation prevents remote sharing.
                </span>
              </div>
            </div>

            {/* Right 5 Columns: Live Student Check-In Stream & Real-Time Stats */}
            <div className="lg:col-span-5 flex flex-col space-y-5">

              {/* Real-time Metric Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Hall Attendance</span>
                  </span>
                  <span className="font-mono text-blue-600 font-bold tabular-nums">
                    {data?.stats?.percentage || '0'}% Present
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-bold text-slate-900 tabular-nums">
                    {data?.stats?.checkedIn || 0}
                  </span>
                  <span className="text-slate-500 text-sm sm:text-base font-mono">
                    / {data?.stats?.total || 0} enrolled
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Number(data?.stats?.percentage || 0))}%` }}
                  />
                </div>
              </div>

              {/* Live Attendee Stream / Ticker */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex-1 flex flex-col shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 tracking-wide">
                    Live Check-In Stream
                  </span>
                  <span className="text-blue-600 font-mono text-[11px] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Listening
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {data?.recentRecords && data.recentRecords.length > 0 ? (
                    data.recentRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs transition-colors hover:border-blue-300"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            ✓
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 truncate block">
                              {rec.studentName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {rec.jambRegNo !== 'NULL' ? rec.jambRegNo : rec.matricNo}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-[11px] text-blue-600 tabular-nums shrink-0 ml-2 font-medium">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      Waiting for students to record attendance...
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Session Closed or Idle State */
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {session?.status === 'completed' ? 'Attendance Session Ended' : 'No Active Session'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {session?.status === 'completed'
                  ? `The attendance window has elapsed. A total of ${data?.stats?.checkedIn || 0} students were verified.`
                  : 'Launch an attendance session from the Course Rep Dashboard to generate rolling passcodes.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onBackToDashboard}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Go to Course Rep Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Projector Footer Info */}
      <footer className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left w-full max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span>Student Portal: <strong className="text-slate-900 font-mono">{checkInUrl}</strong></span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span>Single-device session lock active</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          RUN CyberPass · Redeemer's University Institutional Attendance
        </div>
      </footer>

      {/* QR Code Modal for Lecture Hall Scanning */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="flex justify-between items-center text-xs text-slate-600 pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900">Scan to Check In</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Generated QR Representation */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl mx-auto w-52 h-52 flex flex-col items-center justify-center shadow-xs">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <rect x="8" y="8" width="24" height="24" fill="#0F172A" />
                <rect x="12" y="12" width="16" height="16" fill="white" />
                <rect x="16" y="16" width="8" height="8" fill="#0F172A" />
                <rect x="68" y="8" width="24" height="24" fill="#0F172A" />
                <rect x="72" y="12" width="16" height="16" fill="white" />
                <rect x="76" y="16" width="8" height="8" fill="#0F172A" />
                <rect x="8" y="68" width="24" height="24" fill="#0F172A" />
                <rect x="12" y="72" width="16" height="16" fill="white" />
                <rect x="16" y="76" width="8" height="8" fill="#0F172A" />
                <rect x="40" y="12" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="12" width="6" height="6" fill="#0F172A" />
                <rect x="40" y="24" width="6" height="6" fill="#0F172A" />
                <rect x="48" y="32" width="6" height="6" fill="#0F172A" />
                <rect x="20" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="32" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="44" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="56" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="68" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="80" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="44" y="56" width="6" height="6" fill="#0F172A" />
                <rect x="56" y="56" width="6" height="6" fill="#0F172A" />
                <rect x="68" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="80" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="44" y="76" width="6" height="6" fill="#0F172A" />
                <rect x="56" y="84" width="6" height="6" fill="#0F172A" />
                <rect x="80" y="84" width="6" height="6" fill="#0F172A" />
              </svg>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-slate-500">Direct portal address:</p>
              <p className="font-mono text-blue-600 font-medium break-all">{checkInUrl}</p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
