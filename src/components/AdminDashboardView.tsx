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

  useEffect(() => {
    // Load dynamic data from server
    api.getFeeKPIs().then(res => {
      if (res.success && res.kpi) setKpiData(res.kpi);
    });
    api.getFeeTrend().then(res => {
      if (res.success && res.trend) setTrendData(res.trend);
    });
    api.getDefaulters().then(res => {
      if (res.success && res.defaulters) setDefaulters(res.defaulters);
    });
  }, []);

  return (
    <div id="admin-dashboard-screen" className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header with Title and Dropdown Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-[#444651] mt-1">
            Fees management summary and critical alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Course filter */}
          <select
            id="admin-filter-course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-3.5 py-2 bg-white border border-[#e1e3e4] rounded-lg text-xs font-semibold text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
          >
            <option value="All Courses">All Courses</option>
            <option value="B.Tech CS">B.Tech CS</option>
            <option value="B.Tech ME">B.Tech ME</option>
            <option value="MBA Finance">MBA Finance</option>
            <option value="B.Sc Physics">B.Sc Physics</option>
          </select>

          {/* Semester filter */}
          <select
            id="admin-filter-semester"
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="px-3.5 py-2 bg-white border border-[#e1e3e4] rounded-lg text-xs font-semibold text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
          >
            <option value="Current Semester">Current Semester</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
            <option value="Semester 3">Semester 3</option>
            <option value="Semester 4">Semester 4</option>
          </select>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Collected */}
        <div
          id="kpi-total-collected"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Total Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#dce1ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#191c1d] tracking-tight">
              {kpiData.totalCollectedFormatted}
            </h3>
            <p className="text-xs font-semibold text-[#006a61] mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>{kpiData.totalCollectedGrowth}</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Pending Dues */}
        <div
          id="kpi-pending-dues"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Pending Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#ba1a1a] tracking-tight">
              {kpiData.pendingDuesFormatted}
            </h3>
            <p className="text-xs font-semibold text-[#ba1a1a] mt-1">
              {kpiData.pendingDuesAlert}
            </p>
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div
          id="kpi-pending-approvals"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Pending Approvals
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">assignment_late</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#191c1d] tracking-tight">
              {kpiData.pendingApprovals}
            </h3>
            <p className="text-xs text-[#757682] mt-1">{kpiData.pendingApprovalsLabel}</p>
          </div>
        </div>

        {/* KPI 4: Total Students */}
        <div
          id="kpi-total-students"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Total Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#86f2e4]/30 text-[#006a61] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#191c1d] tracking-tight">
              {kpiData.totalStudents}
            </h3>
            <p className="text-xs text-[#757682] mt-1">{kpiData.totalStudentsLabel}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Defaulters List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fees Collected Trend Bar Chart (7 cols) */}
        <div
          id="fees-trend-chart-card"
          className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#191c1d]">Fees Collected Trend</h3>
                <p className="text-xs text-[#757682] mt-0.5">
                  Monthly institutional fee collection in INR (Lakhs)
                </p>
              </div>
              <span className="px-2 py-1 bg-[#f8f9fa] border border-[#e1e3e4] rounded text-[11px] font-bold text-[#444651]">
                Jan - Jun 2025
              </span>
            </div>

            {/* Custom Bar Visualization */}
            <div className="mt-8 h-56 flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-[#e1e3e4]">
              {trendData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Hover tooltip value */}
                  <span className="text-[10px] font-bold text-[#00236f] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#dce1ff] px-1.5 py-0.5 rounded shadow-xs">
                    {item.amount}
                  </span>

                  {/* Bar */}
                  <div
                    style={{ height: `${item.percentage}%` }}
                    className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                      item.isHighest
                        ? 'bg-[#00236f] hover:bg-[#1e3a8a]'
                        : 'bg-[#b6c4ff] hover:bg-[#90a8ff]'
                    }`}
                  ></div>

                  {/* Month Label */}
                  <span className="text-xs font-semibold text-[#444651] mt-1">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#757682]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#00236f]"></span>
                <span>Peak Collection (June)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#b6c4ff]"></span>
                <span>Regular Months</span>
              </span>
            </div>
            <span className="font-semibold text-[#00236f]">Annual Target: 88% Achieved</span>
          </div>
        </div>

        {/* Defaulters List Card (5 cols) */}
        <div
          id="defaulters-list-card"
          className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#191c1d]">Defaulters List</h3>
                <p className="text-xs text-[#757682] mt-0.5">Critical overdue tuition balances</p>
              </div>
              <button
                id="send-reminders-action-btn"
                onClick={onOpenEmailReminders}
                className="px-3 py-1.5 bg-[#dce1ff] text-[#00236f] hover:bg-[#b6c4ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">mail</span>
                <span>Send Reminders</span>
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {defaulters.map(def => (
                <div
                  key={def.id}
                  className="p-3 bg-[#f8f9fa] rounded-lg border border-[#edeeef] flex items-center justify-between hover:bg-[#f3f4f5] transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#191c1d]">{def.studentName}</h4>
                    <p className="text-[11px] text-[#757682] mt-0.5">{def.courseInfo}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#191c1d] block">
                        {def.dueAmountFormatted}
                      </span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          def.badgeType === 'error'
                            ? 'bg-[#ffdad6] text-[#ba1a1a]'
                            : 'bg-[#fef3c7] text-[#b45309]'
                        }`}
                      >
                        {def.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDefaulter(def);
                        setShowAINotice(true);
                      }}
                      className="p-1.5 bg-[#dce1ff] text-[#00236f] hover:bg-[#b6c4ff] rounded-lg transition-colors cursor-pointer"
                      title="Generate AI Recovery Notice with Gemini"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f3f4f5] text-center">
            <button
              onClick={() => onNavigate('manage-students')}
              className="text-xs font-bold text-[#00236f] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <span>View All Defaulters in Student Master</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {selectedDefaulter && (
        <AIFeeNoticeModal
          isOpen={showAINotice}
          onClose={() => setShowAINotice(false)}
          studentId={selectedDefaulter.id}
          studentName={selectedDefaulter.studentName}
          dueAmount={selectedDefaulter.dueAmount || 45000}
        />
      )}
    </div>
  );
};
