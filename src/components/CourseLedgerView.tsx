import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Calendar,
  BookOpen,
  RefreshCw,
  PlusCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { Course, CourseLedger, AttendanceSession } from '../types/attendance.ts';

interface CourseLedgerViewProps {
  onStartLectureForCourse?: (course: Course) => void;
  activeSession?: AttendanceSession | null;
}

export const CourseLedgerView: React.FC<CourseLedgerViewProps> = ({
  onStartLectureForCourse,
  activeSession,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [ledger, setLedger] = useState<CourseLedger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'at_risk' | 'ineligible'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Add Course Modal State
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newLecturerName, setNewLecturerName] = useState('');
  const [newHallLocation, setNewHallLocation] = useState("Redeemer's Cyber Range Lab");
  const [newDepartment, setNewDepartment] = useState('Cybersecurity');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Delete Course State
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Load courses
  const fetchCourses = async () => {
    try {
      const res = await AttendanceApiService.getCourses();
      if (res.courses) {
        setCourses(res.courses);
        if (res.courses.length > 0) {
          setSelectedCourseId((prev) => (prev && res.courses.some(c => c.id === prev) ? prev : res.courses[0].id));
        } else {
          setSelectedCourseId('');
          setLedger(null);
        }
      }
    } catch {
      // Ignore
    }
  };

  // Load ledger for selected course
  const fetchLedger = async (courseId: string) => {
    setIsLoading(true);
    try {
      const data = await AttendanceApiService.getCourseLedger(courseId);
      setLedger(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchLedger(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleExportCsv = async () => {
    if (!ledger) return;
    setIsExporting(true);
    try {
      const blob = await AttendanceApiService.exportCourseMatrixCsv(ledger.course.id);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cumulative_Ledger_${ledger.course.code.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseTitle.trim()) return;

    setIsSubmittingCourse(true);
    try {
      const res = await AttendanceApiService.createCourse({
        code: newCourseCode.trim().toUpperCase(),
        title: newCourseTitle.trim(),
        lecturerName: newLecturerName.trim() || 'Lecturer',
        hallLocation: newHallLocation.trim() || "Redeemer's Cyber Range Lab",
        department: newDepartment.trim() || 'Cybersecurity',
      });

      if (res.success && res.course) {
        setIsAddCourseModalOpen(false);
        setNewCourseCode('');
        setNewCourseTitle('');
        setNewLecturerName('');
        await fetchCourses();
        setSelectedCourseId(res.course.id);
      } else {
        alert(res.error || 'Failed to create course');
      }
    } catch {
      alert('Network error creating course');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleConfirmDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeletingCourse(true);
    try {
      const res = await AttendanceApiService.deleteCourse(deletingCourse.id);
      if (res.success) {
        const deletedId = deletingCourse.id;
        setDeletingCourse(null);
        const remaining = courses.filter((c) => c.id !== deletedId);
        setCourses(remaining);
        if (remaining.length > 0) {
          setSelectedCourseId(remaining[0].id);
        } else {
          setSelectedCourseId('');
          setLedger(null);
        }
      } else {
        alert(res.error || 'Failed to delete course');
      }
    } catch {
      alert('Network error deleting course');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  // Filter students in matrix
  const filteredStudents = (ledger?.students || []).filter((row) => {
    const matchesSearch =
      row.student.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.student.jambRegNo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.student.matricNo.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'eligible' && row.statusTier === 'eligible') ||
      (statusFilter === 'at_risk' && row.statusTier === 'at_risk') ||
      (statusFilter === 'ineligible' && row.statusTier === 'ineligible');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Banner & Course Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs w-full max-w-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-semibold">
                Multi-Session Ledger
              </span>
              <span className="text-xs text-slate-400">· Senate 75% Clearance Audit</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Course Archives & Cumulative Matrices
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a course to view complete multi-session attendance history and individual eligibility scorecards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>

            {courses.length > 0 && (
              <button
                onClick={handleExportCsv}
                disabled={isExporting || !ledger}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Export Matrix CSV</span>
              </button>
            )}

            {ledger && onStartLectureForCourse && (
              <button
                onClick={() => onStartLectureForCourse(ledger.course)}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Launch Lecture #${(ledger.totalLecturesHeld || 0) + 1} for ${ledger.course.code}`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Next Lecture (#{ledger.totalLecturesHeld + 1})</span>
              </button>
            )}

            {ledger && (
              <button
                onClick={() => setDeletingCourse(ledger.course)}
                className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-300 hover:border-rose-300 rounded-xl text-xs transition-colors cursor-pointer ml-auto md:ml-0"
                title={`Delete ${ledger.course.code} from Ledger`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Course Pills / Switcher */}
        {courses.length > 0 && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-200 overflow-x-auto pb-1">
            {courses.map((c) => {
              const isSelected = selectedCourseId === c.id;
              const isLive = activeSession?.courseCode.toUpperCase() === c.code.toUpperCase();

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span className="font-mono">{c.code}</span>
                  <span className="text-[11px] opacity-80">({c.totalLectures} Lecs)</span>
                  {isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-ping" />
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Add Course</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State when no courses configured */}
      {!isLoading && courses.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Course Ledger is Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Add semester courses (e.g. CYB 201, CYB 401) to begin tracking multi-session attendance records and Senate 75% exam clearance.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Course</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading course ledger & session history...</p>
        </div>
      )}

      {/* Loaded Ledger Content */}
      {!isLoading && ledger && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Lectures Conducted</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
                {ledger.totalLecturesHeld}
                <span className="text-xs text-slate-400 font-normal ml-1">sessions</span>
              </div>
              <div className="text-[11px] text-blue-600 mt-1 font-medium">Continuous Record</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Average Turnout</div>
              <div className="text-2xl font-bold text-blue-600 font-mono mt-1 tabular-nums">
                {ledger.averageAttendanceRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Across all lectures</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Exam Eligible (&ge;75%)</div>
              <div className="text-2xl font-bold text-blue-700 font-mono mt-1 tabular-nums">
                {ledger.eligibleStudentsCount}
                <span className="text-xs text-slate-400 font-normal ml-1">
                  / {ledger.totalStudents}
                </span>
              </div>
              <div className="text-[11px] text-blue-600 mt-1 font-medium">Senate Standard Met</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">At Risk (50-74%)</div>
              <div className="text-2xl font-bold text-amber-600 font-mono mt-1 tabular-nums">
                {ledger.atRiskStudentsCount}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">Warning Threshold</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs col-span-2 lg:col-span-1">
              <div className="text-xs text-slate-500 font-medium">Barred (&lt;50%)</div>
              <div className="text-2xl font-bold text-rose-600 font-mono mt-1 tabular-nums">
                {ledger.ineligibleStudentsCount}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">Requires Intervention</div>
            </div>
          </div>

          {/* Chronological Session Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Lecture Timeline ({ledger.sessions.length} Recorded Sessions)</span>
              </h3>
              <span className="text-xs text-slate-500">
                Lecturer: <strong className="text-slate-900">{ledger.course.lecturerName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {ledger.sessions.map((sess) => {
                const countPresent = ledger.students.filter(
                  (s) => s.sessionAttendance[sess.id]
                ).length;
                const turnoutPct = ((countPresent / (ledger.totalStudents || 1)) * 100).toFixed(0);

                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="font-bold text-slate-900">Lecture #{sess.lectureNumber}</span>
                        <span className="text-blue-700 font-semibold tabular-nums">{turnoutPct}%</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {new Date(sess.startTime).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[120px]">{sess.hallLocation}</span>
                      <span className="font-mono text-slate-700 tabular-nums font-semibold">
                        {countPresent}/{ledger.totalStudents}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matrix Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter student name or JAMB..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  All ({ledger.students.length})
                </button>
                <button
                  onClick={() => setStatusFilter('eligible')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                    statusFilter === 'eligible'
                      ? 'bg-blue-100 text-blue-800 font-semibold border border-blue-300'
                      : 'text-blue-700 hover:text-blue-900 bg-blue-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Eligible ({ledger.eligibleStudentsCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('at_risk')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                    statusFilter === 'at_risk'
                      ? 'bg-amber-100 text-amber-800 font-semibold border border-amber-300'
                      : 'text-amber-700 hover:text-amber-900 bg-amber-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>At Risk ({ledger.atRiskStudentsCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('ineligible')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                    statusFilter === 'ineligible'
                      ? 'bg-rose-100 text-rose-800 font-semibold border border-rose-300'
                      : 'text-rose-700 hover:text-rose-900 bg-rose-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Barred ({ledger.ineligibleStudentsCount})</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">S/N</th>
                    <th className="px-3 py-3 min-w-[160px]">Student Full Name</th>
                    <th className="px-3 py-3 min-w-[120px]">JAMB Reg No</th>
                    <th className="px-3 py-3 min-w-[110px]">Matric No</th>
                    {ledger.sessions.map((s) => (
                      <th
                        key={s.id}
                        className="px-2 py-3 text-center min-w-[65px]"
                        title={`Lecture #${s.lectureNumber} - ${new Date(s.startTime).toLocaleDateString()}`}
                      >
                        L#{s.lectureNumber}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center min-w-[80px]">Total Signed</th>
                    <th className="px-3 py-3 text-center min-w-[70px]">Rate (%)</th>
                    <th className="px-3 py-3 text-right min-w-[110px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((row, idx) => (
                    <tr
                      key={row.student.jambRegNo !== 'NULL' ? row.student.jambRegNo : row.student.matricNo}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                        {row.student.fullName}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-blue-700 font-semibold whitespace-nowrap">
                        {row.student.jambRegNo}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {row.student.matricNo}
                      </td>
                      {ledger.sessions.map((s) => {
                        const attended = row.sessionAttendance[s.id];
                        return (
                          <td key={s.id} className="px-2 py-2.5 text-center">
                            {attended ? (
                              <span
                                className="inline-block w-4 h-4 rounded-md bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold leading-4"
                                title={`Lecture #${s.lectureNumber}: Present`}
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                className="inline-block w-4 h-4 rounded-md bg-slate-100 text-slate-400 border border-slate-200 text-[10px] leading-4"
                                title={`Lecture #${s.lectureNumber}: Absent`}
                              >
                                –
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {row.attendedCount} / {row.totalLectures}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold tabular-nums">
                        <span
                          className={
                            row.attendanceRate >= 75
                              ? 'text-blue-700'
                              : row.attendanceRate >= 50
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }
                        >
                          {row.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {row.statusTier === 'eligible' ? (
                          <span className="text-xs font-mono text-blue-700 font-semibold">
                            Eligible
                          </span>
                        ) : row.statusTier === 'at_risk' ? (
                          <span className="text-xs font-mono text-amber-600 font-semibold">
                            At Risk
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-rose-600 font-semibold">
                            Barred
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={8 + ledger.sessions.length}
                        className="p-8 text-center text-slate-500"
                      >
                        No students match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COURSE */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCourse}
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
          >
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Add Course to Attendance Ledger
              </span>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Course Code *
              </label>
              <input
                type="text"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                placeholder="e.g. CYB 401"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-600 uppercase transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Course Title *
              </label>
              <input
                type="text"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="e.g. Advanced Penetration Testing & Ethical Hacking"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-blue-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Lecturer Name
                </label>
                <input
                  type="text"
                  value={newLecturerName}
                  onChange={(e) => setNewLecturerName(e.target.value)}
                  placeholder="e.g. Dr. E. O. Babalola"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Lecture Venue
                </label>
                <input
                  type="text"
                  value={newHallLocation}
                  onChange={(e) => setNewHallLocation(e.target.value)}
                  placeholder="e.g. Redeemer's Cyber Range Lab"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Department
              </label>
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Cybersecurity"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:border-blue-600 transition-colors"
              />
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="submit"
                disabled={isSubmittingCourse}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmittingCourse ? 'Creating...' : 'Create Course'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DELETE COURSE CONFIRMATION */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Delete Course from Ledger?</h3>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{deletingCourse.code}</strong> ({deletingCourse.title}) from the Course Ledger?
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
              This will remove this course from the cumulative matrix view.
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeletingCourse}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingCourse ? 'Deleting...' : 'Yes, Delete Course'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
