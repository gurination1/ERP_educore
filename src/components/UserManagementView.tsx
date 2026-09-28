import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, UserRole } from '../types';

interface UserManagementViewProps {
  currentUser?: User | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  const handleToggleStatus = async (user: User) => {
    setActionLoadingId(user.id);
    const newStatus = !user.is_active;
    try {
      const res = await api.updateUserStatus(user.id, newStatus);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `User ${user.full_name} has been ${newStatus ? 'Activated' : 'Suspended'}.`,
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
          employeeId: selectedUser.employee_id || 'EMP-ID',
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
      const matchName = u.full_name.toLowerCase().includes(q);
      const matchUsername = u.username.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchEmpId = u.employee_id?.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      const matchDesig = u.designation?.toLowerCase().includes(q);
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
  const activeCount = users.filter(u => u.is_active !== false).length;
  const suspendedCount = users.filter(u => u.is_active === false).length;

  return (
    <div id="user-management-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[28px]">manage_accounts</span>
            <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
              Institutional User & Staff Governance
            </h2>
          </div>
          <p className="text-sm text-[#444651] mt-1">
            Admin Super-Powers: Provision, hire, and govern institutional personnel across Punjab engineering college departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openHireModal}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">person_add</span>
            <span>Hire & Provision Staff</span>
          </button>
          <button
            onClick={loadUsers}
            className="p-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-[#444651]"
            title="Refresh Staff Roster"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61]'
              : 'bg-[#ffdad6]/50 border border-[#ba1a1a]/30 text-[#ba1a1a]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">close</span>
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
          <span className="text-[10px] uppercase font-bold text-[#006a61] block">Counselors</span>
          <h4 className="text-2xl font-black text-[#006a61] mt-1">{counselorCount}</h4>
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
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: `All (${users.length})` },
              { id: 'staff', label: `Faculty (${facultyCount})` },
              { id: 'counselor', label: `Counselors (${counselorCount})` },
              { id: 'hod', label: `HODs (${hodCount})` },
              { id: 'accounts', label: `Accounts (${accountsCount})` },
              { id: 'admin', label: `Admins (${adminCount})` },
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
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#757682] text-[18px]">
              search
            </span>
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
                            <div className="font-bold text-[#191c1d]">{user.full_name}</div>
                            <div className="text-[10px] text-[#757682] font-mono">
                              @{user.username} • {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#00236f]">
                        {user.employee_id || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : user.role === 'hod'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : user.role === 'counselor'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : user.role === 'accounts'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : user.role === 'staff'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#444651]">
                        <div className="font-medium text-[#191c1d]">{user.designation || 'Staff Member'}</div>
                        <div className="text-[10px] text-[#757682]">{user.department || 'General Administration'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isUserActive
                              ? 'bg-[#86f2e4]/30 text-[#006a61]'
                              : 'bg-[#ffdad6] text-[#ba1a1a]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-[#006a61]' : 'bg-[#ba1a1a]'}`}></span>
                          <span>{isUserActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 text-[#444651] hover:text-[#00236f] hover:bg-white rounded border border-transparent hover:border-[#e1e3e4] cursor-pointer"
                            title="Edit User Profile"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="p-1 text-[#006a61] hover:bg-teal-50 rounded border border-transparent hover:border-teal-200 cursor-pointer"
                            title="Override & Reset Password"
                          >
                            <span className="material-symbols-outlined text-[16px]">key</span>
                          </button>
                          <button
                            disabled={actionLoadingId === user.id || user.id === currentUser?.id}
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1 rounded border border-transparent cursor-pointer disabled:opacity-30 ${
                              isUserActive
                                ? 'text-[#ba1a1a] hover:bg-red-50 hover:border-red-200'
                                : 'text-[#006a61] hover:bg-teal-50 hover:border-teal-200'
                            }`}
                            title={isUserActive ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isUserActive ? 'block' : 'check_circle'}
                            </span>
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

      {/* Modal: Hire / Provision Staff Role */}
      {isHireModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[22px] text-amber-300">person_add</span>
                <div>
                  <h3 className="text-base font-bold">Hire & Provision Staff Role</h3>
                  <p className="text-[11px] text-blue-100">Punjab College ERP Institutional Authority</p>
                </div>
              </div>
              <button
                onClick={() => setIsHireModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleHireSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
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
                      { role: 'admin', label: 'Provost / Admin', desc: 'Super Extreme Powers' },
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
                  className="w-full p-2 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono font-bold text-[#006a61]"
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
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>Provision Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Profile */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-[#f8f9fa]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">edit</span>
                <h3 className="text-sm font-bold text-[#191c1d]">Edit Employee Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#757682] hover:text-[#191c1d] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
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
        </div>
      )}

      {/* Modal: Override & Reset Password */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-red-50 text-red-900">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">lock_reset</span>
                <h3 className="text-sm font-bold">Admin Password Reset Override</h3>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-red-700 hover:text-red-900 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
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
                  className="w-full p-2.5 bg-[#f3f4f5] rounded-lg border border-[#e1e3e4] focus:border-[#00236f] focus:outline-none font-mono font-bold text-[#006a61] text-sm"
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
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  <span>Commit Password Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Staff Credentials Slip */}
      {credentialsSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white text-center">
              <span className="material-symbols-outlined text-[36px] text-amber-300">badge</span>
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
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedKey === 'slip_user' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757682] text-[11px]">Temporary Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#006a61]">{credentialsSlip.temporaryPassword}</span>
                    <button
                      onClick={() => handleCopy(credentialsSlip.temporaryPassword, 'slip_pwd')}
                      className="text-[#00236f] hover:underline cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedKey === 'slip_pwd' ? 'check' : 'content_copy'}
                      </span>
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
                  <span className="material-symbols-outlined text-[15px]">print</span>
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
        </div>
      )}
    </div>
  );
};
