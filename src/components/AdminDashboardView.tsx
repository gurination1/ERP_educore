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
    <div id="admin-dashboard-screen" className="space-y-3 animate-fadeIn text-xs">
      {/* Sleek Operations Action Toolbar (Replaces bloated banner, saving 140px vertical space) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <h2 className="font-extrabold text-sm text-[#00236f] tracking-tight">
            Institutional Operations Console
          </h2>
          <span className="text-[10px] text-slate-300 font-semibold">•</span>
          <span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
            UID: 4001-01-03-BFGI
          </span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-flex">
            Relational DB Engine Live
          </span>
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex items-center gap-1.5">
          <select
            id="admin-filter-course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="h-7 px-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00236f] shadow-2xs"
          >
            <option value="All Courses">All Academic Courses</option>
            <option value="B.Tech CS">B.Tech CSE</option>
            <option value="B.Tech ME">B.Tech ME</option>
            <option value="B.Sc Agri">B.Sc Agriculture</option>
            <option value="MBA Finance">MBA Management</option>
          </select>

          <select
            id="admin-filter-semester"
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="h-7 px-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00236f] shadow-2xs"
          >
            <option value="Current Semester">Current Term (Sem 4)</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
            <option value="Semester 3">Semester 3</option>
            <option value="Semester 4">Semester 4</option>
          </select>
        </div>
      </div>

      {/* Enterprise Architecture Quick Jump Bento Grid (High Density 6-Col) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => onNavigate('staff-management')}
          className="p-2.5 bg-white apple-glass-card hover:bg-slate-50 border border-slate-200/80 hover:border-blue-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-bold text-[#ea580c] block uppercase tracking-wider">Staff Master</span>
          <strong className="text-xs text-[#00236f] block mt-0.5 font-bold">Staff HRMS</strong>
          <span className="text-[10px] text-slate-500 block">Multi-Table Dossier</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('enquiries')}
          className="p-2.5 bg-white apple-glass-card hover:bg-slate-50 border border-slate-200/80 hover:border-orange-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-bold text-[#ea580c] block uppercase tracking-wider">Admissions CRM</span>
          <strong className="text-xs text-[#00236f] block mt-0.5 font-bold">Leads Radar</strong>
          <span className="text-[10px] text-slate-500 block">{enquiryCount} Active Leads</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('bulk-import')}
          className="p-2.5 bg-white apple-glass-card hover:bg-slate-50 border border-slate-200/80 hover:border-blue-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-bold text-[#00236f] block uppercase tracking-wider">CSV Engine</span>
          <strong className="text-xs text-[#00236f] block mt-0.5 font-bold">Bulk Mapper</strong>
          <span className="text-[10px] text-slate-500 block">3-Tier Verification</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('partner-portal')}
          className="p-2.5 bg-white apple-glass-card hover:bg-slate-50 border border-slate-200/80 hover:border-orange-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-bold text-[#ea580c] block uppercase tracking-wider">Corporate</span>
          <strong className="text-xs text-[#00236f] block mt-0.5 font-bold">Hiring Partners</strong>
          <span className="text-[10px] text-slate-500 block">{partnerCount} Firms Connected</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('manage-students')}
          className="p-2.5 bg-white apple-glass-card hover:bg-slate-50 border border-slate-200/80 hover:border-blue-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-bold text-[#00236f] block uppercase tracking-wider">Students</span>
          <strong className="text-xs text-[#00236f] block mt-0.5 font-bold">Student Registry</strong>
          <span className="text-[10px] text-slate-500 block">Enrollment & Domicile</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('fee-ledger')}
          className="p-2.5 bg-white apple-glass-card hover:bg-slate-50 border border-slate-200/80 hover:border-orange-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-[9px] font-bold text-[#ea580c] block uppercase tracking-wider">Finance</span>
          <strong className="text-xs text-[#00236f] block mt-0.5 font-bold">Fee Ledger</strong>
          <span className="text-[10px] text-slate-500 block">Billing & Receipts</span>
        </button>
      </div>

      {/* Operational Master & Tagging Status Strip */}
      <div className="bg-white/95 apple-glass-card rounded-xl p-2.5 border border-slate-200/80 shadow-2xs space-y-1.5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#00236f] tracking-tight text-[11px]">Department Tagging Matrix</span>
            <span className="text-[10px] text-slate-400">7 Active</span>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-mono text-[9px] font-bold">
            Relational DB Engine Active
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-0.5 bg-blue-50/80 border border-blue-200/80 text-[#00236f] rounded-full text-[10px] font-semibold">
            CSE · AI & Software
          </span>
          <span className="px-2.5 py-0.5 bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 rounded-full text-[10px] font-semibold">
            AGRI · Agronomy & Soil
          </span>
          <span className="px-2.5 py-0.5 bg-amber-50/80 border border-amber-200/80 text-amber-900 rounded-full text-[10px] font-semibold">
            CE · Civil & Surveying
          </span>
          <span className="px-2.5 py-0.5 bg-purple-50/80 border border-purple-200/80 text-purple-900 rounded-full text-[10px] font-semibold">
            ME · Mechanical & Robotics
          </span>
          <span className="px-2.5 py-0.5 bg-cyan-50/80 border border-cyan-200/80 text-cyan-900 rounded-full text-[10px] font-semibold">
            MGMT · Business & Finance
          </span>
          <span className="px-2.5 py-0.5 bg-rose-50/80 border border-rose-200/80 text-rose-900 rounded-full text-[10px] font-semibold">
            PHARM · Pharmacy & Health
          </span>
          <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-[10px] font-semibold">
            APP_SCI · Physics & Math
          </span>
        </div>
      </div>

      {/* 4 Financial & Operational KPI Cards (Sleek Compact Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* KPI 1: Total Collected */}
        <div className="bg-white apple-glass-card rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Fee Collection
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full text-[9px] font-semibold">
              Collected
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#00236f] tracking-tight">
              {kpiData.totalCollectedFormatted}
            </h3>
            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
              {kpiData.totalCollectedGrowth}
            </p>
          </div>
        </div>

        {/* KPI 2: Pending Dues */}
        <div className="bg-white apple-glass-card rounded-xl p-3 border border-rose-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pending Dues Alert
            </span>
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 rounded-full text-[9px] font-semibold">
              Outstanding
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-rose-600 tracking-tight">
              {kpiData.pendingDuesFormatted}
            </h3>
            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
              {kpiData.pendingDuesAlert}
            </p>
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div className="bg-white apple-glass-card rounded-xl p-3 border border-orange-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </span>
            <span className="bg-orange-50 text-[#ea580c] border border-orange-200 px-2 py-0.2 rounded-full text-[9px] font-semibold">
              Action Required
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#ea580c] tracking-tight">
              {kpiData.pendingApprovals}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{kpiData.pendingApprovalsLabel}</p>
          </div>
        </div>

        {/* KPI 4: Total Students */}
        <div className="bg-white apple-glass-card rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Enrolled Students
            </span>
            <span className="bg-blue-50 text-[#00236f] border border-blue-200 px-2 py-0.2 rounded-full text-[9px] font-semibold">
              Active Roll
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#00236f] tracking-tight">
              {kpiData.totalStudents}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{kpiData.totalStudentsLabel}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Defaulters List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Fees Collected Trend Bar Chart (7 cols) */}
        <div
          id="fees-trend-chart-card"
          className="lg:col-span-7 bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase">Fees Collected Trend (Lakhs INR)</h3>
                <p className="text-[10px] text-slate-500">
                  Monthly institutional collections & revenue realization
                </p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono text-slate-700">
                JAN - JUN 2026
              </span>
            </div>

            {/* Bar Visualization */}
            <div className="mt-3 h-44 flex items-end justify-between gap-3 px-2 pt-4 pb-2 border-b border-slate-100">
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
                  />
                  <span className="text-[9px] font-bold text-slate-600 uppercase mt-1">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-1 flex justify-between items-center text-[10px] text-slate-500">
            <span>Semester Term Collections: <strong className="text-slate-800">Verified Relational Ledger</strong></span>
            <button
              onClick={() => onNavigate('fee-ledger')}
              className="text-[#ea580c] font-bold hover:underline"
            >
              Inspect Fee Ledger &rarr;
            </button>
          </div>
        </div>

        {/* Defaulter Fee Alert List (5 cols) */}
        <div className="lg:col-span-5 bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-rose-800 uppercase">Critical Defaulter Alerts</h3>
                <p className="text-[10px] text-slate-500">Students with outstanding semester fees</p>
              </div>
              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[9px] font-bold">
                {defaulters.length} Overdue
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-1 space-y-0.5">
              {defaulters.map(d => (
                <div key={d.id} className="py-1.5 flex items-center justify-between text-[10px]">
                  <div>
                    <strong className="text-slate-900 block font-semibold">{d.studentName}</strong>
                    <span className="text-slate-500 text-[9px]">{d.courseInfo}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-700 block">{d.dueAmountFormatted}</span>
                    <span className="text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              onClick={onOpenEmailReminders}
              className="px-2.5 py-1 bg-white border border-[#00236f] text-[#00236f] hover:bg-blue-50 rounded-lg font-bold text-[10px] cursor-pointer"
            >
              Dispatch Reminders
            </button>
            <button
              onClick={() => setShowAINotice(true)}
              className="px-3 py-1 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg font-bold text-[10px] cursor-pointer"
            >
              AI Fee Notice Draft &rarr;
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
