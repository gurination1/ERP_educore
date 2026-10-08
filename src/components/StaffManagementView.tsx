import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface StaffManagementViewProps {
  currentUser: User | null;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentUser }) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffProfile, setStaffProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'banks' | 'qualifications' | 'experience' | 'journey'>('overview');

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    employee_status: 'RESIGNED',
    date_of_resigning: '',
    last_working_date: '',
    remarks: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPasswordInput, setTempPasswordInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // New staff onboarding modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    employee_id: '',
    full_name: '',
    father_name: '',
    dob: '',
    gender: 'female',
    date_of_joining: new Date().toISOString().slice(0, 10),
    category: 'fresher',
    primary_designation: 'Assistant Professor',
    department_id: 'CSE',
    employee_status: 'ACTIVE',
    login_enabled: true,
  });

  const fetchStaff = async () => {
    setLoading(true);
    const res = await api.getStaff({
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
    });
    if (res.success && res.staff) {
      setStaffList(res.staff);
      if (!selectedStaffId && res.staff.length > 0) {
        setSelectedStaffId(res.staff[0].staff_id);
      }
    }
    setLoading(false);
  };

  const fetchProfile = async (id: string) => {
    setProfileLoading(true);
    const res = await api.getStaffProfile(id);
    if (res.success && res.profile) {
      setStaffProfile(res.profile);
    }
    setProfileLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, [departmentFilter, statusFilter]);

  useEffect(() => {
    if (selectedStaffId) {
      fetchProfile(selectedStaffId);
    }
  }, [selectedStaffId]);

  const handleToggleLogin = async () => {
    if (!staffProfile) return;
    const currentEnabled = staffProfile.basic.login_enabled;
    const res = await api.toggleStaffLogin(staffProfile.basic.staff_id, !currentEnabled);
    if (res.success) {
      setActionSuccessMsg(res.message);
      fetchProfile(staffProfile.basic.staff_id);
      fetchStaff();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } else {
      setActionErrorMsg(res.error || 'Failed to update login status');
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!staffProfile) return;
    const res = await api.adminResetStaffPassword(staffProfile.basic.staff_id, tempPasswordInput || undefined);
    if (res.success) {
      setShowPasswordModal(false);
      setTempPasswordInput('');
      setActionSuccessMsg(`Credentials Reset: Temporary password is "${res.tempPasswordIssued}". Mandatory password change flag applied!`);
      fetchProfile(staffProfile.basic.staff_id);
      setTimeout(() => setActionSuccessMsg(null), 9000);
    } else {
      setActionErrorMsg(res.error || 'Failed to reset password');
    }
  };

  const handleUpdateStatus = async () => {
    if (!staffProfile) return;
    const res = await api.updateStaffBasic(staffProfile.basic.staff_id, statusModalData);
    if (res.success) {
      setShowStatusModal(false);
      setActionSuccessMsg(`Status transitioned to ${statusModalData.employee_status}. Org journey updated!`);
      fetchProfile(staffProfile.basic.staff_id);
      fetchStaff();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } else {
      setActionErrorMsg(res.error || 'Failed to update status');
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaff.employee_id || !newStaff.full_name) {
      setActionErrorMsg('Employee ID and Full Name are mandatory.');
      return;
    }
    const res = await api.createStaff({ basic: newStaff });
    if (res.success) {
      setShowCreateModal(false);
      setActionSuccessMsg(`Staff member ${newStaff.full_name} (${newStaff.employee_id}) onboarded successfully!`);
      fetchStaff();
      setSelectedStaffId(res.profile.basic.staff_id);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } else {
      setActionErrorMsg(res.error || 'Failed to onboard staff');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-[11px] text-[#00236f]">
      {/* Top Header Bar */}
      <div className="bg-white border border-[#00236f]/20 rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
                window.history.back();
              } else {
                window.location.href = '/dashboard';
              }
            }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-[#00236f] flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
            title="Return to Previous (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] tracking-wide text-[#00236f]">
                STAFF MANAGEMENT & ORG JOURNEY
              </span>
              <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                MULTI-TABLE ARCHITECTURE
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Decoupled 1-to-many Addresses, Bank Accounts, Qualifications, Experience, and Career Events with Default-Key Isolation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-3 py-1.5 rounded text-[11px] transition"
          >
            + ONBOARD NEW STAFF
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded text-[11px] font-medium">
          [SUCCESS] {actionSuccessMsg}
        </div>
      )}
      {actionErrorMsg && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded text-[11px] font-medium">
          [ERROR] {actionErrorMsg}
        </div>
      )}

      {/* Two Column Layout: Staff List on Left, Multi-Table Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Staff Directory */}
        <div className="lg:col-span-4 bg-white border border-[#00236f]/20 rounded p-3 space-y-3 shadow-sm">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Filter by name, Emp ID, designation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchStaff()}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[#00236f]"
            />

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="block text-gray-500 font-semibold mb-0.5">DEPT:</label>
                <select
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded p-1 text-[10px] bg-white"
                >
                  <option value="all">ALL DEPARTMENTS</option>
                  <option value="CSE">COMPUTER SCIENCE (CSE)</option>
                  <option value="AGRI">AGRICULTURE (AGRI)</option>
                  <option value="CE">CIVIL ENGG (CE)</option>
                  <option value="ME">MECHANICAL (ME)</option>
                  <option value="MGMT">MANAGEMENT (MGMT)</option>
                  <option value="PHARM">PHARMACY (PHARM)</option>
                  <option value="APP_SCI">APPLIED SCIENCES</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-0.5">STATUS:</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded p-1 text-[10px] bg-white"
                >
                  <option value="all">ALL STATUSES</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RESIGNED">RESIGNED (NOTICE)</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="AOL">AOL (ABSENT OUT)</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-2 text-[10px] text-gray-500 flex justify-between">
            <span>SHOWING: {staffList.length} STAFF</span>
            <button onClick={fetchStaff} className="text-[#00236f] font-bold hover:underline">
              [REFRESH LIST]
            </button>
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-6 text-gray-400">Loading staff records...</div>
            ) : staffList.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No matching staff records found.</div>
            ) : (
              staffList.map(s => {
                const isSelected = selectedStaffId === s.staff_id;
                const statusColor =
                  s.employee_status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : s.employee_status === 'RESIGNED'
                    ? 'bg-amber-100 text-amber-800'
                    : s.employee_status === 'AOL'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-rose-100 text-rose-800';

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.staff_id)}
                    className={`p-2.5 rounded border cursor-pointer transition ${
                      isSelected
                        ? 'border-[#00236f] bg-[#00236f]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00236f] text-[11px]">{s.full_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColor}`}>
                        {s.employee_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1">
                      <span>{s.primary_designation}</span>
                      <span className="font-mono text-[#00236f] font-semibold">{s.employee_id}</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1 pt-1 border-t border-gray-100">
                      <span>DEPT: {s.department_id}</span>
                      <span>LOGIN: {s.login_enabled ? '[ENABLED]' : '[DISABLED]'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Multi-Table Inspector & Controls */}
        <div className="lg:col-span-8 bg-white border border-[#00236f]/20 rounded p-4 space-y-4 shadow-sm min-h-[500px]">
          {profileLoading || !staffProfile ? (
            <div className="text-center py-20 text-gray-400">
              {profileLoading ? 'Loading full multi-table profile...' : 'Select a staff member from the left pane.'}
            </div>
          ) : (
            <>
              {/* Profile Header & Action Buttons */}
              <div className="border-b border-gray-200 pb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-bold text-[#00236f]">
                      {staffProfile.basic.full_name}
                    </h2>
                    <span className="bg-[#00236f] text-white px-2 py-0.5 rounded text-[10px] font-mono">
                      {staffProfile.basic.employee_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        staffProfile.basic.employee_status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : staffProfile.basic.employee_status === 'RESIGNED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {staffProfile.basic.employee_status}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex gap-3">
                    <span>DESIGNATION: {staffProfile.basic.primary_designation}</span>
                    <span>DEPARTMENT: {staffProfile.basic.department_id}</span>
                    <span>JOINED: {staffProfile.basic.date_of_joining}</span>
                    <span>CATEGORY: {staffProfile.basic.category.toUpperCase()}</span>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleLogin}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                      staffProfile.basic.login_enabled
                        ? 'border-rose-400 text-rose-700 bg-rose-50 hover:bg-rose-100'
                        : 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {staffProfile.basic.login_enabled ? '[DISABLE LOGIN]' : '[ENABLE LOGIN]'}
                  </button>

                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="border border-[#00236f] text-[#00236f] bg-white hover:bg-[#00236f]/5 px-2.5 py-1 rounded text-[10px] font-bold transition"
                  >
                    [ADMIN RESET PWD]
                  </button>

                  <button
                    onClick={() => {
                      setStatusModalData({
                        employee_status: staffProfile.basic.employee_status,
                        date_of_resigning: staffProfile.basic.date_of_resigning || '',
                        last_working_date: staffProfile.basic.last_working_date || '',
                        remarks: '',
                      });
                      setShowStatusModal(true);
                    }}
                    className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-2.5 py-1 rounded text-[10px] font-bold transition"
                  >
                    [TRANSITION STATUS]
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-gray-200 text-[10px] font-bold gap-1">
                {[
                  { id: 'overview', label: 'BASIC INFO' },
                  { id: 'addresses', label: `ADDRESSES (${staffProfile.addresses.length})` },
                  { id: 'banks', label: `BANK ACCOUNTS (${staffProfile.bankAccounts.length})` },
                  { id: 'qualifications', label: `QUALIFICATIONS (${staffProfile.qualifications.length})` },
                  { id: 'experience', label: `EXPERIENCE (${staffProfile.experience.length})` },
                  { id: 'journey', label: `ORG JOURNEY (${staffProfile.orgJourney.length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#00236f] text-[#00236f] bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded border border-gray-200 text-[10px]">
                    <div>
                      <span className="text-gray-500 font-semibold block">FATHER NAME:</span>
                      <span className="font-bold text-gray-800">{staffProfile.basic.father_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">DATE OF BIRTH:</span>
                      <span className="font-bold text-gray-800">{staffProfile.basic.dob || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">GENDER:</span>
                      <span className="font-bold text-gray-800">{staffProfile.basic.gender.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">PORTAL LOGIN:</span>
                      <span className="font-bold text-gray-800">
                        {staffProfile.basic.login_enabled ? 'ALLOWED (ACTIVE)' : 'DISABLED BY ADMIN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">PASSWORD CHANGE REQUIRED:</span>
                      <span className="font-bold text-gray-800">
                        {staffProfile.basic.must_change_password ? 'YES (MANDATORY ON NEXT LOGIN)' : 'NO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">PORTAL USERNAME:</span>
                      <span className="font-mono font-bold text-gray-800">
                        {staffProfile.user?.username || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {staffProfile.additional && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 text-[10px] space-y-2">
                      <span className="font-bold text-[#00236f] block">ADDITIONAL STATUTORY CREDENTIALS:</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="text-gray-500 font-semibold block">BLOOD GROUP:</span>
                          <span className="font-bold text-gray-800">{staffProfile.additional.blood_group || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold block">EMERGENCY PHONE:</span>
                          <span className="font-bold text-gray-800">{staffProfile.additional.emergency_phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold block">PF UAN:</span>
                          <span className="font-mono font-bold text-gray-800">{staffProfile.additional.pf_uan || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold block">ESI NUMBER:</span>
                          <span className="font-mono font-bold text-gray-800">{staffProfile.additional.esi_number || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {staffProfile.basic.date_of_resigning && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded text-[10px] space-y-1">
                      <span className="font-bold text-amber-900 block">[EXIT TIMELINE AUDIT]:</span>
                      <div className="flex gap-4">
                        <span>EFFECTIVE RESIGNATION DATE: <strong>{staffProfile.basic.date_of_resigning}</strong></span>
                        <span>LAST WORKING DATE: <strong>{staffProfile.basic.last_working_date || 'TBD'}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-2">
                  {staffProfile.addresses.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No addresses registered.</div>
                  ) : (
                    staffProfile.addresses.map((a: any) => (
                      <div key={a.id} className="border border-gray-200 p-2.5 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#00236f]">{a.address_type.toUpperCase()} ADDRESS</span>
                            {a.is_default && (
                              <span className="bg-[#00236f] text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-0.5">{a.address_line}</p>
                          <p className="text-gray-500">{a.city}, GST State Code: {a.state_gst} - {a.pincode}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'banks' && (
                <div className="space-y-2">
                  {staffProfile.bankAccounts.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No bank accounts registered.</div>
                  ) : (
                    staffProfile.bankAccounts.map((b: any) => (
                      <div key={b.id} className="border border-gray-200 p-2.5 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#00236f]">{b.bank_name}</span>
                            {b.is_default && (
                              <span className="bg-[#00236f] text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                                SALARY DISBURSEMENT DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-gray-800 mt-0.5">A/C: {b.account_number} | IFSC: {b.ifsc_code}</p>
                          <p className="text-gray-500">Branch: {b.branch_name}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'qualifications' && (
                <div className="space-y-2">
                  {staffProfile.qualifications.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No academic qualifications listed.</div>
                  ) : (
                    staffProfile.qualifications.map((q: any) => (
                      <div key={q.id} className="border border-gray-200 p-2.5 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#00236f]">{q.qualification_title}</span>
                            {q.is_highest && (
                              <span className="bg-[#ea580c] text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                                HIGHEST DEGREE
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-0.5">{q.institution}</p>
                          <p className="text-gray-500">Passing Year: {q.year_of_passing} | Score: {q.percentage_or_cgpa} CGPA/%</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-2">
                  {staffProfile.experience.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No prior work experience listed.</div>
                  ) : (
                    staffProfile.experience.map((e: any) => (
                      <div key={e.id} className="border border-gray-200 p-2.5 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#00236f]">{e.organization_name}</span>
                            {e.is_latest && (
                              <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                                LATEST PRIOR EXPERIENCE
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-0.5">Role: {e.designation}</p>
                          <p className="text-gray-500">Tenure: {e.start_date} to {e.end_date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'journey' && (
                <div className="space-y-2">
                  {staffProfile.orgJourney.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No career journey events recorded.</div>
                  ) : (
                    staffProfile.orgJourney.map((j: any) => (
                      <div key={j.id} className="border-l-2 border-[#00236f] pl-3 py-1 bg-gray-50/50 p-2 rounded text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#00236f] uppercase">
                            [EVENT: {j.event_type.replace(/_/g, ' ')}]
                          </span>
                          <span className="text-gray-400 font-mono text-[9px]">{j.effective_date}</span>
                        </div>
                        {j.new_designation && (
                          <div className="text-gray-700 mt-0.5 font-semibold">
                            {j.old_designation ? `${j.old_designation} -> ${j.new_designation}` : j.new_designation}
                          </div>
                        )}
                        <p className="text-gray-600 mt-1 italic">{j.remarks}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL: Transition Status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-md p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">TRANSITION EMPLOYEE STATUS & LIFECYCLE</span>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">TARGET STATUS:</label>
                <select
                  value={statusModalData.employee_status}
                  onChange={e => setStatusModalData({ ...statusModalData, employee_status: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RESIGNED">RESIGNED (SERVING NOTICE)</option>
                  <option value="TERMINATED">STATUTORILY TERMINATED</option>
                  <option value="AOL">ABSENT OUT OF LEAVE (AOL)</option>
                  <option value="DEACTIVATED">DEACTIVATED / RELIEVED</option>
                </select>
              </div>

              {['RESIGNED', 'TERMINATED', 'AOL', 'DEACTIVATED'].includes(statusModalData.employee_status) && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">EFFECTIVE RESIGNATION/NOTICE DATE:</label>
                    <input
                      type="date"
                      value={statusModalData.date_of_resigning}
                      onChange={e => setStatusModalData({ ...statusModalData, date_of_resigning: e.target.value })}
                      className="w-full border p-1.5 rounded text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">LAST WORKING DATE (HANDOVER):</label>
                    <input
                      type="date"
                      value={statusModalData.last_working_date}
                      onChange={e => setStatusModalData({ ...statusModalData, last_working_date: e.target.value })}
                      className="w-full border p-1.5 rounded text-[11px]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold mb-1 text-gray-700">REGULATORY REMARKS / ORDER NO:</label>
                <textarea
                  rows={2}
                  placeholder="Official memo notes..."
                  value={statusModalData.remarks}
                  onChange={e => setStatusModalData({ ...statusModalData, remarks: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
              >
                CANCEL
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-3 py-1 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-bold rounded"
              >
                COMMIT TRANSITION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Admin Password Reset */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-md p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">ADMIN-ASSISTED CREDENTIAL OVERRIDE</span>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-300 p-2 rounded text-[10px] text-amber-900">
                <strong>[MANDATORY SECURITY ENFORCEMENT]:</strong> Resetting this password forces the user to set a new password on their very next login.
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">CUSTOM TEMPORARY PASSWORD (LEAVE BLANK FOR AUTO-GEN):</label>
                <input
                  type="text"
                  placeholder="e.g. Edu@982103"
                  value={tempPasswordInput}
                  onChange={e => setTempPasswordInput(e.target.value)}
                  className="w-full border p-1.5 rounded text-[11px] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
              >
                CANCEL
              </button>
              <button
                onClick={handleAdminResetPassword}
                className="px-3 py-1 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded"
              >
                GENERATE & ENFORCE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Onboard New Staff */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-lg p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">ONBOARD NEW FACULTY / STAFF MEMBER</span>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">EMPLOYEE ID *:</label>
                <input
                  type="text"
                  placeholder="2001-22-03-01"
                  value={newStaff.employee_id}
                  onChange={e => setNewStaff({ ...newStaff, employee_id: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">FULL NAME *:</label>
                <input
                  type="text"
                  placeholder="Prof. Parminder Singh"
                  value={newStaff.full_name}
                  onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">FATHER NAME:</label>
                <input
                  type="text"
                  placeholder="S. Jaswant Singh"
                  value={newStaff.father_name}
                  onChange={e => setNewStaff({ ...newStaff, father_name: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">DATE OF JOINING:</label>
                <input
                  type="date"
                  value={newStaff.date_of_joining}
                  onChange={e => setNewStaff({ ...newStaff, date_of_joining: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">PRIMARY DESIGNATION:</label>
                <input
                  type="text"
                  placeholder="Assistant Professor"
                  value={newStaff.primary_designation}
                  onChange={e => setNewStaff({ ...newStaff, primary_designation: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">DEPARTMENT:</label>
                <select
                  value={newStaff.department_id}
                  onChange={e => setNewStaff({ ...newStaff, department_id: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                >
                  <option value="CSE">COMPUTER SCIENCE (CSE)</option>
                  <option value="AGRI">AGRICULTURE (AGRI)</option>
                  <option value="CE">CIVIL ENGG (CE)</option>
                  <option value="ME">MECHANICAL (ME)</option>
                  <option value="MGMT">MANAGEMENT (MGMT)</option>
                  <option value="PHARM">PHARMACY (PHARM)</option>
                  <option value="APP_SCI">APPLIED SCIENCES</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">CATEGORY:</label>
                <select
                  value={newStaff.category}
                  onChange={e => setNewStaff({ ...newStaff, category: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                >
                  <option value="fresher">FRESHER</option>
                  <option value="rejoiner">REJOINER</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">GENDER:</label>
                <select
                  value={newStaff.gender}
                  onChange={e => setNewStaff({ ...newStaff, gender: e.target.value })}
                  className="w-full border p-1.5 rounded text-[11px]"
                >
                  <option value="female">FEMALE</option>
                  <option value="male">MALE</option>
                  <option value="other">OTHER</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateStaff}
                className="px-3 py-1 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded"
              >
                CREATE & ONBOARD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
