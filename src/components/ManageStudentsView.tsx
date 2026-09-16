import React, { useState, useEffect } from 'react';
import { api, getStoredToken } from '../api/client';
import { StudentProfile } from '../types';

interface ManageStudentsViewProps {
  onSelectStudent: (student: StudentProfile) => void;
  onOpenEmailReminders: () => void;
}

export const ManageStudentsView: React.FC<ManageStudentsViewProps> = ({
  onSelectStudent,
  onOpenEmailReminders,
}) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [totalCount, setTotalCount] = useState(97);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [yearFilter, setYearFilter] = useState('All Years');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Load Initial Students
  useEffect(() => {
    setIsLoading(true);
    api.getStudents({ page: currentPage, limit: 5 }).then(res => {
      if (res.success && res.students) {
        setStudents(res.students);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
      }
      setIsLoading(false);
    });
  }, [currentPage]);

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
      api.getStudents({ page: 1, limit: 5 }).then(res => {
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
      'bg-[#006a61] text-white',
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
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">Manage Students</h2>
          <p className="text-sm text-[#444651] mt-1">
            View, filter, and manage all student records across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="students-email-reminders-btn"
            onClick={onOpenEmailReminders}
            className="px-4 py-2.5 bg-white border border-[#e1e3e4] hover:bg-[#f8f9fa] text-[#191c1d] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#757682]">mail</span>
            <span>Email Reminders</span>
          </button>

          <button
            id="students-export-csv-btn"
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Filters Sidebar + Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Advanced Filters & Total Enrolled Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Advanced Filters Form Box */}
          <div className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#191c1d]">Advanced Filters</h3>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#00236f] hover:underline"
              >
                Reset
              </button>
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-4">
              {/* Search query */}
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Search Name or ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    id="filter-search-input"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g. Alice or STU-001"
                    className="w-full pl-9 pr-3.5 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                  />
                </div>
              </div>

              {/* Course */}
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Course
                </label>
                <select
                  id="filter-course-select"
                  value={courseFilter}
                  onChange={e => setCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  <option value="All Courses">All Courses</option>
                  <option value="B.Tech CS">B.Tech CS</option>
                  <option value="B.Tech ME">B.Tech ME</option>
                  <option value="MBA Finance">MBA Finance</option>
                  <option value="B.Sc Physics">B.Sc Physics</option>
                </select>
              </div>

              {/* Admission Year */}
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Admission Year
                </label>
                <select
                  id="filter-year-select"
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  <option value="All Years">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>

              {/* Fees Status */}
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Fees Status
                </label>
                <select
                  id="filter-fees-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="due">Due</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <button
                type="submit"
                id="apply-filters-btn"
                className="w-full py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer mt-2"
              >
                Apply Filters
              </button>
            </form>
          </div>

          {/* Total Enrolled Metric Box */}
          <div className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
                Total Enrolled
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#dce1ff] text-[#00236f] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#191c1d] tracking-tight">{totalCount.toLocaleString('en-IN')}</h3>
              <p className="text-xs font-semibold text-[#006a61] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+12% this semester</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Student Master Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e1e3e4] shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Table Container */}
          <div className="overflow-x-auto">
            <table id="student-master-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Fees Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#757682]">
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#757682]">
                      No student records found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  students.map(s => {
                    const fullName = `${s.first_name} ${s.last_name}`;
                    const initials = `${s.first_name[0] || ''}${s.last_name[0] || ''}`.toUpperCase();
                    const courseCode = s.course?.code || 'B.Tech CS';
                    const sessionName = s.session?.name || '2023-2027';

                    return (
                      <tr key={s.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#00236f]">
                          {s.student_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarBadgeColor(
                                fullName
                              )}`}
                            >
                              {initials}
                            </div>
                            <span className="font-semibold text-[#191c1d]">{fullName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#444651]">{courseCode}</td>
                        <td className="py-3.5 px-4 text-[#757682]">{sessionName}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              s.fees_status === 'paid'
                                ? 'bg-[#86f2e4]/40 text-[#006a61]'
                                : s.fees_status === 'due'
                                ? 'bg-[#fef3c7] text-[#b45309]'
                                : 'bg-[#ffdad6] text-[#ba1a1a]'
                            }`}
                          >
                            {s.fees_status === 'paid' ? 'Paid' : s.fees_status === 'due' ? 'Due' : 'Overdue'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onSelectStudent(s)}
                            className="text-[#00236f] hover:text-[#1e3a8a] font-bold inline-flex items-center gap-0.5 text-xs hover:underline cursor-pointer"
                          >
                            <span>View</span>
                            <span className="material-symbols-outlined text-[14px]">
                              arrow_forward
                            </span>
                          </button>
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

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-[#e1e3e4] rounded bg-white hover:bg-[#f3f4f5] disabled:opacity-40 transition-colors font-medium cursor-pointer"
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
                      className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
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
                className="px-2.5 py-1 border border-[#e1e3e4] rounded bg-white hover:bg-[#f3f4f5] disabled:opacity-40 transition-colors font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
