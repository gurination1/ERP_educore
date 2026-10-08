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
    <div id="admin-dashboard-screen" className="space-y-5 animate-fadeIn text-xs">
      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#001f5c] to-[#001744] text-white p-6 rounded-3xl shadow-md border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#ea580c] text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-2xs">
              Enterprise Console
            </span>
            <span className="font-mono text-[10px] text-orange-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
              UID: 4001-01-03-BFGI • Punjab (03)
            </span>
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white">
            Institutional Operations & Governance
          </h2>
          <p className="text-xs text-blue-200/90 mt-1">
            Multi-College Governance • Department Master • Staff HRMS • Admissions CRM • Corporate Partners
          </p>
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex items-center gap-2">
          <select
            id="admin-filter-course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full font-semibold text-xs cursor-pointer focus:outline-none"
          >
            <option value="All Courses" className="text-slate-900">All Courses</option>
            <option value="B.Tech CS" className="text-slate-900">B.Tech CSE</option>
            <option value="B.Tech ME" className="text-slate-900">B.Tech ME</option>
            <option value="B.Sc Agri" className="text-slate-900">B.Sc Agriculture</option>
            <option value="MBA Finance" className="text-slate-900">MBA Management</option>
          </select>

          <select
            id="admin-filter-semester"
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full font-semibold text-xs cursor-pointer focus:outline-none"
          >
            <option value="Current Semester" className="text-slate-900">Current Semester</option>
            <option value="Semester 1" className="text-slate-900">Semester 1</option>
            <option value="Semester 2" className="text-slate-900">Semester 2</option>
            <option value="Semester 3" className="text-slate-900">Semester 3</option>
            <option value="Semester 4" className="text-slate-900">Semester 4</option>
          </select>
        </div>
      </div>

      {/* Enterprise Architecture Quick Jump Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('staff-management')}
          className="p-3.5 bg-white/90 apple-glass-card hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group cursor-pointer"
        >
          <span className="text-[10px] font-bold text-[#ea580c] block uppercase tracking-wider">Staff Master</span>
          <strong className="text-xs text-[#00236f] block mt-1 font-extrabold">Staff HRMS</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">Multi-Table Dossier</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('enquiries')}
          className="p-3.5 bg-white/90 apple-glass-card hover:bg-white border border-slate-200/80 hover:border-orange-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group cursor-pointer"
        >
          <span className="text-[10px] font-bold text-[#ea580c] block uppercase tracking-wider">Admissions CRM</span>
          <strong className="text-xs text-[#00236f] block mt-1 font-extrabold">Leads Radar</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">{enquiryCount} Active Leads</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('bulk-import')}
          className="p-3.5 bg-white/90 apple-glass-card hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group cursor-pointer"
        >
          <span className="text-[10px] font-bold text-[#00236f] block uppercase tracking-wider">CSV Engine</span>
          <strong className="text-xs text-[#00236f] block mt-1 font-extrabold">Bulk Mapper</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">3-Tier Verification</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('partner-portal')}
          className="p-3.5 bg-white/90 apple-glass-card hover:bg-white border border-slate-200/80 hover:border-orange-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group cursor-pointer"
        >
          <span className="text-[10px] font-bold text-[#ea580c] block uppercase tracking-wider">Corporate</span>
          <strong className="text-xs text-[#00236f] block mt-1 font-extrabold">Hiring Partners</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">{partnerCount} Firms Connected</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('manage-students')}
          className="p-3.5 bg-white/90 apple-glass-card hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group cursor-pointer"
        >
          <span className="text-[10px] font-bold text-[#00236f] block uppercase tracking-wider">Students</span>
          <strong className="text-xs text-[#00236f] block mt-1 font-extrabold">Student Registry</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">Enrollment & Domicile</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('fee-ledger')}
          className="p-3.5 bg-white/90 apple-glass-card hover:bg-white border border-slate-200/80 hover:border-orange-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group cursor-pointer"
        >
          <span className="text-[10px] font-bold text-[#ea580c] block uppercase tracking-wider">Finance</span>
          <strong className="text-xs text-[#00236f] block mt-1 font-extrabold">Fee Ledger</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">Billing & Receipts</span>
        </button>
      </div>

      {/* Operational Master & Tagging Status Strip */}
      <div className="bg-white/90 apple-glass-card rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <span className="font-extrabold text-[#00236f] tracking-tight">Department Tagging Matrix & Statuses</span>
            <span className="text-[11px] text-slate-500 ml-2">7 Tagged Departments Active</span>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">
            Relational Engine Active
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-50/80 border border-blue-200/80 text-[#00236f] rounded-full text-[10px] font-bold">
            CSE · AI & Software
          </span>
          <span className="px-3 py-1 bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 rounded-full text-[10px] font-bold">
            AGRI · Agronomy & Soil
          </span>
          <span className="px-3 py-1 bg-amber-50/80 border border-amber-200/80 text-amber-900 rounded-full text-[10px] font-bold">
            CE · Civil & Surveying
          </span>
          <span className="px-3 py-1 bg-purple-50/80 border border-purple-200/80 text-purple-900 rounded-full text-[10px] font-bold">
            ME · Mechanical & Robotics
          </span>
          <span className="px-3 py-1 bg-cyan-50/80 border border-cyan-200/80 text-cyan-900 rounded-full text-[10px] font-bold">
            MGMT · Business & Finance
          </span>
          <span className="px-3 py-1 bg-rose-50/80 border border-rose-200/80 text-rose-900 rounded-full text-[10px] font-bold">
            PHARM · Pharmacy & Health
          </span>
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-[10px] font-bold">
            APP_SCI · Physics & Math
          </span>
        </div>
      </div>

      {/* 4 Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Collected */}
        <div className="bg-white/90 apple-glass-card rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Fee Collection
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
              Collected
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#00236f] tracking-tight">
              {kpiData.totalCollectedFormatted}
            </h3>
            <p className="text-[11px] font-bold text-emerald-600 mt-1">
              {kpiData.totalCollectedGrowth}
            </p>
          </div>
        </div>

        {/* KPI 2: Pending Dues */}
        <div className="bg-white/90 apple-glass-card rounded-2xl p-5 border border-rose-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pending Dues Alert
            </span>
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
              Outstanding
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 tracking-tight">
              {kpiData.pendingDuesFormatted}
            </h3>
            <p className="text-[11px] font-bold text-rose-600 mt-1">
              {kpiData.pendingDuesAlert}
            </p>
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div className="bg-white/90 apple-glass-card rounded-2xl p-5 border border-orange-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </span>
            <span className="bg-orange-50 text-[#ea580c] border border-orange-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
              Action Required
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#ea580c] tracking-tight">
              {kpiData.pendingApprovals}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">{kpiData.pendingApprovalsLabel}</p>
          </div>
        </div>

        {/* KPI 4: Total Students */}
        <div className="bg-white/90 apple-glass-card rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Enrolled Students
            </span>
            <span className="bg-blue-50 text-[#00236f] border border-blue-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
              Active Roll
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#00236f] tracking-tight">
              {kpiData.totalStudents}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">{kpiData.totalStudentsLabel}</p>
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
