import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  FileText,
  AlertCircle,
  GraduationCap,
  Lock,
  Copy,
  ArrowRight,
  Edit3,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { Student } from '../types/attendance.ts';

interface RosterManagerProps {
  onBackToDashboard?: () => void;
  isAdminAuthenticated: boolean;
  onRequireAdminAuth: () => void;
  onSelectStudentForCheckIn?: (jamb: string) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  onBackToDashboard,
  isAdminAuthenticated,
  onRequireAdminAuth,
  onSelectStudentForCheckIn,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedJamb, setCopiedJamb] = useState<string | null>(null);

  // New Student Form
  const [newJamb, setNewJamb] = useState('');
  const [newName, setNewName] = useState('');
  const [newMatric, setNewMatric] = useState('');
  const [newDepartment, setNewDepartment] = useState('Cybersecurity');
  const [newLevel, setNewLevel] = useState('100L');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Wipe Roster State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editJamb, setEditJamb] = useState('');
  const [editMatric, setEditMatric] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Student State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV Drag & Drop State
  const [csvContent, setCsvContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Array<{ jambRegNo: string; fullName: string; matricNo?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStudents = async () => {
    const list = await AttendanceApiService.getStudents();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenAdd = () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenUpload = () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleWipeRoster = async () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setIsWiping(true);
    try {
      await AttendanceApiService.wipeAllStudents();
      setStudents([]);
      setNotification('Entire roster wiped clean. All student names and records taken off the database.');
      setIsWipeModalOpen(false);
      setTimeout(() => setNotification(null), 3500);
    } catch {
      alert('Failed to wipe roster. Please try again.');
    } finally {
      setIsWiping(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newJamb.trim() || !newName.trim()) {
      setAddError('JAMB Number and Student Full Name are required.');
      return;
    }

    setIsAdding(true);
    try {
      const res = await AttendanceApiService.addStudent({
        jambRegNo: newJamb.trim().toUpperCase(),
        fullName: newName.trim(),
        matricNo: newMatric.trim().toUpperCase() || `RUN/CYB/2026/${Math.floor(100 + Math.random() * 900)}`,
        department: newDepartment.trim() || 'Cybersecurity',
        level: newLevel.trim(),
      });

      if (res.success && res.student) {
        setNotification(`Added "${res.student.fullName}" to the roster.`);
        setIsAddModalOpen(false);
        setNewJamb('');
        setNewName('');
        setNewMatric('');
        setAddError(null);
        await loadStudents();
        setTimeout(() => setNotification(null), 3500);
      } else {
        setAddError(res.error || 'Failed to add student. Please verify the JAMB number.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error adding student';
      setAddError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (student: Student) => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditJamb(student.jambRegNo);
    setEditMatric(student.matricNo);
    setEditDepartment(student.department);
    setEditLevel(student.level);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsUpdating(true);
    try {
      const res = await AttendanceApiService.updateStudent(editingStudent.jambRegNo, {
        fullName: editFullName.trim(),
        jambRegNo: editJamb.trim().toUpperCase(),
        matricNo: editMatric.trim().toUpperCase(),
        department: editDepartment.trim(),
        level: editLevel.trim(),
      });
      if (res.success && res.student) {
        setStudents((prev) =>
          prev.map((s) => (s.jambRegNo === editingStudent.jambRegNo ? res.student! : s))
        );
        setNotification(`Student "${res.student.fullName}" updated successfully.`);
        setTimeout(() => setNotification(null), 3000);
        setEditingStudent(null);
      } else {
        alert(res.error || 'Failed to update student');
      }
    } catch {
      alert('Network error updating student');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartDelete = (student: Student) => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setDeletingStudent(student);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      const res = await AttendanceApiService.deleteStudent(deletingStudent.jambRegNo);
      if (res.success) {
        setStudents((prev) => prev.filter((s) => s.jambRegNo !== deletingStudent.jambRegNo));
        setNotification(`Student "${deletingStudent.fullName}" removed from roster.`);
        setTimeout(() => setNotification(null), 3000);
        setDeletingStudent(null);
      } else {
        alert(res.error || 'Failed to remove student');
      }
    } catch {
      alert('Network error removing student');
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvString(text);
    };
    reader.readAsText(file);
  };

  const parseCsvString = (text: string) => {
    setCsvContent(text);
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const parsed: Array<{ jambRegNo: string; fullName: string; matricNo?: string }> = [];

    const startIdx = lines[0].toLowerCase().includes('jamb') || lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 2) {
        let jamb = cols[0];
        let name = cols[1];
        let matric = cols[2];

        if (cols[1].includes('/') && !cols[0].includes('/')) {
          jamb = cols[1];
          name = cols[0];
        }

        if (jamb && name) {
          parsed.push({
            jambRegNo: jamb.toUpperCase(),
            fullName: name,
            matricNo: matric,
          });
        }
      }
    }

    setParsedPreview(parsed);
  };

  const handleCommitCsvImport = async () => {
    if (parsedPreview.length === 0) return;
    const importedCount = await AttendanceApiService.bulkImportStudents(parsedPreview);
    setNotification(`Successfully imported ${importedCount} students into the master list!`);
    setIsUploadModalOpen(false);
    setParsedPreview([]);
    setCsvContent('');
    loadStudents();
    setTimeout(() => setNotification(null), 4000);
  };

  // Download Sample Template CSV
  const handleDownloadSampleCsv = () => {
    const template = 'JAMB Reg No,Student Full Name,Matric No,Department,Level\n2024/991122AA,"Chisom Daniel Okafor",RUN/CYB/2021/099,Cybersecurity,400L\n2024/991133BB,"Zainab Ahmed Shehu",RUN/CYB/2021/100,Cybersecurity,400L\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RUN_CyberPass_Roster_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJamb = (jamb: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jamb);
      setCopiedJamb(jamb);
      setTimeout(() => setCopiedJamb(null), 2000);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.jambRegNo.toLowerCase().includes(q) ||
      s.matricNo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden bg-slate-900 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 w-full">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 w-full">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
              Accredited Student Directory
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
              Class Registry & JAMB Lookup
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Public student list for verifying JAMB registration numbers before lecture attendance check-in ({students.length} students enrolled).
            </p>
          </div>

          {/* Action Buttons: Add / Upload CSV / Reset */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleOpenAdd}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAdminAuthenticated
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isAdminAuthenticated ? 'Add student to class roster' : 'Requires Course Rep password'}
            >
              {isAdminAuthenticated ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>Add Student {isAdminAuthenticated ? '' : '(Rep)'}</span>
            </button>

            <button
              onClick={handleOpenUpload}
              className="px-3 sm:px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isAdminAuthenticated ? 'Bulk upload CSV roster' : 'Requires Course Rep password'}
            >
              {isAdminAuthenticated ? <Upload className="w-4 h-4 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>Upload CSV {isAdminAuthenticated ? '' : '(Rep)'}</span>
            </button>

            <button
              onClick={() => {
                if (!isAdminAuthenticated) {
                  onRequireAdminAuth();
                  return;
                }
                setIsWipeModalOpen(true);
              }}
              className="px-3 sm:px-3.5 py-2 bg-slate-900 hover:bg-rose-950/70 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-medium border border-rose-500/30 hover:border-rose-500/60 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto sm:ml-0"
              title="Wipe all names from the student database"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Wipe Roster</span>
            </button>
          </div>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Table & Search Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider">
                Accredited Students
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">
                Showing {filteredStudents.length} of {students.length}
              </span>
            </div>

            {/* Instant Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your name, JAMB, or matric..."
                className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-mono">
                  <th className="py-2.5 px-3">S/N</th>
                  <th className="py-2.5 px-3">JAMB Reg No</th>
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Student Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3 text-right">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.jambRegNo} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{s.jambRegNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyJamb(s.jambRegNo)}
                            className="text-slate-500 hover:text-slate-300 p-1"
                            title="Copy JAMB number"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedJamb === s.jambRegNo && (
                            <span className="text-[10px] text-emerald-400 font-sans">Copied!</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {s.matricNo}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {s.department}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {s.level}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Student Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(s)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer"
                            title={`Edit ${s.fullName}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Student Button */}
                          <button
                            type="button"
                            onClick={() => handleStartDelete(s)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
                            title={`Remove ${s.fullName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {onSelectStudentForCheckIn && (
                            <button
                              type="button"
                              onClick={() => onSelectStudentForCheckIn(s.jambRegNo)}
                              className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer ml-1"
                            >
                              <span>Check In</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      {students.length === 0 ? (
                        <div className="max-w-md mx-auto space-y-3 py-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <h3 className="text-base font-bold text-white">Student Roster is Clean & Empty</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            All previous names have been wiped from the database. Click "+ Add Student" below to enroll your class cohort, or import via CSV.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={handleOpenAdd}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add New Student</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenUpload}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Upload className="w-4 h-4 text-emerald-400" />
                              <span>Upload CSV</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          No students found matching "{searchQuery}". Try searching by first name or JAMB number.
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: ADD STUDENT (Protected) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStudent}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Enroll Student to Master Roster
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                JAMB Registration Number *
              </label>
              <input
                type="text"
                value={newJamb}
                onChange={(e) => {
                  setNewJamb(e.target.value.toUpperCase());
                  setAddError(null);
                }}
                placeholder="e.g. 202660245646HJ or RUN/CYB/25/18825"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Student Full Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setAddError(null);
                }}
                placeholder="e.g. Asuelime Mcchris"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Matric Number (Optional)
                </label>
                <input
                  type="text"
                  value={newMatric}
                  onChange={(e) => setNewMatric(e.target.value.toUpperCase())}
                  placeholder="e.g. RUN/CYB/2026/001"
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Level
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
                >
                  <option value="100L">100L</option>
                  <option value="200L">200L</option>
                  <option value="300L">300L</option>
                  <option value="400L">400L</option>
                  <option value="500L">500L</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isAdding ? (
                  <span>Enrolling Student...</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enroll to Class List</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: WIPE ROSTER CONFIRMATION (Protected) */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-rose-500/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-sm">Wipe All Student Names?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will completely wipe every present student name from the database and clear all attendance records. The database will become completely clean.
            </p>

            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-[11px] text-rose-200">
              Warning: This action is permanent and clears all {students.length} student records from the server database.
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={handleWipeRoster}
                disabled={isWiping}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isWiping ? 'Wiping Roster...' : 'Yes, Wipe Everything Clean'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CSV BULK IMPORT (Protected) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                Upload Master Class List CSV
              </span>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a comma-separated class roster containing JAMB Registration Numbers and Full Names.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl text-center cursor-pointer transition-colors bg-slate-900/60"
            >
              <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-white">
                Click to browse or drop CSV file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Accepts .csv format (Columns: JAMB Reg No, Full Name, Matric No)
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {parsedPreview.length > 0 && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-emerald-400 block">
                  Detected {parsedPreview.length} students to import:
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
                  {parsedPreview.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{p.fullName}</span>
                      <span className="text-emerald-400">{p.jambRegNo}</span>
                    </div>
                  ))}
                  {parsedPreview.length > 5 && (
                    <div className="text-slate-500 italic">
                      + {parsedPreview.length - 5} more students...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={handleCommitCsvImport}
                disabled={parsedPreview.length === 0}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Import {parsedPreview.length > 0 ? `(${parsedPreview.length} Students)` : ''}
              </button>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT (Protected) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
          >
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Edit Student Information
              </span>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="e.g. Asuelime Mcchris"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                JAMB Registration Number *
              </label>
              <input
                type="text"
                value={editJamb}
                onChange={(e) => setEditJamb(e.target.value.toUpperCase())}
                placeholder="e.g. 202660245646HJ"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Matric Number
              </label>
              <input
                type="text"
                value={editMatric}
                onChange={(e) => setEditMatric(e.target.value.toUpperCase())}
                placeholder="e.g. RUN/CYB/25/18825"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Department
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g. Cybersecurity"
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Level
                </label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
                >
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DELETE STUDENT CONFIRMATION (Protected) */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-sm">Remove Student from Roster?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong className="text-white">{deletingStudent.fullName}</strong> ({deletingStudent.jambRegNo}) from the accredited course roster?
            </p>

            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-[11px] text-rose-300">
              This student will no longer be able to check in until re-enrolled by the Course Rep.
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Yes, Remove Student'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
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
