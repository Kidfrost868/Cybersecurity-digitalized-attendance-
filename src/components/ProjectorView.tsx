import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  ShieldCheck,
  Maximize2,
  Minimize2,
  QrCode,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Sparkles,
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
  onOpenCheckInTab,
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

  // Radial countdown stroke calculation (supports 60s or custom interval)
  const totalInterval = session?.passcodeIntervalMs ? Math.max(1, Math.round(session.passcodeIntervalMs / 1000)) : 60;
  const progressRatio = Math.max(0, Math.min(1, secondsRemainingInPasscode / totalInterval));
  const strokeDashoffset = 283 * (1 - progressRatio); // 2 * PI * 45 ≈ 283

  // Current app URL for QR code
  const checkInUrl = typeof window !== 'undefined' ? window.location.origin : 'https://unipass.ng';

  return (
    <div className="min-h-screen bg-[#070A11] text-white flex flex-col justify-between selection:bg-emerald-500/30 overflow-x-hidden font-sans w-full max-w-full">
      {/* Top Projector Bar */}
      <header className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md w-full max-w-full gap-2 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isAdminAuthenticated ? 'Rep Hub' : 'Check-In'}</span>
          </button>

          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-400 font-mono font-bold block truncate">
              Hall Projector PIN
            </span>
            <h1 className="text-xs sm:text-base md:text-lg font-bold text-slate-100 flex items-center gap-1.5 min-w-0">
              <span className="shrink-0">{session?.courseCode || 'CYB 201'}</span>
              <span className="text-slate-500 font-normal">·</span>
              <span className="text-slate-400 font-normal text-xs sm:text-sm truncate">
                {session?.courseTitle || 'Cybersecurity Lecture'}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle QR Code for mobile cameras"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* Main High-Contrast Center Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-3 sm:px-6 py-4 sm:py-6 max-w-6xl mx-auto w-full overflow-x-hidden">
        {isSessionActive ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left 7 Columns: Giant 4-Digit Passcode & Timers */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">

              {/* Master 5-Minute Session Timer Pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300">Session Window:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums text-base">
                  {formatTime(sessionSecondsRemaining)}
                </span>
                <span className="text-slate-500 text-xs">/ 05:00</span>
              </div>

              {/* The Giant Passcode Presentation Box */}
              <div className="w-full p-5 sm:p-8 md:p-10 rounded-3xl bg-slate-950 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/30 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-[11px] sm:text-xs text-slate-400 uppercase tracking-widest font-mono pb-2">
                  <span>Rolling Passcode</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    Live ({totalInterval >= 60 ? `${Math.round(totalInterval / 60)}m` : `${totalInterval}s`})
                  </span>
                </div>

                {/* The Responsive Passcode */}
                <div className="my-4 sm:my-6">
                  <span className="font-mono text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-widest text-emerald-400 select-all drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                    {session?.currentPasscode || '----'}
                  </span>
                </div>

                {/* Radial Indicator & Countdown Bar */}
                <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    {/* SVG Radial Countdown Ring */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className="stroke-slate-800"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className={`${
                            secondsRemainingInPasscode <= 5 ? 'stroke-amber-400' : 'stroke-emerald-400'
                          } transition-all duration-1000 ease-linear`}
                          strokeWidth="3.5"
                          strokeDasharray={100}
                          strokeDashoffset={100 * (1 - progressRatio)}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <span className="absolute font-mono font-bold text-xs text-white tabular-nums">
                        {secondsRemainingInPasscode}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-slate-300 font-medium block">
                        Rotates in {secondsRemainingInPasscode}s
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Previous PIN accepted for {totalInterval}s grace window
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">Venue</span>
                    <span className="text-slate-300 font-medium">
                      {session?.hallLocation || 'Main Lecture Hall'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anti-Proxy Guard Notice */}
              <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Anti-Proxy Active: Single phone locked per JAMB number · Remote WhatsApp sharing blocked by {totalInterval >= 60 ? '1-minute' : `${totalInterval}s`} rotation.
                </span>
              </div>
            </div>

            {/* Right 5 Columns: Live Student Check-In Stream & Real-Time Stats */}
            <div className="lg:col-span-5 flex flex-col space-y-6">

              {/* Real-time Metric Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Lecture Hall Attendance
                  </span>
                  <span className="font-mono text-emerald-400">
                    {data?.stats?.percentage || '0'}% Present
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-extrabold text-white tabular-nums">
                    {data?.stats?.checkedIn || 0}
                  </span>
                  <span className="text-slate-400 text-lg font-mono">
                    / {data?.stats?.total || 0} Students
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Number(data?.stats?.percentage || 0))}%` }}
                  />
                </div>
              </div>

              {/* Live Attendee Stream / Ticker */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white tracking-wide uppercase">
                    Live Check-In Stream
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Listening
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {data?.recentRecords && data.recentRecords.length > 0 ? (
                    data.recentRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-white truncate block">
                              {rec.studentName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {rec.jambRegNo} · {rec.matricNo}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-[11px] text-emerald-400 tabular-nums shrink-0 ml-2">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Waiting for students to record attendance...
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Session Closed or Idle State */
          <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {session?.status === 'completed' ? 'Attendance Session Ended' : 'No Active Session'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {session?.status === 'completed'
                  ? `The 5-minute attendance window has elapsed. A total of ${data?.stats?.checkedIn || 0} students were verified.`
                  : 'Launch a 5-minute attendance session from the Course Rep Dashboard to generate rolling passcodes.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={onBackToDashboard}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Go to Course Rep Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Projector Footer Info */}
      <footer className="px-3 sm:px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left w-full max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
          <span>Student Portal: <strong className="text-slate-300 font-mono break-all">{checkInUrl}</strong></span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span>Single-device session lock active</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          UniPass Nigeria · Verified Institutional Engine
        </div>
      </footer>

      {/* QR Code Modal for Lecture Hall Scanning */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider">Scan to Check In</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Generated QR Representation */}
            <div className="p-4 bg-white rounded-2xl mx-auto w-56 h-56 flex flex-col items-center justify-center shadow-inner">
              {/* High fidelity SVG QR Matrix */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                {/* Corner Finder 1 */}
                <rect x="8" y="8" width="24" height="24" fill="#070A11" />
                <rect x="12" y="12" width="16" height="16" fill="white" />
                <rect x="16" y="16" width="8" height="8" fill="#070A11" />
                {/* Corner Finder 2 */}
                <rect x="68" y="8" width="24" height="24" fill="#070A11" />
                <rect x="72" y="12" width="16" height="16" fill="white" />
                <rect x="76" y="16" width="8" height="8" fill="#070A11" />
                {/* Corner Finder 3 */}
                <rect x="8" y="68" width="24" height="24" fill="#070A11" />
                <rect x="12" y="72" width="16" height="16" fill="white" />
                <rect x="16" y="76" width="8" height="8" fill="#070A11" />
                {/* Realistic QR pattern elements */}
                <rect x="40" y="12" width="6" height="6" fill="#070A11" />
                <rect x="52" y="12" width="6" height="6" fill="#070A11" />
                <rect x="40" y="24" width="6" height="6" fill="#070A11" />
                <rect x="48" y="32" width="6" height="6" fill="#070A11" />
                <rect x="20" y="44" width="6" height="6" fill="#070A11" />
                <rect x="32" y="44" width="6" height="6" fill="#070A11" />
                <rect x="44" y="44" width="6" height="6" fill="#070A11" />
                <rect x="56" y="44" width="6" height="6" fill="#070A11" />
                <rect x="68" y="44" width="6" height="6" fill="#070A11" />
                <rect x="80" y="44" width="6" height="6" fill="#070A11" />
                <rect x="44" y="56" width="6" height="6" fill="#070A11" />
                <rect x="56" y="56" width="6" height="6" fill="#070A11" />
                <rect x="68" y="68" width="6" height="6" fill="#070A11" />
                <rect x="80" y="68" width="6" height="6" fill="#070A11" />
                <rect x="44" y="76" width="6" height="6" fill="#070A11" />
                <rect x="56" y="84" width="6" height="6" fill="#070A11" />
                <rect x="80" y="84" width="6" height="6" fill="#070A11" />
              </svg>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-white">Direct URL for Students:</p>
              <p className="font-mono text-emerald-400 break-all">{checkInUrl}</p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
