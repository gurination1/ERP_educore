import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ActiveScreen } from '../types';
import { AIFeeNoticeModal } from './AIFeeNoticeModal';

interface AdminDashboardViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenEmailReminders: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  onOpenEmailReminders,
}) => {
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedSemester, setSelectedSemester] = useState('Current Semester');
  const [showAINotice, setShowAINotice] = useState(false);
  const [selectedDefaulter, setSelectedDefaulter] = useState<any | null>(null);
  const [kpiData, setKpiData] = useState<any>({
    totalCollectedFormatted: '₹ 2.4 Cr',
    totalCollectedGrowth: '+12% vs last month',
    pendingDuesFormatted: '₹ 18 L',
    pendingDuesAlert: 'Requires immediate action',
    pendingApprovals: 12,
    pendingApprovalsLabel: 'Fee concessions & refunds',
    totalStudents: '1,250',
    totalStudentsLabel: 'Active enrollments',
  });

  const [trendData, setTrendData] = useState([
    { month: 'Jan', percentage: 30, amount: '₹ 30 Lakhs' },
    { month: 'Feb', percentage: 45, amount: '₹ 45 Lakhs' },
    { month: 'Mar', percentage: 80, amount: '₹ 80 Lakhs' },
    { month: 'Apr', percentage: 20, amount: '₹ 20 Lakhs' },
    { month: 'May', percentage: 35, amount: '₹ 35 Lakhs' },
    { month: 'Jun', percentage: 95, amount: '₹ 95 Lakhs', isHighest: true },
  ]);

  const [defaulters, setDefaulters] = useState([
    {
      id: 'def-01',
      studentName: 'Aarav Sharma',
      courseInfo: 'B.Tech CS • Sem 4',
      dueAmountFormatted: '₹ 45,000',
      status: 'OVERDUE',
      badgeType: 'error',
    },
    {
      id: 'def-02',
      studentName: 'Priya Patel',
      courseInfo: 'MBA Finance • Sem 2',
      dueAmountFormatted: '₹ 32,500',
      status: 'OVERDUE',
      badgeType: 'error',
    },
    {
      id: 'def-03',
      studentName: 'Rohan Gupta',
      courseInfo: 'B.Sc Physics • Sem 6',
      dueAmountFormatted: '₹ 15,000',
      status: 'DUE IN 5 DAYS',
      badgeType: 'warning',
    },
    {
      id: 'def-04',
      studentName: 'Neha Singh',
      courseInfo: 'B.Tech ME • Sem 4',
      dueAmountFormatted: '₹ 45,000',
      status: 'OVERDUE',
      badgeType: 'error',
    },
  ]);

  const [masterSummary, setMasterSummary] = useState<any>(null);
  const [staffCount, setStaffCount] = useState<number>(4);
  const [partnerCount, setPartnerCount] = useState<number>(2);
  const [enquiryCount, setEnquiryCount] = useState<number>(3);

  useEffect(() => {
    api.getFeeKPIs().then(res => {
      if (res.success && res.kpi) setKpiData(res.kpi);
    }).catch(console.warn);
    api.getFeeTrend().then(res => {
      if (res.success && res.trend) setTrendData(res.trend);
    }).catch(console.warn);
    api.getDefaulters().then(res => {
      if (res.success && res.defaulters) setDefaulters(res.defaulters);
    }).catch(console.warn);
    api.getEnterpriseMaster().then(res => {
      if (res.success && res.master) setMasterSummary(res.master);
    }).catch(console.warn);
    (api.getStaffList || api.getStaff)().then(res => {
      if (res.success && res.staff) setStaffCount(res.staff.length);
    }).catch(console.warn);
    api.getPartners().then(res => {
      if (res.success && res.partners) setPartnerCount(res.partners.length);
    }).catch(console.warn);
    api.getEnquiries().then(res => {
      if (res.success && res.enquiries) setEnquiryCount(res.enquiries.length);
    }).catch(console.warn);
  }, []);

  return (
    <div id="admin-dashboard-screen" className="p-4 max-w-7xl mx-auto space-y-4 animate-fadeIn text-[11px]">
      {/* Top Institutional Header Banner */}
      <div className="bg-[#00236f] text-white p-3.5 rounded border-b-2 border-[#ea580c] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
              ENTERPRISE ERP CONSOLE
            </span>
            <span className="font-mono text-[10px] text-orange-200">
              UID: 4001-01-03-BFGI (BFGI BATHINDA • PUNJAB)
            </span>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-tight text-white">
            ADMINISTRATION & INSTITUTIONAL OPERATIONS DASHBOARD
          </h2>
          <p className="text-[10px] text-blue-200 mt-0.5">
            Multi-College Governance • Tagged Departments • Multi-Table Staff • Pre-Admission CRM • Corporate Partners
          </p>
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex items-center gap-2">
          <select
            id="admin-filter-course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-2 py-1 bg-white text-[#00236f] border border-blue-200 rounded font-bold text-[10px]"
          >
            <option value="All Courses">ALL COURSES</option>
            <option value="B.Tech CS">B.TECH CSE</option>
            <option value="B.Tech ME">B.TECH ME</option>
            <option value="B.Sc Agri">B.SC AGRICULTURE</option>
            <option value="MBA Finance">MBA MANAGEMENT</option>
          </select>

          <select
            id="admin-filter-semester"
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="px-2 py-1 bg-white text-[#00236f] border border-blue-200 rounded font-bold text-[10px]"
          >
            <option value="Current Semester">CURRENT SEMESTER</option>
            <option value="Semester 1">SEM 1</option>
            <option value="Semester 2">SEM 2</option>
            <option value="Semester 3">SEM 3</option>
            <option value="Semester 4">SEM 4</option>
          </select>
        </div>
      </div>

      {/* Enterprise Architecture Quick Jump Command Hub */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => onNavigate('staff-management')}
          className="p-2.5 bg-white hover:bg-blue-50 border border-[#00236f]/20 rounded text-left transition shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-mono text-[#ea580c] block font-bold">[STAFF MASTER]</span>
          <strong className="text-[11px] text-[#00236f] block mt-0.5">Staff & Journey</strong>
          <span className="text-[9px] text-gray-500 block">4 Staff • Multi-Tables</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('enquiries')}
          className="p-2.5 bg-white hover:bg-orange-50 border border-[#ea580c]/30 rounded text-left transition shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-mono text-[#ea580c] block font-bold">[ADMISSIONS CRM]</span>
          <strong className="text-[11px] text-[#00236f] block mt-0.5">Pre-Admission CRM</strong>
          <span className="text-[9px] text-gray-500 block">Auto-Dialer • Leads ({enquiryCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('bulk-import')}
          className="p-2.5 bg-white hover:bg-blue-50 border border-[#00236f]/20 rounded text-left transition shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-mono text-[#00236f] block font-bold">[CSV ENGINE]</span>
          <strong className="text-[11px] text-[#00236f] block mt-0.5">Dynamic Mapper</strong>
          <span className="text-[9px] text-gray-500 block">3-Tier Validator</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('partner-portal')}
          className="p-2.5 bg-white hover:bg-blue-50 border border-[#00236f]/20 rounded text-left transition shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-mono text-[#ea580c] block font-bold">[PARTNER PORTAL]</span>
          <strong className="text-[11px] text-[#00236f] block mt-0.5">Corporate Partners</strong>
          <span className="text-[9px] text-gray-500 block">{partnerCount} Firms • Talent Share</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('manage-students')}
          className="p-2.5 bg-white hover:bg-blue-50 border border-[#00236f]/20 rounded text-left transition shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-mono text-[#00236f] block font-bold">[STUDENT MASTER]</span>
          <strong className="text-[11px] text-[#00236f] block mt-0.5">Student Records</strong>
          <span className="text-[9px] text-gray-500 block">Roll Nos & Domicile</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('fee-ledger')}
          className="p-2.5 bg-white hover:bg-blue-50 border border-[#00236f]/20 rounded text-left transition shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-mono text-[#ea580c] block font-bold">[ACCOUNTS]</span>
          <strong className="text-[11px] text-[#00236f] block mt-0.5">Fee Ledger & Billing</strong>
          <span className="text-[9px] text-gray-500 block">Tally XML & Dues</span>
        </button>
      </div>

      {/* Operational Master & Tagging Status Strip */}
      <div className="bg-white border border-[#00236f]/20 rounded p-3 space-y-2">
        <div className="flex justify-between items-center border-b pb-1.5">
          <div>
            <span className="font-bold text-[#00236f]">[TAGGING NATION: MASTER DEPARTMENTS & ENTERPRISE STATUSES]</span>
            <span className="text-[10px] text-gray-500 ml-2">7 Tagged Departments • 5 Reserve Columns Active</span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono text-[9px] font-bold">
            DB ENGINE: RELATIONAL ACTIVE
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-1 bg-blue-50 border border-blue-200 text-[#00236f] rounded text-[10px] font-bold">
            CSE [AI, Engineering, Software]
          </span>
          <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-[10px] font-bold">
            AGRI [Agronomy, Soil, Field]
          </span>
          <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[10px] font-bold">
            CE [Structural, Surveying]
          </span>
          <span className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-900 rounded text-[10px] font-bold">
            ME [Thermal, Robotics]
          </span>
          <span className="px-2 py-1 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded text-[10px] font-bold">
            MGMT [Finance, HR, Marketing]
          </span>
          <span className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-900 rounded text-[10px] font-bold">
            PHARM [Clinical, Chemistry]
          </span>
          <span className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-800 rounded text-[10px] font-bold">
            APP_SCI [Physics, Math, Chemistry]
          </span>
        </div>
      </div>

      {/* 4 Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Collected */}
        <div className="bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Total Fee Collection
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
              [COLLECTED]
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-[#00236f] tracking-tight">
              {kpiData.totalCollectedFormatted}
            </h3>
            <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
              {kpiData.totalCollectedGrowth}
            </p>
          </div>
        </div>

        {/* KPI 2: Pending Dues */}
        <div className="bg-white rounded p-3.5 border border-rose-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Pending Dues Alert
            </span>
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
              [DUES]
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-rose-700 tracking-tight">
              {kpiData.pendingDuesFormatted}
            </h3>
            <p className="text-[10px] font-bold text-rose-600 mt-0.5">
              {kpiData.pendingDuesAlert}
            </p>
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div className="bg-white rounded p-3.5 border border-[#ea580c]/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Pending Approvals
            </span>
            <span className="bg-orange-100 text-[#ea580c] px-1.5 py-0.5 rounded text-[9px] font-bold">
              [APPROVALS]
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-[#ea580c] tracking-tight">
              {kpiData.pendingApprovals}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{kpiData.pendingApprovalsLabel}</p>
          </div>
        </div>

        {/* KPI 4: Total Students */}
        <div className="bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Enrolled Students
            </span>
            <span className="bg-blue-100 text-[#00236f] px-1.5 py-0.5 rounded text-[9px] font-bold">
              [ENROLLED]
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-[#00236f] tracking-tight">
              {kpiData.totalStudents}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{kpiData.totalStudentsLabel}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Defaulters List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Fees Collected Trend Bar Chart (7 cols) */}
        <div
          id="fees-trend-chart-card"
          className="lg:col-span-7 bg-white rounded p-4 border border-[#00236f]/20 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase">Fees Collected Trend (Lakhs INR)</h3>
                <p className="text-[10px] text-gray-500">
                  Monthly institutional collections & revenue realization
                </p>
              </div>
              <span className="px-2 py-0.5 bg-gray-100 border rounded text-[9px] font-mono text-gray-700">
                JAN - JUN 2026
              </span>
            </div>

            {/* Bar Visualization */}
            <div className="mt-4 h-48 flex items-end justify-between gap-3 px-2 pt-4 pb-2 border-b border-gray-200">
              {trendData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-[9px] font-mono font-bold text-[#00236f] opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-blue-100 px-1 rounded">
                    {item.amount}
                  </span>
                  <div
                    style={{ height: `${item.percentage}%` }}
                    className={`w-full max-w-[42px] rounded-t transition-all ${
                      item.isHighest ? 'bg-[#ea580c]' : 'bg-[#00236f] hover:bg-[#00236f]/80'
                    }`}
                  ></div>
                  <span className="text-[9px] font-mono text-gray-600 mt-1">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-gray-500">
            <span>Orange indicates peak collection month (June Sem End)</span>
            <button
              onClick={() => onNavigate('fee-ledger')}
              className="text-[#00236f] font-bold hover:underline"
            >
              [VIEW COMPLETE FEE AUDIT LEDGER &rarr;]
            </button>
          </div>
        </div>

        {/* Critical Defaulters Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded p-4 border border-[#00236f]/20 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-xs font-bold text-rose-800 uppercase">Critical Defaulter Alerts</h3>
                <p className="text-[10px] text-gray-500">Students with outstanding semester fees</p>
              </div>
              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">
                [{defaulters.length} OVERDUE]
              </span>
            </div>

            <div className="divide-y divide-gray-100 mt-2 space-y-1">
              {defaulters.map(d => (
                <div key={d.id} className="py-2 flex items-center justify-between text-[10px]">
                  <div>
                    <strong className="text-gray-900 block">{d.studentName}</strong>
                    <span className="text-gray-500 text-[9px]">{d.courseInfo}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-700 block">{d.dueAmountFormatted}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      [{d.status}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t flex justify-end gap-2">
            <button
              onClick={onOpenEmailReminders}
              className="px-2.5 py-1 bg-white border border-[#00236f] text-[#00236f] hover:bg-blue-50 rounded font-bold text-[10px]"
            >
              [DISPATCH REMINDERS]
            </button>
            <button
              onClick={() => setShowAINotice(true)}
              className="px-3 py-1 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white rounded font-bold text-[10px]"
            >
              [AI NOTICE GENERATOR]
            </button>
          </div>
        </div>
      </div>

      {/* AI Notice Modal */}
      {showAINotice && (
        <AIFeeNoticeModal
          isOpen={showAINotice}
          onClose={() => setShowAINotice(false)}
          defaultStudent={selectedDefaulter}
        />
      )}
    </div>
  );
};
