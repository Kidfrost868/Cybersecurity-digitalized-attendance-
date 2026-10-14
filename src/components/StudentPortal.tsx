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
  Sparkles,
  Lock,
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
  isAdminAuthenticated,
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
      // Auto-advance to next box
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

  // Real Student Quick Selector
  const demoStudents = [
    { name: 'Asuelime Mcchris', jamb: '202660245646HJ' },
    { name: 'Idudu Oghenetekome Favour', jamb: '202660181457IF' },
    { name: 'Alaba Samuel Oluwatumininu', jamb: '202660546091HG' },
    { name: 'Arowoshola Dejola', jamb: 'RUN/CYB/25/18825' },
    { name: 'Joshua Jeremiah', jamb: '202660045223BB' },
  ];

  const handleSelectDemo = (jamb: string) => {
    setJambRegNo(jamb);
    setErrorMessage(null);
    setErrorCode(null);
    // Focus first PIN box
    setTimeout(() => {
      digitInputRefs[0].current?.focus();
    }, 150);
  };

  // Form Submission with 1-Minute Passcode & Single-Device Anti-Proxy Verification
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
      setErrorMessage('Please enter the complete 4-digit passcode displayed in class.');
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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 py-6 px-4 sm:px-6 flex flex-col justify-start items-center">
      <div className="w-full max-w-md mx-auto space-y-6">

        {/* Live Session Status Banner */}
        {activeSession && activeSession.status === 'active' ? (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
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

            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {activeSession.courseCode}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {activeSession.courseTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Venue: {activeSession.hallLocation}</span>
                </p>
              </div>

              {onGoToProjector && (
                <button
                  type="button"
                  onClick={onGoToProjector}
                  className="shrink-0 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="View live lecture hall rolling PIN display"
                >
                  <span>View Hall PIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-3">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-300 block">No Active Attendance Session</span>
              <span className="text-slate-500">Waiting for Course Rep or Lecturer to start attendance...</span>
            </div>
          </div>
        )}

        {/* Verification Success Pass Card */}
        {resultRecord ? (
          <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Attendance Recorded
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                Accredited & Verified for this Session
              </p>
            </div>

            {/* Student Credential Slip */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Student Name</span>
                <span className="font-semibold text-white">{resultRecord.studentName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">JAMB Reg No</span>
                <span className="font-mono text-emerald-300 font-semibold">{resultRecord.jambRegNo}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Matric No</span>
                <span className="font-mono text-slate-200">{resultRecord.matricNo}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200">{resultRecord.department}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {new Date(resultRecord.timestamp).toLocaleTimeString()} ({new Date(resultRecord.timestamp).toLocaleDateString()})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Security Hash</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {resultRecord.id.substring(0, 16)}
                </span>
              </div>
            </div>

            {/* Anti-Proxy Device Badge */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Device Locked: Single-device hardware lock verified for this student.</span>
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
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
          >
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Student Check-In
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  RUN CyberPass
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your JAMB registration number and the live 4-digit passcode displayed in class.
              </p>
            </div>

            {/* Live Verification Shield Card: 1-Minute Rolling PIN + Single-Device Lock */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-semibold text-white">Live Attendance Shield Active</span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Fast Anti-Proxy Lock
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1-Min Rotating PIN</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1 Device = 1 Student</span>
                </div>
              </div>
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
                    <p className="text-slate-400">
                      Tip: Passcodes rotate every 1 minute. Make sure you enter the latest PIN from the classroom projector.
                    </p>
                  )}
                  {errorCode === 'DEVICE_LOCKED' && (
                    <p className="text-slate-400">
                      Single-Device Lock: This phone has already submitted attendance for another coursemate. Anti-proxy rules prevent signing in for multiple students.
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
                    Verified
                  </span>
                </div>
              )}

              {/* Fast Test Student Picker */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Quick-select demo student:
                  </span>
                  {onGoToDirectory && (
                    <button
                      type="button"
                      onClick={onGoToDirectory}
                      className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                    >
                      Find JAMB in Directory →
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {demoStudents.map((st) => (
                    <button
                      key={st.jamb}
                      type="button"
                      onClick={() => handleSelectDemo(st.jamb)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        jambRegNo === st.jamb
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4-Digit Live Passcode Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Hall Passcode (4 Digits)
                </label>
                <span className="text-[11px] text-slate-400">
                  Rotates every 1 min
                </span>
              </div>

              {/* 4 Segmented Digit Input Boxes */}
              <div className="grid grid-cols-4 gap-3">
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
                    className="h-14 text-center text-2xl font-mono font-bold rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-emerald-400 transition-colors"
                  />
                ))}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Look at the lecture hall screen or projector for the active PIN.
              </p>
            </div>

            {/* Anti-Proxy Guard Footnote */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Single-device lock active: Only 1 submission allowed from this phone.
              </span>
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
                  <span>Verifying Passcode & Identity...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Attendance</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Subtle, Discreet Course Rep Portal Trigger */}
        <div className="pt-4 pb-6 text-center">
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
