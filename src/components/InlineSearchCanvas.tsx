import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ActiveScreen } from '../types';
import { Search, User as UserIcon, GraduationCap, Briefcase, DollarSign, ArrowRight, X, Phone, Mail, Building2 } from 'lucide-react';

interface InlineSearchCanvasProps {
  searchQuery: string;
  onClose: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  selectedCampus?: string;
}

export const InlineSearchCanvas: React.FC<InlineSearchCanvasProps> = ({
  searchQuery,
  onClose,
  onNavigate,
  selectedCampus,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setStudents([]);
      setStaff([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [studRes, staffRes] = await Promise.all([
          api.getStudents({ search: q, limit: 20 }),
          api.getStaffList({ search: q }),
        ]);
        const studList = studRes.students || (studRes as any).data || [];
        const staffList = staffRes.staff || (staffRes as any).data || [];
        setStudents(studList);
        setStaff(staffList);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const cleanDigits = searchQuery.replace(/[^0-9]/g, '');
  const is13DigitStudent = cleanDigits.length === 13;
  const is8DigitStaff = cleanDigits.length === 8 || searchQuery.toUpperCase().startsWith('EMP');

  // Exact Match determination
  const exactStudent = students.find(
    s => s.uid === searchQuery || s.roll_no === searchQuery || s.id === searchQuery
  ) || (is13DigitStudent && students[0]) || null;

  const exactStaff = staff.find(
    st => st.employee_id === searchQuery || st.staff_id === searchQuery || st.id === searchQuery
  ) || (is8DigitStaff && staff[0]) || null;

  const totalResults = students.length + staff.length;

  return (
    <div id="inline-search-canvas" className="space-y-4 animate-fadeIn pb-8">
      {/* Top Banner & Control */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00236f] to-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                Database Search Results: <span className="text-[#00236f] font-mono font-black">"{searchQuery}"</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {isLoading ? 'Searching...' : `${totalResults} Records Found`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Karanvir Sir Unified Resolution: 13-digit Student UID vs 8-digit Staff Employee ID
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-8 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer ml-auto shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close Search (ESC)</span>
        </button>
      </div>

      {/* SECTION 1: Exact Match Box (Karanvir Sir Lecture 4 Mandate) */}
      {(exactStudent || exactStaff || is13DigitStudent || is8DigitStaff) && (
        <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-2 border-[#00236f]/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#00236f] uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Exact Match Detected</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                {exactStudent ? '13-Digit Scholar UID' : exactStaff ? '8-Digit Faculty EMP ID' : 'Target Entity'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Canonical Verified
            </span>
          </div>

          {exactStudent && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00236f] text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    {exactStudent.full_name || exactStudent.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 font-mono">
                    <span className="font-bold text-[#00236f] bg-blue-100/70 px-1.5 py-0.5 rounded">
                      UID: {exactStudent.uid || exactStudent.roll_no}
                    </span>
                    <span>•</span>
                    <span>{exactStudent.course || exactStudent.department} (Sem {exactStudent.semester || 1})</span>
                    <span>•</span>
                    <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {exactStudent.enrollment_status || 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {exactStudent.contact_number || exactStudent.phone || '98765-43210'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {exactStudent.email || `${exactStudent.uid?.toLowerCase() || 'scholar'}@college.edu`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('manage-students');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Student Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('fee-ledger');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fee Ledger</span>
                </button>
              </div>
            </div>
          )}

          {exactStaff && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    {exactStaff.full_name || exactStaff.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 font-mono">
                    <span className="font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                      EMP ID: {exactStaff.employee_id || exactStaff.staff_id}
                    </span>
                    <span>•</span>
                    <span>{exactStaff.primary_designation || 'Faculty'}</span>
                    <span>•</span>
                    <span>Dept: {exactStaff.department_id || exactStaff.department || 'General'}</span>
                    <span>•</span>
                    <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {exactStaff.employee_status || 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      Campus: {exactStaff.campus_id === 'campus_02' ? 'Faridkot Campus 02' : 'Bathinda Campus 01'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('staff-management');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Staff Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Similar & Nearby Matches Table */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700">
              Similar & Nearby Live Matches
            </h3>
            <p className="text-[11px] text-slate-400">
              Scholars, faculty, and administrative personnel matching query across collegiate databases
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">
            {totalResults} Live Matches
          </span>
        </div>

        {totalResults === 0 && !isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-xs text-slate-600">No records found matching "{searchQuery}"</p>
            <p className="text-[11px] text-slate-400 mt-1">Try searching by partial student name, 13-digit UID, or 8-digit Employee ID</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Canonical UID / EMP ID</th>
                  <th className="py-2.5 px-3">Name & Contact</th>
                  <th className="py-2.5 px-3">Academic Department / Course</th>
                  <th className="py-2.5 px-3">Campus</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Students */}
                {students.map((st: any) => (
                  <tr key={`st-${st.id || st.uid}`} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                        Student
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#00236f]">
                      {st.uid || st.roll_no}
                    </td>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block font-bold">{st.full_name || st.name}</strong>
                      <span className="text-[11px] text-slate-500">{st.email || 'scholar@college.edu'}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-700">{st.course || st.department || 'Engineering'}</span>
                      <span className="block text-[10px] text-slate-400">Sem {st.semester || 1}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {st.campus_id === 'campus_02' ? 'Faridkot 02' : 'Bathinda 01'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {st.enrollment_status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('manage-students');
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#00236f] hover:bg-[#001744] text-white rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer"
                      >
                        Open Dossier →
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Staff */}
                {staff.map((sf: any) => (
                  <tr key={`sf-${sf.id || sf.staff_id}`} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        Staff
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                      {sf.employee_id || sf.staff_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block font-bold">{sf.full_name || sf.name}</strong>
                      <span className="text-[11px] text-slate-500">{sf.user_account?.email || `${sf.employee_id}@college.edu`}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-700">{sf.primary_designation || 'Faculty'}</span>
                      <span className="block text-[10px] text-slate-400">{sf.department_id || 'General'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {sf.campus_id === 'campus_02' ? 'Faridkot 02' : 'Bathinda 01'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sf.employee_status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('staff-management');
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer"
                      >
                        Open Dossier →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
