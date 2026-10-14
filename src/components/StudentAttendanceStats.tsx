import React, { useState, useEffect } from 'react';
import {
  Search,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { StudentSummaryStats, StudentCourseStats } from '../types/attendance.ts';

interface StudentAttendanceStatsProps {
  onGoToCheckIn?: () => void;
  activeCourseCode?: string;
  initialJambQuery?: string;
}

export const StudentAttendanceStats: React.FC<StudentAttendanceStatsProps> = ({
  onGoToCheckIn,
  activeCourseCode,
  initialJambQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialJambQuery || '202660245646HJ');
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentSummaryStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Quick lookup suggestions for students
  const quickDemoStudents = [
    { label: 'Asuelime Mcchris', jamb: '202660245646HJ' },
    { label: 'Idudu Oghenetekome', jamb: '202660181457IF' },
    { label: 'Alaba Samuel', jamb: '202660546091HG' },
    { label: 'Arowoshola Dejola', jamb: 'RUN/CYB/25/18825' },
  ];

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim().toUpperCase();
    if (!q) {
      setErrorMessage('Please enter a JAMB Registration Number or Matric Number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await AttendanceApiService.getStudentStats(q);
      if (res.found && res.stats) {
        setStudentData(res.stats);
        // Expand the first course by default
        if (res.stats.courses.length > 0) {
          setExpandedCourse(res.stats.courses[0].courseId);
        }
      } else {
        setStudentData(null);
        setErrorMessage(
          res.message || `No attendance record found for "${q}". Please check the registration number.`
        );
      }
    } catch {
      setErrorMessage('Failed to connect to the attendance database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial lookup on mount
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, []);

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourse(prev => (prev === courseId ? null : courseId));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Academic Compliance & Senate Audit
              </span>
              <span className="text-xs text-slate-400">· 75% Minimum Attendance Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Course Attendance & Exam Eligibility
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Look up your cumulative lecture attendance history across all registered semester courses. Track your attendance percentage against university senate requirements to ensure examination clearance.
            </p>
          </div>

          {activeCourseCode && onGoToCheckIn && (
            <button
              onClick={onGoToCheckIn}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer shrink-0 self-start md:self-auto"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{activeCourseCode} Class Active — Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your JAMB Reg No (e.g. 2024/104829AB) or Matric No..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Check My Records</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pickers */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Sample Check:</span>
          {quickDemoStudents.map((demo) => (
            <button
              key={demo.jamb}
              type="button"
              onClick={() => {
                setSearchQuery(demo.jamb);
                handleSearch(demo.jamb);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer font-mono"
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Record Lookup Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Student Data Display */}
      {studentData && (
        <div className="space-y-8">
          {/* Identity & Senate Compliance Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Student Bio */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {studentData.student.fullName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {studentData.student.level}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 mt-1 font-mono">
                    <span>
                      JAMB: <strong className="text-slate-200">{studentData.student.jambRegNo}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Matric: <strong className="text-slate-200">{studentData.student.matricNo}</strong>
                    </span>
                    <span>·</span>
                    <span>{studentData.student.department}</span>
                  </div>
                </div>
              </div>

              {/* Senate Overall Compliance Badge */}
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:px-4 sm:py-3 shrink-0">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                    Overall Compliance
                  </div>
                  <div className="text-lg font-bold text-white flex items-center justify-end gap-1.5">
                    <span className="font-mono text-emerald-400">
                      {studentData.overallAttendanceRate}%
                    </span>
                    <span className="text-xs text-slate-400 font-normal">Semester Avg</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div>
                  {studentData.overallAttendanceRate >= 75 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Exam Cleared
                    </span>
                  ) : studentData.overallAttendanceRate >= 50 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Attendance At Risk
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <XCircle className="w-3.5 h-3.5" />
                      Barred (&lt;50%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Classes Attended</div>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {studentData.totalClassesAttended}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    / {studentData.totalClassesHeld} held
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Clearance Rate</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                  {studentData.overallAttendanceRate}%
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Cleared Courses</div>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {studentData.eligibleCoursesCount}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    / {studentData.totalCoursesCount}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Senate Benchmark</div>
                <div className="text-xl font-bold text-slate-200 font-mono mt-1">
                  &ge; 75.0%
                </div>
              </div>
            </div>
          </div>

          {/* Course-by-Course Attendance Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Enrolled Course Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400">
                Click any course to inspect historical lecture dates & times
              </span>
            </div>

            <div className="space-y-4">
              {studentData.courses.map((course) => {
                const isExpanded = expandedCourse === course.courseId;
                const isLiveNow = activeCourseCode?.toUpperCase() === course.courseCode.toUpperCase();

                return (
                  <div
                    key={course.courseId}
                    className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
                  >
                    {/* Header Bar */}
                    <div
                      onClick={() => toggleCourseExpand(course.courseId)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            course.attendanceRate >= 75
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : course.attendanceRate >= 50
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {course.courseCode.slice(0, 3)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white font-mono text-base">
                              {course.courseCode}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-sm text-slate-300 font-medium">
                              {course.courseTitle}
                            </span>
                            {isLiveNow && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                Active Lecture
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Lecturer: <span className="text-slate-300">{course.lecturerName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        {/* Attendance Metric */}
                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-mono">
                            {course.timesAttended} of {course.totalLecturesHeld} Lectures
                          </div>
                          <div className="text-base font-bold font-mono flex items-center justify-end gap-1.5">
                            <span
                              className={
                                course.attendanceRate >= 75
                                  ? 'text-emerald-400'
                                  : course.attendanceRate >= 50
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }
                            >
                              {course.attendanceRate}%
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="w-32 text-right">
                          {course.statusTier === 'eligible' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Exam Eligible
                            </span>
                          ) : course.statusTier === 'at_risk' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              At Risk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              Barred (&lt;50%)
                            </span>
                          )}
                        </div>

                        {/* Chevron */}
                        <div className="text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Line */}
                    <div className="w-full bg-slate-900 h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          course.attendanceRate >= 75
                            ? 'bg-emerald-500'
                            : course.attendanceRate >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, course.attendanceRate))}%` }}
                      />
                    </div>

                    {/* Expanded Lecture Sessions Breakdown */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 bg-slate-900/40 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                            Historical Lecture Records ({course.sessions.length} Recorded Sessions)
                          </h4>
                          {isLiveNow && onGoToCheckIn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onGoToCheckIn();
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Current class open: Enter Passcode</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-2.5">Lecture #</th>
                                <th className="px-3 py-2.5">Date & Time</th>
                                <th className="px-3 py-2.5">Hall Location</th>
                                <th className="px-3 py-2.5">Your Attendance</th>
                                <th className="px-3 py-2.5 text-right">Verification</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                              {course.sessions.map((sess) => (
                                <tr
                                  key={sess.sessionId}
                                  className={`hover:bg-slate-900/60 transition-colors ${
                                    sess.attended ? 'text-slate-200' : 'text-slate-400'
                                  }`}
                                >
                                  <td className="px-3 py-3 font-mono font-semibold text-white">
                                    Lecture #{sess.lectureNumber}
                                  </td>
                                  <td className="px-3 py-3 font-mono text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        {new Date(sess.date).toLocaleDateString('en-GB', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                      <span className="text-slate-500">·</span>
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        {new Date(sess.date).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{sess.hallLocation}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">
                                    {sess.attended ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Present & Verified
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        <XCircle className="w-3 h-3" />
                                        Absent
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-right font-mono text-[11px] text-slate-400">
                                    {sess.checkInTime ? (
                                      <span className="text-emerald-400">
                                        Signed at{' '}
                                        {new Date(sess.checkInTime).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">No Record</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
