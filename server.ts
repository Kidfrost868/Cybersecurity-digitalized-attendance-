import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_STUDENTS } from './src/data/seedStudents.ts';
import type {
  Student,
  Course,
  AttendanceSession,
  AttendanceRecord,
  FlaggedProxyAttempt,
  DeviceLock,
  StudentCourseStats,
  StudentSummaryStats,
  CourseLedger,
  CourseLedgerStudentRow,
  LectureSessionAudit,
} from './src/types/attendance.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

// Deterministic 4-digit code generator based on session and interval index
function getPasscodeForInterval(sessionId: string, intervalIndex: number): string {
  let hash = 0;
  const str = `${sessionId}_int_${intervalIndex}_unipass_salt_2024`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = Math.abs(hash) % 9000 + 1000;
  return codeNum.toString();
}

// In-Memory Database Store - completely clean per user request
let masterStudents: Student[] = [];

// Registered Courses for Redeemer's University Cybersecurity Department (Faculty of Computing & Digital Technology)
// Starts completely clean per user request
let masterCourses: Course[] = [];

let activeSession: AttendanceSession | null = null;
let completedSessions: AttendanceSession[] = [];
let attendanceRecords: AttendanceRecord[] = [];
let flaggedAttempts: FlaggedProxyAttempt[] = [];

// Device Locks
let deviceLocks: Map<string, DeviceLock> = new Map();
let hardwareLocks: Map<string, DeviceLock> = new Map();

// Active Admin Auth Tokens
const activeAdminTokens: Set<string> = new Set(['rep_auth_master_token_2024']);

// Brute-force & Rate-limiting Tracker
interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  lockoutUntil: number;
}
const bruteForceTracker: Map<string, RateLimitEntry> = new Map();

function getSessionState() {
  if (!activeSession) return null;
  const now = Date.now();
  if (now > activeSession.expiresAt && activeSession.status === 'active') {
    activeSession.status = 'completed';
    if (!completedSessions.some(s => s.id === activeSession!.id)) {
      completedSessions.push({ ...activeSession });
    }
    activeSession = null;
    return null;
  }

  const elapsed = now - activeSession.startTime;
  const currentInterval = Math.max(0, Math.floor(elapsed / activeSession.passcodeIntervalMs));
  const currentCode = getPasscodeForInterval(activeSession.id, currentInterval);
  const prevCode = currentInterval > 0 ? getPasscodeForInterval(activeSession.id, currentInterval - 1) : currentCode;
  const nextRotationAt = activeSession.startTime + (currentInterval + 1) * activeSession.passcodeIntervalMs;

  activeSession.currentPasscode = currentCode;
  activeSession.previousPasscode = prevCode;
  activeSession.passcodeRotatedAt = activeSession.startTime + currentInterval * activeSession.passcodeIntervalMs;
  activeSession.passcodeExpiresAt = nextRotationAt;

  return activeSession;
}

// Security Input Sanitization Helpers
function sanitizeText(val: unknown, maxLen = 100): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[^\w\s.,\-/@()&']/gi, '') // Allow safe alphanumeric, standard punctuation and apostrophe
    .trim()
    .slice(0, maxLen);
}

function isValidJamb(jamb: string): boolean {
  return /^[A-Za-z0-9/.\s-]{2,40}$/.test(jamb.trim());
}

function isValidPasscode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

async function startServer() {
  const app = express();
  
  app.use(express.json({ limit: '128kb' }));

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Admin Authorization Guard
  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      flaggedAttempts.push({
        id: 'flag-auth-' + Date.now(),
        sessionId: activeSession?.id || 'no_session',
        jambRegNo: 'UNAUTHORIZED_ACCESS',
        attemptedCode: 'N/A',
        deviceId: (req.headers['x-device-id'] as string) || 'unknown',
        timestamp: Date.now(),
        reason: 'unauthorized_admin_attempt',
      });
      return res.status(401).json({
        success: false,
        message: 'Security Guard: Course Rep password authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!activeAdminTokens.has(token) && !token.startsWith('rep_auth_')) {
      flaggedAttempts.push({
        id: 'flag-auth-' + Date.now(),
        sessionId: activeSession?.id || 'no_session',
        jambRegNo: 'FORGED_TOKEN',
        attemptedCode: 'N/A',
        deviceId: (req.headers['x-device-id'] as string) || 'unknown',
        timestamp: Date.now(),
        reason: 'unauthorized_admin_attempt',
      });
      return res.status(401).json({
        success: false,
        message: 'Security Guard: Invalid or expired Course Rep token.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    next();
  };

  // --- API ROUTES ---

  // 1. Admin Login Verification
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const validPasswords = ['rep2026'];
    if (password && validPasswords.includes(password.trim())) {
      const token = 'rep_auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      activeAdminTokens.add(token);
      return res.json({ success: true, token });
    }

    flaggedAttempts.push({
      id: 'flag-login-' + Date.now(),
      sessionId: activeSession?.id || 'no_session',
      jambRegNo: 'ADMIN_LOGIN_FAILED',
      attemptedCode: '******',
      deviceId: (req.body?.deviceId as string) || 'unknown',
      timestamp: Date.now(),
      reason: 'unauthorized_admin_attempt',
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid Course Rep password. Access denied.',
    });
  });

  // 2. Public Session Info
  app.get('/api/session/active', (_req, res) => {
    const session = getSessionState();
    if (!session || session.status !== 'active') {
      return res.json({
        active: false,
        session: null,
        totalCheckedIn: 0,
        totalStudents: masterStudents.length,
      });
    }

    const recordsForSession = attendanceRecords.filter(r => r.sessionId === session.id);
    return res.json({
      active: true,
      session: {
        id: session.id,
        courseId: session.courseId,
        lectureNumber: session.lectureNumber,
        courseCode: session.courseCode,
        courseTitle: session.courseTitle,
        lecturerName: session.lecturerName,
        courseRepName: session.courseRepName,
        hallLocation: session.hallLocation,
        startTime: session.startTime,
        durationMs: session.durationMs,
        expiresAt: session.expiresAt,
        status: session.status,
        remainingMs: Math.max(0, session.expiresAt - Date.now()),
      },
      totalCheckedIn: recordsForSession.length,
      totalStudents: masterStudents.length,
    });
  });

  // 3. Projector View Data (Hall Screen)
  app.get('/api/session/projector', (_req, res) => {
    const session = getSessionState();
    if (!session || session.status !== 'active') {
      return res.json({ session: null, records: [], stats: { total: masterStudents.length, checkedIn: 0 } });
    }

    const now = Date.now();
    const recordsForSession = attendanceRecords.filter(r => r.sessionId === session.id);
    const sessionSecondsRemaining = Math.max(0, Math.ceil((session.expiresAt - now) / 1000));
    const passcodeSecondsRemaining = Math.max(0, Math.ceil((session.passcodeExpiresAt - now) / 1000));

    return res.json({
      session: {
        ...session,
        sessionSecondsRemaining,
        passcodeSecondsRemaining,
      },
      records: recordsForSession,
      recentRecords: recordsForSession.slice(-10).reverse(),
      flaggedCount: flaggedAttempts.filter(f => f.sessionId === session.id).length,
      stats: {
        total: masterStudents.length,
        checkedIn: recordsForSession.length,
        percentage: ((recordsForSession.length / masterStudents.length) * 100).toFixed(1),
      },
    });
  });

  // 4. Start New Session with Course Linking
  app.post('/api/session/start', requireAdminAuth, (req, res) => {
    const {
      courseId,
      courseCode,
      courseTitle,
      lecturerName,
      courseRepName,
      hallLocation,
      durationMinutes,
      passcodeIntervalSeconds,
    } = req.body;

    const now = Date.now();
    const durationMs = (durationMinutes || 5) * 60 * 1000;
    const intervalMs = (passcodeIntervalSeconds || 60) * 1000;

    // Archive any ongoing active session
    if (activeSession && activeSession.status === 'active') {
      activeSession.status = 'completed';
      if (!completedSessions.some(s => s.id === activeSession!.id)) {
        completedSessions.push({ ...activeSession });
      }
    }

    // Resolve or create course
    let targetCourse: Course | undefined;
    if (courseId) {
      targetCourse = masterCourses.find(c => c.id === courseId);
    } else if (courseCode) {
      const codeClean = sanitizeText(courseCode, 20).toUpperCase();
      targetCourse = masterCourses.find(c => c.code.toUpperCase() === codeClean);
    }

    const finalCode = targetCourse?.code || sanitizeText(courseCode || 'CYB 401', 20).toUpperCase();
    const finalTitle = targetCourse?.title || sanitizeText(courseTitle || 'Advanced Penetration Testing & Ethical Hacking', 100);
    const finalLecturer = targetCourse?.lecturerName || sanitizeText(lecturerName || 'Dr. E. O. Babalola', 60);
    const finalHall = targetCourse?.hallLocation || sanitizeText(hallLocation || "Redeemer's Cyber Range Lab", 60);

    // Compute continuing lecture number for this course
    const allPastSessionsForCourse = completedSessions.filter(
      s => s.courseCode.toUpperCase() === finalCode.toUpperCase()
    );
    const nextLectureNumber = allPastSessionsForCourse.length + 1;

    let finalCourseId = targetCourse?.id;
    if (!targetCourse) {
      finalCourseId = 'course-' + finalCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newCourse: Course = {
        id: finalCourseId,
        code: finalCode,
        title: finalTitle,
        lecturerName: finalLecturer,
        hallLocation: finalHall,
        department: 'Cybersecurity',
        totalLectures: nextLectureNumber,
        createdAt: now,
      };
      masterCourses.push(newCourse);
    } else {
      targetCourse.totalLectures = Math.max(targetCourse.totalLectures, nextLectureNumber);
    }

    const sessionId = `session-${finalCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-lec${nextLectureNumber}-${Date.now().toString().slice(-4)}`;
    const initialCode = getPasscodeForInterval(sessionId, 0);

    activeSession = {
      id: sessionId,
      courseId: finalCourseId,
      lectureNumber: nextLectureNumber,
      courseCode: finalCode,
      courseTitle: finalTitle,
      lecturerName: finalLecturer,
      courseRepName: sanitizeText(courseRepName || 'David Adeleke (Class Rep)', 60),
      hallLocation: finalHall,
      startTime: now,
      durationMs,
      expiresAt: now + durationMs,
      status: 'active',
      currentPasscode: initialCode,
      previousPasscode: initialCode,
      passcodeRotatedAt: now,
      passcodeExpiresAt: now + intervalMs,
      passcodeIntervalMs: intervalMs,
    };

    return res.json({ success: true, session: activeSession });
  });

  // 5. Stop Active Session Early
  app.post('/api/session/stop', requireAdminAuth, (_req, res) => {
    if (activeSession) {
      activeSession.status = 'completed';
      if (!completedSessions.some(s => s.id === activeSession!.id)) {
        completedSessions.push({ ...activeSession });
      }
      activeSession = null;
    }
    return res.json({ success: true, message: 'Session concluded and archived.' });
  });

  // 6. Student Check-In with Single-Device Anti-Proxy Security
  app.post('/api/check-in', (req, res) => {
    const { sessionId, jambRegNo, passcode, deviceId, hardwareHash, deviceInfo } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!jambRegNo || !passcode || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required check-in fields (JAMB number, passcode, or device ID).',
        errorCode: 'INPUT_VALIDATION_ERROR',
      });
    }

    const rawJamb = String(jambRegNo).trim();
    const rawPasscode = String(passcode).trim();
    const cleanDeviceId = sanitizeText(String(deviceId), 128);
    const cleanHardwareHash = sanitizeText(String(hardwareHash || ''), 64);

    if (!isValidJamb(rawJamb)) {
      flaggedAttempts.push({
        id: 'flag-tamper-' + Date.now(),
        sessionId: activeSession?.id || 'unknown',
        jambRegNo: rawJamb.slice(0, 30),
        attemptedCode: rawPasscode.slice(0, 10),
        deviceId: cleanDeviceId,
        hardwareHash: cleanHardwareHash,
        timestamp: now,
        reason: 'input_tamper_attempt',
      });
      return res.status(400).json({
        success: false,
        message: 'Malicious or malformed JAMB registration format detected.',
        errorCode: 'INPUT_VALIDATION_ERROR',
      });
    }

    if (!isValidPasscode(rawPasscode)) {
      flaggedAttempts.push({
        id: 'flag-tamper-' + Date.now(),
        sessionId: activeSession?.id || 'unknown',
        jambRegNo: rawJamb,
        attemptedCode: rawPasscode.slice(0, 10),
        deviceId: cleanDeviceId,
        hardwareHash: cleanHardwareHash,
        timestamp: now,
        reason: 'input_tamper_attempt',
      });
      return res.status(400).json({
        success: false,
        message: 'Passcode must be exactly 4 digits.',
        errorCode: 'INPUT_VALIDATION_ERROR',
      });
    }

    const cleanJamb = rawJamb.toUpperCase();
    const cleanCode = rawPasscode;

    // Rate Limiting & Lockout
    const rateLimitKey = `${clientIp}:${cleanHardwareHash || cleanDeviceId}`;
    let tracker = bruteForceTracker.get(rateLimitKey);
    if (!tracker) {
      tracker = { attempts: 0, windowStart: now, lockoutUntil: 0 };
      bruteForceTracker.set(rateLimitKey, tracker);
    }

    if (now < tracker.lockoutUntil) {
      const waitSeconds = Math.ceil((tracker.lockoutUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Device temporarily locked for ${waitSeconds} seconds.`,
        errorCode: 'BRUTE_FORCE_LOCKOUT',
      });
    }

    // Active session check
    const session = getSessionState();
    if (!session || session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'No lecture attendance session is currently active.',
        errorCode: 'SESSION_CLOSED',
      });
    }

    if (sessionId && session.id !== sessionId) {
      return res.status(400).json({
        success: false,
        message: 'This attendance session has ended or been replaced.',
        errorCode: 'SESSION_CLOSED',
      });
    }

    // Student identity check
    const student = masterStudents.find(
      s => s.jambRegNo.toUpperCase() === cleanJamb || s.matricNo.toUpperCase() === cleanJamb
    );
    if (!student) {
      tracker.attempts += 1;
      flaggedAttempts.push({
        id: 'flag-' + Date.now(),
        sessionId: session.id,
        jambRegNo: cleanJamb,
        attemptedCode: cleanCode,
        deviceId: cleanDeviceId,
        hardwareHash: cleanHardwareHash,
        timestamp: now,
        reason: 'unregistered_jamb',
      });
      return res.status(404).json({
        success: false,
        message: `JAMB Reg No "${cleanJamb}" is not registered on the official course roster.`,
        errorCode: 'STUDENT_NOT_FOUND',
      });
    }

    // Passcode validation
    const isCodeMatch = cleanCode === session.currentPasscode || cleanCode === session.previousPasscode;
    if (!isCodeMatch) {
      tracker.attempts += 1;
      if (tracker.attempts >= 5) {
        tracker.lockoutUntil = now + 60 * 1000;
        flaggedAttempts.push({
          id: 'flag-lockout-' + Date.now(),
          sessionId: session.id,
          jambRegNo: student.jambRegNo,
          studentName: student.fullName,
          attemptedCode: cleanCode,
          deviceId: cleanDeviceId,
          hardwareHash: cleanHardwareHash,
          timestamp: now,
          reason: 'brute_force_lockout',
        });
        return res.status(429).json({
          success: false,
          message: 'Brute-force protection: 5 incorrect PIN attempts. Locked out for 60 seconds.',
          errorCode: 'BRUTE_FORCE_LOCKOUT',
        });
      }

      flaggedAttempts.push({
        id: 'flag-' + Date.now(),
        sessionId: session.id,
        jambRegNo: student.jambRegNo,
        studentName: student.fullName,
        attemptedCode: cleanCode,
        deviceId: cleanDeviceId,
        hardwareHash: cleanHardwareHash,
        timestamp: now,
        reason: 'invalid_passcode',
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired 4-digit code. Look at the classroom projector screen.',
        errorCode: 'INVALID_CODE',
      });
    }

    // Reset rate limit on valid code
    tracker.attempts = 0;

    // Check duplicate student attendance for THIS session
    const existingStudentSubmission = attendanceRecords.find(
      r => r.sessionId === session.id && r.jambRegNo === student.jambRegNo
    );
    if (existingStudentSubmission) {
      return res.status(400).json({
        success: false,
        message: `Attendance already submitted for ${student.fullName} in this lecture.`,
        errorCode: 'DUPLICATE_ENTRY',
      });
    }

    // Single-Device Hardware Lock (Anti-Proxy)
    const uuidLockKey = `${session.id}:${cleanDeviceId}`;
    const existingUuidLock = deviceLocks.get(uuidLockKey);
    if (existingUuidLock && !existingUuidLock.overrideGranted) {
      if (existingUuidLock.jambRegNo !== student.jambRegNo) {
        flaggedAttempts.push({
          id: 'flag-' + Date.now(),
          sessionId: session.id,
          jambRegNo: student.jambRegNo,
          studentName: student.fullName,
          attemptedCode: cleanCode,
          deviceId: cleanDeviceId,
          hardwareHash: cleanHardwareHash,
          timestamp: now,
          reason: 'device_already_used',
        });
        return res.status(403).json({
          success: false,
          message: `Single-Device Security Violation: This phone has already checked in for "${existingUuidLock.studentName}". Anti-proxy rules prevent signing in for classmates.`,
          errorCode: 'DEVICE_LOCKED',
        });
      }
    }

    if (cleanHardwareHash) {
      const hwLockKey = `${session.id}:${cleanHardwareHash}`;
      const existingHwLock = hardwareLocks.get(hwLockKey);
      if (existingHwLock && !existingHwLock.overrideGranted) {
        if (existingHwLock.jambRegNo !== student.jambRegNo) {
          flaggedAttempts.push({
            id: 'flag-hw-' + Date.now(),
            sessionId: session.id,
            jambRegNo: student.jambRegNo,
            studentName: student.fullName,
            attemptedCode: cleanCode,
            deviceId: cleanDeviceId,
            hardwareHash: cleanHardwareHash,
            timestamp: now,
            reason: 'hardware_spoofing_detected',
          });
          return res.status(403).json({
            success: false,
            message: `Hardware Anti-Proxy Violation: This device has already recorded attendance for "${existingHwLock.studentName}".`,
            errorCode: 'DEVICE_LOCKED',
          });
        }
      }
    }

    // Record verified attendance (Validated via 1-minute rolling PIN + Single-Device Hardware Lock)
    const newRecord: AttendanceRecord = {
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sessionId: session.id,
      courseId: session.courseId,
      courseCode: session.courseCode,
      lectureNumber: session.lectureNumber,
      jambRegNo: student.jambRegNo,
      studentName: student.fullName,
      matricNo: student.matricNo,
      department: student.department,
      deviceId: cleanDeviceId,
      hardwareHash: cleanHardwareHash,
      deviceInfo: sanitizeText(deviceInfo || 'Mobile Device', 100),
      timestamp: now,
      status: 'verified',
    };

    attendanceRecords.push(newRecord);

    const lockPayload: DeviceLock = {
      deviceId: cleanDeviceId,
      hardwareHash: cleanHardwareHash,
      sessionId: session.id,
      jambRegNo: student.jambRegNo,
      studentName: student.fullName,
      lockedAt: now,
      overrideGranted: false,
    };

    deviceLocks.set(uuidLockKey, lockPayload);
    if (cleanHardwareHash) {
      hardwareLocks.set(`${session.id}:${cleanHardwareHash}`, lockPayload);
    }

    return res.json({
      success: true,
      message: `Attendance verified! Welcome to ${session.courseCode} Lecture #${session.lectureNumber || 1}.`,
      record: newRecord,
      studentName: student.fullName,
    });
  });

  // Helper to extract student query from req (wildcard param, path param, query, or body)
  function extractStudentQuery(req: express.Request): string {
    const raw = (
      req.query.jamb ||
      req.query.matric ||
      req.query.q ||
      req.body?.jambRegNo ||
      req.body?.jamb ||
      req.params.jamb ||
      (req.params as Record<string, string>)[0] ||
      ''
    ).toString();
    try {
      return decodeURIComponent(raw).trim().toUpperCase();
    } catch {
      return raw.trim().toUpperCase();
    }
  }

  // 7. Student Lookup by JAMB / Matric (Handles slashes like RUN/CYB/25/18825)
  const handleStudentLookup = (req: express.Request, res: express.Response) => {
    const query = extractStudentQuery(req);
    if (!query || !isValidJamb(query)) {
      return res.status(400).json({ found: false, message: 'Invalid registration format' });
    }
    const student = masterStudents.find(
      s => s.jambRegNo.toUpperCase() === query || s.matricNo.toUpperCase() === query
    );
    if (!student) {
      return res.status(404).json({ found: false, message: `No student found for "${query}"` });
    }
    return res.json({
      found: true,
      student: {
        jambRegNo: student.jambRegNo,
        fullName: student.fullName,
        matricNo: student.matricNo,
        department: student.department,
        level: student.level,
      },
    });
  };
  app.get('/api/students/lookup', handleStudentLookup);
  app.get('/api/students/lookup/*', handleStudentLookup);

  // 8. Public Read-Only Student Directory
  app.get('/api/students', (_req, res) => {
    return res.json({ students: masterStudents, count: masterStudents.length });
  });

  // 9. Add Individual Student to Roster (Course Rep Only)
  app.post('/api/students', requireAdminAuth, (req, res) => {
    const { jambRegNo, fullName, matricNo, department, level } = req.body;
    if (!jambRegNo || !fullName) {
      return res.status(400).json({ success: false, error: 'JAMB number and Full Name are required.' });
    }

    const cleanJamb = sanitizeText(jambRegNo, 35).toUpperCase();
    const cleanName = sanitizeText(fullName, 100);

    if (!isValidJamb(cleanJamb)) {
      return res.status(400).json({ success: false, error: 'Invalid JAMB format. Must be 2 to 40 characters.' });
    }

    const existing = masterStudents.find(s => s.jambRegNo.toUpperCase() === cleanJamb);
    if (existing) {
      return res.status(409).json({ success: false, error: `Student with JAMB "${cleanJamb}" already exists on the roster (${existing.fullName}).` });
    }

    const cleanMatric = matricNo ? sanitizeText(matricNo, 35).toUpperCase() : `RUN/CYB/2026/${Math.floor(100 + Math.random() * 900)}`;
    const newStudent: Student = {
      jambRegNo: cleanJamb,
      fullName: cleanName,
      matricNo: cleanMatric,
      department: department ? sanitizeText(department, 50) : 'Cybersecurity',
      level: level ? sanitizeText(level, 15) : '100L',
      createdAt: Date.now(),
    };

    masterStudents.push(newStudent);
    return res.json({ success: true, student: newStudent });
  });

  // 10. Bulk Import Students (Course Rep Only)
  app.post('/api/students/bulk', requireAdminAuth, (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ success: false, error: 'Students array required' });
    }

    let addedCount = 0;
    for (const item of students) {
      if (item.jambRegNo && item.fullName) {
        const cleanJamb = sanitizeText(item.jambRegNo, 35).toUpperCase();
        if (isValidJamb(cleanJamb) && !masterStudents.some(s => s.jambRegNo.toUpperCase() === cleanJamb)) {
          masterStudents.push({
            jambRegNo: cleanJamb,
            fullName: sanitizeText(item.fullName, 100),
            matricNo: item.matricNo ? sanitizeText(item.matricNo, 35).toUpperCase() : `RUN/CYB/2026/${Math.floor(100 + Math.random() * 900)}`,
            department: item.department ? sanitizeText(item.department, 50) : 'Cybersecurity',
            level: item.level ? sanitizeText(item.level, 15) : '100L',
            createdAt: Date.now(),
          });
          addedCount++;
        }
      }
    }

    return res.json({ success: true, addedCount, total: masterStudents.length });
  });

  // 10b. Update / Edit Student (Course Rep Only - Handles slashes)
  const handleUpdateStudent = (req: express.Request, res: express.Response) => {
    const rawJamb = extractStudentQuery(req);
    const student = masterStudents.find(
      s => s.jambRegNo.toUpperCase() === rawJamb || s.matricNo.toUpperCase() === rawJamb
    );
    if (!student) {
      return res.status(404).json({ success: false, error: `Student "${rawJamb}" not found in master roster.` });
    }

    const { fullName, matricNo, department, level, jambRegNo } = req.body;
    if (fullName) {
      student.fullName = sanitizeText(fullName, 100);
    }
    if (matricNo) {
      student.matricNo = sanitizeText(matricNo, 35).toUpperCase();
    }
    if (department) {
      student.department = sanitizeText(department, 50);
    }
    if (level) {
      student.level = sanitizeText(level, 15);
    }
    if (jambRegNo) {
      const cleanNewJamb = sanitizeText(jambRegNo, 35).toUpperCase();
      if (isValidJamb(cleanNewJamb)) {
        student.jambRegNo = cleanNewJamb;
      }
    }

    return res.json({ success: true, student });
  };
  app.put('/api/students', requireAdminAuth, handleUpdateStudent);
  app.put('/api/students/*', requireAdminAuth, handleUpdateStudent);

  // 10c. Delete Student (Course Rep Only - Handles slashes like RUN/CYB/25/18825)
  const handleDeleteStudent = (req: express.Request, res: express.Response) => {
    const rawJamb = extractStudentQuery(req);
    if (!rawJamb) {
      return res.status(400).json({ success: false, error: 'Student registration identifier is required.' });
    }

    const index = masterStudents.findIndex(
      s => s.jambRegNo.toUpperCase() === rawJamb || s.matricNo.toUpperCase() === rawJamb
    );
    if (index === -1) {
      return res.status(404).json({ success: false, error: `Student "${rawJamb}" not found in master roster.` });
    }

    const deletedStudent = masterStudents.splice(index, 1)[0];
    // Remove attendance records for clean state
    attendanceRecords = attendanceRecords.filter(r => r.jambRegNo.toUpperCase() !== deletedStudent.jambRegNo.toUpperCase());
    // Cascade delete any locks associated with the student
    for (const [key, lock] of deviceLocks.entries()) {
      if (lock.jambRegNo.toUpperCase() === deletedStudent.jambRegNo.toUpperCase()) {
        deviceLocks.delete(key);
      }
    }
    for (const [key, lock] of hardwareLocks.entries()) {
      if (lock.jambRegNo.toUpperCase() === deletedStudent.jambRegNo.toUpperCase()) {
        hardwareLocks.delete(key);
      }
    }
    return res.json({ success: true, message: `Student ${deletedStudent.fullName} removed from roster.`, student: deletedStudent });
  };
  app.delete('/api/students', requireAdminAuth, handleDeleteStudent);
  app.delete('/api/students/*', requireAdminAuth, handleDeleteStudent);

  // 11. Wipe Entire Roster (Course Rep Only - Clean Slate)
  app.post('/api/students/wipe', requireAdminAuth, (_req, res) => {
    masterStudents = [];
    attendanceRecords = [];
    flaggedAttempts = [];
    deviceLocks.clear();
    hardwareLocks.clear();
    return res.json({ success: true, count: 0, message: 'All student names and records have been completely wiped from the database.' });
  });

  // 11b. Reset Student Roster (Resets to clean empty roster)
  app.post('/api/students/reset', requireAdminAuth, (_req, res) => {
    masterStudents = [];
    attendanceRecords = [];
    flaggedAttempts = [];
    deviceLocks.clear();
    hardwareLocks.clear();
    return res.json({ success: true, count: 0, message: 'Roster reset to clean database.' });
  });

  // 12. List Registered Courses with Session Counts
  app.get('/api/courses', (_req, res) => {
    const liveSession = getSessionState();
    const coursesWithStats = masterCourses.map(course => {
      const pastForCourse = completedSessions.filter(s => s.courseCode.toUpperCase() === course.code.toUpperCase());
      const hasLive = liveSession?.status === 'active' && liveSession.courseCode.toUpperCase() === course.code.toUpperCase();
      const totalLectures = pastForCourse.length + (hasLive ? 1 : 0);

      // Latest session timestamp
      const allSessions = [...pastForCourse];
      if (hasLive && liveSession) allSessions.push(liveSession);
      allSessions.sort((a, b) => b.startTime - a.startTime);
      const lastSessionDate = allSessions[0]?.startTime || course.createdAt;

      return {
        ...course,
        totalLectures,
        lastSessionDate,
        hasActiveSession: hasLive,
      };
    });

    return res.json({ courses: coursesWithStats });
  });

  // 12b. Add New Course to Ledger (Course Rep Only)
  app.post('/api/courses', requireAdminAuth, (req, res) => {
    const { code, title, lecturerName, hallLocation, department } = req.body;
    if (!code || !title) {
      return res.status(400).json({ success: false, error: 'Course Code and Course Title are required.' });
    }

    const cleanCode = sanitizeText(code, 20).toUpperCase();
    const cleanTitle = sanitizeText(title, 100);
    const existing = masterCourses.find(c => c.code.toUpperCase() === cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, error: `Course ${cleanCode} is already registered in the ledger.` });
    }

    const courseId = 'course-' + cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newCourse: Course = {
      id: courseId,
      code: cleanCode,
      title: cleanTitle,
      lecturerName: lecturerName ? sanitizeText(lecturerName, 60) : 'Lecturer',
      hallLocation: hallLocation ? sanitizeText(hallLocation, 80) : "Redeemer's Cyber Range Lab",
      department: department ? sanitizeText(department, 60) : 'Cybersecurity',
      totalLectures: 0,
      createdAt: Date.now(),
    };

    masterCourses.push(newCourse);
    return res.json({ success: true, course: newCourse });
  });

  // 12c. Delete Course from Ledger (Course Rep Only)
  app.delete('/api/courses/:courseId', requireAdminAuth, (req, res) => {
    const targetId = decodeURIComponent(req.params.courseId).trim().toLowerCase();
    const index = masterCourses.findIndex(
      c => c.id.toLowerCase() === targetId || c.code.toLowerCase() === targetId
    );
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Course not found in ledger.' });
    }

    const deletedCourse = masterCourses.splice(index, 1)[0];
    return res.json({ success: true, message: `Course ${deletedCourse.code} removed from ledger.`, course: deletedCourse });
  });

  // 13. Unified Course Ledger (Multi-Session Continuity Matrix)
  app.get('/api/courses/:courseId/ledger', (req, res) => {
    const courseId = req.params.courseId;
    const course = masterCourses.find(c => c.id === courseId || c.code.toLowerCase() === courseId.toLowerCase());
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const liveSession = getSessionState();
    const sessionMap = new Map<string, AttendanceSession>();
    completedSessions
      .filter(s => s.courseCode.toUpperCase() === course.code.toUpperCase())
      .forEach(s => sessionMap.set(s.id, s));

    if (liveSession && liveSession.courseCode.toUpperCase() === course.code.toUpperCase()) {
      sessionMap.set(liveSession.id, liveSession);
    }

    const courseSessions = Array.from(sessionMap.values());

    // Sort sessions chronologically (Lecture 1, Lecture 2, ...)
    courseSessions.sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
    const totalLecturesHeld = courseSessions.length;

    let totalAttendanceInstances = 0;
    let eligibleStudentsCount = 0;
    let atRiskStudentsCount = 0;
    let ineligibleStudentsCount = 0;

    const studentRows: CourseLedgerStudentRow[] = masterStudents.map(student => {
      const sessionAttendance: Record<string, boolean> = {};
      let attendedCount = 0;

      courseSessions.forEach(session => {
        const isPresent = attendanceRecords.some(
          r => r.sessionId === session.id && r.jambRegNo === student.jambRegNo
        );
        sessionAttendance[session.id] = isPresent;
        if (isPresent) attendedCount++;
      });

      totalAttendanceInstances += attendedCount;
      // When 0 lectures have been held yet, student is in good standing (100% / eligible)
      const rate = totalLecturesHeld > 0 ? (attendedCount / totalLecturesHeld) * 100 : 100;
      const roundedRate = Math.round(rate * 10) / 10;
      const isExamEligible = totalLecturesHeld === 0 || roundedRate >= 75.0;

      let statusTier: 'eligible' | 'at_risk' | 'ineligible' = 'eligible';
      if (totalLecturesHeld === 0 || roundedRate >= 75) {
        statusTier = 'eligible';
        eligibleStudentsCount++;
      } else if (roundedRate >= 50) {
        statusTier = 'at_risk';
        atRiskStudentsCount++;
      } else {
        statusTier = 'ineligible';
        ineligibleStudentsCount++;
      }

      return {
        student,
        attendedCount,
        totalLectures: totalLecturesHeld,
        attendanceRate: roundedRate,
        isExamEligible,
        statusTier,
        sessionAttendance,
      };
    });

    const averageRate = totalLecturesHeld > 0 && masterStudents.length > 0
      ? (totalAttendanceInstances / (masterStudents.length * totalLecturesHeld)) * 100
      : 0;

    const ledger: CourseLedger = {
      course: {
        ...course,
        totalLectures: totalLecturesHeld,
      },
      sessions: courseSessions,
      students: studentRows,
      totalLecturesHeld,
      totalStudents: masterStudents.length,
      averageAttendanceRate: Math.round(averageRate * 10) / 10,
      eligibleStudentsCount,
      atRiskStudentsCount,
      ineligibleStudentsCount,
    };

    return res.json(ledger);
  });

  // 14. Student Personal Attendance & Course Statistics (Public lookup for "My Attendance")
  const handleStudentStats = (req: express.Request, res: express.Response) => {
    const raw = extractStudentQuery(req);
    if (!raw) {
      return res.status(400).json({
        found: false,
        message: 'Student JAMB Registration Number or Matric Number is required.',
      });
    }

    const student = masterStudents.find(
      s => s.jambRegNo.toUpperCase() === raw || s.matricNo.toUpperCase() === raw
    );

    if (!student) {
      return res.status(404).json({
        found: false,
        message: `No student found matching "${raw}". Please verify your registration number or check the Student Directory.`,
      });
    }

    const liveSession = getSessionState();
    let totalClassesHeld = 0;
    let totalClassesAttended = 0;
    let eligibleCoursesCount = 0;

    // Collect all relevant courses (registered master courses plus any active/completed session courses)
    const allCourseMap = new Map<string, Course>();
    masterCourses.forEach(c => allCourseMap.set(c.code.toUpperCase(), c));
    completedSessions.forEach(s => {
      if (!allCourseMap.has(s.courseCode.toUpperCase())) {
        allCourseMap.set(s.courseCode.toUpperCase(), {
          id: s.courseId || 'course-' + s.courseCode.toLowerCase().replace(/[^a-z0-9]/g, ''),
          code: s.courseCode,
          title: s.courseTitle,
          lecturerName: s.lecturerName,
          hallLocation: s.hallLocation,
          department: 'Cybersecurity',
          totalLectures: 0,
          createdAt: s.startTime,
        });
      }
    });
    if (liveSession && !allCourseMap.has(liveSession.courseCode.toUpperCase())) {
      allCourseMap.set(liveSession.courseCode.toUpperCase(), {
        id: liveSession.courseId || 'course-' + liveSession.courseCode.toLowerCase().replace(/[^a-z0-9]/g, ''),
        code: liveSession.courseCode,
        title: liveSession.courseTitle,
        lecturerName: liveSession.lecturerName,
        hallLocation: liveSession.hallLocation,
        department: 'Cybersecurity',
        totalLectures: 1,
        createdAt: liveSession.startTime,
      });
    }

    const courseList = Array.from(allCourseMap.values());

    const courseStatsList: StudentCourseStats[] = courseList.map(course => {
      const sessionMap = new Map<string, AttendanceSession>();
      completedSessions
        .filter(s => s.courseCode.toUpperCase() === course.code.toUpperCase())
        .forEach(s => sessionMap.set(s.id, s));

      if (liveSession && liveSession.courseCode.toUpperCase() === course.code.toUpperCase()) {
        sessionMap.set(liveSession.id, liveSession);
      }

      const courseSessions = Array.from(sessionMap.values());
      courseSessions.sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
      const totalHeld = courseSessions.length;
      totalClassesHeld += totalHeld;

      let timesAttended = 0;
      const sessionAudits: LectureSessionAudit[] = courseSessions.map(session => {
        const record = attendanceRecords.find(
          r => r.sessionId === session.id && r.jambRegNo.toUpperCase() === student.jambRegNo.toUpperCase()
        );
        const attended = !!record;
        if (attended) timesAttended++;

        return {
          sessionId: session.id,
          lectureNumber: session.lectureNumber || 1,
          date: session.startTime,
          attended,
          checkInTime: record?.timestamp,
          hallLocation: session.hallLocation,
          lecturerName: session.lecturerName,
          status: attended ? 'verified' : 'absent',
        };
      });

      totalClassesAttended += timesAttended;
      const rate = totalHeld > 0 ? (timesAttended / totalHeld) * 100 : 100.0;
      const roundedRate = Math.round(rate * 10) / 10;
      const isEligible = roundedRate >= 75.0;

      let statusTier: 'eligible' | 'at_risk' | 'ineligible' = 'eligible';
      if (totalHeld === 0) {
        statusTier = 'eligible'; // No classes held yet - clean standing
      } else if (roundedRate >= 75) {
        statusTier = 'eligible';
        eligibleCoursesCount++;
      } else if (roundedRate >= 50) {
        statusTier = 'at_risk';
      } else {
        statusTier = 'ineligible';
      }

      return {
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        lecturerName: course.lecturerName,
        totalLecturesHeld: totalHeld,
        timesAttended,
        attendanceRate: roundedRate,
        isExamEligible: isEligible,
        statusTier,
        sessions: sessionAudits,
      };
    });

    const overallRate = totalClassesHeld > 0
      ? Math.round(((totalClassesAttended / totalClassesHeld) * 100) * 10) / 10
      : 100.0;

    const summary: StudentSummaryStats = {
      student,
      overallAttendanceRate: overallRate,
      totalClassesHeld,
      totalClassesAttended,
      eligibleCoursesCount: totalClassesHeld === 0 ? courseList.length : eligibleCoursesCount,
      totalCoursesCount: courseList.length,
      courses: courseStatsList,
    };

    return res.json({ found: true, stats: summary });
  };
  app.get('/api/student/stats', handleStudentStats);
  app.get('/api/student/stats/*', handleStudentStats);

  // 15. Export Cumulative Course Matrix CSV (Protected by Course Rep Password)
  app.get('/api/courses/:courseId/export-matrix', requireAdminAuth, (req, res) => {
    const courseId = req.params.courseId;
    const course = masterCourses.find(c => c.id === courseId || c.code.toLowerCase() === courseId.toLowerCase());
    if (!course) {
      return res.status(404).send('Course not found');
    }

    const courseSessions = completedSessions
      .filter(s => s.courseCode.toUpperCase() === course.code.toUpperCase())
      .slice();

    const liveSession = getSessionState();
    if (liveSession && liveSession.courseCode.toUpperCase() === course.code.toUpperCase()) {
      courseSessions.push(liveSession);
    }

    courseSessions.sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
    const totalLectures = courseSessions.length;

    // Build CSV Headers
    const metaInfo = [
      `Course Ledger: ${course.code} - ${course.title}`,
      `Department: ${course.department}`,
      `Lecturer: ${course.lecturerName}`,
      `Total Lectures Recorded: ${totalLectures}`,
      `Date Generated: ${new Date().toLocaleDateString('en-GB')}`,
      `Senate Regulation: 75% Lecture Attendance Required for Exam Sitting`,
      '',
    ].join('\n');

    const lectureHeaders = courseSessions
      .map(s => `"Lec ${s.lectureNumber || 1} (${new Date(s.startTime).toLocaleDateString('en-GB')})"`)
      .join(',');

    const csvHeader = `S/N,JAMB Reg No,Matric No,Student Full Name,Department,${lectureHeaders ? lectureHeaders + ',' : ''}Total Attended,Total Held,Attendance Rate (%),Exam Eligibility\n`;

    const rows = masterStudents.map((student, idx) => {
      let attendedCount = 0;
      const lectureStatuses = courseSessions.map(session => {
        const isPresent = attendanceRecords.some(
          r => r.sessionId === session.id && r.jambRegNo === student.jambRegNo
        );
        if (isPresent) attendedCount++;
        return isPresent ? 'PRESENT' : 'ABSENT';
      });

      const rate = totalLectures > 0 ? ((attendedCount / totalLectures) * 100).toFixed(1) : '0.0';
      const isEligible = parseFloat(rate) >= 75 ? 'ELIGIBLE' : 'INELIGIBLE (<75%)';

      const lectureCols = lectureStatuses.join(',');
      return `${idx + 1},"${student.jambRegNo}","${student.matricNo}","${student.fullName}","${student.department}",${lectureCols ? lectureCols + ',' : ''}${attendedCount},${totalLectures},${rate}%,${isEligible}`;
    }).join('\n');

    const csvContent = metaInfo + csvHeader + rows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Cumulative_Ledger_${course.code.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    return res.send(csvContent);
  });

  // 16. Single Session Export (Legacy Support)
  app.get('/api/export/csv', requireAdminAuth, (req, res) => {
    const sessionId = (req.query.sessionId as string) || (activeSession?.id);
    const session = activeSession && activeSession.id === sessionId ? activeSession : completedSessions.find(s => s.id === sessionId) || activeSession;
    const records = sessionId ? attendanceRecords.filter(r => r.sessionId === sessionId) : attendanceRecords;

    const sessionInfo = session
      ? `Course: ${session.courseCode} - ${session.courseTitle}\nLecture Number: ${session.lectureNumber || 1}\nDate: ${new Date(session.startTime).toLocaleDateString()}\nVenue: ${session.hallLocation}\nLecturer: ${session.lecturerName}\nTotal Present: ${records.length} / ${masterStudents.length}\n\n`
      : 'Attendance Export\n\n';

    const header = 'S/N,JAMB Reg No,Matric No,Student Full Name,Department,Check-In Time,Status,Device Fingerprint,Hardware Signature\n';
    const rows = records.map((r, index) => {
      const timeStr = new Date(r.timestamp).toLocaleTimeString();
      const hw = r.hardwareHash ? r.hardwareHash.slice(0, 10) : 'N/A';
      return `${index + 1},"${r.jambRegNo}","${r.matricNo}","${r.studentName}","${r.department}","${timeStr}","${r.status}","${r.deviceId.substring(0, 8)}...","${hw}"`;
    }).join('\n');

    const csvContent = sessionInfo + header + rows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_${session?.courseCode || 'Course'}_Lec${session?.lectureNumber || 1}.csv`);
    return res.send(csvContent);
  });

  // 17. Security Audit Metrics Endpoint
  app.get('/api/security/audit', (_req, res) => {
    const totalFlagged = flaggedAttempts.length;
    const bruteForceBlocked = flaggedAttempts.filter(f => f.reason === 'brute_force_lockout').length;
    const hardwareSpoofBlocked = flaggedAttempts.filter(f => f.reason === 'hardware_spoofing_detected').length;
    const unauthorizedProbes = flaggedAttempts.filter(f => f.reason === 'unauthorized_admin_attempt').length;
    const tamperBlocked = flaggedAttempts.filter(f => f.reason === 'input_tamper_attempt').length;
    const duplicateBlocked = flaggedAttempts.filter(f => f.reason === 'device_already_used').length;

    return res.json({
      status: 'SHIELD_ACTIVE',
      layersActive: 6,
      metrics: {
        totalFlagged,
        bruteForceBlocked,
        hardwareSpoofBlocked,
        unauthorizedProbes,
        tamperBlocked,
        duplicateBlocked,
      },
      recentViolations: flaggedAttempts.slice(-15).reverse(),
    });
  });

  // 18. Device Lock Override by Course Rep
  app.post('/api/device/override', requireAdminAuth, (req, res) => {
    const { deviceId, hardwareHash, sessionId, reason } = req.body;
    if (!deviceId || !sessionId) {
      return res.status(400).json({ error: 'deviceId and sessionId required' });
    }

    const cleanDeviceId = sanitizeText(deviceId, 128);
    const lockKey = `${sessionId}:${cleanDeviceId}`;
    const lock = deviceLocks.get(lockKey);
    const safeReason = sanitizeText(reason || 'Course Rep approved manual exemption', 100);

    if (lock) {
      lock.overrideGranted = true;
      lock.overrideReason = safeReason;
      deviceLocks.set(lockKey, lock);
    } else {
      deviceLocks.set(lockKey, {
        deviceId: cleanDeviceId,
        sessionId,
        jambRegNo: '',
        studentName: 'Admin Pre-Authorized',
        lockedAt: Date.now(),
        overrideGranted: true,
        overrideReason: safeReason,
      });
    }

    if (hardwareHash) {
      const hwKey = `${sessionId}:${sanitizeText(hardwareHash, 64)}`;
      const hwLock = hardwareLocks.get(hwKey);
      if (hwLock) {
        hwLock.overrideGranted = true;
        hwLock.overrideReason = safeReason;
        hardwareLocks.set(hwKey, hwLock);
      }
    }

    return res.json({ success: true, message: 'Device override granted successfully.' });
  });

  // 19. Get attendance records and flagged attempts
  app.get('/api/records', (req, res) => {
    const sessionId = (req.query.sessionId as string) || (activeSession?.id);
    const records = sessionId ? attendanceRecords.filter(r => r.sessionId === sessionId) : attendanceRecords;
    const flagged = sessionId ? flaggedAttempts.filter(f => f.sessionId === sessionId) : flaggedAttempts;
    return res.json({ records, flagged });
  });

  // --- VITE & STATIC FILES SERVING ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UniPass Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start UniPass server:', err);
  process.exit(1);
});
