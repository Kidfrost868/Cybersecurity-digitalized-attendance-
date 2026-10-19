export interface Student {
  jambRegNo: string;
  fullName: string;
  matricNo: string;
  department: string;
  level: string;
  phone?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  lecturerName: string;
  hallLocation: string;
  department: string;
  totalLectures: number;
  createdAt: number;
}

export interface AttendanceSession {
  id: string;
  courseId?: string;
  lectureNumber?: number; // e.g. Lecture 1, 2, 3...
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  courseRepName: string;
  hallLocation: string;
  startTime: number;
  durationMs: number; // default 5 mins (300,000 ms)
  expiresAt: number;
  status: 'active' | 'completed' | 'cancelled';
  currentPasscode: string;
  previousPasscode: string;
  passcodeRotatedAt: number;
  passcodeExpiresAt: number;
  passcodeIntervalMs: number; // 60,000 ms
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId?: string;
  courseCode?: string;
  lectureNumber?: number;
  jambRegNo: string;
  studentName: string;
  matricNo: string;
  department: string;
  deviceId: string;
  deviceInfo: string;
  hardwareHash?: string;
  timestamp: number;
  status: 'verified' | 'flagged' | 'manual_override';
  ipAddress?: string;
}

export interface FlaggedProxyAttempt {
  id: string;
  sessionId: string;
  jambRegNo: string;
  studentName?: string;
  attemptedCode: string;
  deviceId: string;
  hardwareHash?: string;
  timestamp: number;
  reason:
    | 'device_already_used'
    | 'invalid_passcode'
    | 'session_expired'
    | 'unregistered_jamb'
    | 'duplicate_submission'
    | 'brute_force_lockout'
    | 'rate_limit_exceeded'
    | 'hardware_spoofing_detected'
    | 'unauthorized_admin_attempt'
    | 'input_tamper_attempt';
}

export interface DeviceLock {
  deviceId: string;
  hardwareHash?: string;
  sessionId: string;
  jambRegNo: string;
  studentName: string;
  lockedAt: number;
  overrideGranted: boolean;
  overrideReason?: string;
}

export interface SessionPublicInfo {
  id: string;
  courseId?: string;
  lectureNumber?: number;
  courseCode: string;
  courseTitle: string;
  hallLocation: string;
  status: 'active' | 'completed' | 'cancelled';
  startTime: number;
  expiresAt: number;
  remainingMs: number;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  studentName?: string;
  errorCode?:
    | 'INVALID_CODE'
    | 'EXPIRED_CODE'
    | 'SESSION_CLOSED'
    | 'DUPLICATE_ENTRY'
    | 'DEVICE_LOCKED'
    | 'STUDENT_NOT_FOUND'
    | 'RATE_LIMITED'
    | 'BRUTE_FORCE_LOCKOUT'
    | 'INPUT_VALIDATION_ERROR'
    | 'UNAUTHORIZED';
}

// --- Multi-Session Continuity & Student Analytics Types ---

export interface LectureSessionAudit {
  sessionId: string;
  lectureNumber: number;
  date: number;
  attended: boolean;
  checkInTime?: number;
  hallLocation: string;
  lecturerName: string;
  status: 'verified' | 'absent' | 'excused';
}

export interface StudentCourseStats {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  totalLecturesHeld: number;
  timesAttended: number;
  attendanceRate: number; // percentage e.g. 80.0
  isExamEligible: boolean; // >= 75%
  statusTier: 'eligible' | 'at_risk' | 'ineligible'; // >= 75%, 50-74%, < 50%
  sessions: LectureSessionAudit[];
}

export interface StudentSummaryStats {
  student: Student;
  overallAttendanceRate: number;
  totalClassesHeld: number;
  totalClassesAttended: number;
  eligibleCoursesCount: number;
  totalCoursesCount: number;
  courses: StudentCourseStats[];
}

export interface CourseLedgerStudentRow {
  student: Student;
  attendedCount: number;
  totalLectures: number;
  attendanceRate: number;
  isExamEligible: boolean;
  statusTier: 'eligible' | 'at_risk' | 'ineligible';
  sessionAttendance: Record<string, boolean>; // sessionId -> attended boolean
}

export interface CourseLedger {
  course: Course;
  sessions: AttendanceSession[];
  students: CourseLedgerStudentRow[];
  totalLecturesHeld: number;
  totalStudents: number;
  averageAttendanceRate: number;
  eligibleStudentsCount: number;
  atRiskStudentsCount: number;
  ineligibleStudentsCount: number;
}
