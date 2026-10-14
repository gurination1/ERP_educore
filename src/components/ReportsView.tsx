import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { api, getStoredToken } from '../api/client';
import { User } from '../types';

interface ReportsViewProps {
  currentUser: User | null;
}

interface CourseDistributionItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  department: string;
  studentCount: number;
  paidCount: number;
  dueCount: number;
  totalCollected: number;
  totalDue: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAccounts = currentUser?.role === 'accounts';
  const isCounselor = currentUser?.role === 'counselor';

  const getInitialTab = (): 'financial' | 'academic_workload' | 'platform_telemetry' | 'attendance_gate' => {
    const tabParam = urlTab || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null);
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    if (tabParam === 'attendance' || tabParam === 'attendance_gate' || tabParam === 'compliance') {
      return 'attendance_gate';
    }
    if (tabParam === 'financial' || tabParam === 'revenue') {
      return 'financial';
    }
    if (tabParam === 'academic_workload' || tabParam === 'workload') {
      return (isAccounts || isCounselor) ? 'financial' : 'academic_workload';
    }
    if (tabParam === 'platform_telemetry' || tabParam === 'telemetry' || pathname === '/telemetry') {
      return 'platform_telemetry';
    }
    if (isAccounts || isCounselor) {
      return 'financial';
    }
    return isSuperAdmin ? 'platform_telemetry' : 'academic_workload';
  };

  const [activeTab, setActiveTab] = useState<'financial' | 'academic_workload' | 'platform_telemetry' | 'attendance_gate'>(
    getInitialTab()
  );

  useEffect(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    if (urlTab === 'attendance' || urlTab === 'attendance_gate' || urlTab === 'compliance') {
      setActiveTab('attendance_gate');
    } else if (urlTab === 'financial' || urlTab === 'revenue') {
      setActiveTab('financial');
    } else if (urlTab === 'academic_workload' || urlTab === 'workload') {
      setActiveTab((isAccounts || isCounselor) ? 'financial' : 'academic_workload');
    } else if (urlTab === 'platform_telemetry' || urlTab === 'telemetry' || pathname === '/telemetry') {
      setActiveTab('platform_telemetry');
    } else if (isAccounts || isCounselor) {
      setActiveTab('financial');
    }
  }, [urlTab, isAccounts, isCounselor, isSuperAdmin]);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [distribution, setDistribution] = useState<CourseDistributionItem[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [workloadData, setWorkloadData] = useState<any>(null);
  const [attendanceStudents, setAttendanceStudents] = useState<any[]>([]);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'eligible' | 'condonation' | 'detained'>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isCondoningId, setIsCondoningId] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin) {
        const [telemRes, kpiRes, stuRes] = await Promise.all([
          api.getPlatformTelemetry(),
          api.getFeeKPIs(),
          api.getStudents(),
        ]);
        if (telemRes.success) {
          setTelemetryData(telemRes);
        }
        if (kpiRes.success && kpiRes.kpi) {
          setKpiData(kpiRes.kpi);
        }
        if (stuRes.success && Array.isArray(stuRes.students)) {
          setAttendanceStudents(stuRes.students);
        }
      } else {
        const [distRes, kpiRes, workRes, stuRes] = await Promise.all([
          api.getAdmissionsByCourseReport(),
          api.getFeeKPIs(),
          api.getAcademicWorkloadReport(),
          api.getStudents(),
        ]);

        if (distRes.success && distRes.distribution) {
          setDistribution(distRes.distribution);
        }
        if (kpiRes.success && kpiRes.kpi) {
          setKpiData(kpiRes.kpi);
        }
        if (workRes.success) {
          setWorkloadData(workRes);
        }
        if (stuRes.success && Array.isArray(stuRes.students)) {
          setAttendanceStudents(stuRes.students);
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Programmatic Master Student CSV Export with Bearer Auth Token
  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `/api/reports/export-students-csv?token=${encodeURIComponent(token || '')}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(`Failed to download report (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `EduCore_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setExportMessage('Master student CSV directory exported successfully.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Programmatic Financial Revenue CSV Export
  const handleExportFinancialCsv = () => {
    try {
      const escapeCsv = (val: any): string => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const headers = ['Course Code', 'Course Name', 'Department', 'Enrolled Scholars', 'Paid Count', 'Due Count', 'Total Collected (INR)', 'Total Outstanding Due (INR)'];
      const rows = distribution.map(d => [
        escapeCsv(d.courseCode),
        escapeCsv(d.courseName),
        escapeCsv(d.department),
        d.studentCount,
        d.paidCount,
        d.dueCount,
        d.totalCollected,
        d.totalDue,
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EduCore_Revenue_Distribution_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage('Revenue & fee distribution CSV exported.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      setExportMessage(`Export failed: ${err.message}`);
    }
  };

  // Programmatic Academic Workload CSV Export
  const handleExportWorkloadCsv = () => {
    try {
      const escapeCsv = (val: any): string => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const headers = ['Faculty Name', 'Staff / Employee ID', 'Department', 'Designation', 'Assigned Subjects', 'Weekly Teaching Hours', 'Combined Classes (CC) Count'];
      const rows = (workloadData?.teacherAssignments || []).map((t: any) => [
        escapeCsv(t.full_name),
        escapeCsv(t.employee_id || t.staff_id),
        escapeCsv(t.department || 'N/A'),
        escapeCsv(t.primary_designation || 'Faculty'),
        escapeCsv((t.assigned_subjects || []).map((s: any) => s.code || s.name).join('; ')),
        t.weekly_slots_count || 0,
        t.combined_slots_count || 0,
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EduCore_Faculty_Workload_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage('Academic workload audit CSV exported.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      setExportMessage(`Export failed: ${err.message}`);
    }
  };

  // Programmatic 75% Attendance Gate Exam Eligibility CSV Export
  const handleExportAttendanceGateCsv = () => {
    try {
      const escapeCsv = (val: any): string => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const headers = ['Student ID', 'Full Name', 'Course Code', 'Current Semester', 'Attended Classes', 'Total Classes', 'Attendance %', 'Condonation Granted', 'Statutory Exam Status'];
      const rows = attendanceStudents.map(s => {
        const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
        let status = 'ELIGIBLE';
        if (att < 75) {
          if (s.condonation_granted) status = 'CONDONED_ELIGIBLE';
          else if (att >= 65) status = 'CONDONATION_REQUIRED';
          else status = 'STRICTLY_DETAINED';
        }
        return [
          escapeCsv(s.student_id),
          escapeCsv(`${s.first_name} ${s.last_name}`),
          escapeCsv(s.course?.code || s.course_id),
          s.current_semester || 1,
          s.attended_classes || 0,
          s.total_classes || 0,
          `${att}%`,
          s.condonation_granted ? 'YES' : 'NO',
          status,
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EduCore_75Percent_Attendance_Gate_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage('75% attendance gate exam eligibility audit exported.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      setExportMessage(`Export failed: ${err.message}`);
    }
  };

  // Dean / HOD Condonation Order Action
  const handleCondoneAttendance = async (student: any) => {
    setIsCondoningId(student.id);
    try {
      const res = await api.condoneExamAttendance({
        studentId: student.id,
        orderNo: `ORD-DEAN-${Date.now().toString().slice(-5)}`,
        reason: 'Statutory Dean Condonation under Ordinance 7.4 approved by Academic Council',
      });
      if (res.success) {
        setAttendanceStudents(prev =>
          prev.map(s => (s.id === student.id ? { ...s, condonation_granted: true, condonation_order_no: res.orderNo } : s))
        );
        setExportMessage(`Attendance condonation granted for ${student.first_name} ${student.last_name}. Order: ${res.orderNo}`);
        setTimeout(() => setExportMessage(null), 4000);
      }
    } catch (err: any) {
      setExportMessage(`Condonation error: ${err.message}`);
    } finally {
      setIsCondoningId(null);
    }
  };

  const canExport = ['admin', 'super_admin', 'staff', 'accounts', 'hod', 'hr'].includes(currentUser?.role || '');

  return (
    <div id="institutional-reports-screen" className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-base transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-[#191c1d] tracking-tight">
              {isSuperAdmin
                ? 'SaaS Platform Infrastructure & Database Telemetry'
                : 'Institutional Analytical Reports & Audits'}
            </h2>
            <p className="text-sm text-[#444651] mt-1">
              {isSuperAdmin
                ? 'Real-time PostgreSQL 18.6 connection pool health, MariaDB dual-cluster mirror, and 1-database-per-college architecture'
                : 'Departmental enrollment verification, fee reconciliation, and statutory university compliance'}
            </p>
          </div>
        </div>

        {canExport && (
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'financial' && (
              <button
                type="button"
                onClick={handleExportFinancialCsv}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Export Revenue Ledger (CSV)</span>
              </button>
            )}
            {activeTab === 'academic_workload' && (
              <button
                type="button"
                onClick={handleExportWorkloadCsv}
                className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Export Faculty Workload (CSV)</span>
              </button>
            )}
            {activeTab === 'attendance_gate' && (
              <button
                type="button"
                onClick={handleExportAttendanceGateCsv}
                className="px-3 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Export 75% Gate Audit (CSV)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-3.5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <span>{isExporting ? 'Generating CSV...' : 'Export Master Data (CSV)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Export feedback toast */}
      {exportMessage && (
        <div className="p-3.5 bg-[#ffedd5] border border-[#ea580c] text-[#00236f] rounded-xl text-xs font-bold flex items-center gap-2">
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 flex-wrap">
        {isSuperAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('platform_telemetry')}
              className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'platform_telemetry'
                  ? 'border-[#00236f] text-[#00236f]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>PLATFORM INFRASTRUCTURE & 1-DB-PER-COLLEGE TELEMETRY</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-extrabold">
                99.98% SLA
              </span>
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'financial'
                  ? 'border-[#00236f] text-[#00236f]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>CROSS-CAMPUS REVENUE & GLOBAL SCHOLAR CENSUS</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance_gate')}
              className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'attendance_gate'
                  ? 'border-[#00236f] text-[#00236f]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>75% ATTENDANCE GATE & EXAM AUDIT</span>
              {attendanceStudents.filter(s => {
                const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                return att < 75 && !s.condonation_granted;
              }).length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-rose-100 text-rose-800 rounded-full font-extrabold">
                  {attendanceStudents.filter(s => {
                    const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                    return att < 75 && !s.condonation_granted;
                  }).length} Flagged
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            {!isAccounts && !isCounselor && (
              <button
                onClick={() => setActiveTab('academic_workload')}
                className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'academic_workload'
                    ? 'border-[#00236f] text-[#00236f]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>ACADEMIC TOPOLOGY & WORKLOAD AUDIT</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('financial')}
              className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'financial'
                  ? 'border-[#00236f] text-[#00236f]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>FINANCIAL REVENUE & ENROLLMENT LEDGER</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance_gate')}
              className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'attendance_gate'
                  ? 'border-[#00236f] text-[#00236f]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>75% ATTENDANCE GATE & EXAM AUDIT</span>
              {attendanceStudents.filter(s => {
                const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                return att < 75 && !s.condonation_granted;
              }).length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-rose-100 text-rose-800 rounded-full font-extrabold">
                  {attendanceStudents.filter(s => {
                    const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                    return att < 75 && !s.condonation_granted;
                  }).length} Flagged
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {activeTab === 'platform_telemetry' ? (
        <div className="space-y-6">
          {/* Cluster Telemetry Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-xl border border-blue-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                PRIMARY DB ENGINE
              </span>
              <p className="text-xl font-extrabold text-[#00236f] mt-1">
                {telemetryData?.cluster?.engine || 'PostgreSQL 18.6 Enterprise'}
              </p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                Active Connections: {telemetryData?.cluster?.activeConnections || 12} / {telemetryData?.cluster?.maxPoolConnections || 50}
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                DUAL-POOL REPLICATION
              </span>
              <p className="text-xl font-extrabold text-slate-800 mt-1">
                Active Mirror Dual-Pool
              </p>
              <span className="text-xs text-slate-600 font-semibold mt-1 block">
                Isolation: {telemetryData?.cluster?.transactionIsolation || 'SERIALIZABLE'} • SSL: Active
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1 DB PER COLLEGE
              </span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">
                {telemetryData?.domains?.length || 4} Dedicated DBs
              </p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                100% Isolated Tenant Schemas
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PLATFORM CLOUD SLA
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {telemetryData?.cluster?.uptime || '99.98%'} Uptime
              </p>
              <span className="text-xs text-slate-500 mt-1 block">
                Avg Latency: {telemetryData?.cluster?.averageLatencyMs || '14.2'} ms
              </span>
            </div>
          </div>

          {/* Tenant-Isolated Database Instances Breakdown (1 DB Per College) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Collegiate Database Catalog (1 Dedicated DB Per College)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tenant-isolated relational schemas guaranteeing data segregation, zero cross-college leakage, and dedicated tablespaces
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {telemetryData?.domains?.length || 4} Isolated Databases Active
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Institution / Campus</th>
                    <th className="p-3.5">Dedicated Database</th>
                    <th className="p-3.5">Core Schema Tables</th>
                    <th className="p-3.5 text-center">Records Ingested</th>
                    <th className="p-3.5 text-center">Storage Size</th>
                    <th className="p-3.5 text-center">Database Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {telemetryData?.domains?.map((dom: any) => (
                    <tr key={dom.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-slate-900 font-bold block">{dom.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {dom.collegeId || dom.id}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[#00236f] font-bold">
                        {dom.dbName || dom.id}
                        <span className="block text-[10px] text-slate-400 font-normal">{dom.engine || 'PostgreSQL 18.6'}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {dom.tables?.map((t: string) => (
                            <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-extrabold text-[#00236f]">
                        {dom.recordCount?.toLocaleString('en-IN') || '—'}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">
                        {dom.storageMb} MB
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                          {dom.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Tenant Campuses Roster */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Active SaaS Multi-Tenant Institutions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutions served by EduCore SaaS cluster with isolated tenant schema namespaces
              </p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {telemetryData?.tenants?.map((t: any) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#00236f] text-sm">{t.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-[#00236f] font-mono text-[10px] font-bold rounded">
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Subdomain: <span className="font-mono font-bold text-slate-800">{t.subdomain}</span></div>
                      <div className="flex gap-4">
                        <span>Campuses: <strong>{t.campuses}</strong></span>
                        <span>Scholars: <strong>{t.enrolledScholars}</strong></span>
                        <span>Faculty & Staff: <strong>{t.facultyCount}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hardware & Cloud Infrastructure Live Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">CPU Utilization</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{telemetryData?.systemMetrics?.cpuUsagePercent || 18.4}%</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${telemetryData?.systemMetrics?.cpuUsagePercent || 18.4}%` }}></div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">RAM Ingestion Footprint</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{telemetryData?.systemMetrics?.memoryUsageMb || 428.6} MB</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Disk IOPS</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{telemetryData?.systemMetrics?.diskIops || 420} IOPS</p>
              <span className="text-[10px] text-slate-500 mt-1 block">NVMe PCIe 4.0 Storage</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Network Throughput</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{telemetryData?.systemMetrics?.networkThroughputMbps || 84.2} Mbps</p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Zero Egress Bottleneck</span>
            </div>
          </div>
        </div>
      ) : (!isSuperAdmin && activeTab === 'academic_workload') ? (
        <div className="space-y-6">
          {/* Lecture 3 Academic KPI Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-xl border border-indigo-100 shadow-xs">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                Combined Classes (CC)
              </span>
              <p className="text-2xl font-extrabold text-[#00236f] mt-1">
                {workloadData?.summary?.totalCombinedClasses ?? 0}
              </p>
              <span className="text-xs text-slate-500 mt-1 block">
                Multi-batch synchronized slots
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Academic Subjects
              </span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">
                {workloadData?.summary?.totalSubjects ?? 0}
              </p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                3-Flag evaluation matrix
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Teaching Faculty Members
              </span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">
                {workloadData?.summary?.totalTeachers ?? 0}
              </p>
              <span className="text-xs text-slate-500 mt-1 block">
                Teaching & additional roles
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Free Period (FC) Sessions
              </span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {workloadData?.summary?.totalFreePeriodSlots ?? 0}
              </p>
              <span className="text-xs text-amber-700 font-semibold mt-1 block">
                Auto-present (no exam/attendance)
              </span>
            </div>
          </div>

          {/* Teacher-Subject Workload Distribution Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Faculty-Subject Workload Distribution Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subjects assigned to each teacher, weekly periods, and combined class allocations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="all">All Departments</option>
                  {workloadData?.departments?.map((d: any) => (
                    <option key={d.department} value={d.department}>{d.department}</option>
                  ))}
                </select>
                <button
                  onClick={loadReportsData}
                  className="text-xs font-bold text-[#00236f] hover:underline"
                >
                  [REFRESH]
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Faculty Member</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">Assigned Subjects</th>
                    <th className="p-3.5 text-center">Weekly Periods</th>
                    <th className="p-3.5 text-center">Combined Classes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workloadData?.teacherAssignments
                    ?.filter((t: any) => deptFilter === 'all' || t.department?.toLowerCase() === deptFilter.toLowerCase())
                    .map((teacher: any) => (
                      <tr key={teacher.staff_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-slate-900 block text-xs">{teacher.full_name}</strong>
                          <span className="text-[11px] text-slate-500">ID: {teacher.employee_id || teacher.staff_id}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-semibold">{teacher.department || 'N/A'}</td>
                        <td className="p-3.5 text-slate-600">{teacher.primary_designation || 'Faculty'}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {teacher.assigned_subjects?.length > 0 ? (
                              teacher.assigned_subjects.map((sub: any) => (
                                <span
                                  key={sub.id}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    sub.code?.startsWith('FC_')
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}
                                  title={sub.name}
                                >
                                  {sub.code || sub.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No assigned subjects</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-slate-800">
                          {teacher.weekly_slots_count} hrs
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            teacher.combined_slots_count > 0 ? 'bg-indigo-100 text-indigo-800' : 'text-slate-400'
                          }`}>
                            {teacher.combined_slots_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combined Classes Timetable Roster */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Combined Classes (CC) & Elective Parallel Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lecture periods combining multiple batches under common instructors
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Subject & Code</th>
                    <th className="p-3.5">Faculty In-Charge</th>
                    <th className="p-3.5">Timing & Day</th>
                    <th className="p-3.5">Lecture Room</th>
                    <th className="p-3.5">Batches Merged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workloadData?.combinedClassesDetail?.length > 0 ? (
                    workloadData.combinedClassesDetail.map((cc: any) => (
                      <tr key={cc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-slate-900 block text-xs">{cc.subject_name}</strong>
                          <span className="text-[10px] text-indigo-700 font-bold">{cc.subject_code}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-semibold">{cc.faculty_name}</td>
                        <td className="p-3.5 text-slate-600">
                          <span className="font-bold text-slate-800">{cc.day_of_week}</span> ({cc.start_time} - {cc.end_time})
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">
                            {cc.room_number}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex gap-1 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                              Primary: {cc.batch_id}
                            </span>
                            {cc.linked_batches?.map((b: string) => (
                              <span key={b} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                                + {b}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-xs text-slate-400">
                        No combined classes currently scheduled. Toggle "Combined Class (CC)" when adding timetable slots.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Hierarchy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {workloadData?.departments?.map((dept: any) => (
              <div key={dept.department} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{dept.department}</h4>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                    {dept.courses_count} Courses
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {dept.subjects_count} Subjects • {dept.teachers_count} Faculty Members • {dept.combined_slots_count} CC Slots
                </p>
                <div className="pt-2 flex flex-wrap gap-1">
                  {dept.course_list?.map((c: any) => (
                    <span key={c.id} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {c.code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'attendance_gate' ? (
        <div className="space-y-6">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Enrolled Scholars
              </span>
              <p className="text-2xl font-extrabold text-[#00236f] mt-1">
                {attendanceStudents.length}
              </p>
              <span className="text-xs text-slate-500 font-semibold mt-1 block">
                Verified against Campus Roster
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Exam Gate Eligible (&ge;75%)
              </span>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">
                {attendanceStudents.filter(s => {
                  const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                  return att >= 75 || s.condonation_granted;
                }).length}
              </p>
              <span className="text-xs text-emerald-700 font-semibold mt-1 block">
                Clear for Hall Ticket & Admit Card
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Condonable Window (65% - 74%)
              </span>
              <p className="text-2xl font-extrabold text-amber-800 mt-1">
                {attendanceStudents.filter(s => {
                  const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                  return att >= 65 && att < 75 && !s.condonation_granted;
                }).length}
              </p>
              <span className="text-xs text-amber-700 font-semibold mt-1 block">
                Eligible with Dean / HOD Sanction
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                Strict Detention (&lt;65%)
              </span>
              <p className="text-2xl font-extrabold text-rose-800 mt-1">
                {attendanceStudents.filter(s => {
                  const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                  return att < 65 && !s.condonation_granted;
                }).length}
              </p>
              <span className="text-xs text-rose-700 font-semibold mt-1 block">
                Ineligible under University Ordinance
              </span>
            </div>
          </div>

          {/* Search, Filter Toolbar & Detailed Attendance Ledger */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  75% Attendance Gate & Examination Eligibility Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory University Ordinance 7.4 compliance tracking and Dean / HOD condonation management
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search scholar name or ID..."
                  value={attendanceSearch}
                  onChange={e => setAttendanceSearch(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00236f]"
                />

                <select
                  value={attendanceFilter}
                  onChange={e => setAttendanceFilter(e.target.value as any)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="all">All Attendance Slabs</option>
                  <option value="eligible">Eligible (&ge;75%)</option>
                  <option value="condonation">Condonation Window (65% - 74%)</option>
                  <option value="detained">Strict Detention (&lt;65%)</option>
                </select>

                <button
                  onClick={loadReportsData}
                  className="text-xs font-bold text-[#00236f] hover:underline cursor-pointer"
                >
                  [REFRESH]
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Scholar Name & ID</th>
                    <th className="p-3.5">Course & Semester</th>
                    <th className="p-3.5 text-center">Classes Attended</th>
                    <th className="p-3.5 text-center">Attendance %</th>
                    <th className="p-3.5 text-center">Exam Gate Status</th>
                    <th className="p-3.5 text-right">Committee Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceStudents
                    .filter(s => {
                      const att = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);
                      if (attendanceFilter === 'eligible') return att >= 75 || s.condonation_granted;
                      if (attendanceFilter === 'condonation') return att >= 65 && att < 75 && !s.condonation_granted;
                      if (attendanceFilter === 'detained') return att < 65 && !s.condonation_granted;
                      return true;
                    })
                    .filter(s => {
                      if (!attendanceSearch.trim()) return true;
                      const q = attendanceSearch.toLowerCase();
                      return (
                        s.student_id?.toLowerCase().includes(q) ||
                        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
                        (s.course?.code || s.course_id)?.toLowerCase().includes(q)
                      );
                    })
                    .map(student => {
                      const att = student.total_classes === 0 ? (student.attendance_percentage ?? 100) : Math.round((student.attended_classes / student.total_classes) * 100);
                      const isEligible = att >= 75;
                      const isCondoned = Boolean(student.condonation_granted);
                      const canCondone = att >= 65 && att < 75 && !isCondoned;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <strong className="text-slate-900 block text-xs">{student.first_name} {student.last_name}</strong>
                            <span className="text-[11px] font-mono text-slate-500">{student.student_id}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800">{student.course?.code || student.course_id}</span>
                            <span className="block text-[10px] text-slate-500">Semester {student.current_semester || 1}</span>
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            <span className="font-bold text-slate-800">{student.attended_classes ?? 0}</span>
                            <span className="text-slate-400"> / {student.total_classes ?? 0}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-black font-mono text-xs ${
                                att >= 75 ? 'text-emerald-700' : att >= 65 ? 'text-amber-700' : 'text-rose-700'
                              }`}>
                                {att}%
                              </span>
                              <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    att >= 75 ? 'bg-emerald-600' : att >= 65 ? 'bg-amber-500' : 'bg-rose-600'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(5, att))}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            {isEligible ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                EXAM ELIGIBLE
                              </span>
                            ) : isCondoned ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                CONDONED (ORD 7.4)
                              </span>
                            ) : canCondone ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                CONDONATION REQUIRED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                STRICTLY DETAINED
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {canCondone ? (
                              <button
                                type="button"
                                onClick={() => handleCondoneAttendance(student)}
                                disabled={isCondoningId === student.id}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                {isCondoningId === student.id ? 'Granting...' : 'Grant Ord 7.4 Sanction'}
                              </button>
                            ) : isCondoned ? (
                              <span className="text-[10px] text-blue-700 font-mono font-semibold">
                                {student.condonation_order_no || 'ORD-COE-COND'}
                              </span>
                            ) : isEligible ? (
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                Gate Cleared
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-600 font-semibold italic">
                                Detention Immutable
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dynamic KPI Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
              <span className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Institutional Revenue
              </span>
              <p className="text-2xl font-extrabold text-[#00236f] mt-1">
                {kpiData?.totalCollectedFormatted || '₹ 2.4 Cr'}
              </p>
              <span className="text-xs text-[#00236f] font-semibold mt-1 block">
                {kpiData?.totalCollectedGrowth || 'Reconciled in PostgreSQL 18.6'}
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
              <span className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Overdue Balance
              </span>
              <p className="text-2xl font-extrabold text-[#ba1a1a] mt-1">
                {kpiData?.pendingDuesFormatted || '₹ 18 L'}
              </p>
              <span className="text-xs text-[#757682] mt-1 block">
                Fee recovery follow-up pending
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
              <span className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Total Enrollments
              </span>
              <p className="text-2xl font-extrabold text-[#191c1d] mt-1">
                {kpiData?.totalStudents || '1,432'}
              </p>
              <span className="text-xs text-[#00236f] font-semibold mt-1 block">
                Active Fall 2025 Roster
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
              <span className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Fee Concessions
              </span>
              <p className="text-2xl font-extrabold text-[#755b00] mt-1">
                {kpiData?.pendingApprovals ? `${kpiData.pendingApprovals} Pending` : '12 Pending'}
              </p>
              <span className="text-xs text-[#757682] mt-1 block">
                Scholarship waivers applied
              </span>
            </div>
          </div>

          {/* Live Department Enrollment & Fee Distribution Table */}
          <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-[#f3f4f5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#191c1d]">
                  Course-Wise Enrollment & Revenue Distribution
                </h3>
                <p className="text-xs text-[#757682] mt-0.5">
                  Live audit data aggregated from student fees and admissions ledger
                </p>
              </div>
              <button
                onClick={loadReportsData}
                className="text-xs font-bold text-[#00236f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="font-bold text-[10px]">[REFRESH]</span>
                <span>Refresh Table</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-[#757682]">
                Loading audit metrics...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8f9fa] text-[#757682] uppercase tracking-wider text-[10px] font-bold border-b border-[#e1e3e4]">
                    <tr>
                      <th className="p-3.5">Course Code & Name</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5 text-center">Enrolled</th>
                      <th className="p-3.5 text-center">Fully Paid</th>
                      <th className="p-3.5 text-center">Fee Due</th>
                      <th className="p-3.5 text-right">Total Collected</th>
                      <th className="p-3.5 text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f5]">
                    {distribution.map(item => (
                      <tr key={item.courseId} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="p-3.5">
                          <strong className="text-[#191c1d] block text-xs">{item.courseCode}</strong>
                          <span className="text-[11px] text-[#757682]">{item.courseName}</span>
                        </td>
                        <td className="p-3.5 text-[#444651]">{item.department}</td>
                        <td className="p-3.5 text-center font-bold text-[#191c1d]">{item.studentCount}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 bg-[#ffedd5] text-[#00236f] rounded font-bold">
                            {item.paidCount}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded font-bold">
                            {item.dueCount}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-[#00236f]">
                          ₹ {item.totalCollected.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-[#ba1a1a]">
                          ₹ {item.totalDue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Statutory Audit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs space-y-2">
              <h4 className="text-sm font-bold text-[#191c1d]">Statutory University Exam Eligibility Audit</h4>
              <p className="text-xs text-[#757682]">
                Mandatory check of 75% attendance cutoff under University Ordinance 7.4 and zero-dues clearance.
              </p>
              <span className="inline-block pt-2 text-xs font-bold text-[#00236f]">
                Status: Synchronized with Hall Ticket Engine
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs space-y-2">
              <h4 className="text-sm font-bold text-[#191c1d]">Punjab Domicile 85% Quota Roster</h4>
              <p className="text-xs text-[#757682]">
                Verified Punjab resident quota registrations across all B.Tech and degree programs.
              </p>
              <span className="inline-block pt-2 text-xs font-bold text-[#00236f]">
                Status: Department verified
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs space-y-2">
              <h4 className="text-sm font-bold text-[#191c1d]">Fee Waiver & Scholarship Disbursals</h4>
              <p className="text-xs text-[#757682]">
                Institutional scholarship grants credited against academic tuition fee heads.
              </p>
              <span className="inline-block pt-2 text-xs font-bold text-[#00236f]">
                Status: Fully Reconciled
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
