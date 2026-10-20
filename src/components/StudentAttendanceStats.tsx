import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { StudentSummaryStats } from '../types/attendance.ts';

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
  const [searchQuery, setSearchQuery] = useState(initialJambQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentSummaryStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim().toUpperCase();
    if (!q) {
      setErrorMessage('Please enter your JAMB Registration Number or Matric Number.');
      setStudentData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await AttendanceApiService.getStudentStats(q);
      if (res.found && res.stats) {
        setStudentData(res.stats);
        if (res.stats.courses.length > 0) {
          setExpandedCourse(res.stats.courses[0].courseId);
        }
      } else {
        setStudentData(null);
        setErrorMessage(
          res.message || `No student found matching "${q}". Please check the registration number or confirm with your Course Rep.`
        );
      }
    } catch {
      setErrorMessage('Failed to connect to the attendance database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialJambQuery && initialJambQuery.trim()) {
      handleSearch(initialJambQuery);
    }
  }, [initialJambQuery]);

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourse(prev => (prev === courseId ? null : courseId));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-medium">
                Academic Compliance & Audit
              </span>
              <span className="text-xs text-slate-500">· 75% Minimum Attendance Standard</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              My Course Attendance & Exam Clearance
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Look up your cumulative lecture attendance history across all registered semester courses. Track your attendance percentage against university senate requirements.
            </p>
          </div>

          {activeCourseCode && onGoToCheckIn && (
            <button
              onClick={onGoToCheckIn}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 self-start md:self-auto active:scale-[0.98]"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{activeCourseCode} Active — Check In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar Container */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your JAMB Reg No (e.g. 2024/104829AB) or Matric No..."
              className="w-full bg-[#0B0F17] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Check My Records</span>
              </>
            )}
          </button>
        </form>

        {/* Helper Guidance */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-normal text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Enter any accredited JAMB registration number or Matriculation number to inspect lecture attendance.
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3 mb-8">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Record Lookup Notice</p>
            <p className="mt-0.5 text-rose-300/80">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Student Data Display */}
      {studentData && (
        <div className="space-y-6">
          {/* Identity & Senate Compliance Card */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Student Bio */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {studentData.student.fullName}
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {studentData.student.level}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-1 font-mono">
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

              {/* Senate Overall Compliance Box */}
              <div className="flex items-center gap-3 bg-[#0B0F17] border border-white/[0.06] rounded-xl p-3 sm:px-4 sm:py-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Overall Compliance
                  </div>
                  <div className="text-base font-bold text-white flex items-center justify-end gap-1.5">
                    <span className="font-mono text-emerald-400 tabular-nums">
                      {studentData.overallAttendanceRate}%
                    </span>
                    <span className="text-xs text-slate-500 font-normal">Semester Avg</span>
                  </div>
                </div>

                <div className="h-7 w-px bg-white/[0.08]" />

                <div>
                  {studentData.totalClassesHeld === 0 ? (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Good Standing
                    </span>
                  ) : studentData.overallAttendanceRate >= 75 ? (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Exam Cleared
                    </span>
                  ) : studentData.overallAttendanceRate >= 50 ? (
                    <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Attendance At Risk
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Barred (&lt;50%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/[0.06]">
              <div className="bg-[#0B0F17] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-xs text-slate-400">Classes Attended</div>
                <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                  {studentData.totalClassesAttended}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    / {studentData.totalClassesHeld} held
                  </span>
                </div>
              </div>

              <div className="bg-[#0B0F17] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-xs text-slate-400">Clearance Rate</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1 tabular-nums">
                  {studentData.overallAttendanceRate}%
                </div>
              </div>

              <div className="bg-[#0B0F17] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-xs text-slate-400">Cleared Courses</div>
                <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                  {studentData.eligibleCoursesCount}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    / {studentData.totalCoursesCount}
                  </span>
                </div>
              </div>

              <div className="bg-[#0B0F17] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-xs text-slate-400">Senate Benchmark</div>
                <div className="text-lg font-bold text-slate-300 font-mono mt-1">
                  &ge; 75.0%
                </div>
              </div>
            </div>
          </div>

          {/* Course-by-Course Attendance Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Enrolled Course Breakdown</span>
              </h3>
              <span className="text-xs text-slate-500">
                Click any course to inspect historical lecture dates & times
              </span>
            </div>

            {studentData.courses.length === 0 ? (
              <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 text-center text-xs text-slate-400">
                No semester courses are currently registered in the attendance ledger.
              </div>
            ) : (
              <div className="space-y-3">
                {studentData.courses.map((course) => {
                  const isExpanded = expandedCourse === course.courseId;
                  const isLiveNow = activeCourseCode?.toUpperCase() === course.courseCode.toUpperCase();

                  return (
                    <div
                      key={course.courseId}
                      className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm transition-all"
                    >
                      {/* Header Bar */}
                      <div
                        onClick={() => toggleCourseExpand(course.courseId)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              course.attendanceRate >= 75
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : course.attendanceRate >= 50
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {course.courseCode.slice(0, 3)}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white font-mono text-sm sm:text-base">
                                {course.courseCode}
                              </span>
                              <span className="text-xs text-slate-600">·</span>
                              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                                {course.courseTitle}
                              </span>
                              {isLiveNow && (
                                <span className="text-[11px] font-mono text-emerald-400 animate-pulse">
                                  ● Active Lecture
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Lecturer: <span className="text-slate-300">{course.lecturerName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          {/* Attendance Metric */}
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-slate-400 font-mono">
                              {course.timesAttended} of {course.totalLecturesHeld} Lectures
                            </div>
                            <div className="text-sm sm:text-base font-bold font-mono tabular-nums">
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

                          {/* Status */}
                          <div className="text-right">
                            {course.statusTier === 'eligible' ? (
                              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Exam Eligible
                              </span>
                            ) : course.statusTier === 'at_risk' ? (
                              <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                At Risk
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-rose-400 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                Barred (&lt;50%)
                              </span>
                            )}
                          </div>

                          {/* Chevron */}
                          <div className="text-slate-500 ml-auto sm:ml-0">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar Line */}
                      <div className="w-full bg-[#0B0F17] h-1 overflow-hidden">
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
                        <div className="p-4 sm:p-5 bg-[#0B0F17]/60 border-t border-white/[0.06] w-full overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                              Historical Lecture Records ({course.sessions.length} Recorded Sessions)
                            </h4>
                            {isLiveNow && onGoToCheckIn && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onGoToCheckIn();
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto transition-colors"
                              >
                                <span>Current class active: Enter Passcode</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-white/[0.06]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#0B0F17] text-slate-400 uppercase font-mono border-b border-white/[0.06] text-[11px]">
                                <tr>
                                  <th className="px-3 py-2.5">Lecture #</th>
                                  <th className="px-3 py-2.5">Date & Time</th>
                                  <th className="px-3 py-2.5">Hall Venue</th>
                                  <th className="px-3 py-2.5">Attendance</th>
                                  <th className="px-3 py-2.5 text-right">Verification</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.04]">
                                {course.sessions.map((sess) => (
                                  <tr
                                    key={sess.sessionId}
                                    className="hover:bg-white/[0.02] transition-colors"
                                  >
                                    <td className="px-3 py-3 font-mono text-white">
                                      Lecture #{sess.lectureNumber}
                                    </td>
                                    <td className="px-3 py-3 font-mono text-slate-300">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>
                                          {new Date(sess.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </span>
                                        <span className="text-slate-600">·</span>
                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
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
                                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{sess.hallLocation}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3">
                                      {sess.attended ? (
                                        <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Present & Verified
                                        </span>
                                      ) : (
                                        <span className="text-rose-400 font-mono text-xs flex items-center gap-1">
                                          <XCircle className="w-3 h-3" />
                                          Absent
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-[11px] text-slate-400">
                                      {sess.checkInTime ? (
                                        <span className="text-emerald-400 tabular-nums">
                                          Signed at{' '}
                                          {new Date(sess.checkInTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600">No Record</span>
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
            )}
          </div>
        </div>
      )}

      {/* Initial State / Welcome Prompt */}
      {!studentData && !errorMessage && !isLoading && (
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Personal Lecture Attendance Lookup
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Enter your JAMB Registration Number or Matriculation Number in the search bar above to look up your personal semester lecture attendance history and senate 75% exam clearance status.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Redeemer's University Academic Compliance System</span>
          </div>
        </div>
      )}
    </div>
  );
};
