import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ActiveScreen } from '../types';

interface AdminDashboardViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenEmailReminders?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
}) => {
  const [selectedCluster, setSelectedCluster] = useState('All Departments');
  const [selectedTerm, setSelectedTerm] = useState('Current Term');

  // Executive KPIs
  const [kpiData, setKpiData] = useState<any>({
    totalStudents: '1,250',
    totalStudentsGrowth: '+8% YoY enrollment',
    sanctionedSeats: 1500,
    seatFillRate: '83.3%',
    fsrRatio: '1:18.4',
    fsrStatus: 'AICTE Compliant (<= 1:20)',
    attendanceCompliance: '88.4%',
    attendanceWarningCount: 28,
    docCompliance: '92.6%',
    totalCollectedFormatted: '₹ 2.4 Cr',
    pendingDuesFormatted: '₹ 18 L',
  });

  const [progressionStats, setProgressionStats] = useState({
    active: 1150,
    promoted: 80,
    demoted: 12,
    struck_off: 8,
    deactivated: 0,
  });

  const [workloadSummary, setWorkloadSummary] = useState<any>({
    totalCombinedClasses: 1,
    totalSubjects: 6,
    totalTeachers: 4,
    departmentsCount: 4,
  });

  const [departmentRows, setDepartmentRows] = useState<any[]>([
    { name: 'Computer Science & Engineering', code: 'CSE', students: 480, faculty: 18, fsr: '1:17.2', attendanceAvg: '81.2%', status: 'Compliant' },
    { name: 'Mechanical Engineering', code: 'ME', students: 240, faculty: 10, fsr: '1:19.0', attendanceAvg: '76.8%', status: 'Compliant' },
    { name: 'Civil Engineering', code: 'CE', students: 180, faculty: 8, fsr: '1:18.5', attendanceAvg: '78.4%', status: 'Compliant' },
    { name: 'Management & Business Studies', code: 'MBA', students: 350, faculty: 14, fsr: '1:19.5', attendanceAvg: '84.0%', status: 'Compliant' },
  ]);

  const [pendingGovernanceActions, setPendingGovernanceActions] = useState<any[]>([
    { id: 'gov-01', title: 'Student Progression Review', subtitle: '8 Semester 4 students pending promotion ordinance review', type: 'progression', actionScreen: 'manage-students' },
    { id: 'gov-02', title: 'Staff Exit NOC Handover', subtitle: 'Prof. Sunita Rao - Library & Accounts cleared; awaiting Final Sanction', type: 'hrms', actionScreen: 'staff-management' },
    { id: 'gov-03', title: 'Combined Class Timetable Audit', subtitle: 'Room LH-101 CC1_BATCH_2025 verified without room clashes', type: 'academics', actionScreen: 'academics' },
    { id: 'gov-04', title: '75% Attendance Detained Warning', subtitle: '28 scholars across sections below mandatory exam cutoff', type: 'compliance', actionScreen: 'reports' },
  ]);

  useEffect(() => {
    // Load Real Workload Report
    api.getAcademicWorkloadReport().then(res => {
      if (res.success && res.summary) {
        setWorkloadSummary(res.summary);
        if (res.departments && res.departments.length > 0) {
          setDepartmentRows(res.departments.map((d: any) => ({
            name: d.department_name || d.name,
            code: d.department_code || d.code || 'DEPT',
            students: d.students_count || 120,
            faculty: d.teachers_count || 4,
            fsr: `1:${Math.round((d.students_count || 120) / (d.teachers_count || 4))}`,
            attendanceAvg: '80.5%',
            status: 'Compliant',
          })));
        }
      }
    }).catch(console.warn);

    // Load Real Students Count & Progression
    api.getStudents().then(res => {
      if (res.success && Array.isArray(res.students)) {
        const total = res.students.length;
        const active = res.students.filter((s: any) => s.progression_status === 'active' || !s.progression_status).length;
        const promoted = res.students.filter((s: any) => s.progression_status === 'promoted').length;
        const demoted = res.students.filter((s: any) => s.progression_status === 'demoted').length;
        const struckOff = res.students.filter((s: any) => s.progression_status === 'struck_off').length;
        setProgressionStats({
          active,
          promoted,
          demoted,
          struck_off: struckOff,
          deactivated: 0,
        });
        setKpiData((prev: any) => ({
          ...prev,
          totalStudents: String(total),
        }));
      }
    }).catch(console.warn);

    // Load Macro Fees
    api.getFeeKPIs().then(res => {
      if (res.success && res.kpi) {
        setKpiData((prev: any) => ({
          ...prev,
          totalCollectedFormatted: res.kpi.totalCollectedFormatted || prev.totalCollectedFormatted,
          pendingDuesFormatted: res.kpi.pendingDuesFormatted || prev.pendingDuesFormatted,
        }));
      }
    }).catch(console.warn);
  }, []);

  const filteredDepartmentRows = departmentRows.filter(d => {
    if (selectedCluster === 'All Departments') return true;
    return d.code === selectedCluster || d.name?.toLowerCase().includes(selectedCluster.toLowerCase());
  });

  return (
    <div id="admin-dashboard-screen" className="space-y-4 animate-fadeIn text-xs">
      {/* Sleek Operations Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00236f] to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
            ADM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-[#00236f] tracking-tight">
                Institutional Executive Governance Cockpit
              </h2>
              <span className="bg-blue-50 text-[#00236f] border border-blue-200/80 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md">
                CAMPUS PROVOST 4001
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Accreditation compliance, faculty workload hierarchy, 75% attendance gate, and academic topology
            </p>
          </div>
        </div>

        {/* Quick Filter Selectors - Cupertino Style */}
        <div className="flex items-center gap-2">
          <select
            id="admin-filter-cluster"
            value={selectedCluster}
            onChange={e => setSelectedCluster(e.target.value)}
            className="h-8 px-3 bg-white border border-slate-200/90 text-slate-700 rounded-lg font-medium text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00236f] shadow-2xs hover:border-slate-300 transition-all"
          >
            <option value="All Departments">All Academic Departments</option>
            <option value="CSE">Computer Science & Engineering</option>
            <option value="ME">Mechanical Engineering</option>
            <option value="CE">Civil Engineering</option>
            <option value="MBA">Management Studies</option>
          </select>

          <select
            id="admin-filter-term"
            value={selectedTerm}
            onChange={e => setSelectedTerm(e.target.value)}
            className="h-8 px-3 bg-white border border-slate-200/90 text-slate-700 rounded-lg font-medium text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00236f] shadow-2xs hover:border-slate-300 transition-all"
          >
            <option value="Current Term">Current Term (2025-26)</option>
            <option value="Odd Term">Odd Semester (Term 1/3/5/7)</option>
            <option value="Even Term">Even Semester (Term 2/4/6/8)</option>
          </select>
        </div>
      </div>

      {/* 4 Executive Campus Pulse Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Enrolled Scholars across 5 Topology Levels */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('manage-students')}
          className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer hover:border-[#00236f]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Enrolled Scholars</span>
            <span className="text-[#00236f] bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-xs font-bold group-hover:bg-[#00236f] group-hover:text-white transition-colors">
              5-LEVEL TOPOLOGY
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00236f] tracking-tight">{kpiData.totalStudents}</span>
            <span className="text-xs font-semibold text-emerald-600">{kpiData.totalStudentsGrowth}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Seat Fill-Rate: <strong className="text-slate-800">{kpiData.seatFillRate}</strong> ({kpiData.sanctionedSeats} Capacity)</span>
          </div>
        </div>

        {/* Metric 2: Faculty-to-Student Ratio (FSR) - AICTE/UGC Compliance */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('staff-management')}
          className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer hover:border-emerald-500/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Faculty-Student Ratio</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-xs font-bold group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              COMPLIANT
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">{kpiData.fsrRatio}</span>
            <span className="text-xs text-slate-500">Across 4 Clusters</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>AICTE Mandate: <strong className="text-slate-700">&le; 1:20 for Engineering</strong></span>
          </div>
        </div>

        {/* Metric 3: 75% Attendance Exam Gate Compliance */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('reports')}
          className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer hover:border-orange-500/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>75% Exam Gate Safety</span>
            <span className="text-[#ea580c] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full text-xs font-bold group-hover:bg-[#ea580c] group-hover:text-white transition-colors">
              MANDATORY
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpiData.attendanceCompliance}</span>
            <span className="text-xs text-emerald-600 font-semibold">Eligible</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Danger Zone (&lt;75%): <strong className="text-rose-600">{kpiData.attendanceWarningCount} Scholars Flagged</strong></span>
          </div>
        </div>

        {/* Metric 4: Macro Institutional Treasury */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('fee-ledger')}
          className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer hover:border-blue-500/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Macro Institutional Revenue</span>
            <span className="text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-xs font-bold group-hover:bg-blue-700 group-hover:text-white transition-colors">
              TERM LEDGER
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00236f] tracking-tight">{kpiData.totalCollectedFormatted}</span>
            <span className="text-xs text-slate-500">Realized</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Outstanding Term Receivables: <strong className="text-rose-600">{kpiData.pendingDuesFormatted}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid: Departmental Workload & Accreditation (7 cols) + Executive Actions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Departmental Accreditation & FSR Health Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                  Departmental Academic Topology & Accreditation Status
                </h3>
                <p className="text-slate-500 text-[11px]">
                  FSR ratios, attendance averages, and teaching capacity across institutional clusters
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono text-[11px] font-bold">
                {filteredDepartmentRows.length} Departments
              </span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-2 px-2">Academic Department</th>
                    <th className="py-2 px-2 text-center">Students</th>
                    <th className="py-2 px-2 text-center">Faculty</th>
                    <th className="py-2 px-2 text-center">FSR</th>
                    <th className="py-2 px-2 text-center">Avg Attendance</th>
                    <th className="py-2 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepartmentRows.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-2">
                        <strong className="text-slate-900 block font-semibold text-xs">{d.name}</strong>
                        <span className="text-slate-400 font-mono text-[10px]">{d.code}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                        {d.students}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-700">
                        {d.faculty}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700">
                        {d.fsr}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-700">
                        {d.attendanceAvg}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Workload Hierarchy: <strong>{workloadSummary.totalCombinedClasses} Combined Classes (CC)</strong> active</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-[#00236f] font-bold hover:underline cursor-pointer"
            >
              Academic Workload Audit Report &rarr;
            </button>
          </div>
        </div>

        {/* Executive Governance Actions & Progression Ordinances (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                  Executive Governance & Ordinances
                </h3>
                <p className="text-slate-500 text-[11px]">Sanction items requiring Principal or Registrar clearance</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono text-[10px] font-bold">
                {pendingGovernanceActions.length} Actions
              </span>
            </div>

            {/* Student Progression State Counters */}
            <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Student Lifecycle State Distribution
              </div>
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate('manage-students')}
                  className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-300 transition-all"
                  title="Filter Active Scholars"
                >
                  <span className="block text-base font-black text-emerald-700">{progressionStats.active}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Active</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate('manage-students')}
                  className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all"
                  title="Filter Promoted Scholars"
                >
                  <span className="block text-base font-black text-blue-700">{progressionStats.promoted}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Promoted</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate('manage-students')}
                  className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-amber-50/50 hover:border-amber-300 transition-all"
                  title="Filter Demoted Scholars"
                >
                  <span className="block text-base font-black text-amber-600">{progressionStats.demoted}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Demoted</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate('manage-students')}
                  className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-rose-50/50 hover:border-rose-300 transition-all"
                  title="Filter Struck-Off Scholars"
                >
                  <span className="block text-base font-black text-rose-600">{progressionStats.struck_off}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Struck-Off</span>
                </div>
              </div>
            </div>

            {/* Governance Action Items List */}
            <div className="mt-3 space-y-2">
              {pendingGovernanceActions.map(action => (
                <div
                  key={action.id}
                  onClick={() => onNavigate(action.actionScreen as ActiveScreen)}
                  className="p-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <strong className="block text-slate-800 text-xs font-semibold">{action.title}</strong>
                    <span className="text-slate-500 text-[11px] truncate block">{action.subtitle}</span>
                  </div>
                  <span className="text-slate-400 font-bold text-xs shrink-0">&rarr;</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Document Compliance Vault: <strong className="text-emerald-700">92.6% Verified</strong></span>
            <button
              onClick={() => onNavigate('manage-students')}
              className="text-[#00236f] font-bold hover:underline cursor-pointer"
            >
              Progression Ordinance Desk &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
