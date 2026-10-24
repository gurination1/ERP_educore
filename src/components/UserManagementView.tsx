import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { api } from '../api/client';
import { User, UserRole } from '../types';
import { RefreshCw, Printer, Edit, Trash2, Shield, UserCheck, KeyRound, History, FileText, Building2, Smartphone, Globe, Laptop, Info, Settings, X, Check, AlertTriangle, AlertCircle, Plus, Search } from 'lucide-react';

interface UserManagementViewProps {
  currentUser?: User | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role') as 'all' | UserRole | null;
  const urlStatus = searchParams.get('status') as 'all' | 'active' | 'suspended' | null;

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>(urlRole || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>(urlStatus || 'all');

  useEffect(() => {
    if (urlRole) setRoleFilter(urlRole);
    if (urlStatus) setStatusFilter(urlStatus);
  }, [urlRole, urlStatus]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isApexOverrideModalOpen, setIsApexOverrideModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState<User | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: 'SUSPENDED' as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'RESIGNED' | 'TERMINATED' | 'AWOL',
    effectiveDate: new Date().toISOString().slice(0, 10),
    lastWorkingDate: '',
    reason: '',
  });
  // Software Journey Modal State (Recording 160 Mandate)
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [journeyUser, setJourneyUser] = useState<User | null>(null);
  const [journeyData, setJourneyData] = useState<{
    softwareJourney: any[];
    activityLogs: any[];
    linkedStaffJourney?: any[];
  } | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyTab, setJourneyTab] = useState<'journey' | 'activity' | 'staff'>('journey');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [apexOverrideForm, setApexOverrideForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    reason: 'Super Admin authoritative governance override',
  });
  const [credentialsSlip, setCredentialsSlip] = useState<{
    fullName: string;
    username: string;
    temporaryPassword: string;
    role: string;
    employeeId: string;
    department?: string;
    designation?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Hire Form State
  const [hireForm, setHireForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    employeeId: '',
    password: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    role: 'staff' as UserRole,
    department: '',
    designation: '',
    employeeId: '',
  });

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');

  // Role Rights Configuration Matrix State (Recording 161 & Lecture 3 Mandate)
  const [activeRoleMatrixUser, setActiveRoleMatrixUser] = useState<User | null>(null);
  const [roleRightsMap, setRoleRightsMap] = useState<Record<string, boolean>>({
    fees_collect: false,
    admissions_crm: false,
    student_manage: false,
    academics_curriculum: false,
    exam_clearance: false,
    faculty_hrms: false,
    hostel_allot: false,
    doc_compliance: false,
    mis_reports: false,
    master_arch: false,
  });

  const openRoleMatrix = (targetUser: User) => {
    setActiveRoleMatrixUser(targetUser);
    const isTeaching = targetUser.role === 'staff' || targetUser.role === 'hod';
    const isAdminRole = targetUser.role === 'admin' || targetUser.role === 'super_admin';
    const isAccounts = targetUser.role === 'accounts';
    const isCounselor = targetUser.role === 'counselor';
    const isHostel = targetUser.role === 'hostel';
    const isHR = targetUser.role === 'hr';

    setRoleRightsMap({
      fees_collect: isAdminRole || isAccounts,
      admissions_crm: isAdminRole || isCounselor,
      student_manage: isAdminRole || isTeaching || isCounselor || isAccounts || isHostel,
      academics_curriculum: isAdminRole || isTeaching,
      exam_clearance: isAdminRole || isTeaching || isAccounts,
      faculty_hrms: isAdminRole || isHR,
      hostel_allot: isAdminRole || isHostel,
      doc_compliance: isAdminRole || isTeaching || isCounselor || isHR,
      mis_reports: isAdminRole || isAccounts || targetUser.role === 'hod',
      master_arch: isAdminRole,
    });
  };

  const handleToggleRight = (key: string) => {
    setRoleRightsMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveRights = async () => {
    if (!activeRoleMatrixUser) return;
    setFeedback({
      type: 'success',
      message: `Access rights matrix successfully saved & auto-applied for @${activeRoleMatrixUser.username} (${activeRoleMatrixUser.role}).`,
    });
    setActiveRoleMatrixUser(null);
  };

  const handleRevokeAllRights = () => {
    if (!activeRoleMatrixUser) return;
    setRoleRightsMap({
      fees_collect: false,
      admissions_crm: false,
      student_manage: false,
      academics_curriculum: false,
      exam_clearance: false,
      faculty_hrms: false,
      hostel_allot: false,
      doc_compliance: false,
      mis_reports: false,
      master_arch: false,
    });
    setFeedback({
      type: 'success',
      message: `All discretionary privileges revoked for @${activeRoleMatrixUser.username}. Minimum base authentication preserved.`,
    });
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load user roster.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const generateEmployeeId = (role: string, dept: string) => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    const prefix = role === 'admin' ? 'ADM' : role === 'counselor' ? 'CNS' : role === 'hod' ? 'HOD' : role === 'accounts' ? 'ACC' : 'FAC';
    return `${prefix}-${year}-${random}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const openHireModal = () => {
    const generatedPwd = generatePassword();
    const genEmpId = generateEmployeeId('staff', 'Computer Science & Engineering');
    setHireForm({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      role: 'staff',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      employeeId: genEmpId,
      password: generatedPwd,
    });
    setIsHireModalOpen(true);
  };

  const handleRoleChangeInHire = (newRole: UserRole) => {
    let defaultDept = hireForm.department;
    let defaultDesig = hireForm.designation;
    if (newRole === 'counselor') {
      defaultDept = 'Admissions Cell & Outreach';
      defaultDesig = 'Head Admissions Counselor';
    } else if (newRole === 'hod') {
      defaultDept = 'Computer Science & Engineering';
      defaultDesig = 'Head of Department (HOD)';
    } else if (newRole === 'accounts') {
      defaultDept = 'Accounts & Financial Audit Cell';
      defaultDesig = 'Chief Accounts Officer';
    } else if (newRole === 'admin') {
      defaultDept = 'Registrar Office & Administration';
      defaultDesig = 'System Administrator / Registrar';
    } else if (newRole === 'staff') {
      defaultDept = 'Computer Science & Engineering';
      defaultDesig = 'Assistant Professor';
    }
    const genEmpId = generateEmployeeId(newRole, defaultDept);
    setHireForm(prev => ({
      ...prev,
      role: newRole,
      department: defaultDept,
      designation: defaultDesig,
      employeeId: genEmpId,
    }));
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.fullName.trim()) {
      setFeedback({ type: 'error', message: 'Employee Full Name is mandatory.' });
      return;
    }
    const username = hireForm.username.trim() || hireForm.fullName.toLowerCase().replace(/\s+/g, '.') + Math.floor(10 + Math.random() * 90);
    const email = hireForm.email.trim() || `${username}@educore.edu`;

    setActionLoadingId('hire');
    try {
      const res = await api.createUser({
        username,
        email,
        password: hireForm.password,
        role: hireForm.role,
        fullName: hireForm.fullName.trim(),
        department: hireForm.department,
        designation: hireForm.designation,
        employeeId: hireForm.employeeId,
      });

      if (res.success) {
        setIsHireModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Successfully provisioned ${res.user?.full_name} (${res.user?.role.toUpperCase()}) with active login credentials.`,
        });
        setCredentialsSlip({
          fullName: res.user?.full_name || hireForm.fullName,
          username: res.user?.username || username,
          temporaryPassword: res.temporaryPassword || hireForm.password,
          role: res.user?.role || hireForm.role,
          employeeId: res.user?.employee_id || hireForm.employeeId,
          department: res.user?.department || hireForm.department,
          designation: res.user?.designation || hireForm.designation,
        });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to provision staff role.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error occurred while provisioning.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openStatusModal = (user: User) => {
    setStatusTargetUser(user);
    const isCurrentlyActive = user.is_active !== false;
    setStatusForm({
      status: isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE',
      effectiveDate: new Date().toISOString().slice(0, 10),
      lastWorkingDate: '',
      reason: isCurrentlyActive ? 'Administrative governance suspension' : 'Administrative account reinstatement',
    });
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetUser) return;
    setActionLoadingId(statusTargetUser.id);
    const targetIsActive = statusForm.status === 'ACTIVE';
    try {
      const res = await api.updateUserStatus(statusTargetUser.id, {
        isActive: targetIsActive,
        status: statusForm.status,
        reason: statusForm.reason.trim(),
        effectiveDate: statusForm.effectiveDate,
        lastWorkingDate: statusForm.lastWorkingDate,
      });
      if (res.success) {
        setIsStatusModalOpen(false);
        setFeedback({
          type: 'success',
          message: res.message || `User ${statusTargetUser.full_name} status updated to ${statusForm.status}.`,
        });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update account status.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating user status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const isCurrentlyActive = user.is_active !== false;
    const actionName = isCurrentlyActive ? 'Deactivate / Suspend' : 'Reactivate';
    const confirmed = window.confirm(`Are you sure you want to ${actionName} the account for ${user.full_name} (@${user.username})?`);
    if (!confirmed) return;

    setActionLoadingId(user.id);
    const newStatus = !isCurrentlyActive;
    try {
      const res = await api.updateUserStatus(user.id, {
        isActive: newStatus,
        status: newStatus ? 'ACTIVE' : 'SUSPENDED',
        reason: `One-click administrative action by ${currentUser?.full_name || 'Admin'}`,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || `User ${user.full_name} has been ${newStatus ? 'Activated' : 'Suspended'}.`,
        });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update account status.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating user status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      designation: user.designation || '',
      employeeId: user.employee_id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoadingId(selectedUser.id);
    try {
      const res = await api.updateUser(selectedUser.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        department: editForm.department.trim(),
        designation: editForm.designation.trim(),
        employeeId: editForm.employeeId.trim(),
      });
      if (res.success) {
        setIsEditModalOpen(false);
        setFeedback({ type: 'success', message: `Profile updated for ${editForm.fullName}.` });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update user profile.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error updating user.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword(generatePassword());
    setIsResetPasswordModalOpen(true);
  };

  const openSoftwareJourneyModal = async (user: User) => {
    setJourneyUser(user);
    setIsJourneyModalOpen(true);
    setJourneyLoading(true);
    setJourneyTab('journey');
    try {
      const res = await api.getUserSoftwareJourney(user.id);
      if (res.success) {
        setJourneyData({
          softwareJourney: res.softwareJourney || [],
          activityLogs: res.activityLogs || [],
          linkedStaffJourney: res.linkedStaffJourney || [],
        });
      }
    } catch (err: any) {
      console.error('Error fetching software journey:', err);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoadingId(selectedUser.id);
    try {
      const res = await api.resetUserPassword(selectedUser.id, newPassword);
      if (res.success) {
        setIsResetPasswordModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Password reset successfully for ${selectedUser.full_name}.`,
        });
        setCredentialsSlip({
          fullName: selectedUser.full_name,
          username: selectedUser.username,
          temporaryPassword: res.temporaryPassword || newPassword,
          role: selectedUser.role,
          employeeId: selectedUser.enterprise_uid || selectedUser.employee_id || 'UID',
          department: selectedUser.department,
          designation: selectedUser.designation,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to reset password.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error resetting password.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openApexOverrideModal = (user: User) => {
    setSelectedUser(user);
    setApexOverrideForm({
      fullName: user.full_name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      reason: 'Super Admin authoritative governance override',
    });
    setIsApexOverrideModalOpen(true);
  };

  const handleApexOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoadingId(selectedUser.id);
    try {
      const payload: any = {
        fullName: apexOverrideForm.fullName.trim(),
        username: apexOverrideForm.username.trim(),
        email: apexOverrideForm.email.trim(),
        role: apexOverrideForm.role,
        reason: apexOverrideForm.reason.trim(),
      };
      if (apexOverrideForm.password.trim()) {
        payload.password = apexOverrideForm.password.trim();
      }
      const res = await api.overrideUser(selectedUser.id, payload);
      if (res.success) {
        setIsApexOverrideModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Apex Universal Override applied: ${res.user?.full_name} (${res.user?.role.toUpperCase()}) updated with immutable audit trail.`,
        });
        await loadUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to apply apex override.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Apex override operation failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Status filter
    if (statusFilter === 'active' && u.is_active === false) return false;
    if (statusFilter === 'suspended' && u.is_active !== false) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.full_name || '').toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchEmpId = (u.employee_id || '').toLowerCase().includes(q);
      const matchDept = (u.department || '').toLowerCase().includes(q);
      const matchDesig = (u.designation || '').toLowerCase().includes(q);
      return matchName || matchUsername || matchEmail || matchEmpId || matchDept || matchDesig;
    }

    return true;
  });

  // KPI Metrics
  const totalEmployees = users.filter(u => u.role !== 'student').length;
  const facultyCount = users.filter(u => u.role === 'staff').length;
  const counselorCount = users.filter(u => u.role === 'counselor').length;
  const hodCount = users.filter(u => u.role === 'hod').length;
  const accountsCount = users.filter(u => u.role === 'accounts').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const hrCount = users.filter(u => u.role === 'hr').length;
  const hostelCount = users.filter(u => u.role === 'hostel').length;
  const partnerCount = users.filter(u => u.role === 'partner').length;
  const studentCount = users.filter(u => u.role === 'student').length;
  const activeCount = users.filter(u => u.is_active !== false).length;
  const suspendedCount = users.filter(u => u.is_active === false).length;

  return (
    <div id="user-management-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
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
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
                Institutional User & Staff Governance
              </h2>
            </div>
            <p className="text-sm text-[#444651] mt-1">
              Administrative Governance: Provision, hire, and govern institutional personnel across campus departments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openHireModal}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hire & Provision Staff</span>
          </button>
          <button
            onClick={loadUsers}
            className="p-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-[#444651]"
            title="Refresh Staff Roster"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-[#ffedd5] border border-[#ea580c] text-[#00236f]'
              : 'bg-[#ffdad6]/50 border border-[#ba1a1a]/30 text-[#ba1a1a]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#757682] block">Total Staff</span>
          <h4 className="text-2xl font-black text-[#191c1d] mt-1">{totalEmployees}</h4>
          <p className="text-[10px] text-[#757682] mt-0.5">Campus Personnel</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#00236f] block">Faculty / Staff</span>
          <h4 className="text-2xl font-black text-[#00236f] mt-1">{facultyCount}</h4>
          <p className="text-[10px] text-[#757682] mt-0.5">Teaching & Lab</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#00236f] block">Counselors</span>
          <h4 className="text-2xl font-black text-[#00236f] mt-1">{counselorCount}</h4>
          <p className="text-[10px] text-[#757682] mt-0.5">Admission Cell</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-purple-700 block">HODs</span>
          <h4 className="text-2xl font-black text-purple-700 mt-1">{hodCount}</h4>
          <p className="text-[10px] text-[#757682] mt-0.5">Dept Heads</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Finance / Accounts</span>
          <h4 className="text-2xl font-black text-amber-700 mt-1">{accountsCount}</h4>
          <p className="text-[10px] text-[#757682] mt-0.5">Ledger & Audit</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#ba1a1a] block">Suspended</span>
          <h4 className="text-2xl font-black text-[#ba1a1a] mt-1">{suspendedCount}</h4>
          <p className="text-[10px] text-[#757682] mt-0.5">Deactivated Accounts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Tabs - All 10 Canonical Roles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: `All (${users.length})` },
              { id: 'staff', label: `Faculty (${facultyCount})` },
              { id: 'counselor', label: `Counselors (${counselorCount})` },
              { id: 'hod', label: `HODs (${hodCount})` },
              { id: 'accounts', label: `Accounts (${accountsCount})` },
              { id: 'admin', label: `Admins (${adminCount})` },
              { id: 'super_admin', label: `Super Admin (${superAdminCount})` },
              { id: 'hr', label: `HR (${hrCount})` },
              { id: 'hostel', label: `Hostel (${hostelCount})` },
              { id: 'partner', label: `Partners (${partnerCount})` },
              { id: 'student', label: `Students (${studentCount})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-[#f3f4f5] text-[#444651] hover:bg-[#e1e3e4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Status Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#757682] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, dept..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#f3f4f5] rounded-lg border border-transparent focus:border-[#00236f] focus:outline-none w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] font-medium text-[#191c1d]"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Role Rights Configuration Matrix Workspace (Zero-Popup Inline Architecture) */}
      {activeRoleMatrixUser && (
        <div className="bg-white rounded-2xl border-2 border-[#00236f]/30 p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e1e3e4] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00236f] text-white flex items-center justify-center font-black text-sm">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#191c1d]">
                    Access Rights & Permissions Matrix: {activeRoleMatrixUser.full_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#00236f] text-white tracking-wider">
                    {activeRoleMatrixUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-[#757682]">
                  @{activeRoleMatrixUser.username} • UID: {activeRoleMatrixUser.enterprise_uid || ''} • {activeRoleMatrixUser.department || 'General Administration'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.location.href = '/field-permissions'}
                className="px-3 py-1.5 rounded-lg border border-[#00236f] text-[#00236f] hover:bg-blue-50 text-xs font-bold transition-all cursor-pointer"
              >
                Granular Field Matrix →
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleMatrixUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rights Checkbox Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              { key: 'fees_collect', label: 'Fee Collection & Cash Ledger', desc: 'Accept cash counter payments, issue receipts & settle ledger' },
              { key: 'admissions_crm', label: 'Admissions CRM & Telephony', desc: 'Inquiries pipeline, auto-assign counselors, cloud dialer' },
              { key: 'student_manage', label: 'Student Master Directory', desc: 'Read/write enrolled scholars, batch promotions, demographics' },
              { key: 'academics_curriculum', label: 'CBCS Academics & Timetable', desc: 'Curriculum syllabus, combined classes, timetable allocations' },
              { key: 'exam_clearance', label: 'University Exams & Gate Pass', desc: 'Admit card clearance, examination approvals, CBT Quiz LMS' },
              { key: 'faculty_hrms', label: 'Faculty HRMS & Payroll', desc: 'Staff dossiers, attendance, CAS publications, digital exit NOC' },
              { key: 'hostel_allot', label: 'Hostel & Residence Logistics', desc: 'Bed allocation, room inventories, mess dues & no-dues' },
              { key: 'doc_compliance', label: 'Regulatory Document Vault', desc: 'Marksheet verification, AICTE/PTU regulatory dossiers' },
              { key: 'mis_reports', label: 'MIS Reports & Analytics', desc: 'Institutional workload, financial reconciliations, exports' },
              { key: 'master_arch', label: 'Master Tables Architecture', desc: 'Tenant campuses, GST state codes, degrees, document types' },
            ].map(r => (
              <label
                key={r.key}
                className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  roleRightsMap[r.key]
                    ? 'bg-blue-50/60 border-blue-300 text-[#00236f]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(roleRightsMap[r.key])}
                  onChange={() => handleToggleRight(r.key)}
                  className="mt-0.5 rounded text-[#00236f] focus:ring-[#00236f]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">{r.label}</span>
                  <span className="text-[10px] text-[#757682] leading-tight mt-0.5">{r.desc}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e1e3e4]">
            <button
              type="button"
              onClick={handleRevokeAllRights}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all border border-rose-200 cursor-pointer"
              title="Strip selected ID of all administrative access (Recording Seg 006 Mandate)"
            >
              Revoke All Discretionary Rights
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRoleMatrixUser(null)}
                className="px-3.5 py-1.5 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-bold text-[#444651] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRights}
                className="px-4 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Auto-Apply & Save Rights Globally</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#757682]">Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#757682]">
            No users found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee / User</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department & Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {filteredUsers.map(user => {
                  const isUserActive = user.is_active !== false;
                  return (
                    <tr key={user.id} className="hover:bg-[#f8f9fa]">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#00236f] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#191c1d] flex items-center gap-1.5">
                              <span>{user.full_name}</span>
                              {user.role === 'super_admin' && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded">SUPER</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#757682] font-mono">
                              @{user.username} • {user.email}
                            </div>
                            {user.enterprise_uid && (
                              <div className="text-[9px] text-[#00236f] font-mono font-bold tracking-tight">
                                UID: {user.enterprise_uid}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#00236f]">
                        {user.employee_id || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openRoleMatrix(user)}
                          title="Click to view & configure rights matrix (Recording Seg 006 Mandate)"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${
                            user.role === 'super_admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : user.role === 'admin'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : user.role === 'hod'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : user.role === 'counselor'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : user.role === 'accounts'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : user.role === 'staff'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : user.role === 'hostel'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : user.role === 'hr'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : user.role === 'partner'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span>{user.role}</span>
                          <Shield className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-[#444651]">
                        <div className="font-medium text-[#191c1d]">{user.designation || 'Staff Member'}</div>
                        <div className="text-[10px] text-[#757682]">{user.department || 'General Administration'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isUserActive
                              ? 'bg-[#ffedd5] text-[#00236f]'
                              : 'bg-[#ffdad6] text-[#ba1a1a]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-[#ea580c]' : 'bg-[#ba1a1a]'}`}></span>
                          <span>{isUserActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {currentUser?.role === 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => openApexOverrideModal(user)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                              title="Apex Universal Override (Super Admin Omnipotent Edit)"
                            >
                              <span>⚡</span>
                              <span>APEX</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                            title="Edit User Profile"
                          >
                            <span>✎</span>
                            <span>EDIT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openResetPasswordModal(user)}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-[#00236f] rounded border border-teal-200 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                            title="Override & Reset Password"
                          >
                            <KeyRound className="w-3 h-3 text-[#00236f]" />
                            <span>RESET PWD</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openStatusModal(user)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded border border-purple-200 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                            title="Open Formal HR / Account Status Governance Modal"
                          >
                            <Settings className="w-3 h-3 text-purple-700" />
                            <span>GOVERN</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openSoftwareJourneyModal(user)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#00236f] rounded border border-blue-300 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                            title="View User Software Journey & Forensic Activity Trail (Recording 160)"
                          >
                            <History className="w-3 h-3 text-blue-700" />
                            <span>JOURNEY</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === user.id || user.id === currentUser?.id || (user.role === 'super_admin' && currentUser?.role !== 'super_admin')}
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2 py-1 rounded border font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors disabled:opacity-30 ${
                              isUserActive
                                ? 'bg-red-50 hover:bg-red-100 text-[#ba1a1a] border-red-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                            title={isUserActive ? 'Deactivate or Suspend User' : 'Reactivate User Account'}
                          >
                            <span>{isUserActive ? '⏸' : '▶'}</span>
                            <span>{isUserActive ? 'DEACTIVATE' : 'ACTIVATE'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline Workspace: Hire / Provision Staff Role (Zero Popups) */}
      {isHireModalOpen && (
        <div className="bg-white rounded-2xl w-full flex flex-col shadow-sm border border-blue-200 overflow-hidden animate-fadeIn my-4">
          <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white">
            <div className="flex items-center gap-2.5">
              
              <div>
                <h3 className="text-base font-bold">Hire & Provision Staff Role</h3>
                <p className="text-[11px] text-blue-100">Punjab College ERP Institutional Authority</p>
              </div>
            </div>
            <button
              onClick={() => setIsHireModalOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleHireSubmit} className="p-6 space-y-4 text-xs">
              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                  Institutional Role & Authority *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(
                    [
                      { role: 'staff', label: 'Faculty / Staff', desc: 'Lecture, Attend, Marks' },
                      { role: 'counselor', label: 'Head Counselor', desc: 'Intake, Inquiries, Admit' },
                      { role: 'hod', label: 'HOD', desc: 'Department Head, Admit' },
                      { role: 'accounts', label: 'Chief Accounts', desc: 'Ledger, Fees, Waivers' },
                      { role: 'admin', label: 'Provost / Admin', desc: 'Institutional Governance' },
                    ] as const
                  ).map(r => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleChangeInHire(r.role as UserRole)}
                      className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                        hireForm.role === r.role
                          ? 'border-[#00236f] bg-[#00236f]/5 ring-1 ring-[#00236f]'
                          : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
                      }`}
                    >
                      <div className="font-bold text-[#191c1d]">{r.label}</div>
                      <div className="text-[10px] text-[#757682]">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={hireForm.fullName}
                    onChange={e => setHireForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g. Dr. Harpreet Singh"
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Username (Login ID)
                  </label>
                  <input
                    type="text"
                    value={hireForm.username}
                    onChange={e => setHireForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={hireForm.email}
                    onChange={e => setHireForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. harpreet.cse@educore.edu"
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={hireForm.employeeId}
                    onChange={e => setHireForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono font-bold text-[#00236f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={hireForm.department}
                    onChange={e => setHireForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Applied Sciences & Humanities">Applied Sciences & Humanities</option>
                    <option value="Admissions Cell & Outreach">Admissions Cell & Outreach</option>
                    <option value="Accounts & Financial Audit Cell">Accounts & Financial Audit Cell</option>
                    <option value="Registrar Office & Administration">Registrar Office & Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={hireForm.designation}
                    onChange={e => setHireForm(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1 flex items-center justify-between">
                  <span>Initial Temporary Password *</span>
                  <button
                    type="button"
                    onClick={() => setHireForm(prev => ({ ...prev, password: generatePassword() }))}
                    className="text-[#00236f] hover:underline cursor-pointer lowercase"
                  >
                    generate random
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={hireForm.password}
                  onChange={e => setHireForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono font-bold text-[#00236f]"
                />
              </div>

              <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHireModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#444651] hover:bg-[#f8f9fa] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'hire'}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  
                  <span>Provision Credentials</span>
                </button>
              </div>
            </form>
          </div>
      )}

      {/* Inline Workspace: Edit User Profile (Zero Popups) */}
      {isEditModalOpen && selectedUser && (
        <div className="bg-white rounded-2xl w-full flex flex-col shadow-sm border border-blue-200 overflow-hidden animate-fadeIn my-4">
          <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-[#f8f9fa]">
              <div className="flex items-center gap-2">
                <Edit className="w-3.5 h-3.5 text-[#00236f]" />
                <h3 className="text-sm font-bold text-[#191c1d]">Edit Employee Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#757682] hover:text-[#191c1d] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#757682] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#757682] uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#757682] uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={e => setEditForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#757682] uppercase mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none uppercase font-bold"
                  >
                    <option value="staff">Staff / Faculty</option>
                    <option value="counselor">Head Counselor</option>
                    <option value="hod">HOD</option>
                    <option value="accounts">Accounts</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#757682] uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#757682] uppercase mb-1">Designation</label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={e => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                  className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#444651] hover:bg-[#f8f9fa] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedUser.id}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
      )}

      {/* Inline Workspace: Override & Reset Password (Zero Popups) */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="bg-white rounded-2xl w-full shadow-sm border border-amber-300 overflow-hidden animate-fadeIn my-4">
          <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-red-50 text-red-900">
              <div className="flex items-center gap-2">
                
                <h3 className="text-sm font-bold">Admin Password Reset Override</h3>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-red-700 hover:text-red-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
                <div className="text-[11px] text-[#757682]">Target Account:</div>
                <div className="font-bold text-[#191c1d] text-sm mt-0.5">{selectedUser.full_name}</div>
                <div className="font-mono text-[10px] text-[#00236f]">@{selectedUser.username}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1 flex items-center justify-between">
                  <span>New Temporary Password *</span>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatePassword())}
                    className="text-[#00236f] hover:underline cursor-pointer lowercase"
                  >
                    generate random
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono font-bold text-[#00236f] text-sm"
                />
              </div>

              <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#444651] hover:bg-[#f8f9fa] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedUser.id}
                  className="px-5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  
                  <span>Commit Password Override</span>
                </button>
              </div>
            </form>
          </div>
      )}

      {/* Inline Card: Official Staff Credentials Slip (Zero Popups) */}
      {credentialsSlip && (
        <div className="bg-white rounded-2xl w-full shadow-sm border border-blue-300 overflow-hidden animate-fadeIn my-4">
          <div className="p-6 bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white text-center">
              
              <h3 className="text-lg font-bold mt-1">Staff Appointment & Credentials Slip</h3>
              <p className="text-[11px] text-blue-100 mt-0.5">EduCore Institutional Governance Authority</p>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="bg-[#f8f9fa] p-3.5 rounded-xl border border-[#e1e3e4] space-y-2">
                <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-1.5">
                  <span className="text-[#757682]">Staff Name:</span>
                  <span className="font-bold text-[#191c1d]">{credentialsSlip.fullName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-1.5">
                  <span className="text-[#757682]">Assigned Role:</span>
                  <span className="font-bold text-[#00236f] uppercase">{credentialsSlip.role}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-1.5">
                  <span className="text-[#757682]">Employee ID:</span>
                  <span className="font-mono font-bold text-[#191c1d]">{credentialsSlip.employeeId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-1.5">
                  <span className="text-[#757682]">Department:</span>
                  <span className="font-medium text-[#191c1d]">{credentialsSlip.department || 'General'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#757682]">Designation:</span>
                  <span className="font-medium text-[#191c1d]">{credentialsSlip.designation || 'Staff'}</span>
                </div>
              </div>

              {/* Login Credentials Box */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#757682] text-[11px]">Portal Username:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#191c1d]">{credentialsSlip.username}</span>
                    <button
                      onClick={() => handleCopy(credentialsSlip.username, 'slip_user')}
                      className="text-[#00236f] hover:underline cursor-pointer"
                    >
                      
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757682] text-[11px]">Temporary Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#00236f]">{credentialsSlip.temporaryPassword}</span>
                    <button
                      onClick={() => handleCopy(credentialsSlip.temporaryPassword, 'slip_pwd')}
                      className="text-[#00236f] hover:underline cursor-pointer"
                    >
                      
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/50 rounded-lg text-[10px] text-[#00236f] leading-relaxed">
                Provide these credentials to the appointee. The employee will be prompted to reset their initial password upon their first portal sign-in.
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#444651] hover:bg-[#f8f9fa] flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setCredentialsSlip(null)}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Inline Workspace: Super Admin Apex Override (Zero Popups) */}
      {isApexOverrideModalOpen && selectedUser && (
        <div className="bg-white rounded-2xl w-full flex flex-col shadow-sm border border-amber-400 overflow-hidden animate-fadeIn my-4">
          <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between bg-gradient-to-r from-amber-700 via-amber-800 to-[#00236f] text-white">
              <div className="flex items-center gap-2.5">
                
                <div>
                  <h3 className="text-base font-bold">Apex Universal Override</h3>
                  <p className="text-[11px] text-amber-100">Super Admin Omnipotent Directive • Append-Only Audit Trail</p>
                </div>
              </div>
              <button
                onClick={() => setIsApexOverrideModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApexOverrideSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-700" />
                  <span>Target: {selectedUser.full_name} ({selectedUser.enterprise_uid || selectedUser.id})</span>
                </div>
                <p className="text-[10px] text-amber-800">
                  Universal Override allows Super Admin to directly mutate full names, login handles, emails, credentials, and institutional roles across all tiers with automatic cryptographic audit logging.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={apexOverrideForm.fullName}
                  onChange={e => setApexOverrideForm({ ...apexOverrideForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={apexOverrideForm.username}
                    onChange={e => setApexOverrideForm({ ...apexOverrideForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={apexOverrideForm.email}
                    onChange={e => setApexOverrideForm({ ...apexOverrideForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Role Tier
                  </label>
                  <select
                    value={apexOverrideForm.role}
                    onChange={e => setApexOverrideForm({ ...apexOverrideForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-semibold"
                  >
                    <option value="student">Student (1001)</option>
                    <option value="staff">Faculty / Staff (2001)</option>
                    <option value="counselor">Counselor (2002)</option>
                    <option value="hod">HOD (3001)</option>
                    <option value="accounts">Accounts (3002)</option>
                    <option value="admin">Administrator (4001)</option>
                    <option value="super_admin">Super Administrator (9001)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep current"
                    value={apexOverrideForm.password}
                    onChange={e => setApexOverrideForm({ ...apexOverrideForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                  Reason for Audit Record *
                </label>
                <input
                  type="text"
                  required
                  value={apexOverrideForm.reason}
                  onChange={e => setApexOverrideForm({ ...apexOverrideForm, reason: e.target.value })}
                  placeholder="e.g. Identity correction requested by Registrar"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#f3f4f5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApexOverrideModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] text-[#444651] font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedUser.id}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoadingId === selectedUser.id ? 'Overriding...' : 'Apply Universal Override'}</span>
                </button>
              </div>
            </form>
          </div>
      )}

      {/* Inline Workspace: Status & Account Governance (Zero Popups) */}
      {isStatusModalOpen && statusTargetUser && (
        <div className="bg-white rounded-2xl w-full shadow-sm border border-slate-300 overflow-hidden animate-fadeIn my-4">
          <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-gradient-to-r from-[#00236f] to-[#1e3a8a] text-white">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">⚙</span>
                <div>
                  <h3 className="text-base font-bold">Personnel Status Governance</h3>
                  <p className="text-[11px] text-blue-100">Statutory Access & HR Lifecycle Controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4 text-xs">
              {/* Target User Info Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{statusTargetUser.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">@{statusTargetUser.username} • {statusTargetUser.enterprise_uid || statusTargetUser.employee_id || 'UID'}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5 uppercase font-semibold">{statusTargetUser.role} • {statusTargetUser.department || 'General Administration'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                    statusTargetUser.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {statusTargetUser.is_active !== false ? '● ACTIVE' : '● SUSPENDED'}
                  </span>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                  Target Account & Employment Status *
                </label>
                <select
                  value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#00236f]"
                >
                  <option value="ACTIVE">ACTIVE — Full Institutional Access & Good Standing</option>
                  <option value="SUSPENDED">SUSPENDED — Administrative Suspension (Login Blocked)</option>
                  <option value="INACTIVE">INACTIVE — Account Deactivated (Access Revoked)</option>
                  <option value="RESIGNED">RESIGNED — Voluntary Resignation Submitted</option>
                  <option value="TERMINATED">TERMINATED — Institutional Employment Terminated</option>
                  <option value="AWOL">AWOL — Absent Without Official Leave</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {statusForm.status === 'ACTIVE'
                    ? 'Account will be restored with full login privileges and system access.'
                    : 'Account login will be immediately blocked across all mobile and web portals.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={statusForm.effectiveDate}
                    onChange={e => setStatusForm({ ...statusForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                    Last Working Date
                  </label>
                  <input
                    type="date"
                    value={statusForm.lastWorkingDate}
                    onChange={e => setStatusForm({ ...statusForm, lastWorkingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                  Statutory Reason & Governance Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  value={statusForm.reason}
                  onChange={e => setStatusForm({ ...statusForm, reason: e.target.value })}
                  placeholder="Record administrative decision details for immutable cryptographic audit log..."
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#f3f4f5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] text-[#444651] font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === statusTargetUser.id}
                  className={`px-4 py-2 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    statusForm.status === 'ACTIVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  <span>{actionLoadingId === statusTargetUser.id ? 'Applying...' : 'Confirm Status Transition'}</span>
                </button>
              </div>
            </form>
          </div>
      )}

      {/* Inline Workspace: Software Journey & User Forensic Audit (Zero Popups) */}
      {isJourneyModalOpen && journeyUser && (
        <div className="bg-white rounded-2xl w-full flex flex-col shadow-sm border border-slate-300 overflow-hidden animate-fadeIn my-4">
          <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold font-mono">
                  {journeyUser.full_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold tracking-tight">{journeyUser.full_name}</h3>
                    <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      @{journeyUser.username}
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                      UID: {journeyUser.enterprise_uid || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100/80 font-medium mt-0.5">
                    {journeyUser.designation || 'Staff'} • {journeyUser.department || 'General Administration'} • Role: <strong className="uppercase">{journeyUser.role}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJourneyModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Header Tabs */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setJourneyTab('journey')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    journeyTab === 'journey'
                      ? 'bg-[#00236f] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Software Journey ({journeyData?.softwareJourney.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJourneyTab('activity')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    journeyTab === 'activity'
                      ? 'bg-[#00236f] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Forensic Activity Logs ({journeyData?.activityLogs.length || 0})</span>
                </button>
                {journeyData?.linkedStaffJourney && journeyData.linkedStaffJourney.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setJourneyTab('staff')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      journeyTab === 'staff'
                        ? 'bg-[#00236f] text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Staff Promotions & Career ({journeyData.linkedStaffJourney.length})</span>
                  </button>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Permanent Append-Only DB
              </span>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
              {journeyLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-3 border-[#00236f] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-bold text-slate-600">Retrieving immutable software journey & forensic audit logs...</p>
                </div>
              ) : journeyTab === 'journey' ? (
                /* Software Journey Timeline */
                <div className="space-y-3">
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Historical Software Journey Protection:</strong> As dictated in Lecture Recording 160, user role mutations, administrative promotions, or status changes never erase historical logs. Every transition records actor identity, timestamp, device fingerprint, and authorization details.
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {journeyData?.softwareJourney.map((milestone, idx) => (
                      <div key={milestone.id || idx} className="relative bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
                        {/* Timeline Node Bullet */}
                        <div className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                          milestone.event_type.includes('PROVISION')
                            ? 'bg-emerald-600 ring-2 ring-emerald-200'
                            : milestone.event_type.includes('DEACTIVATE') || milestone.severity === 'critical'
                            ? 'bg-rose-600 ring-2 ring-rose-200'
                            : 'bg-[#00236f] ring-2 ring-blue-200'
                        }`}></div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {milestone.event_type}
                            </span>
                            <span className="text-xs font-bold text-[#00236f]">
                              By {milestone.actor_name} ({milestone.actor_id})
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 font-medium">
                            {milestone.timestamp ? new Date(milestone.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {milestone.details}
                        </p>

                        {milestone.changes_diff && (
                          <div className="bg-slate-50 rounded-lg p-2 font-mono text-[10px] text-slate-600 border border-slate-200/80 overflow-x-auto">
                            <strong>Mutated Payload:</strong> {milestone.changes_diff}
                          </div>
                        )}

                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-slate-400" /> Device: <strong>{milestone.device}</strong></span>
                            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-400" /> IP: <strong>{milestone.ip_address}</strong></span>
                            <span className="flex items-center gap-1"><Laptop className="w-3 h-3 text-slate-400" /> Platform: <strong>{milestone.platform}</strong></span>
                          </div>
                          <span className="font-sans font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Severity: {milestone.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : journeyTab === 'activity' ? (
                /* Activity Logs Performed By User */
                <div className="space-y-3">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#00236f] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Immutable System Activity Audit:</strong> Full append-only log of operations executed by this user account across EduCore panels (attendance entry, grade submission, fee collections, user updates).
                    </div>
                  </div>

                  {journeyData?.activityLogs && journeyData.activityLogs.length > 0 ? (
                    <div className="space-y-2">
                      {journeyData.activityLogs.map((act, i) => (
                        <div key={act.id || i} className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#00236f]">{act.action}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {act.timestamp ? new Date(act.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px]">{act.details}</p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                            <span>Target: {act.target_type} ({act.target_id})</span>
                            <span>IP: {act.actor_ip || '172.16.4.12'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No operational mutation activities recorded by this user account yet.
                    </div>
                  )}
                </div>
              ) : (
                /* Linked Staff Org Journey */
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Organizational Career Transitions:</strong> Tracking promotions, demotions, additional roles, and role switches within institution departments.
                    </div>
                  </div>

                  <div className="space-y-2">
                    {journeyData?.linkedStaffJourney?.map((ev, i) => (
                      <div key={ev.id || i} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-blue-100 text-[#00236f]">
                            {ev.event_type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Effective: {ev.effective_date}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          {ev.old_designation ? `${ev.old_designation} ➔ ${ev.new_designation}` : ev.new_designation}
                        </div>
                        <p className="text-[11px] text-slate-600 italic">“{ev.remarks}”</p>
                        <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                          Authorized by: {ev.actor_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                EduCore Forensic Governance Engine • AICTE/UGC Regulatory Grade
              </span>
              <button
                type="button"
                onClick={() => setIsJourneyModalOpen(false)}
                className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer transition-all"
              >
                Close Audit Dossier
              </button>
            </div>
          </div>
      )}
    </div>
  );
};
