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
    <div id="admin-dashboard-screen" className="space-y-4 animate-fadeIn text-xs">
      {/* Sleek Operations Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <h2 className="font-extrabold text-base text-[#00236f] tracking-tight">
            Institutional Operations Console
          </h2>
          <span className="text-slate-300 font-semibold">•</span>
          <span className="bg-slate-100 text-[#00236f] border border-slate-200/90 font-mono text-xs font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
            UID 4001-01-03-01
          </span>
        </div>

        {/* Quick Filter Selectors - Cupertino Style */}
        <div className="flex items-center gap-2">
          <select
            id="admin-filter-course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="h-8 px-3 bg-white border border-slate-200/90 text-slate-700 rounded-lg font-medium text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00236f] shadow-2xs hover:border-slate-300 transition-all"
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
            className="h-8 px-3 bg-white border border-slate-200/90 text-slate-700 rounded-lg font-medium text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00236f] shadow-2xs hover:border-slate-300 transition-all"
          >
            <option value="Current Semester">Current Term (Sem 4)</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
            <option value="Semester 3">Semester 3</option>
            <option value="Semester 4">Semester 4</option>
          </select>
        </div>
      </div>

      {/* Sleek Operations Quick-Access Ribbon (Cupertino / Linear Segmented Style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-2xs text-xs">
        <button
          type="button"
          onClick={() => onNavigate('staff-management')}
          className="h-8 px-3 rounded-lg text-slate-700 hover:text-[#00236f] hover:bg-slate-100/80 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Staff HRMS</span>
          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-md font-mono border border-slate-200/80">
            {staffCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('enquiries')}
          className="h-8 px-3 rounded-lg text-slate-700 hover:text-[#ea580c] hover:bg-orange-50/60 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Leads Radar</span>
          <span className="bg-orange-50 text-[#ea580c] text-xs font-bold px-2 py-0.5 rounded-md font-mono border border-orange-200/60">
            {enquiryCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('bulk-import')}
          className="h-8 px-3 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Bulk CSV Mapper</span>
          <span className="text-xs text-slate-400 font-mono">3-Tier</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('partner-portal')}
          className="h-8 px-3 rounded-lg text-slate-700 hover:text-[#ea580c] hover:bg-orange-50/60 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Hiring Partners</span>
          <span className="bg-orange-50 text-[#ea580c] text-xs font-bold px-2 py-0.5 rounded-md font-mono border border-orange-200/60">
            {partnerCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('manage-students')}
          className="h-8 px-3 rounded-lg text-slate-700 hover:text-[#00236f] hover:bg-slate-100/80 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Student Registry</span>
          <span className="text-xs text-slate-400 font-mono">KYC</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('fee-ledger')}
          className="h-8 px-3 rounded-lg text-slate-700 hover:text-[#00236f] hover:bg-slate-100/80 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Fee Ledger</span>
          <span className="text-xs text-emerald-700 font-mono font-bold">Reconciled</span>
        </button>
      </div>

      {/* Unified High-Density Operations & Financial Metrics Bar (Apple Health / Linear Card Style) */}
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-y-3">
          {/* Metric 1: Total Fee Collection */}
          <div className="px-3 py-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Total Fee Collection</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-xs font-bold">REALIZED</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#00236f] tracking-tight">{kpiData.totalCollectedFormatted}</span>
              <span className="text-xs font-semibold text-emerald-600">{kpiData.totalCollectedGrowth}</span>
            </div>
          </div>

          {/* Metric 2: Pending Dues Alert */}
          <div className="px-3 py-1 sm:pl-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Pending Dues Alert</span>
              <span className="text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full text-xs font-bold">OVERDUE</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 tracking-tight">{kpiData.pendingDuesFormatted}</span>
              <span className="text-xs font-semibold text-rose-600">{kpiData.pendingDuesAlert}</span>
            </div>
          </div>

          {/* Metric 3: Pending Approvals */}
          <div className="px-3 py-1 sm:pl-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Pending Approvals</span>
              <span className="text-[#ea580c] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full text-xs font-bold">ACTION</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#ea580c] tracking-tight">{kpiData.pendingApprovals}</span>
              <span className="text-xs text-slate-500">{kpiData.pendingApprovalsLabel}</span>
            </div>
          </div>

          {/* Metric 4: Enrolled Students */}
          <div className="px-3 py-1 sm:pl-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Enrolled Students</span>
              <span className="text-[#00236f] bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-xs font-bold">ACTIVE</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#00236f] tracking-tight">{kpiData.totalStudents}</span>
              <span className="text-xs text-slate-500">{kpiData.totalStudentsLabel}</span>
            </div>
          </div>
        </div>

        {/* Integrated Inline Department Filter Strip (Clean Duotone Tokens - No Color Slop) */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-xs mr-1">Clusters:</span>
            {['CSE · AI & Software', 'AGRI · Agronomy', 'CE · Civil', 'ME · Robotics', 'MGMT · Finance', 'PHARM · Health', 'APP_SCI · Physics'].map((cluster, i) => (
              <span key={i} className="px-2.5 py-1 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-700 rounded-lg font-medium text-xs transition-colors">
                {cluster}
              </span>
            ))}
          </div>
          <span className="text-slate-400 text-xs font-mono font-semibold hidden md:inline shrink-0">
            PUP Patiala • MRSPTU • PU
          </span>
        </div>
      </div>

      {/* Main Grid: Chart & Defaulters List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Fees Collected Trend Bar Chart (7 cols) */}
        <div
          id="fees-trend-chart-card"
          className="lg:col-span-7 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase">Fees Collected Trend (Lakhs INR)</h3>
                <p className="text-xs text-slate-500">
                  Monthly institutional collections & revenue realization
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/70 rounded-full text-xs font-mono font-semibold text-slate-700">
                JAN - JUN 2026
              </span>
            </div>

            {/* Bar Visualization */}
            <div className="mt-3 h-44 flex items-end justify-between gap-3 px-2 pt-4 pb-2 border-b border-slate-100">
              {trendData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-xs font-mono font-bold text-[#00236f] opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-blue-100 px-1.5 py-0.5 rounded-md">
                    {item.amount}
                  </span>
                  <div
                    style={{ height: `${item.percentage}%` }}
                    className={`w-full max-w-[42px] rounded-t-lg transition-all ${
                      item.isHighest ? 'bg-[#ea580c]' : 'bg-[#00236f] hover:bg-[#00236f]/80'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-600 uppercase mt-1">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-1 flex justify-between items-center text-xs text-slate-500">
            <span>Semester Term Collections: <strong className="text-slate-800">Verified Relational Ledger</strong></span>
            <button
              onClick={() => onNavigate('fee-ledger')}
              className="text-[#ea580c] font-bold hover:underline cursor-pointer"
            >
              Inspect Fee Ledger &rarr;
            </button>
          </div>
        </div>

        {/* Defaulter Fee Alert List (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-rose-800 uppercase">Critical Defaulter Alerts</h3>
                <p className="text-xs text-slate-500">Students with outstanding semester fees</p>
              </div>
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-xs font-bold">
                {defaulters.length} Overdue
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-1">
              {defaulters.map(d => (
                <div key={d.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 block font-semibold">{d.studentName}</strong>
                    <span className="text-slate-500 text-xs">{d.courseInfo}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-700 block">{d.dueAmountFormatted}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200/80">
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              onClick={onOpenEmailReminders}
              className="h-8 px-3.5 bg-white border border-[#00236f]/60 text-[#00236f] hover:bg-blue-50 rounded-lg font-bold text-xs cursor-pointer transition shadow-2xs"
            >
              Dispatch Reminders
            </button>
            <button
              onClick={() => setShowAINotice(true)}
              className="h-8 px-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-2xs"
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
