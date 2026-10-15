import {
  Student,
  Course,
  AttendanceSession,
  AttendanceRecord,
  FlaggedProxyAttempt,
  CheckInResponse,
  CourseLedger,
  StudentSummaryStats,
} from '../types/attendance.ts';
import { SEED_STUDENTS } from '../data/seedStudents.ts';

// Deterministic 4-digit code generator matching server logic
export function generateLocalPasscode(sessionId: string, intervalIndex: number): string {
  let hash = 0;
  const str = `${sessionId}_int_${intervalIndex}_unipass_salt_2024`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = Math.abs(hash) % 9000 + 1000;
  return codeNum.toString();
}

// In-browser fallback state store
const STORAGE_PREFIX = 'unipass_';

function getStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

export interface SecurityAuditData {
  status: string;
  layersActive: number;
  metrics: {
    totalFlagged: number;
    bruteForceBlocked: number;
    hardwareSpoofBlocked: number;
    unauthorizedProbes: number;
    tamperBlocked: number;
    duplicateBlocked: number;
  };
  recentViolations: FlaggedProxyAttempt[];
}

export class AttendanceApiService {
  private static getAdminAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('unipass_admin_token') || 'rep_auth_master_token_2024';
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Public active session check
  static async getActiveSession(): Promise<{
    active: boolean;
    session: AttendanceSession | null;
    totalCheckedIn: number;
    totalStudents: number;
  }> {
    try {
      const res = await fetch('/api/session/active');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const session = getStored<AttendanceSession | null>('active_session', null);
    const records = getStored<AttendanceRecord[]>('records', []);
    const students = getStored<Student[]>('students', SEED_STUDENTS);

    if (!session || Date.now() > session.expiresAt || session.status !== 'active') {
      return {
        active: false,
        session: null,
        totalCheckedIn: 0,
        totalStudents: students.length,
      };
    }

    const sessionRecords = records.filter(r => r.sessionId === session.id);
    return {
      active: true,
      session,
      totalCheckedIn: sessionRecords.length,
      totalStudents: students.length,
    };
  }

  // Projector view data
  static async getProjectorData(): Promise<{
    session: (AttendanceSession & { sessionSecondsRemaining: number; passcodeSecondsRemaining: number }) | null;
    records: AttendanceRecord[];
    recentRecords: AttendanceRecord[];
    flaggedCount: number;
    stats: { total: number; checkedIn: number; percentage: string };
  }> {
    try {
      const res = await fetch('/api/session/projector');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    let session = getStored<AttendanceSession | null>('active_session', null);
    const records = getStored<AttendanceRecord[]>('records', []);
    const flagged = getStored<FlaggedProxyAttempt[]>('flagged', []);
    const students = getStored<Student[]>('students', SEED_STUDENTS);

    const now = Date.now();
    if (!session) {
      const sessionId = 'session-' + now;
      const durationMs = 5 * 60 * 1000;
      const intervalMs = 60 * 1000;
      session = {
        id: sessionId,
        courseCode: 'CYB 401',
        courseTitle: 'Advanced Penetration Testing & Ethical Hacking',
        lecturerName: 'Dr. E. O. Babalola',
        courseRepName: 'David Adeleke (Class Rep)',
        hallLocation: "Redeemer's Cyber Range Lab",
        startTime: now,
        durationMs,
        expiresAt: now + durationMs,
        status: 'active',
        currentPasscode: generateLocalPasscode(sessionId, 0),
        previousPasscode: generateLocalPasscode(sessionId, 0),
        passcodeRotatedAt: now,
        passcodeExpiresAt: now + intervalMs,
        passcodeIntervalMs: intervalMs,
      };
      setStored('active_session', session);
    }

    const sessionRecords = records.filter(r => r.sessionId === session!.id);
    const sessionSecondsRemaining = Math.max(0, Math.ceil((session.expiresAt - now) / 1000));
    const passcodeSecondsRemaining = Math.max(0, Math.ceil((session.passcodeExpiresAt - now) / 1000));

    return {
      session: {
        ...session,
        sessionSecondsRemaining,
        passcodeSecondsRemaining,
      },
      records: sessionRecords,
      recentRecords: sessionRecords.slice(-10).reverse(),
      flaggedCount: flagged.filter(f => f.sessionId === session!.id).length,
      stats: {
        total: students.length,
        checkedIn: sessionRecords.length,
        percentage: ((sessionRecords.length / students.length) * 100).toFixed(1),
      },
    };
  }

  // Student check-in
  static async checkIn(params: {
    sessionId?: string;
    jambRegNo: string;
    passcode: string;
    deviceId: string;
    hardwareHash?: string;
    deviceInfo?: string;
    userLat?: number;
    userLng?: number;
  }): Promise<CheckInResponse> {
    return this.submitCheckIn({
      ...params,
      sessionId: params.sessionId || '',
    });
  }

  static async submitCheckIn(params: {
    sessionId: string;
    jambRegNo: string;
    passcode: string;
    deviceId: string;
    hardwareHash?: string;
    deviceInfo?: string;
    userLat?: number;
    userLng?: number;
  }): Promise<CheckInResponse> {
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch {
      // Local Fallback simulation
    }

    const cleanJamb = params.jambRegNo.trim().toUpperCase();
    const cleanCode = params.passcode.trim();
    const now = Date.now();

    const session = getStored<AttendanceSession | null>('active_session', null);
    if (!session || session.status !== 'active' || now > session.expiresAt) {
      return {
        success: false,
        message: 'No attendance session is currently active.',
        errorCode: 'SESSION_CLOSED',
      };
    }

    const students = getStored<Student[]>('students', SEED_STUDENTS);
    const records = getStored<AttendanceRecord[]>('records', []);
    const flagged = getStored<FlaggedProxyAttempt[]>('flagged', []);
    const locks = getStored<Record<string, { jambRegNo: string; studentName: string; override: boolean }>>('device_locks', {});

    const student = students.find(s => s.jambRegNo.toUpperCase() === cleanJamb || s.matricNo.toUpperCase() === cleanJamb);

    if (!student) {
      return {
        success: false,
        message: `JAMB Reg No '${cleanJamb}' is not in the accredited class list. Please confirm with your Course Rep.`,
        errorCode: 'STUDENT_NOT_FOUND',
      };
    }

    const elapsed = now - session.startTime;
    const intervalIdx = Math.max(0, Math.floor(elapsed / session.passcodeIntervalMs));
    const currCode = generateLocalPasscode(session.id, intervalIdx);
    const prevCode = intervalIdx > 0 ? generateLocalPasscode(session.id, intervalIdx - 1) : currCode;

    if (cleanCode !== currCode && cleanCode !== prevCode) {
      flagged.push({
        id: 'flag-' + now,
        sessionId: session.id,
        jambRegNo: student.jambRegNo,
        studentName: student.fullName,
        attemptedCode: cleanCode,
        deviceId: params.deviceId,
        hardwareHash: params.hardwareHash,
        timestamp: now,
        reason: 'invalid_passcode',
      });
      setStored('flagged', flagged);
      return {
        success: false,
        message: 'Invalid or expired 4-digit passcode. Look up at the lecture hall projector for the latest PIN.',
        errorCode: 'INVALID_CODE',
      };
    }

    // Duplicate check
    const existing = records.find(r => r.sessionId === session.id && r.jambRegNo === student.jambRegNo);
    if (existing) {
      return {
        success: false,
        message: `Attendance already verified for ${student.fullName}.`,
        record: existing,
        studentName: student.fullName,
        errorCode: 'DUPLICATE_ENTRY',
      };
    }

    // Single-device check
    const lockKey = `${session.id}:${params.deviceId}`;
    const existingLock = locks[lockKey];
    if (existingLock && !existingLock.override && existingLock.jambRegNo !== student.jambRegNo) {
      flagged.push({
        id: 'flag-' + now,
        sessionId: session.id,
        jambRegNo: student.jambRegNo,
        studentName: student.fullName,
        attemptedCode: cleanCode,
        deviceId: params.deviceId,
        hardwareHash: params.hardwareHash,
        timestamp: now,
        reason: 'device_already_used',
      });
      setStored('flagged', flagged);
      return {
        success: false,
        message: `Single-Device Security Violation: This mobile device has already recorded attendance for "${existingLock.studentName}". Anti-proxy rules prevent signing in for other students.`,
        errorCode: 'DEVICE_LOCKED',
      };
    }

    const newRecord: AttendanceRecord = {
      id: 'rec-' + now,
      sessionId: session.id,
      courseCode: session.courseCode,
      lectureNumber: session.lectureNumber || 1,
      jambRegNo: student.jambRegNo,
      studentName: student.fullName,
      matricNo: student.matricNo,
      department: student.department,
      deviceId: params.deviceId,
      hardwareHash: params.hardwareHash,
      deviceInfo: params.deviceInfo || 'Mobile Web Device',
      timestamp: now,
      status: 'verified',
    };

    records.push(newRecord);
    setStored('records', records);

    locks[lockKey] = {
      jambRegNo: student.jambRegNo,
      studentName: student.fullName,
      override: false,
    };
    if (params.hardwareHash) {
      locks[`${session.id}:${params.hardwareHash}`] = {
        jambRegNo: student.jambRegNo,
        studentName: student.fullName,
        override: false,
      };
    }
    setStored('device_locks', locks);

    return {
      success: true,
      message: 'Attendance recorded successfully!',
      record: newRecord,
      studentName: student.fullName,
    };
  }

  // Lookup student name by JAMB
  static async lookupStudent(jamb: string): Promise<{ found: boolean; student?: Partial<Student> }> {
    const clean = jamb.trim().toUpperCase();
    try {
      const res = await fetch(`/api/students/lookup?jamb=${encodeURIComponent(clean)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Local fallback
    }

    const students = getStored<Student[]>('students', []);
    const student = students.find(s => s.jambRegNo.toUpperCase() === clean || s.matricNo.toUpperCase() === clean);
    if (!student) return { found: false };
    return {
      found: true,
      student: {
        jambRegNo: student.jambRegNo,
        fullName: student.fullName,
        matricNo: student.matricNo,
        department: student.department,
        level: student.level,
      },
    };
  }

  // Start Session (Protected)
  static async startSession(data: {
    courseId?: string;
    courseCode: string;
    courseTitle: string;
    hallLocation: string;
    lecturerName?: string;
    courseRepName?: string;
    durationMinutes?: number;
    passcodeIntervalSeconds?: number;
    latitude?: number;
    longitude?: number;
    geofenceRadius?: number;
  }): Promise<AttendanceSession> {
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.session;
      }
    } catch {
      // Fallback
    }

    const now = Date.now();
    const durationMs = (data.durationMinutes || 5) * 60 * 1000;
    const intervalMs = (data.passcodeIntervalSeconds || 60) * 1000;
    const sessionId = 'session-' + now;
    const initialCode = generateLocalPasscode(sessionId, 0);

    const newSession: AttendanceSession = {
      id: sessionId,
      courseId: data.courseId,
      lectureNumber: 1,
      courseCode: data.courseCode || 'CYB 401',
      courseTitle: data.courseTitle || 'Advanced Penetration Testing & Ethical Hacking',
      lecturerName: data.lecturerName || 'Dr. E. O. Babalola',
      courseRepName: data.courseRepName || 'David Adeleke',
      hallLocation: data.hallLocation || "Redeemer's Cyber Range Lab",
      startTime: now,
      durationMs,
      expiresAt: now + durationMs,
      status: 'active',
      currentPasscode: initialCode,
      previousPasscode: initialCode,
      passcodeRotatedAt: now,
      passcodeExpiresAt: now + intervalMs,
      passcodeIntervalMs: intervalMs,
      latitude: data.latitude || 7.6983,
      longitude: data.longitude || 4.4239,
      geofenceRadius: data.geofenceRadius || 60,
    };

    setStored('active_session', newSession);
    return newSession;
  }

  // Stop Session (Protected)
  static async stopSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/session/stop', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
      });
      if (res.ok) {
        setStored('active_session', null);
        return true;
      }
    } catch {
      // Fallback
    }

    const session = getStored<AttendanceSession | null>('active_session', null);
    if (session) {
      session.status = 'completed';
      setStored('active_session', null);
    }
    return true;
  }

  // Get Courses List
  static async getCourses(): Promise<{ courses: Course[] }> {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return {
      courses: [
        {
          id: 'course-cyb201',
          code: 'CYB 201',
          title: 'Introduction to Cybersecurity & Information Assurance',
          lecturerName: 'Dr. E. O. Babalola',
          hallLocation: 'Faculty of Computing & Digital Tech Lab 1',
          department: 'Cybersecurity',
          totalLectures: 1,
          createdAt: Date.now(),
        },
        {
          id: 'course-cyb202',
          code: 'CYB 202',
          title: 'Fundamentals of Cryptography & Network Defense',
          lecturerName: 'Prof. O. K. Adeleke',
          hallLocation: 'FCDT Lecture Auditorium',
          department: 'Cybersecurity',
          totalLectures: 0,
          createdAt: Date.now(),
        },
        {
          id: 'course-cyb301',
          code: 'CYB 301',
          title: 'Digital Forensics, Threat Intelligence & Incident Response',
          lecturerName: 'Dr. Mrs. A. Funmilayo',
          hallLocation: "Redeemer's Cyber Range Lab",
          department: 'Cybersecurity',
          totalLectures: 0,
          createdAt: Date.now(),
        },
        {
          id: 'course-cyb401',
          code: 'CYB 401',
          title: 'Advanced Penetration Testing & Ethical Hacking',
          lecturerName: 'Engr. K. Balogun',
          hallLocation: "Redeemer's Cyber Range Lab",
          department: 'Cybersecurity',
          totalLectures: 0,
          createdAt: Date.now(),
        },
      ],
    };
  }

  // Get Course Ledger (Protected / Admin view)
  static async getCourseLedger(courseId: string): Promise<CourseLedger | null> {
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/ledger`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return null;
  }

  // Get Student Personal Attendance Analytics (Public for student lookup)
  static async getStudentStats(jambOrMatric: string): Promise<{ found: boolean; stats?: StudentSummaryStats; message?: string }> {
    const clean = jambOrMatric.trim().toUpperCase();
    try {
      const res = await fetch(`/api/student/stats?jamb=${encodeURIComponent(clean)}`);
      return await res.json();
    } catch {
      return { found: false, message: 'Unable to connect to server. Please try again.' };
    }
  }

  // Export Course Matrix CSV
  static async exportCourseMatrixCsv(courseId: string): Promise<Blob | null> {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('unipass_admin_token') || 'rep_auth_master_token_2024' : '';
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/export-matrix`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        return await res.blob();
      }
    } catch {
      // Fallback
    }
    return null;
  }

  // Get All Students
  static async getStudents(): Promise<Student[]> {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.students)) {
          setStored('students', json.students);
          return json.students;
        }
      }
    } catch {
      // Fallback
    }
    return getStored<Student[]>('students', []);
  }

  // Add individual student
  static async addStudent(studentData: Partial<Student>): Promise<{ success: boolean; student?: Student; error?: string }> {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
        body: JSON.stringify(studentData),
      });
      const data = await res.json();
      if (res.ok && data.success && data.student) {
        const current = getStored<Student[]>('students', []);
        const cleanJamb = data.student.jambRegNo.toUpperCase();
        if (!current.some(s => s.jambRegNo.toUpperCase() === cleanJamb)) {
          setStored('students', [...current, data.student]);
        }
        return data;
      }
      return { success: false, error: data.error || 'Failed to add student to directory' };
    } catch {
      // Fallback in case of temporary network issue
      if (studentData.jambRegNo && studentData.fullName) {
        const current = getStored<Student[]>('students', []);
        const cleanJamb = studentData.jambRegNo.trim().toUpperCase();
        if (current.some(s => s.jambRegNo.toUpperCase() === cleanJamb)) {
          return { success: false, error: `Student with JAMB "${cleanJamb}" already exists.` };
        }
        const newStudent: Student = {
          jambRegNo: cleanJamb,
          fullName: studentData.fullName.trim(),
          matricNo: studentData.matricNo?.trim().toUpperCase() || `RUN/CYB/2026/${Math.floor(100 + Math.random() * 900)}`,
          department: studentData.department || 'Cybersecurity',
          level: studentData.level || '100L',
          createdAt: Date.now(),
        };
        setStored('students', [...current, newStudent]);
        return { success: true, student: newStudent };
      }
      return { success: false, error: 'Network error adding student' };
    }
  }

  // Bulk import students
  static async bulkImportStudents(students: Partial<Student>[]): Promise<{ success: boolean; addedCount: number; error?: string }> {
    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh local cache
        const refreshed = await this.getStudents();
        setStored('students', refreshed);
        return data;
      }
      return { success: false, addedCount: 0, error: data.error };
    } catch {
      return { success: false, addedCount: 0, error: 'Network error bulk importing' };
    }
  }

  // Update student (Edit)
  static async updateStudent(jambRegNo: string, updatedData: Partial<Student>): Promise<{ success: boolean; student?: Student; error?: string }> {
    const cleanJamb = jambRegNo.trim().toUpperCase();
    try {
      const res = await fetch(`/api/students?jamb=${encodeURIComponent(cleanJamb)}`, {
        method: 'PUT',
        headers: this.getAdminAuthHeaders(),
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (data.success && data.student) {
        const current = getStored<Student[]>('students', []);
        setStored('students', current.map(s => (s.jambRegNo.toUpperCase() === cleanJamb ? data.student! : s)));
      }
      return data;
    } catch {
      return { success: false, error: 'Network error updating student' };
    }
  }

  // Delete student
  static async deleteStudent(jambRegNo: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanJamb = jambRegNo.trim().toUpperCase();
    try {
      const res = await fetch(`/api/students?jamb=${encodeURIComponent(cleanJamb)}`, {
        method: 'DELETE',
        headers: this.getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const current = getStored<Student[]>('students', []);
        setStored('students', current.filter(s => s.jambRegNo.toUpperCase() !== cleanJamb && s.matricNo.toUpperCase() !== cleanJamb));
      }
      return data;
    } catch {
      // Local storage fallback removal
      const current = getStored<Student[]>('students', []);
      setStored('students', current.filter(s => s.jambRegNo.toUpperCase() !== cleanJamb && s.matricNo.toUpperCase() !== cleanJamb));
      return { success: true, message: `Student removed from roster.` };
    }
  }

  // Wipe All Students (Completely clean slate)
  static async wipeAllStudents(): Promise<boolean> {
    try {
      await fetch('/api/students/wipe', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
      });
    } catch {
      // Fallback
    }
    setStored('students', []);
    setStored('records', []);
    setStored('device_locks', {});
    return true;
  }

  // Reset student roster
  static async resetStudents(): Promise<Student[]> {
    try {
      await fetch('/api/students/reset', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
      });
    } catch {
      // Fallback
    }
    setStored('students', []);
    return [];
  }

  // Override device lock
  static async overrideDevice(sessionId: string, deviceId: string, hardwareHash?: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/device/override', {
        method: 'POST',
        headers: this.getAdminAuthHeaders(),
        body: JSON.stringify({ sessionId, deviceId, hardwareHash, reason }),
      });
      return res.ok;
    } catch {
      // Fallback
    }
    return true;
  }

  // Export single session CSV
  static async exportAttendanceCsv(sessionId?: string): Promise<Blob | null> {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('unipass_admin_token') || 'rep_auth_master_token_2024' : '';
      const res = await fetch(`/api/export/csv${sessionId ? `?sessionId=${sessionId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        return await res.blob();
      }
    } catch {
      // Fallback
    }
    return null;
  }

  // Security Audit metrics
  static async getSecurityAudit(): Promise<SecurityAuditData | null> {
    try {
      const res = await fetch('/api/security/audit');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const flagged = getStored<FlaggedProxyAttempt[]>('flagged', []);
    return {
      status: 'SHIELD_ACTIVE',
      layersActive: 6,
      metrics: {
        totalFlagged: flagged.length,
        bruteForceBlocked: flagged.filter(f => f.reason === 'brute_force_lockout').length,
        hardwareSpoofBlocked: flagged.filter(f => f.reason === 'hardware_spoofing_detected').length,
        unauthorizedProbes: flagged.filter(f => f.reason === 'unauthorized_admin_attempt').length,
        tamperBlocked: flagged.filter(f => f.reason === 'input_tamper_attempt').length,
        duplicateBlocked: flagged.filter(f => f.reason === 'device_already_used').length,
      },
      recentViolations: flagged.slice(-15).reverse(),
    };
  }

  // Admin Authentication Methods
  static async loginAdmin(password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('unipass_admin_auth', 'true');
          if (data.token) {
            sessionStorage.setItem('unipass_admin_token', data.token);
          }
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Incorrect password' };
    } catch {
      const valid = ['rep2026'];
      if (valid.includes(password.trim())) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('unipass_admin_auth', 'true');
          sessionStorage.setItem('unipass_admin_token', 'rep_auth_local_fallback');
        }
        return { success: true };
      }
      return { success: false, message: 'Incorrect password' };
    }
  }

  static isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('unipass_admin_auth') === 'true';
  }

  static logoutAdmin(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('unipass_admin_auth');
      sessionStorage.removeItem('unipass_admin_token');
    }
  }
}
