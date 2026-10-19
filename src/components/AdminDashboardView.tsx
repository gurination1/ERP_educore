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
    { name: 'Computer Science & Engineering', code: 'CSE', students: 480, active: 450, deactive: 22, struckOff: 8, faculty: 18, fsr: '1:17.2', attendanceAvg: '81.2%', status: 'Compliant' },
    { name: 'Mechanical Engineering', code: 'ME', students: 240, active: 225, deactive: 11, struckOff: 4, faculty: 10, fsr: '1:19.0', attendanceAvg: '76.8%', status: 'Compliant' },
    { name: 'Civil Engineering', code: 'CE', students: 180, active: 168, deactive: 9, struckOff: 3, faculty: 8, fsr: '1:18.5', attendanceAvg: '78.4%', status: 'Compliant' },
    { name: 'Management & Business Studies', code: 'MBA', students: 350, active: 335, deactive: 10, struckOff: 5, faculty: 14, fsr: '1:19.5', attendanceAvg: '84.0%', status: 'Compliant' },
  ]);

  // Master Search & Reports Engine State (Karanvir Sir Lecture 4)
  const [reportSchool, setReportSchool] = useState('all');
  const [reportEntity, setReportEntity] = useState<'student' | 'teacher'>('student');
  const [reportSubCategory, setReportSubCategory] = useState('admission_details');
  const [reportPeriod, setReportPeriod] = useState<'current' | 'previous' | 'custom'>('current');
  const [customStartDate, setCustomStartDate] = useState('2025-01-01');
  const [customEndDate, setCustomEndDate] = useState('2025-12-31');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any[]>([]);

  // Support Tickets Queue (from Login View's Contact Admin flip)
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const loadSupportTickets = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('educore_support_tickets') || '[]');
      if (stored && stored.length > 0) {
        setSupportTickets(stored);
      } else {
        const mockTickets = [
          {
            id: 'TKT-829144',
            ticket_number: 'TKT-829144',
            user_identifier: '1001-88-03-01',
            category: 'regarding_password',
            concern_text: 'Student portal password locked after multiple semester fee attempts. Need OTP reset.',
            status: 'open',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'TKT-619203',
            ticket_number: 'TKT-619203',
            user_identifier: '2001-14-03-01',
            category: 'regarding_username',
            concern_text: 'Faculty handle not recognized in Sessional Mark Entry portal. Please verify mapping.',
            status: 'in_progress',
            created_at: new Date(Date.now() - 14400000).toISOString(),
          },
          {
            id: 'TKT-491028',
            ticket_number: 'TKT-491028',
            user_identifier: '10001-01-03-01',
            category: 'regarding_others',
            concern_text: 'Hostel warden biometric sync anomaly for Block A boys residence.',
            status: 'resolved',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setSupportTickets(mockTickets);
        localStorage.setItem('educore_support_tickets', JSON.stringify(mockTickets));
      }
    } catch {
      // Fallback
    }
  };

  const handleResolveTicket = (id: string) => {
    setSupportTickets(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t);
      localStorage.setItem('educore_support_tickets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleGenerateReport = () => {
    setIsReportGenerated(true);
    if (reportEntity === 'student') {
      setGeneratedReport([
        { id: '1001-88-03-01', name: 'Aryan Sharma', school: 'School of Engineering', dept: 'CSE', term: 'Sem 4', metric: '₹ 85,000 Paid (Contra Policy Applied)', attendance: '88.4%', status: 'Active' },
        { id: '1001-88-03-02', name: 'Priya Verma', school: 'School of Engineering', dept: 'CSE', term: 'Sem 4', metric: '₹ 90,000 Paid (Full Clearance)', attendance: '91.2%', status: 'Active' },
        { id: '1001-88-03-03', name: 'Rohan Mehra', school: 'School of Management', dept: 'MBA', term: 'Sem 2', metric: '₹ 45,000 Due (Exam Hold)', attendance: '74.2% [DETENTION WARNING]', status: 'Active' },
        { id: '1001-88-03-04', name: 'Simran Kaur', school: 'School of Engineering', dept: 'ME', term: 'Sem 6', metric: '₹ 92,000 Paid (Merit Concession)', attendance: '82.0%', status: 'Active' },
        { id: '1001-88-03-05', name: 'Gurjit Singh', school: 'School of Engineering', dept: 'CE', term: 'Sem 4', metric: 'Demoted to Sem 2 (Pending Fees Voided)', attendance: '68.5%', status: 'Demoted' },
        { id: '1001-88-03-06', name: 'Harpreet Gill', school: 'School of Commerce', dept: 'B.Com', term: 'Sem 2', metric: 'Struck-off (Non-Payment of Dues)', attendance: '42.1%', status: 'Struck-Off' },
      ]);
    } else {
      setGeneratedReport([
        { id: '2001-14-03-01', name: 'Dr. Gurpreet Singh', school: 'School of Engineering', dept: 'CSE', term: 'Associate Prof', metric: '₹ 1,15,000 / mo (Cleared)', attendance: '18 Lectures / Wk', status: 'Active' },
        { id: '2001-14-03-02', name: 'Prof. Sunita Rao', school: 'School of Management', dept: 'MBA', term: 'Assistant Prof', metric: 'Under Exit NOC Handover', attendance: '14 Lectures / Wk', status: 'Resigned' },
        { id: '2001-14-03-03', name: 'Er. Jaswinder Brar', school: 'School of Engineering', dept: 'ME', term: 'Assistant Prof', metric: '₹ 95,000 / mo (Cleared)', attendance: '16 Lectures / Wk', status: 'Active' },
        { id: '2001-14-03-04', name: 'Dr. Neha Mittal', school: 'School of Engineering', dept: 'CSE', term: 'Associate Prof', metric: '₹ 1,10,000 / mo (Cleared)', attendance: '19 Lectures / Wk', status: 'Active' },
      ]);
    }
  };

  const downloadReportCSV = () => {
    if (generatedReport.length === 0) return;
    const headers = Object.keys(generatedReport[0]).join(',');
    const rows = generatedReport.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduCore_Report_${reportEntity}_${reportSubCategory}_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 font-mono">
            Staff: <strong className="text-emerald-700">50 Teaching</strong> + <strong className="text-blue-700">40 Non-Teaching</strong> + <strong className="text-slate-700">10 Admin</strong> = <strong className="text-[#00236f]">100 Total</strong>
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

      {/* Karanvir Sir Lecture 4: Full-Width Master Search & Reports Engine */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                Institutional Master Search & Reports Engine
              </h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono text-[10px] font-bold border border-blue-200/70">
                MULTI-TIER FILTER & CSV EXPORT
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Live executive intelligence for Teachers (Joining, Payroll, Workload) and Students (Admission, Attendance, Fee Ledger, Demotions).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isReportGenerated && generatedReport.length > 0 && (
              <button
                onClick={downloadReportCSV}
                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>↓ Download CSV</span>
              </button>
            )}
            <button
              onClick={handleGenerateReport}
              className="h-8 px-4 bg-[#00236f] hover:bg-[#001950] text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡ Generate Report</span>
            </button>
          </div>
        </div>

        {/* 4 Multi-Tier Selector Dropdowns */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              1. School / Faculty Cluster
            </label>
            <select
              value={reportSchool}
              onChange={e => setReportSchool(e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#00236f] outline-none"
            >
              <option value="all">All Schools & Campuses</option>
              <option value="School of Engineering">School of Engineering & Tech (Bathinda 01)</option>
              <option value="School of Management">School of Management & Commerce (Campus 02)</option>
              <option value="School of Applied Sciences">School of Applied Sciences</option>
              <option value="School of Humanities">School of Humanities & Social Sciences</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              2. Target Entity Category
            </label>
            <select
              value={reportEntity}
              onChange={e => {
                const ent = e.target.value as 'student' | 'teacher';
                setReportEntity(ent);
                setReportSubCategory(ent === 'student' ? 'admission' : 'joining');
              }}
              className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold text-xs focus:ring-1 focus:ring-[#00236f] outline-none"
            >
              <option value="student">Student / Undergraduate Scholars</option>
              <option value="teacher">Teacher / Faculty & Academic Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              3. Operational Sub-Category
            </label>
            <select
              value={reportSubCategory}
              onChange={e => setReportSubCategory(e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#00236f] outline-none"
            >
              {reportEntity === 'teacher' ? (
                <>
                  <option value="joining">Joining & Profile Verification Details</option>
                  <option value="payroll">Payroll, Salary Disbursements & ESI/PF</option>
                  <option value="workload">Academic Workload, Timetable & Lesson Plans</option>
                </>
              ) : (
                <>
                  <option value="admission">Admissions Intake, Merit & Category Registry</option>
                  <option value="attendance">Daily & Cumulative Lecture Attendance (75% Gate)</option>
                  <option value="fees">Fee Ledgers, Contra Negation Policies & Dues</option>
                  <option value="demotions">Academic Demotions & Course Reset Orders</option>
                  <option value="events">Institutional & Sports Events Participation</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              4. Session / Temporal Scope
            </label>
            <select
              value={reportPeriod}
              onChange={e => setReportPeriod(e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#00236f] outline-none"
            >
              <option value="current">Current Academic Session (2025-26)</option>
              <option value="last">Previous Session (2024-25)</option>
              <option value="historical">Historical Archive (2023-24 & Prior)</option>
              <option value="custom">Custom Date & Statutory Period</option>
            </select>
          </div>
        </div>

        {/* Live Interactive Report Table */}
        {isReportGenerated && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#00236f] uppercase">
                Showing {generatedReport.length} Records ({reportEntity.toUpperCase()} • {reportSubCategory.toUpperCase()} • {reportPeriod.toUpperCase()})
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Audit Verified & Formatted
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">UID / EMP ID</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Faculty / School</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">{reportEntity === 'student' ? 'Term / Semester' : 'Designation'}</th>
                    <th className="py-2.5 px-3">{reportEntity === 'student' ? 'Financial / Fee Metric' : 'Compensation / Handover'}</th>
                    <th className="py-2.5 px-3 text-center">{reportEntity === 'student' ? 'Attendance' : 'Workload Load'}</th>
                    <th className="py-2.5 px-3 text-right">Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {generatedReport.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#00236f]">{row.id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.name}</td>
                      <td className="py-2 px-3 text-slate-600">{row.school}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{row.dept}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{row.term}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{row.metric}</td>
                      <td className="py-2 px-3 text-center font-mono font-semibold text-slate-700">{row.attendance}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          row.status === 'Demoted' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          row.status === 'Struck-Off' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Karanvir Sir Lecture 4 & User Request: Hostel is in diff new role, ALSO in Admin */}
      <div className="bg-gradient-to-r from-blue-900/10 via-white to-amber-50/50 rounded-2xl p-4 border border-blue-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00236f] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              🏨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                  Campus Residence, Hostel & Fleet Command Hub
                </h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-mono text-[10px] font-bold border border-emerald-200">
                  WARDEN ROLE SYNC ACTIVE
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Admin central oversight of Residence Blocks (Owned vs Leased), ARW/FCW Room Typology, 360-day Overhaul Timers, and Mess No-Dues Clearance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('hostel-management')}
              className="px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Full Hostel Console</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {/* Tile 1: Total Residence Capacity & Occupancy */}
          <div
            onClick={() => onNavigate('hostel-management?tab=rooms' as any)}
            className="p-3 rounded-xl bg-white border border-slate-200/90 hover:border-[#00236f]/40 cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Residence Beds</span>
              <span className="text-[#00236f] group-hover:underline">144 Total</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-[#00236f]">122 Occupied</span>
              <span className="text-[10px] font-semibold text-emerald-600">84.7% Filled</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">22 Vacant Beds (ARW / FCW)</div>
          </div>

          {/* Tile 2: Unallocated Hostel Queue */}
          <div
            onClick={() => onNavigate('hostel-management?tab=unassigned' as any)}
            className="p-3 rounded-xl bg-white border border-amber-200/90 hover:border-amber-400 cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Unallocated Queue</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">ATTENTION</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-amber-700">5 Scholars</span>
              <span className="text-[10px] font-semibold text-amber-600">Awaiting Bed</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">1-Click Allotment Desk &rarr;</div>
          </div>

          {/* Tile 3: 360-Day Maintenance & Overhaul */}
          <div
            onClick={() => onNavigate('hostel-management?tab=maintenance' as any)}
            className="p-3 rounded-xl bg-white border border-slate-200/90 hover:border-[#00236f]/40 cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Safety & Overhaul</span>
              <span className="text-rose-600 font-bold text-[9px]">1 DUE SOON</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-rose-700">18 Days Left</span>
              <span className="text-[10px] text-slate-500">Block B</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Annual Painting & Hygiene Audit</div>
          </div>

          {/* Tile 4: Mess No-Dues Clearance Gate */}
          <div
            onClick={() => onNavigate('hostel-management?tab=mess' as any)}
            className="p-3 rounded-xl bg-white border border-slate-200/90 hover:border-[#00236f]/40 cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Mess Dues Gate</span>
              <span className="text-emerald-600 font-bold text-[9px]">ACTIVE</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-800">2 Clearance</span>
              <span className="text-[10px] font-semibold text-emerald-600">Pending Sign-off</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Deposit Release NOC Ordinance</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Departmental Workload & Accreditation (7 cols) + Executive Actions & Support Tickets (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Departmental Accreditation & Student Status Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                  Departmental Academic Topology & Student Breakdown
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Active, Deactivated, and Struck-off student proportions with Faculty-to-Student Ratio (FSR)
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono text-[11px] font-bold">
                {filteredDepartmentRows.length} Departments
              </span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-2 px-2">Academic Department / School</th>
                    <th className="py-2 px-2 text-center">Total Enrolled</th>
                    <th className="py-2 px-2 text-center">Active (%)</th>
                    <th className="py-2 px-2 text-center">Deactive (%)</th>
                    <th className="py-2 px-2 text-center">Struck-Off (%)</th>
                    <th className="py-2 px-2 text-center">Faculty</th>
                    <th className="py-2 px-2 text-center">FSR</th>
                    <th className="py-2 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Karanvir Sir Lecture 4 Segment 0: Prominent Summary Total Row at TOP, not bottom */}
                  {(() => {
                    const totalStudents = filteredDepartmentRows.reduce((acc, d) => acc + (d.students || 0), 0);
                    const totalActive = filteredDepartmentRows.reduce((acc, d) => acc + (d.active || 0), 0);
                    const totalDeactive = filteredDepartmentRows.reduce((acc, d) => acc + (d.deactive || 0), 0);
                    const totalStruckOff = filteredDepartmentRows.reduce((acc, d) => acc + (d.struckOff || 0), 0);
                    const totalFaculty = filteredDepartmentRows.reduce((acc, d) => acc + (d.faculty || 0), 0);
                    const totActivePct = totalStudents > 0 ? (Math.round((totalActive / totalStudents) * 1000) / 10).toFixed(1) : '0.0';
                    const totDeactivePct = totalStudents > 0 ? (Math.round((totalDeactive / totalStudents) * 1000) / 10).toFixed(1) : '0.0';
                    const totStruckOffPct = totalStudents > 0 ? (Math.round((totalStruckOff / totalStudents) * 1000) / 10).toFixed(1) : '0.0';
                    return (
                      <tr className="bg-blue-50/90 font-bold border-b-2 border-blue-200 text-slate-900">
                        <td className="py-2.5 px-2">
                          <span className="text-[#00236f] font-black uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#00236f]"></span>
                            ALL SCHOOLS TOTAL (HEAD SUMMARY)
                          </span>
                          <span className="text-slate-500 font-mono text-[9px] font-normal">Aggregated Campus Cohort</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-[#00236f]">
                          {totalStudents}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-800">
                          {totalActive} <span className="text-[10px] font-semibold text-emerald-600">({totActivePct}%)</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800">
                          {totalDeactive} <span className="text-[10px] font-normal text-amber-600">({totDeactivePct}%)</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-800">
                          {totalStruckOff} <span className="text-[10px] font-normal text-rose-600">({totStruckOffPct}%)</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-slate-800">
                          {totalFaculty}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-[#00236f]">
                          1:{(totalStudents / (totalFaculty || 1)).toFixed(1)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#00236f] text-white">
                            CANONICAL
                          </span>
                        </td>
                      </tr>
                    );
                  })()}

                  {filteredDepartmentRows.map((d, i) => {
                    const activePct = d.students > 0 ? (Math.round((d.active / d.students) * 1000) / 10).toFixed(1) : '0.0';
                    const deactivePct = d.students > 0 ? (Math.round((d.deactive / d.students) * 1000) / 10).toFixed(1) : '0.0';
                    const struckOffPct = d.students > 0 ? (Math.round((d.struckOff / d.students) * 1000) / 10).toFixed(1) : '0.0';
                    return (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-2">
                          <strong className="text-slate-900 block font-semibold text-xs">{d.name}</strong>
                          <span className="text-slate-400 font-mono text-[10px]">{d.code}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                          {d.students}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700">
                          {d.active} <span className="text-[10px] font-normal text-emerald-600">({activePct}%)</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-amber-700 font-semibold">
                          {d.deactive} <span className="text-[10px] font-normal text-amber-600">({deactivePct}%)</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-rose-700 font-semibold">
                          {d.struckOff} <span className="text-[10px] font-normal text-rose-600">({struckOffPct}%)</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-700">
                          {d.faculty}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700">
                          {d.fsr}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

        {/* Executive Governance Actions & Live Support Tickets (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Executive Governance Actions */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
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

          {/* Karanvir Sir Lecture 4: Live Support Tickets Queue (From Login View Contact Admin Flip) */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                  Live Support Tickets Queue
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono text-[10px] font-bold border border-blue-200">
                {supportTickets.filter(t => t.status !== 'resolved').length} Open
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tickets submitted from Login Page &quot;Contact Admin&quot; 3D flip card.
            </p>

            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {supportTickets.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs">No pending support tickets.</div>
              ) : (
                supportTickets.map(t => (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      t.status === 'resolved'
                        ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                        : 'bg-white border-blue-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <strong className="text-slate-900 font-bold text-[11px]">{t.ticket_number}</strong>
                        <span className="text-slate-400 text-[10px]">({t.user_identifier})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed mb-2">
                      {t.concern_text}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                      <span>{new Date(t.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {t.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveTicket(t.id)}
                          className="px-2 py-0.5 bg-[#00236f] hover:bg-[#001950] text-white rounded font-bold text-[10px] transition cursor-pointer"
                        >
                          Mark Resolved ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
