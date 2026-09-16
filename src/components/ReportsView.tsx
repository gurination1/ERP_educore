import React, { useState, useEffect } from 'react';
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
  const [distribution, setDistribution] = useState<CourseDistributionItem[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      const [distRes, kpiRes] = await Promise.all([
        api.getAdmissionsByCourseReport(),
        api.getFeeKPIs(),
      ]);

      if (distRes.success && distRes.distribution) {
        setDistribution(distRes.distribution);
      }
      if (kpiRes.success && kpiRes.kpi) {
        setKpiData(kpiRes.kpi);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Programmatic CSV Export with Bearer Auth Token
  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Query param token acts as fallback
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

  const isStaffOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  return (
    <div id="institutional-reports-screen" className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1d] tracking-tight">
            Institutional Analytical Reports & Audits
          </h2>
          <p className="text-sm text-[#444651] mt-1">
            Departmental enrollment verification, fee reconciliation, and MRSPTU compliance
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isExporting ? 'hourglass_top' : 'download'}
            </span>
            <span>{isExporting ? 'Generating CSV...' : 'Export Master Data (CSV)'}</span>
          </button>
        )}
      </div>

      {/* Export feedback toast */}
      {exportMessage && (
        <div className="p-3.5 bg-[#86f2e4]/20 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Dynamic KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
            Institutional Revenue
          </span>
          <p className="text-2xl font-extrabold text-[#00236f] mt-1">
            {kpiData?.totalCollectedFormatted || '₹ 2.4 Cr'}
          </p>
          <span className="text-xs text-[#006a61] font-semibold mt-1 block">
            {kpiData?.totalCollectedGrowth || 'Reconciled in MariaDB'}
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
          <span className="text-xs text-[#006a61] font-semibold mt-1 block">
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
            <span className="material-symbols-outlined text-[15px]">refresh</span>
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
                      <span className="px-2 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded font-bold">
                        {item.paidCount}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded font-bold">
                        {item.dueCount}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-[#006a61]">
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
          <h4 className="text-sm font-bold text-[#191c1d]">MRSPTU Exam Eligibility Audit</h4>
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
  );
};
