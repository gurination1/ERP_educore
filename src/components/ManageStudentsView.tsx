import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { api, getStoredToken } from '../api/client';
import { StudentProfile, User } from '../types';
import { Download, Search, Users, GraduationCap } from 'lucide-react';

interface ManageStudentsViewProps {
  currentUser?: User | null;
  onSelectStudent: (student: StudentProfile) => void;
  onOpenEmailReminders: () => void;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
  onOpenMasterTables?: (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents' | 'hostel' | 'fees' | 'employee') => void;
}

export const ManageStudentsView: React.FC<ManageStudentsViewProps> = ({
  currentUser,
  onSelectStudent,
  onOpenEmailReminders,
  selectedCampus,
  onOpenMasterTables,
}) => {
  const navigate = useNavigate();
  const isHOD = currentUser?.role === 'hod';
  const hodCourseDefault = isHOD
    ? (currentUser?.department?.toLowerCase().includes('me') ? 'B.Tech ME' : 'B.Tech CS')
    : 'All Courses';

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [totalCount, setTotalCount] = useState(97);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState(hodCourseDefault);
  const [yearFilter, setYearFilter] = useState('All Years');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Progression Lifecycle State (Lecture 3 & 4 Demotion Protocol)
  const [selectedProgressionStudent, setSelectedProgressionStudent] = useState<StudentProfile | null>(null);
  const [isProgressionModalOpen, setIsProgressionModalOpen] = useState(false);
  const [progressionForm, setProgressionForm] = useState({
    new_status: 'promoted' as 'active' | 'promoted' | 'demoted' | 'struck_off' | 'deactivated',
    new_term: 2,
    order_no: '',
    reason: '',
    journey_mode: 'retain_all' as 'retain_all' | 'reset_from_demotion',
    void_higher_pending_fees: true,
    paid_fees_action: 'adjust' as 'adjust' | 'refund',
    approved_by: 'Bursar & Dean Academic Affairs',
  });
  const [progressionMsg, setProgressionMsg] = useState<string | null>(null);

  const handleUpdateProgression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgressionStudent) return;
    try {
      const res = await api.updateStudentProgression(selectedProgressionStudent.id, progressionForm);
      if (res.success) {
        // Record Contra Ledger Entry if demoted and fees voided/adjusted
        if (progressionForm.new_status === 'demoted') {
          const contraEntries = JSON.parse(localStorage.getItem('educore_contra_ledger') || '[]');
          if (progressionForm.void_higher_pending_fees) {
            contraEntries.push({
              id: `CONTRA-VOID-${Date.now()}`,
              student_id: selectedProgressionStudent.id,
              student_name: `${selectedProgressionStudent.first_name} ${selectedProgressionStudent.last_name}`,
              semester: selectedProgressionStudent.current_semester,
              entry_type: 'demotion_void',
              amount: 45000,
              description: `Null & Void Pending Fee - Semester ${selectedProgressionStudent.current_semester} (Demoted to Sem ${progressionForm.new_term} per Order ${progressionForm.order_no || 'ORD-2025'})`,
              is_contra: true,
              timestamp: new Date().toISOString(),
              authorized_by: progressionForm.approved_by,
            });
          }
          if (progressionForm.paid_fees_action === 'adjust') {
            contraEntries.push({
              id: `CONTRA-ADJ-${Date.now()}`,
              student_id: selectedProgressionStudent.id,
              student_name: `${selectedProgressionStudent.first_name} ${selectedProgressionStudent.last_name}`,
              semester: progressionForm.new_term,
              entry_type: 'demotion_adjustment',
              amount: 40000,
              description: `Credit Adjustment from Higher Semester ${selectedProgressionStudent.current_semester} to Demoted Semester ${progressionForm.new_term}`,
              is_contra: true,
              timestamp: new Date().toISOString(),
              authorized_by: progressionForm.approved_by,
            });
          }
          localStorage.setItem('educore_contra_ledger', JSON.stringify(contraEntries));
        }

        setIsProgressionModalOpen(false);
        setProgressionMsg(`Progression status updated for ${selectedProgressionStudent.first_name}: ${progressionForm.new_status.toUpperCase()}${progressionForm.new_status === 'demoted' ? ' [Contra Ledger Entries Generated]' : ''}`);
        setTimeout(() => setProgressionMsg(null), 5000);
        const refreshed = await api.getStudents({ page: currentPage, limit: 5 });
        if (refreshed.success && refreshed.students) {
          setStudents(refreshed.students);
        }
      } else {
        alert(res.error || 'Failed to update progression');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Load Initial Students
  useEffect(() => {
    setIsLoading(true);
    const queryParams: any = { page: currentPage, limit: 5 };
    if (courseFilter !== 'All Courses') queryParams.course = courseFilter;
    if (selectedCampus && selectedCampus !== 'all') queryParams.campus = selectedCampus;
    api.getStudents(queryParams).then(res => {
      if (res.success && res.students) {
        setStudents(res.students);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
      }
      setIsLoading(false);
    });
  }, [currentPage, selectedCampus]);

  // Handle Search & Filter Submission
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setCurrentPage(1);

    const queryParams: any = {
      page: 1,
      limit: 5,
    };

    if (searchQuery.trim()) queryParams.search = searchQuery.trim();
    if (courseFilter !== 'All Courses') queryParams.course = courseFilter;
    if (yearFilter !== 'All Years') queryParams.year = yearFilter;
    if (statusFilter !== 'All Statuses') queryParams.feesStatus = statusFilter;
    if (selectedCampus && selectedCampus !== 'all') queryParams.campus = selectedCampus;

    api.getStudents(queryParams).then(res => {
      if (res.success && res.students) {
        setStudents(res.students);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
      }
      setIsLoading(false);
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCourseFilter('All Courses');
    setYearFilter('All Years');
    setStatusFilter('All Statuses');
    setCurrentPage(1);
    setTimeout(() => {
      const queryParams: any = { page: 1, limit: 5 };
      if (selectedCampus && selectedCampus !== 'all') queryParams.campus = selectedCampus;
      api.getStudents(queryParams).then(res => {
        if (res.success && res.students) {
          setStudents(res.students);
          setTotalCount(res.total);
          setTotalPages(res.totalPages);
        }
      });
    }, 50);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const url = `/api/reports/export-students-csv?token=${encodeURIComponent(token || '')}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `students_master_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export students CSV: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Avatar color helper
  const getAvatarBadgeColor = (name: string) => {
    const colors = [
      'bg-[#00236f] text-white',
      'bg-[#ea580c] text-white',
      'bg-[#6366f1] text-white',
      'bg-[#d97706] text-white',
      'bg-[#059669] text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div id="manage-students-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header with Title and Global Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-base transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">Manage Students</h2>
              {isHOD && (
                <span className="bg-blue-50 text-[#00236f] border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00236f] animate-pulse inline-block" />
                  HOD Scoped: {currentUser?.department || 'Computer Science & Engineering'}
                </span>
              )}
            </div>
            <p className="text-sm text-[#444651] mt-1">
              {isHOD
                ? `Department student registry and progression console for ${currentUser?.department || 'Computer Science'}.`
                : 'View, filter, and manage all student records across departments.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="students-email-reminders-btn"
            onClick={onOpenEmailReminders}
            className="px-4 py-2.5 bg-white border border-[#e1e3e4] hover:bg-[#f8f9fa] text-[#191c1d] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            
            <span>Email Reminders</span>
          </button>

          <button
            id="students-export-csv-btn"
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sleek Horizontal Filter Bar & Quick Actions Strip */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#e1e3e4] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="filter-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search scholar name or UID..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-xs text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 font-medium"
            />
          </div>

          {/* Course select pill */}
          <select
            id="filter-course-select"
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-xs font-semibold text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 cursor-pointer"
          >
            <option value="All Courses">All Courses</option>
            <option value="B.Tech CS">B.Tech CS</option>
            <option value="B.Tech ME">B.Tech ME</option>
            <option value="MBA Finance">MBA Finance</option>
            <option value="B.Sc Physics">B.Sc Physics</option>
          </select>

          {/* Admission Year select pill */}
          <select
            id="filter-year-select"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-xs font-semibold text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 cursor-pointer"
          >
            <option value="All Years">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>

          {/* Fees Status select pill */}
          <select
            id="filter-fees-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-xs font-semibold text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 cursor-pointer"
          >
            <option value="All Statuses">All Fee Statuses</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </select>

          <button
            type="submit"
            id="apply-filters-btn"
            className="px-3 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Filter
          </button>

          {(searchQuery || courseFilter !== hodCourseDefault || yearFilter !== 'All Years' || statusFilter !== 'All Statuses') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          {onOpenMasterTables && (
            <button
              type="button"
              onClick={() => onOpenMasterTables('degrees')}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Open Master Degrees, Ordinances & Branch Codes"
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Master Degrees & Ordinances</span>
            </button>
          )}

          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-[#00236f] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{(totalCount || 0).toLocaleString('en-IN')} Enrolled Scholars</span>
          </div>
        </div>
      </div>

      {/* Student Master Table (Full Width 12-cols) */}
      <div className="w-full bg-white rounded-xl border border-[#e1e3e4] shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Table Container */}
          <div className="overflow-x-auto">
            <table id="student-master-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Progression</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fees Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#757682]">
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#757682]">
                      No student records found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  students.map(s => {
                    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student Scholar';
                    const initials = `${(s.first_name || 'S')[0] || ''}${(s.last_name || '')[0] || ''}`.toUpperCase();
                    const courseCode = s.course?.code || 'B.Tech CS';
                    const isAccountActive = (s.status || 'active').toLowerCase() === 'active';

                    return (
                      <tr key={s.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#00236f]">
                          {s.student_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarBadgeColor(
                                fullName
                              )}`}
                            >
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold text-[#191c1d] block">{fullName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{s.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#444651]">
                          <div>{courseCode}</div>
                          <div className="text-[10px] text-[#757682]">Sem {s.current_semester}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              s.progression_status === 'promoted'
                                ? 'bg-indigo-100 text-indigo-800'
                                : s.progression_status === 'demoted'
                                ? 'bg-amber-100 text-amber-800'
                                : s.progression_status === 'struck_off'
                                ? 'bg-rose-100 text-rose-800'
                                : s.progression_status === 'deactivated'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            ● {s.progression_status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isAccountActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isAccountActive ? '● Active' : '● Suspended'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              s.fees_status === 'paid'
                                ? 'bg-[#ffedd5] text-[#00236f]'
                                : s.fees_status === 'due'
                                ? 'bg-[#fef3c7] text-[#b45309]'
                                : 'bg-[#ffdad6] text-[#ba1a1a]'
                            }`}
                          >
                            {s.fees_status === 'paid' ? 'Paid' : s.fees_status === 'due' ? 'Due' : 'Overdue'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgressionStudent(s);
                                setProgressionForm(prev => ({
                                  ...prev,
                                  new_status: 'promoted',
                                  new_term: (s.current_semester || 1) + 1,
                                  order_no: `ORD-${Date.now().toString().slice(-6)}`,
                                  reason: 'Passed CBCS ordinance clearance',
                                }));
                                setIsProgressionModalOpen(true);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                              title="Update academic progression lifecycle"
                            >
                              <span>Progression ⇄</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectStudent(s)}
                              className="px-2.5 py-1 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded font-bold text-xs inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Inspect full academic dossier & manage student"
                            >
                              <span>Inspect</span>
                              <span className="font-bold text-xs">→</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#e1e3e4] bg-[#f8f9fa] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#757682]">
            <span>
              Showing {(currentPage - 1) * 5 + 1} to{' '}
              {Math.min(currentPage * 5, totalCount)} of {totalCount} results
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-8 px-3 border border-[#e1e3e4] rounded-lg bg-white hover:bg-[#f3f4f5] disabled:opacity-40 transition-colors font-medium text-xs cursor-pointer"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  typeof p === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-[#757682]">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === p
                          ? 'bg-[#00236f] text-white'
                          : 'border border-[#e1e3e4] bg-white text-[#191c1d] hover:bg-[#f3f4f5]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-8 px-3 border border-[#e1e3e4] rounded-lg bg-white hover:bg-[#f3f4f5] disabled:opacity-40 transition-colors font-medium text-xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      {/* Progression Toast Notification */}
      {progressionMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00236f] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-blue-400">
          <span>✓ {progressionMsg}</span>
          <button onClick={() => setProgressionMsg(null)} className="font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Student Progression Lifecycle Modal (Lecture 3) */}
      {isProgressionModalOpen && selectedProgressionStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Academic Progression Lifecycle</h4>
                <p className="text-[11px] text-slate-500">
                  {selectedProgressionStudent.first_name} {selectedProgressionStudent.last_name} ({selectedProgressionStudent.student_id})
                </p>
              </div>
              <button onClick={() => setIsProgressionModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateProgression} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Progression Status (Statutory Ordinance) *
                </label>
                <select
                  value={progressionForm.new_status}
                  onChange={e => setProgressionForm({ ...progressionForm, new_status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="promoted">Promoted (Advance to Next Academic Term)</option>
                  <option value="demoted">Demoted (Detained in Current Term)</option>
                  <option value="struck_off">Struck Off (Disciplinary / Attendance Cutoff)</option>
                  <option value="deactivated">Deactivated (Suspended Login & Enrollment)</option>
                  <option value="active">Active (Normal Collegiate Standing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Next Term / Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={progressionForm.new_term}
                    onChange={e => setProgressionForm({ ...progressionForm, new_term: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gazette / Order No</label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-2025-081"
                    value={progressionForm.order_no}
                    onChange={e => setProgressionForm({ ...progressionForm, order_no: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason / Board of Studies Minutes</label>
                <textarea
                  rows={2}
                  value={progressionForm.reason}
                  onChange={e => setProgressionForm({ ...progressionForm, reason: e.target.value })}
                  placeholder="e.g. Detained due to attendance/credit shortage per ordinance; demoted to Semester 2."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              {/* Karanvir Sir Lecture 4: Special Demotion Protocol */}
              {progressionForm.new_status === 'demoted' && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                      ⚠️ Demotion Protocol & Academic Journey Configuration
                    </span>
                    <span className="text-[9px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      Lecture 4 Mandate
                    </span>
                  </div>

                  {/* 1. Academic Journey Retention vs Reset */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                      1. Academic Journey Preservation Mode:
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-start gap-2 cursor-pointer bg-white p-2 rounded-lg border border-amber-200">
                        <input
                          type="radio"
                          name="journey_mode"
                          value="retain_all"
                          checked={progressionForm.journey_mode === 'retain_all'}
                          onChange={() => setProgressionForm({ ...progressionForm, journey_mode: 'retain_all' })}
                          className="mt-0.5 text-[#00236f]"
                        />
                        <div>
                          <strong className="block text-slate-900 text-[11px]">Retain Complete Academic Journey</strong>
                          <span className="text-[10px] text-slate-500">
                            Preserves records for Semesters 1 to {selectedProgressionStudent.current_semester} in timeline. Tagged with demotion gazette order.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer bg-white p-2 rounded-lg border border-amber-200">
                        <input
                          type="radio"
                          name="journey_mode"
                          value="reset_from_demotion"
                          checked={progressionForm.journey_mode === 'reset_from_demotion'}
                          onChange={() => setProgressionForm({ ...progressionForm, journey_mode: 'reset_from_demotion' })}
                          className="mt-0.5 text-[#00236f]"
                        />
                        <div>
                          <strong className="block text-slate-900 text-[11px]">Reset from Demoted Semester</strong>
                          <span className="text-[10px] text-slate-500">
                            Higher semester records are inactivated/hidden. Student history starts fresh from Semester {progressionForm.new_term}.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 2. Fee Status Check & Contra Reversal */}
                  <div className="pt-2 border-t border-amber-200">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      2. Semester Fee Audit & Contra Ledger Entries:
                    </label>
                    <div className="bg-white rounded-lg p-2.5 border border-amber-200 text-[10px] space-y-2">
                      <div className="grid grid-cols-4 font-bold text-slate-600 border-b pb-1">
                        <span>Term</span>
                        <span className="text-right">Fee</span>
                        <span className="text-right">Paid</span>
                        <span className="text-right">Pending</span>
                      </div>
                      <div className="grid grid-cols-4 font-mono text-slate-700">
                        <span>Sem 1</span>
                        <span className="text-right">₹ 45,000</span>
                        <span className="text-right text-emerald-600">₹ 45,000</span>
                        <span className="text-right text-slate-400">₹ 0</span>
                      </div>
                      <div className="grid grid-cols-4 font-mono text-slate-700">
                        <span>Sem 2</span>
                        <span className="text-right">₹ 45,000</span>
                        <span className="text-right text-emerald-600">₹ 45,000</span>
                        <span className="text-right text-slate-400">₹ 0</span>
                      </div>
                      <div className="grid grid-cols-4 font-mono text-slate-700">
                        <span>Sem 3 (Current)</span>
                        <span className="text-right">₹ 45,000</span>
                        <span className="text-right text-emerald-600">₹ 15,000</span>
                        <span className="text-right text-rose-600 font-bold">₹ 30,000</span>
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={progressionForm.void_higher_pending_fees}
                            onChange={e => setProgressionForm({ ...progressionForm, void_higher_pending_fees: e.target.checked })}
                            className="rounded text-[#00236f]"
                          />
                          <span className="text-[11px] font-semibold text-slate-800">
                            Make Sem 3 Pending Due (₹ 30,000) <strong>Null & Void via Contra Entry</strong> (Never delete!)
                          </span>
                        </label>

                        <div>
                          <span className="text-[10px] font-semibold text-slate-700 block mb-1">
                            Action for already-paid fee in higher semester (₹ 15,000):
                          </span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="paid_action"
                                value="adjust"
                                checked={progressionForm.paid_fees_action === 'adjust'}
                                onChange={() => setProgressionForm({ ...progressionForm, paid_fees_action: 'adjust' })}
                              />
                              <span>Adjust towards new Semester {progressionForm.new_term} fee</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="paid_action"
                                value="refund"
                                checked={progressionForm.paid_fees_action === 'refund'}
                                onChange={() => setProgressionForm({ ...progressionForm, paid_fees_action: 'refund' })}
                              />
                              <span>Initiate Accounts Refund</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Statutory Approver */}
                  <div className="pt-2 border-t border-amber-200">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Statutory Clearance Authority (Admin & Accounts Sign-Off):
                    </label>
                    <input
                      type="text"
                      value={progressionForm.approved_by}
                      onChange={e => setProgressionForm({ ...progressionForm, approved_by: e.target.value })}
                      className="w-full px-2.5 py-1 bg-white border border-amber-200 rounded text-[11px] font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProgressionModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00236f] text-white rounded-xl font-bold hover:bg-[#001950] transition shadow-xs"
                >
                  Confirm Progression Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
