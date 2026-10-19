import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  RefreshCw,
  Lock,
  Check,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { getDeviceSecurityPayload } from '../utils/deviceFingerprint.ts';
import { AttendanceRecord, SessionPublicInfo } from '../types/attendance.ts';

interface StudentPortalProps {
  onGoToProjector?: () => void;
  onGoToDirectory?: () => void;
  onGoToMyStats?: (jamb?: string) => void;
  activeSession: SessionPublicInfo | null;
  onOpenAdminLogin: () => void;
  isAdminAuthenticated: boolean;
  prefilledJamb?: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onGoToProjector,
  onGoToDirectory,
  onGoToMyStats,
  activeSession,
  onOpenAdminLogin,
  prefilledJamb,
}) => {
  const [jambRegNo, setJambRegNo] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [resolvedStudent, setResolvedStudent] = useState<{
    fullName: string;
    matricNo?: string;
    department?: string;
    level?: string;
  } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultRecord, setResultRecord] = useState<AttendanceRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>('05:00');

  const digitInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const deviceSecurity = getDeviceSecurityPayload();
  const deviceId = deviceSecurity.deviceId;
  const hardwareHash = deviceSecurity.hardwareHash;
  const deviceSummary = deviceSecurity.deviceInfo;

  useEffect(() => {
    if (prefilledJamb) {
      setJambRegNo(prefilledJamb);
    }
  }, [prefilledJamb]);

  // Session countdown ticker
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setSessionTimeLeft('Closed');
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, activeSession.expiresAt - Date.now());
      if (remainingMs <= 0) {
        setSessionTimeLeft('00:00 (Expired)');
      } else {
        const totalSec = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setSessionTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Real-time lookup of student name when JAMB number has at least 8 characters
  useEffect(() => {
    const clean = jambRegNo.trim().toUpperCase();
    if (clean.length >= 8) {
      let cancelled = false;
      setIsLookingUp(true);
      const timer = setTimeout(async () => {
        const res = await AttendanceApiService.lookupStudent(clean);
        if (!cancelled) {
          setIsLookingUp(false);
          if (res.found && res.student) {
            setResolvedStudent({
              fullName: res.student.fullName || '',
              matricNo: res.student.matricNo,
              department: res.student.department,
              level: res.student.level,
            });
          } else {
            setResolvedStudent(null);
          }
        }
      }, 350);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    } else {
      setResolvedStudent(null);
      setIsLookingUp(false);
    }
  }, [jambRegNo]);

  // Handle PIN input box changes
  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const newDigits = [...pinDigits];

    if (sanitized.length > 0) {
      newDigits[index] = sanitized.slice(-1);
      setPinDigits(newDigits);
      if (index < 3) {
        digitInputRefs[index + 1].current?.focus();
      }
    } else {
      newDigits[index] = '';
      setPinDigits(newDigits);
    }
    setErrorMessage(null);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      digitInputRefs[index - 1].current?.focus();
    }
  };

  const handlePastePin = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (paste.length > 0) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < paste.length; i++) {
        newDigits[i] = paste[i];
      }
      setPinDigits(newDigits);
      const nextFocus = Math.min(paste.length, 3);
      digitInputRefs[nextFocus].current?.focus();
    }
  };

  // Form Submission with 1-Min Rotating PIN & Single-Device Anti-Proxy
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    const cleanJamb = jambRegNo.trim().toUpperCase();
    const passcode = pinDigits.join('');

    if (!cleanJamb) {
      setErrorMessage('Please enter your accredited JAMB Registration Number.');
      return;
    }

    if (passcode.length !== 4) {
      setErrorMessage('Please enter the complete 4-digit passcode displayed on the screen.');
      digitInputRefs[pinDigits.findIndex(d => !d) || 0]?.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AttendanceApiService.checkIn({
        sessionId: activeSession?.id,
        jambRegNo: cleanJamb,
        passcode,
        deviceId,
        hardwareHash,
        deviceInfo: deviceSummary,
      });

      if (response.success && response.record) {
        setResultRecord(response.record);
      } else {
        setErrorMessage(response.message);
        setErrorCode(response.errorCode || 'ERROR');
        // Clear pin on error so student can try new pin
        setPinDigits(['', '', '', '']);
        digitInputRefs[0].current?.focus();
      }
    } catch {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden bg-slate-900 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 flex flex-col justify-start items-center">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-5">

        {/* Live Session Status Banner */}
        {activeSession && activeSession.status === 'active' ? (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm w-full">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Attendance Session
              </span>
              <span className="font-mono tabular-nums text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {sessionTimeLeft} left
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-sm block">
                  {activeSession.courseCode} · Lecture #{activeSession.lectureNumber || 1}
                </span>
                <span className="text-xs text-slate-400 truncate block max-w-[260px]">
                  {activeSession.courseTitle}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Live PIN
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-2 w-full">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-white">No Active Lecture Session</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Attendance sessions are launched by the Course Rep or Lecturer during scheduled lecture hours.
            </p>
            {onGoToProjector && (
              <button
                type="button"
                onClick={onGoToProjector}
                className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
              >
                View Classroom Screen →
              </button>
            )}
          </div>
        )}

        {/* Check-In Form or Success Receipt */}
        {resultRecord ? (
          <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200 w-full overflow-hidden">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Attendance Recorded
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                Accredited Student Verification Confirmed
              </p>
            </div>

            {/* Student Credential Slip */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 gap-2">
                <span className="text-slate-400 shrink-0">Student Name</span>
                <span className="font-semibold text-white text-right truncate">{resultRecord.studentName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 gap-2">
                <span className="text-slate-400 shrink-0">JAMB Reg No</span>
                <span className="font-mono text-emerald-300 font-semibold text-right">{resultRecord.jambRegNo}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 gap-2">
                <span className="text-slate-400 shrink-0">Matric No</span>
                <span className="font-mono text-slate-200 text-right">{resultRecord.matricNo}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 gap-2">
                <span className="text-slate-400 shrink-0">Department</span>
                <span className="text-slate-200 text-right truncate">{resultRecord.department}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 gap-2">
                <span className="text-slate-400 shrink-0">Timestamp</span>
                <span className="font-mono tabular-nums text-slate-300 text-right text-[11px] sm:text-xs">
                  {new Date(resultRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(resultRecord.timestamp).toLocaleDateString()})
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 shrink-0">Verification Receipt</span>
                <span className="font-mono text-[10px] text-slate-500 truncate text-right">
                  {resultRecord.id.substring(0, 16)}
                </span>
              </div>
            </div>

            {/* Anti-Proxy Device Badge */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Single-Device Hardware Lock Verified · Anti-Proxy Defense Active.</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {onGoToMyStats && (
                <button
                  type="button"
                  onClick={() => {
                    const j = resultRecord.jambRegNo;
                    setResultRecord(null);
                    onGoToMyStats(j);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>View My Full Attendance Stats</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setResultRecord(null);
                  setJambRegNo('');
                  setPinDigits(['', '', '', '']);
                }}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Main Check-In Form */
          <form
            onSubmit={handleSubmitCheckIn}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 w-full overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Student Check-In
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Instant Verification
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your accredited JAMB number and the live 4-digit PIN displayed on the lecture screen.
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                errorCode === 'DEVICE_LOCKED'
                  ? 'bg-red-950/50 border-red-500/50 text-red-200'
                  : errorCode === 'DUPLICATE_ENTRY'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                  {errorCode === 'INVALID_CODE' && (
                    <p className="text-slate-400 text-[11px]">
                      Tip: Passcodes rotate every 1 minute. Enter the latest PIN shown on the lecture screen.
                    </p>
                  )}
                  {errorCode === 'DEVICE_LOCKED' && (
                    <p className="text-slate-400 text-[11px]">
                      Single-Device Lock: This phone has already submitted attendance for another coursemate.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* JAMB Registration Number Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="jambInput"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  JAMB Registration Number
                </label>
                {isLookingUp && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                    Validating...
                  </span>
                )}
              </div>

              <input
                id="jambInput"
                type="text"
                value={jambRegNo}
                onChange={(e) => {
                  setJambRegNo(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                placeholder="e.g. 2024/104829AB"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-base uppercase tracking-wider placeholder:text-slate-600 transition-colors"
              />

              {/* Verified Student Preview Chip */}
              {resolvedStudent && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-300 block">{resolvedStudent.fullName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {resolvedStudent.matricNo || resolvedStudent.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Accredited
                  </span>
                </div>
              )}

              {/* Directory Finder Link */}
              {onGoToDirectory && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Need to confirm your accredited JAMB number?</span>
                  <button
                    type="button"
                    onClick={onGoToDirectory}
                    className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                  >
                    Check Student Directory →
                  </button>
                </div>
              )}
            </div>

            {/* 4-Digit Live Passcode Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Lecture Passcode (4 Digits)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Rotates every 1 min
                </span>
              </div>

              {/* 4 Segmented Digit Input Boxes */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={digitInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePastePin : undefined}
                    className="h-12 sm:h-14 w-full min-w-0 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-emerald-400 transition-colors"
                  />
                ))}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Look at the lecture screen or projector for the active 4-digit PIN.
              </p>
            </div>

            {/* Anti-Proxy Guard Footnote */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Single-device lock: 1 submission per phone</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <Check className="w-3.5 h-3.5" />
                <span>Cloud Synced</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !jambRegNo.trim() || pinDigits.some(d => !d)}
              className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Identity...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Presence & Record Attendance</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Subtle, Discreet Course Rep Portal Trigger */}
        <div className="pt-2 pb-6 text-center">
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-400 text-xs transition-colors py-2 px-3 rounded-lg hover:bg-slate-950/60 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Lecturer & Course Rep Login</span>
          </button>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
            RUN CyberPass · Redeemer's University Faculty of Computing and Digital Technology
          </p>
        </div>
      </div>
    </div>
  );
};
