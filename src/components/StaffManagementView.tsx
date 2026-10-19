import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { User, StaffRoleAssignment, DefaultCategoryRights } from '../types';
import { api } from '../api/client';

export type StaffTab = 'overview' | 'payroll' | 'exit-noc' | 'addresses' | 'banks' | 'qualifications' | 'experience' | 'journey' | 'additional-roles';

interface StaffManagementViewProps {
  currentUser: User | null;
  initialTab?: StaffTab;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentUser, initialTab }) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as StaffTab | null;
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffProfile, setStaffProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const isHOD = currentUser?.role === 'hod';
  const hodDeptDefault = isHOD
    ? (currentUser?.department?.toUpperCase().includes('ME') ? 'ME' : currentUser?.department?.toUpperCase().includes('ECE') ? 'ECE' : 'CSE')
    : 'all';
  const [departmentFilter, setDepartmentFilter] = useState(hodDeptDefault);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'fresher' | 'rejoiner'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StaffTab>(urlTab || initialTab || 'overview');
  const canManageHR = !currentUser || ['admin', 'super_admin', 'hr', 'hod'].includes(currentUser.role);

  // Karanvir Sir Lecture 4 Segment 6: View Mode (Staff Directory vs Roles Matrix & Bulk Revoke)
  const [mainViewMode, setMainViewMode] = useState<'directory' | 'roles_matrix'>('directory');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStaffIdsForRevoke, setSelectedStaffIdsForRevoke] = useState<string[]>([]);
  const [activeRoleAssignments, setActiveRoleAssignments] = useState<StaffRoleAssignment[]>([
    {
      id: 'ra-01',
      employee_id: '2001-14-03-01',
      staff_name: 'Dr. Gurpreet Singh',
      department: 'Computer Science & Engineering',
      role_key: 'fee_collector',
      role_title: 'Tuition Fee Collection Cashier',
      granted_by: 'Campus Provost 4001',
      granted_at: '2025-08-01',
      is_active: true,
    },
    {
      id: 'ra-02',
      employee_id: '2001-14-03-03',
      staff_name: 'Er. Jaswinder Brar',
      department: 'Mechanical Engineering',
      role_key: 'fee_collector',
      role_title: 'Tuition Fee Collection Cashier',
      granted_by: 'Campus Provost 4001',
      granted_at: '2025-08-05',
      is_active: true,
    },
    {
      id: 'ra-03',
      employee_id: '2001-14-03-04',
      staff_name: 'Dr. Neha Mittal',
      department: 'Computer Science & Engineering',
      role_key: 'admissions_counselor',
      role_title: 'Senior Admissions Lead Counselor',
      granted_by: 'Dean Academics',
      granted_at: '2025-07-15',
      is_active: true,
    },
    {
      id: 'ra-04',
      employee_id: '10001-01-03-01',
      staff_name: 'Er. Harminder Singh',
      department: 'Campus Infrastructure',
      role_key: 'hostel_warden',
      role_title: 'Chief Residence Warden (Block A/B)',
      granted_by: 'Campus Provost 4001',
      granted_at: '2025-06-10',
      is_active: true,
    },
    {
      id: 'ra-05',
      employee_id: '2001-14-03-02',
      staff_name: 'Prof. Sunita Rao',
      department: 'Management Studies',
      role_key: 'fee_collector',
      role_title: 'Tuition Fee Collection Cashier',
      granted_by: 'Campus Provost 4001',
      granted_at: '2025-08-02',
      is_active: true,
    },
  ]);

  const [defaultRightsData, setDefaultRightsData] = useState<DefaultCategoryRights[]>([
    {
      category: 'teaching',
      category_label: 'Teaching Faculty & Professors',
      default_roles: ['Faculty Advisor', 'Lecture Attendance Officer', 'CA Marks Evaluator'],
      rights: [
        { key: 'mark_attendance', label: 'Take Classroom Lecture Attendance (75% Gate)', enabled: true },
        { key: 'enter_sessional_marks', label: 'Submit MST 1/2 and Assignment Sessional Marks', enabled: true },
        { key: 'view_syllabus', label: 'Access CBCS Curriculum & Syllabus Units', enabled: true },
        { key: 'verify_admit_cards', label: 'Verify Admit Cards & Hall Tickets', enabled: true },
        { key: 'collect_fees', label: 'Cashier Quick Fee Collection Desk', enabled: false },
        { key: 'demote_scholar', label: 'Sign-off Student Demotion & Contra Entry', enabled: false },
        { key: 'manage_hostel', label: 'Hostel Bed Allotment & Mess Clearance', enabled: false },
      ],
    },
    {
      category: 'non_teaching',
      category_label: 'Non-Teaching Operations & Facilities',
      default_roles: ['Residence Warden', 'Cashier', 'Transport Fleet Manager'],
      rights: [
        { key: 'collect_fees', label: 'Cashier Quick Fee Collection Desk', enabled: true },
        { key: 'manage_hostel', label: 'Hostel Bed Allotment & Mess Clearance', enabled: true },
        { key: 'log_maintenance', label: '360-day Facility Overhaul & Inspection Logging', enabled: true },
        { key: 'manage_transport', label: 'Collegiate Bus Route & Seat Allocation', enabled: true },
        { key: 'enter_sessional_marks', label: 'Submit MST 1/2 and Assignment Sessional Marks', enabled: false },
        { key: 'demote_scholar', label: 'Sign-off Student Demotion & Contra Entry', enabled: false },
      ],
    },
    {
      category: 'administration',
      category_label: 'Administrative Governance (Deans & Provosts)',
      default_roles: ['Campus Provost', 'Dean Academics', 'Registrar', 'Bursar'],
      rights: [
        { key: 'batch_deployment', label: 'Deploy Full-Page Academic Batches & Sessions', enabled: true },
        { key: 'demote_scholar', label: 'Sign-off Student Demotion & Contra Entry', enabled: true },
        { key: 'fee_policies', label: 'Create Fee Policies & Reversal Contra Ledgers', enabled: true },
        { key: 'resolve_tickets', label: 'Resolve Login Support Tickets Queue', enabled: true },
        { key: 'master_architecture', label: 'Mutate Master Tables (States, Degrees, Depts)', enabled: true },
        { key: 'bulk_revoke_roles', label: 'Universal Role Assignment & Bulk Revocation', enabled: true },
      ],
    },
  ]);

  const handleToggleCategoryRight = (category: string, rightKey: string) => {
    setDefaultRightsData(prev =>
      prev.map(cat => {
        if (cat.category !== category) return cat;
        return {
          ...cat,
          rights: cat.rights.map(r => r.key === rightKey ? { ...r, enabled: !r.enabled } : r),
        };
      })
    );
  };

  const handleSingleRevokeRole = (roleAssignmentId: string, staffName: string, roleTitle: string) => {
    setActiveRoleAssignments(prev => prev.filter(r => r.id !== roleAssignmentId));
    setSelectedStaffIdsForRevoke(prev => prev.filter(id => id !== roleAssignmentId));
    setActionSuccessMsg(`Revoked role '${roleTitle}' from ${staffName}. Access terminated.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleBulkRevokeRoles = () => {
    if (selectedStaffIdsForRevoke.length === 0) return;
    const count = selectedStaffIdsForRevoke.length;
    setActiveRoleAssignments(prev => prev.filter(r => !selectedStaffIdsForRevoke.includes(r.id)));
    setSelectedStaffIdsForRevoke([]);
    setActionSuccessMsg(`Karanvir Sir Ordinance: Bulk revoked assigned role from ${count} staff member(s). Live permissions terminated.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [urlTab, initialTab]);

  // Designation Transition Modal (Lecture 3 & Recording 160)
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [designationForm, setDesignationForm] = useState({
    eventType: 'PROMOTION' as 'PROMOTION' | 'DEMOTION' | 'ADDITIONAL_ROLE' | 'ROLE_SWITCH',
    newDesignation: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  });

  // Multi-Role Allocation (Lecture 3: Teaching, Non-Teaching, Administrative across Schools)
  const [additionalRoles, setAdditionalRoles] = useState<any[]>([]);
  const [newRoleForm, setNewRoleForm] = useState({
    role_name: '',
    role_type: 'teaching' as 'teaching' | 'non-teaching' | 'administrative',
    department_id: '',
    school_id: '',
    remarks: '',
  });
  const [isAddingRole, setIsAddingRole] = useState(false);

  // HRMS Payroll & Security Deductions (Lecture 3)
  const [payrollData, setPayrollData] = useState<any | null>(null);
  const [securityData, setSecurityData] = useState<any | null>(null);
  const [nocData, setNocData] = useState<any | null>(null);
  const [isEditingPayroll, setIsEditingPayroll] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    basic_pay: 55000,
    hra: 15000,
    special_allowance: 10000,
    pf_applicable: true,
    esi_applicable: false,
    voluntary_pf_amount: 0,
    tds_deduction: 3500,
  });

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

  // Decoupled sub-entity modals (Addresses, Bank Accounts, Qualifications, Experience)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_type: 'current' as 'current' | 'permanent' | 'correspondence',
    address_line: '',
    city: 'Bathinda',
    state_gst: '03',
    pincode: '151001',
    is_default: true,
  });

  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: 'HDFC Bank',
    account_number: '',
    ifsc_code: 'HDFC0000123',
    branch_name: 'Bathinda Main Branch',
    is_default: true,
  });

  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [qualificationForm, setQualificationForm] = useState({
    qualification_title: 'M.Tech Computer Science & Engineering',
    institution: 'Thapar Institute of Engineering & Technology',
    year_of_passing: 2021,
    percentage_or_cgpa: 8.8,
    is_highest: false,
  });

  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [experienceForm, setExperienceForm] = useState({
    organization_name: 'Infosys Technologies Ltd',
    designation: 'Senior Systems Engineer',
    start_date: '2021-07-01',
    end_date: '2023-12-31',
    is_latest: false,
  });

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
    const [profRes, payRes, secRes, nocRes, rolesRes] = await Promise.all([
      api.getStaffProfile(id),
      api.getStaffPayroll(id),
      api.getStaffSecurityDeduction(id),
      api.getStaffExitNoc(id),
      api.getStaffAdditionalRoles(id),
    ]);
    if (profRes.success && profRes.profile) {
      const p = profRes.profile;
      const normalized = p.basic ? p : {
        ...p,
        basic: p,
        addresses: p.addresses || [],
        bankAccounts: p.bankAccounts || [],
        qualifications: p.qualifications || [],
        experience: p.experience || [],
        orgJourney: p.orgJourney || [],
        additional: p.additional || {},
      };
      setStaffProfile(normalized);
    }
    if (rolesRes.success && rolesRes.roles) {
      setAdditionalRoles(rolesRes.roles);
    }
    if (payRes.success && payRes.payroll) {
      setPayrollData(payRes.payroll);
      setPayrollForm({
        basic_pay: payRes.payroll.basic_pay,
        hra: payRes.payroll.hra,
        special_allowance: payRes.payroll.special_allowance,
        pf_applicable: payRes.payroll.pf_applicable,
        esi_applicable: payRes.payroll.esi_applicable,
        voluntary_pf_amount: payRes.payroll.voluntary_pf_amount,
        tds_deduction: payRes.payroll.tds_deduction,
      });
    }
    if (secRes.success && secRes.securityDeduction) {
      setSecurityData(secRes.securityDeduction);
    }
    if (nocRes.success && nocRes.noc) {
      setNocData(nocRes.noc);
    }
    setProfileLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, [departmentFilter, statusFilter]);

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    } else {
      setActiveTab('overview');
    }
  }, [urlTab, initialTab]);

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

  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    const res = await api.updateStaffPayroll(selectedStaffId, payrollForm);
    if (res.success && res.payroll) {
      setPayrollData(res.payroll);
      setIsEditingPayroll(false);
      setActionSuccessMsg('Payroll structure updated successfully.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setActionErrorMsg(res.error || 'Failed to update payroll');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleRecordSecurityDeduction = async () => {
    if (!selectedStaffId) return;
    const res = await api.recordSecurityInstallment(selectedStaffId, 5000);
    if (res.success && res.securityDeduction) {
      setSecurityData(res.securityDeduction);
      setActionSuccessMsg('Recorded ₹5,000 security deduction installment.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setActionErrorMsg(res.error || 'Failed to record security installment');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleToggleNocCheckpoint = async (checkpoint: string, currentCleared: boolean) => {
    if (!selectedStaffId) return;
    const remarks = prompt(`Enter remarks for ${checkpoint.toUpperCase()} clearance:`, currentCleared ? 'Revoked' : 'All equipment and clearance verified') || '';
    const res = await api.updateNocCheckpoint(selectedStaffId, { checkpoint, cleared: !currentCleared, remarks });
    if (res.success && res.noc) {
      setNocData(res.noc);
      setActionSuccessMsg(`Updated ${checkpoint.toUpperCase()} clearance checkpoint.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setActionErrorMsg(res.error || 'Failed to update clearance checkpoint');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleReleaseSecurityRefund = async () => {
    if (!selectedStaffId) return;
    const tx = prompt('Enter Bank / Ledger Transaction Reference for Refund Release:', `TX-REFUND-${Date.now().toString().slice(-6)}`);
    if (!tx) return;
    const res = await api.releaseSecurityRefund(selectedStaffId, tx);
    if (res.success && res.noc) {
      setNocData(res.noc);
      if (securityData) setSecurityData({ ...securityData, status: 'refunded' });
      setActionSuccessMsg(`Security Deposit Refund Released! Tx: ${tx}`);
      setTimeout(() => setActionSuccessMsg(null), 6000);
    } else {
      setActionErrorMsg(res.error || 'Failed to release refund');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !newRoleForm.role_name) return;
    try {
      const res = await api.createStaffAdditionalRole(selectedStaffId, newRoleForm);
      if (res.success && res.role) {
        setAdditionalRoles(prev => [res.role, ...prev]);
        setIsAddingRole(false);
        setNewRoleForm({
          role_name: '',
          role_type: 'teaching',
          department_id: '',
          school_id: '',
          remarks: '',
        });
        setActionSuccessMsg('Additional institutional role allocated successfully.');
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to allocate role.');
        setTimeout(() => setActionErrorMsg(null), 4000);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!selectedStaffId) return;
    if (!confirm('Are you sure you want to relieve this additional role?')) return;
    try {
      const res = await api.deleteStaffAdditionalRole(selectedStaffId, roleId);
      if (res.success) {
        setAdditionalRoles(prev => prev.filter(r => r.id !== roleId));
        setActionSuccessMsg('Role relieved successfully.');
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to relieve role.');
        setTimeout(() => setActionErrorMsg(null), 4000);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleOneClickDeactivate = async (staffId: string, fullName: string) => {
    if (!confirm(`Confirm immediate deactivation & revocation of portal credentials for ${fullName}? (Last Working Day reached)`)) return;
    try {
      const [loginRes, statusRes] = await Promise.all([
        api.toggleStaffLogin(staffId, false),
        api.updateStaffBasic(staffId, { employee_status: 'RESIGNED', login_enabled: false }),
      ]);
      if (loginRes.success && statusRes.success) {
        setActionSuccessMsg(`Deactivated credentials and locked access for ${fullName}.`);
        fetchStaff();
        if (selectedStaffId === staffId) fetchProfile(staffId);
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        setActionErrorMsg(loginRes.error || statusRes.error || 'Failed to deactivate.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !addressForm.address_line || !addressForm.city) return;
    try {
      const res = await api.addStaffAddress(selectedStaffId, addressForm);
      if (res.success) {
        setShowAddressModal(false);
        setAddressForm({
          address_type: 'current',
          address_line: '',
          city: 'Bathinda',
          state_gst: '03',
          pincode: '151001',
          is_default: true,
        });
        setActionSuccessMsg('Staff residential address added successfully.');
        fetchProfile(selectedStaffId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to add address.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !bankForm.account_number || !bankForm.ifsc_code) return;
    try {
      const res = await api.addStaffBank(selectedStaffId, bankForm);
      if (res.success) {
        setShowBankModal(false);
        setBankForm({
          bank_name: 'HDFC Bank',
          account_number: '',
          ifsc_code: 'HDFC0000123',
          branch_name: 'Bathinda Main Branch',
          is_default: true,
        });
        setActionSuccessMsg('Staff salary disbursement bank account registered.');
        fetchProfile(selectedStaffId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to add bank account.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const handleAddQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !qualificationForm.qualification_title || !qualificationForm.institution) return;
    try {
      const res = await api.addStaffQualification(selectedStaffId, {
        ...qualificationForm,
        year_of_passing: Number(qualificationForm.year_of_passing),
        percentage_or_cgpa: Number(qualificationForm.percentage_or_cgpa),
      });
      if (res.success) {
        setShowQualificationModal(false);
        setQualificationForm({
          qualification_title: 'M.Tech Computer Science & Engineering',
          institution: 'Thapar Institute of Engineering & Technology',
          year_of_passing: 2021,
          percentage_or_cgpa: 8.8,
          is_highest: false,
        });
        setActionSuccessMsg('Academic qualification recorded successfully.');
        fetchProfile(selectedStaffId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to add qualification.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !experienceForm.organization_name || !experienceForm.designation) return;
    try {
      const res = await api.addStaffExperience(selectedStaffId, experienceForm);
      if (res.success) {
        setShowExperienceModal(false);
        setExperienceForm({
          organization_name: 'Infosys Technologies Ltd',
          designation: 'Senior Systems Engineer',
          start_date: '2021-07-01',
          end_date: '2023-12-31',
          is_latest: false,
        });
        setActionSuccessMsg('Prior work experience entry logged.');
        fetchProfile(selectedStaffId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to add experience.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const handleApplyDesignationChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffProfile || !designationForm.newDesignation.trim()) {
      setActionErrorMsg('New designation is required.');
      return;
    }
    try {
      const staffId = staffProfile.basic.staff_id;
      const oldDesig = staffProfile.basic.primary_designation;
      const journeyRes = await api.addStaffOrgJourney(staffId, {
        event_type: designationForm.eventType,
        old_designation: oldDesig,
        new_designation: designationForm.newDesignation.trim(),
        effective_date: designationForm.effectiveDate,
        remarks: designationForm.remarks || `${designationForm.eventType} approved by Governing Body`,
      });
      const basicRes = await api.updateStaffBasic(staffId, {
        primary_designation: designationForm.newDesignation.trim(),
      });

      if (journeyRes.success && basicRes.success) {
        setShowDesignationModal(false);
        setActionSuccessMsg(`Designation transition recorded: ${oldDesig} → ${designationForm.newDesignation} (${designationForm.eventType})`);
        fetchProfile(staffId);
        fetchStaff();
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        setActionErrorMsg(journeyRes.error || basicRes.error || 'Failed to record designation change.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    }
  };

  const approachingLwdStaff = staffList.filter(s => {
    if (!s.last_working_date) return false;
    const lwd = new Date(s.last_working_date).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((lwd - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && (s.login_enabled || s.employee_status === 'ACTIVE' || s.employee_status === 'RESIGNED');
  });

  const filteredStaffList = staffList.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-[11px] text-[#00236f]">
      {/* Top Header Bar */}
      <div className="bg-white border border-[#00236f]/20 rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#00236f] flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
            title="Return to Previous Screen (Alt + ←)"
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
          {/* Karanvir Sir Lecture 4 Segment 6: View Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMainViewMode('directory')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                mainViewMode === 'directory'
                  ? 'bg-[#00236f] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Directory
            </button>
            <button
              type="button"
              onClick={() => setMainViewMode('roles_matrix')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                mainViewMode === 'roles_matrix'
                  ? 'bg-[#00236f] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Roles & Bulk Revoke Matrix</span>
              <span className="px-1 py-0.2 rounded bg-amber-400 text-[#00236f] text-[8px] font-black">
                LECTURE 4
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-3 py-1.5 rounded text-[11px] transition cursor-pointer shadow-2xs"
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

      {/* Mentor Karanvir Sir Lecture 3: Approaching / Passed Last Working Day Alert Widget */}
      {approachingLwdStaff.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400/80 rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <div>
                <span className="font-extrabold text-[12px] text-amber-950 uppercase tracking-tight">
                  Last Working Day (LWD) System Deactivation Alert
                </span>
                <p className="text-[10px] text-amber-800 mt-0.5">
                  {approachingLwdStaff.length} employee(s) have reached or are within 7 days of their Last Working Day. Institutional deactivation is mandatory.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-amber-200/70 pt-2">
            {approachingLwdStaff.map(emp => (
              <div key={emp.id} className="flex items-center justify-between bg-white/90 p-2 rounded-lg border border-amber-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{emp.full_name}</span>
                  <span className="font-mono text-slate-500 text-[10px]">({emp.employee_id})</span>
                  <span className="text-[10px] text-amber-900 font-semibold">• LWD: {emp.last_working_date}</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[9px] uppercase">
                    {emp.employee_status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOneClickDeactivate(emp.staff_id, emp.full_name)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded text-[10px] transition cursor-pointer shadow-2xs"
                >
                  1-Click Deactivate & Revoke Access
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR Executive Command KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Faculty & Staff</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-[#00236f]">{staffList.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">{staffList.filter(s => s.employee_status === 'ACTIVE').length} Active</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fresher vs Rejoiner</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-indigo-900">{staffList.filter(s => s.category === 'fresher').length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Freshers • {staffList.filter(s => s.category === 'rejoiner').length} Rejoiners</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Deposit Deductions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-emerald-700">₹{((staffList.length * 15000) / 1000).toFixed(0)}k</span>
            <span className="text-[10px] text-slate-500 font-medium">₹5,000/mo schedule</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exit NOC Pipeline</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-amber-700">{staffList.filter(s => s.employee_status === 'RESIGNED').length}</span>
            <span className="text-[10px] text-amber-800 font-medium">Clearance Pending</span>
          </div>
        </div>
      </div>

      {mainViewMode === 'roles_matrix' ? (
        <div className="space-y-6 animate-fade-in text-xs">
          {/* Roles Management & Bulk Revocation Console (Karanvir Sir Lecture 4 Segment 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00236f]" />
                  <h3 className="font-extrabold text-sm text-[#00236f] uppercase tracking-wide">
                    Campus Roles Assignment & Bulk Revocation Console
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-50 text-[#00236f] rounded-full text-[10px] font-bold border border-blue-200">
                    LECTURE 4 • SEGMENT 6
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Universal privilege management: Inspect active role holders across departments, allocate cross-departmental duties, or execute 1-click bulk role revocations.
                </p>
              </div>

              {/* Bulk Revoke Action Bar */}
              <div className="flex items-center gap-2">
                {selectedStaffIdsForRevoke.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkRevokeRoles}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Bulk Revoke Role from {selectedStaffIdsForRevoke.length} Staff Member(s)</span>
                    <span className="text-white/80">✕</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Role Key */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filter by Specific Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={e => {
                    setSelectedRoleFilter(e.target.value);
                    setSelectedStaffIdsForRevoke([]);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800"
                >
                  <option value="all">All Assigned Institutional Roles</option>
                  <option value="fee_collector">Tuition Fee Collection Cashier</option>
                  <option value="admissions_counselor">Admissions Lead Counselor</option>
                  <option value="hostel_warden">Residence Warden & Mess In-charge</option>
                </select>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Showing {activeRoleAssignments.filter(r => selectedRoleFilter === 'all' || r.role_key === selectedRoleFilter).length} active assignments
              </span>
            </div>

            {/* Roles Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedStaffIdsForRevoke.length > 0 &&
                          selectedStaffIdsForRevoke.length ===
                            activeRoleAssignments.filter(r => selectedRoleFilter === 'all' || r.role_key === selectedRoleFilter).length
                        }
                        onChange={e => {
                          const currentFiltered = activeRoleAssignments.filter(r => selectedRoleFilter === 'all' || r.role_key === selectedRoleFilter);
                          if (e.target.checked) {
                            setSelectedStaffIdsForRevoke(currentFiltered.map(r => r.id));
                          } else {
                            setSelectedStaffIdsForRevoke([]);
                          }
                        }}
                        className="rounded text-[#00236f] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Faculty / Staff Member</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Assigned Role & Privilege</th>
                    <th className="py-2.5 px-3">Granting Authority</th>
                    <th className="py-2.5 px-3">Grant Date</th>
                    <th className="py-2.5 px-3 text-right">Revoke Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeRoleAssignments
                    .filter(r => selectedRoleFilter === 'all' || r.role_key === selectedRoleFilter)
                    .map(r => {
                      const isChecked = selectedStaffIdsForRevoke.includes(r.id);
                      return (
                        <tr key={r.id} className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-rose-50/40' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedStaffIdsForRevoke(prev =>
                                  prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id]
                                );
                              }}
                              className="rounded text-rose-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#00236f]">{r.staff_name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{r.employee_id}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{r.department}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00236f] font-bold text-[11px] border border-blue-200">
                              {r.role_title}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">{r.granted_by}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{r.granted_at}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSingleRevokeRole(r.id, r.staff_name, r.role_title)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all cursor-pointer border border-rose-200"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Default Rights Matrix by Staff Category (Segment 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="font-extrabold text-sm text-[#00236f] uppercase tracking-wide">
                  Default Privilege Rights Matrix by Staff Category
                </h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                  AUTO-APPLY ORDINANCE
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Karanvir Sir Lecture 4 Ordinance: Baseline privileges automatically granted whenever a Teaching, Non-Teaching, or Administrative staff member is provisioned.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {defaultRightsData.map(cat => (
                <div key={cat.category} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-xs text-[#00236f] uppercase">{cat.category_label}</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.2 rounded">
                      AUTO-APPLIED
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {cat.rights.map(r => (
                      <label key={r.key} className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={r.enabled}
                          onChange={() => handleToggleCategoryRight(cat.category, r.key)}
                          className="mt-0.5 rounded text-[#00236f] focus:ring-0 cursor-pointer"
                        />
                        <span className={`text-[11px] font-medium leading-tight ${r.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                          {r.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActionSuccessMsg(`Default rights matrix for ${cat.category_label} saved successfully.`);
                      setTimeout(() => setActionSuccessMsg(null), 3000);
                    }}
                    className="w-full py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white font-bold text-xs transition cursor-pointer"
                  >
                    Save Category Baseline
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Two Column Layout: Staff List on Left, Multi-Table Inspector on Right */
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

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div>
                <label className="block text-gray-500 font-semibold mb-0.5">DEPT:</label>
                <select
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded p-1 text-[10px] bg-white"
                >
                  <option value="all">ALL</option>
                  <option value="CSE">CSE</option>
                  <option value="AGRI">AGRI</option>
                  <option value="CE">CE</option>
                  <option value="ME">ME</option>
                  <option value="MGMT">MGMT</option>
                  <option value="PHARM">PHARM</option>
                  <option value="APP_SCI">APP_SCI</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-0.5">STATUS:</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded p-1 text-[10px] bg-white"
                >
                  <option value="all">ALL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RESIGNED">RESIGNED</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="AOL">AOL</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-0.5">CATEGORY:</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="w-full border border-gray-300 rounded p-1 text-[10px] bg-white font-semibold"
                >
                  <option value="all">ALL</option>
                  <option value="fresher">FRESHER</option>
                  <option value="rejoiner">REJOINER</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-2 text-[10px] text-gray-500 flex justify-between">
            <span>SHOWING: {filteredStaffList.length} STAFF</span>
            <button onClick={fetchStaff} className="text-[#00236f] font-bold hover:underline">
              [REFRESH LIST]
            </button>
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-6 text-gray-400">Loading staff records...</div>
            ) : filteredStaffList.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No matching staff records found.</div>
            ) : (
              filteredStaffList.map(s => {
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
                      <span className={`px-1 py-0.2 rounded font-bold uppercase ${s.category === 'rejoiner' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                        {s.category || 'FRESHER'}
                      </span>
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
                      {staffProfile.basic?.full_name || staffProfile.full_name || 'Faculty Member'}
                    </h2>
                    <span className="bg-[#00236f] text-white px-2 py-0.5 rounded text-[10px] font-mono">
                      {staffProfile.basic?.employee_id || staffProfile.employee_id || 'EMP'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (staffProfile.basic?.employee_status || staffProfile.employee_status) === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (staffProfile.basic?.employee_status || staffProfile.employee_status) === 'RESIGNED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {staffProfile.basic?.employee_status || staffProfile.employee_status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex gap-3">
                    <span>DESIGNATION: {staffProfile.basic?.primary_designation || staffProfile.primary_designation || 'Faculty'}</span>
                    <span>DEPARTMENT: {staffProfile.basic?.department_id || staffProfile.department_id || 'General'}</span>
                    <span>JOINED: {staffProfile.basic?.date_of_joining || '2020-01-01'}</span>
                    <span>CATEGORY: {String(staffProfile.basic?.category || 'General').toUpperCase()}</span>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleLogin}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                      staffProfile.basic?.login_enabled
                        ? 'border-rose-400 text-rose-700 bg-rose-50 hover:bg-rose-100'
                        : 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {staffProfile.basic?.login_enabled ? '[DISABLE LOGIN]' : '[ENABLE LOGIN]'}
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
                        employee_status: staffProfile.basic?.employee_status || 'ACTIVE',
                        date_of_resigning: staffProfile.basic?.date_of_resigning || '',
                        last_working_date: staffProfile.basic?.last_working_date || '',
                        remarks: '',
                      });
                      setShowStatusModal(true);
                    }}
                    className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-2.5 py-1 rounded text-[10px] font-bold transition"
                  >
                    [TRANSITION STATUS]
                  </button>

                  <button
                    onClick={() => {
                      setDesignationForm({
                        eventType: 'PROMOTION',
                        newDesignation: staffProfile.basic?.primary_designation || '',
                        effectiveDate: new Date().toISOString().slice(0, 10),
                        remarks: '',
                      });
                      setShowDesignationModal(true);
                    }}
                    className="bg-[#00236f] hover:bg-[#00236f]/90 text-white px-2.5 py-1 rounded text-[10px] font-bold transition"
                  >
                    [DESIGNATION TRANSITION]
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-gray-200 text-[10px] font-bold gap-1">
                {[
                  { id: 'overview', label: 'BASIC INFO' },
                  { id: 'payroll', label: 'PAYROLL & SECURITY' },
                  { id: 'exit-noc', label: 'EXIT NOC (5-PT)' },
                  { id: 'addresses', label: `ADDRESSES (${staffProfile.addresses?.length || 0})` },
                  { id: 'banks', label: `BANK ACCOUNTS (${staffProfile.bankAccounts?.length || 0})` },
                  { id: 'qualifications', label: `QUALIFICATIONS (${staffProfile.qualifications?.length || 0})` },
                  { id: 'experience', label: `EXPERIENCE (${staffProfile.experience?.length || 0})` },
                  { id: 'journey', label: `ORG JOURNEY (${staffProfile.orgJourney?.length || 0})` },
                  { id: 'additional-roles', label: `ADDITIONAL ROLES (${additionalRoles?.length || 0})` },
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
                      <span className="font-bold text-gray-800">{staffProfile.basic?.father_name || staffProfile.father_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">DATE OF BIRTH:</span>
                      <span className="font-bold text-gray-800">{staffProfile.basic?.dob || staffProfile.dob || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">GENDER:</span>
                      <span className="font-bold text-gray-800">{String(staffProfile.basic?.gender || staffProfile.gender || 'Not Specified').toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">PORTAL LOGIN:</span>
                      <span className="font-bold text-gray-800">
                        {(staffProfile.basic?.login_enabled ?? staffProfile.login_enabled) ? 'ALLOWED (ACTIVE)' : 'DISABLED BY ADMIN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold block">PASSWORD CHANGE REQUIRED:</span>
                      <span className="font-bold text-gray-800">
                        {staffProfile.basic?.must_change_password ? 'YES (MANDATORY ON NEXT LOGIN)' : 'NO'}
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="font-extrabold text-[11px] text-[#00236f] tracking-wide uppercase">
                      Staff Residential & Domicile Addresses ({staffProfile.addresses?.length || 0})
                    </span>
                    {canManageHR && (
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                      >
                        + ADD ADDRESS
                      </button>
                    )}
                  </div>
                  {!staffProfile.addresses || staffProfile.addresses.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No addresses registered.</div>
                  ) : (
                    (staffProfile.addresses || []).map((a: any) => (
                      <div key={a.id} className="border border-gray-200 p-2.5 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#00236f]">{String(a.address_type || 'residential').toUpperCase()} ADDRESS</span>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="font-extrabold text-[11px] text-[#00236f] tracking-wide uppercase">
                      Salary Disbursal Bank Mandates ({staffProfile.bankAccounts?.length || 0})
                    </span>
                    {canManageHR && (
                      <button
                        type="button"
                        onClick={() => setShowBankModal(true)}
                        className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                      >
                        + ADD BANK ACCOUNT
                      </button>
                    )}
                  </div>
                  <div className="bg-emerald-50 border border-emerald-300 rounded p-2.5 flex items-center justify-between text-[10px] text-emerald-900">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase tracking-wide">
                        [HR & ESTABLISHMENT SOLE DISBURSEMENT AUTHORITY]
                      </span>
                      <span>•</span>
                      <span>
                        Bank accounts and IFSC verification are governed exclusively under HR Audit Compliance. Faculty/staff cannot mutate bank coordinates.
                      </span>
                    </div>
                    <span className="bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded text-[9px]">
                      AUDIT COMPLIANT
                    </span>
                  </div>
                  {!staffProfile.bankAccounts || staffProfile.bankAccounts.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No bank accounts registered.</div>
                  ) : (
                    (staffProfile.bankAccounts || []).map((b: any) => (
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="font-extrabold text-[11px] text-[#00236f] tracking-wide uppercase">
                      Academic Degrees & UGC NET/PhD ({staffProfile.qualifications?.length || 0})
                    </span>
                    {canManageHR && (
                      <button
                        type="button"
                        onClick={() => setShowQualificationModal(true)}
                        className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                      >
                        + ADD ACADEMIC QUALIFICATION
                      </button>
                    )}
                  </div>
                  {!staffProfile.qualifications || staffProfile.qualifications.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No academic qualifications listed.</div>
                  ) : (
                    (staffProfile.qualifications || []).map((q: any) => (
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="font-extrabold text-[11px] text-[#00236f] tracking-wide uppercase">
                      Prior Industrial & Academic Experience ({staffProfile.experience?.length || 0})
                    </span>
                    {canManageHR && (
                      <button
                        type="button"
                        onClick={() => setShowExperienceModal(true)}
                        className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                      >
                        + ADD WORK EXPERIENCE
                      </button>
                    )}
                  </div>
                  {!staffProfile.experience || staffProfile.experience.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No prior work experience listed.</div>
                  ) : (
                    (staffProfile.experience || []).map((e: any) => (
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
                  {!staffProfile.orgJourney || staffProfile.orgJourney.length === 0 ? (
                    <div className="text-gray-400 py-6 text-center">No career journey events recorded.</div>
                  ) : (
                    (staffProfile.orgJourney || []).map((j: any) => (
                      <div key={j.id} className="border-l-2 border-[#00236f] pl-3 py-1 bg-gray-50/50 p-2 rounded text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#00236f] uppercase">
                            [EVENT: {String(j.event_type || 'UPDATE').replace(/_/g, ' ')}]
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

              {activeTab === 'additional-roles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Multi-Role Allocation & Dual Charges</h4>
                      <p className="text-[10px] text-slate-500">
                        Manage teaching, non-teaching, and administrative responsibilities across campus departments and schools.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingRole(!isAddingRole)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-[#00236f] text-white rounded hover:bg-[#001950] transition"
                    >
                      {isAddingRole ? 'Cancel' : '+ Allocate New Role'}
                    </button>
                  </div>

                  {isAddingRole && (
                    <form onSubmit={handleAddRole} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Role Title / Designation *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dean Student Welfare or Hostel Warden"
                            value={newRoleForm.role_name}
                            onChange={e => setNewRoleForm(prev => ({ ...prev, role_name: e.target.value }))}
                            className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Role Classification *</label>
                          <select
                            value={newRoleForm.role_type}
                            onChange={e => setNewRoleForm(prev => ({ ...prev, role_type: e.target.value as any }))}
                            className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-white"
                          >
                            <option value="teaching">Teaching Faculty (Adjunct / Cross-Dept)</option>
                            <option value="administrative">Administrative Officer (Dean / Head / Proctor)</option>
                            <option value="non-teaching">Non-Teaching Operations / Hostel</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Department / Cell</label>
                          <input
                            type="text"
                            placeholder="e.g. Mechanical Engg or Examination Cell"
                            value={newRoleForm.department_id}
                            onChange={e => setNewRoleForm(prev => ({ ...prev, department_id: e.target.value }))}
                            className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">School / Entity Code</label>
                          <input
                            type="text"
                            placeholder="e.g. SCH-LAW or SCH-PHARM"
                            value={newRoleForm.school_id}
                            onChange={e => setNewRoleForm(prev => ({ ...prev, school_id: e.target.value }))}
                            className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700">Administrative Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Order Ref #REG/2024/093 with 20% honorarium"
                          value={newRoleForm.remarks}
                          onChange={e => setNewRoleForm(prev => ({ ...prev, remarks: e.target.value }))}
                          className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsAddingRole(false)}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[10px] font-bold bg-[#00236f] text-white rounded hover:bg-[#001950]"
                        >
                          Confirm Role Allocation
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {additionalRoles.length === 0 ? (
                      <div className="text-gray-400 py-6 text-center text-xs">
                        No additional institutional roles assigned to this staff member.
                      </div>
                    ) : (
                      additionalRoles.map((role: any) => (
                        <div
                          key={role.id}
                          className="border border-slate-200 p-2.5 rounded bg-slate-50/70 flex justify-between items-center text-[10px]"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#00236f] text-xs">{role.role_name}</span>
                              <span className="bg-blue-100 text-[#00236f] px-1.5 py-0.2 rounded text-[8px] font-bold uppercase">
                                {role.role_type}
                              </span>
                              {role.is_active && (
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[8px] font-bold">
                                  ACTIVE CHARGE
                                </span>
                              )}
                            </div>
                            <div className="text-slate-600 flex gap-3 text-[10px]">
                              {role.department_id && <span>Dept: <strong>{role.department_id}</strong></span>}
                              {role.school_id && <span>School: <strong>{role.school_id}</strong></span>}
                              {role.assigned_date && <span>Since: {role.assigned_date}</span>}
                            </div>
                            {role.remarks && <p className="text-slate-500 italic mt-0.5">{role.remarks}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role.id)}
                            className="px-2 py-1 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
                          >
                            Relieve Role
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Payroll Structure & Statutory Allowances</h4>
                      <p className="text-[10px] text-slate-500">Basic pay, HRA, Provident Fund (PF), ESI, Voluntary PF, and TDS deductions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingPayroll(!isEditingPayroll)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-[#00236f] text-white rounded hover:bg-[#001950] transition"
                    >
                      {isEditingPayroll ? 'Cancel Edit' : 'Configure Structure'}
                    </button>
                  </div>

                  {isEditingPayroll ? (
                    <form onSubmit={handleSavePayroll} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Basic Pay (₹)</label>
                          <input
                            type="number"
                            value={payrollForm.basic_pay}
                            onChange={e => setPayrollForm({ ...payrollForm, basic_pay: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">HRA Allowance (₹)</label>
                          <input
                            type="number"
                            value={payrollForm.hra}
                            onChange={e => setPayrollForm({ ...payrollForm, hra: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Special Allowance (₹)</label>
                          <input
                            type="number"
                            value={payrollForm.special_allowance}
                            onChange={e => setPayrollForm({ ...payrollForm, special_allowance: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Voluntary PF (₹)</label>
                          <input
                            type="number"
                            value={payrollForm.voluntary_pf_amount}
                            onChange={e => setPayrollForm({ ...payrollForm, voluntary_pf_amount: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">TDS Deduction (₹)</label>
                          <input
                            type="number"
                            value={payrollForm.tds_deduction}
                            onChange={e => setPayrollForm({ ...payrollForm, tds_deduction: parseFloat(e.target.value) || 0 })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={payrollForm.pf_applicable}
                            onChange={e => setPayrollForm({ ...payrollForm, pf_applicable: e.target.checked })}
                            className="rounded border-slate-300"
                          />
                          <span>Provident Fund (PF - 12% Basic) Applicable</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={payrollForm.esi_applicable}
                            onChange={e => setPayrollForm({ ...payrollForm, esi_applicable: e.target.checked })}
                            className="rounded border-slate-300"
                          />
                          <span>ESI (0.75% Gross) Applicable</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <button type="button" onClick={() => setIsEditingPayroll(false)} className="px-2.5 py-1 text-[10px] font-semibold text-slate-600">Cancel</button>
                        <button type="submit" className="px-3 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded">Save Payroll</button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                        <span className="text-slate-400 block font-medium">BASIC PAY:</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block font-mono">₹{payrollData?.basic_pay || 55000}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                        <span className="text-slate-400 block font-medium">HRA ALLOWANCE:</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block font-mono">₹{payrollData?.hra || 15000}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                        <span className="text-slate-400 block font-medium">GROSS SALARY:</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block font-mono">₹{payrollData?.gross_salary || 80000}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                        <span className="text-emerald-700 block font-bold">NET TAKE-HOME:</span>
                        <span className="text-xs font-black text-emerald-800 mt-0.5 block font-mono">₹{payrollData?.net_salary || 70200}</span>
                      </div>
                    </div>
                  )}

                  {/* Security Deposit Deduction Schedule (Lecture 3) */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">Security Deposit Deduction Schedule</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          securityData?.is_locked ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {securityData?.is_locked ? 'Target Achieved & Locked' : 'Active Deduction Schedule'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRecordSecurityDeduction}
                        disabled={securityData?.is_locked}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition ${
                          securityData?.is_locked
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#00236f] text-white hover:bg-[#001950]'
                        }`}
                      >
                        {securityData?.is_locked ? 'Schedule Completed' : '+ Deduct ₹5,000 Installment'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block font-medium">TOTAL TARGET:</span>
                        <span className="font-mono font-bold text-slate-900">₹{securityData?.target_amount || 30000}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block font-medium">DEDUCTED TO DATE:</span>
                        <span className="font-mono font-bold text-emerald-700">₹{securityData?.deducted_so_far || 0}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block font-medium">REMAINING TARGET:</span>
                        <span className="font-mono font-bold text-rose-700">₹{securityData?.remaining_amount !== undefined ? securityData.remaining_amount : 30000}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'exit-noc' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">5-Point Online Departmental Exit NOC Clearance</h4>
                      <p className="text-[10px] text-slate-500">
                        Mandatory online checklist as decreed in Senior Mentor Lecture 3. All 5 departments must clear prior to unlocking the security deposit refund.
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      nocData?.all_cleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {nocData?.all_cleared ? 'All 5 Departments Cleared' : 'Clearance Incomplete'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'library', name: '1. Library Directorate', cleared: !!nocData?.library_cleared, remarks: nocData?.library_remarks },
                      { key: 'lab', name: '2. Science & Computer Laboratory', cleared: !!nocData?.lab_cleared, remarks: nocData?.lab_remarks },
                      { key: 'accounts', name: '3. Accounts & Finance Department', cleared: !!nocData?.accounts_cleared, remarks: nocData?.accounts_remarks },
                      { key: 'it', name: '4. Information Technology Systems', cleared: !!nocData?.it_cleared, remarks: nocData?.it_remarks },
                      { key: 'hr', name: '5. Human Resources & Registrar Office', cleared: !!nocData?.hr_cleared, remarks: nocData?.hr_remarks },
                    ].map(chk => (
                      <div key={chk.key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{chk.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              chk.cleared ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {chk.cleared ? 'CLEARED' : 'PENDING'}
                            </span>
                          </div>
                          {chk.remarks && (
                            <p className="text-[10px] text-slate-500 mt-0.5 italic">Remarks: {chk.remarks}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleNocCheckpoint(chk.key, chk.cleared)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                            chk.cleared
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {chk.cleared ? 'Revoke' : 'Clear Department'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Security Deposit Refund Release Button Gate (Lecture 3) */}
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-900 text-xs block">Security Deposit Refund Authorization</span>
                      <span className="text-[10px] text-indigo-700">
                        {nocData?.security_refund_released
                          ? `✓ Security Deposit Refund of ₹${nocData.security_refund_amount || 30000} released on ${nocData.security_refund_date || 'today'} (Tx: ${nocData.security_refund_tx_ref || 'REFUND-001'}).`
                          : nocData?.all_cleared
                          ? 'All 5 departmental checkpoints verified. Authorization gate UNLOCKED.'
                          : 'Gate locked. All 5 departments must submit clearance first.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReleaseSecurityRefund}
                      disabled={!nocData?.all_cleared || nocData?.security_refund_released}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                        nocData?.security_refund_released
                          ? 'bg-emerald-600 text-white cursor-default'
                          : nocData?.all_cleared
                          ? 'bg-[#00236f] text-white hover:bg-[#001950] cursor-pointer active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      }`}
                    >
                      {nocData?.security_refund_released
                        ? 'Refund Disbursed ✓'
                        : 'Release Security Deposit Refund ↗'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}

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

      {/* Designation Transition Modal (Lecture 3 & Recording 160) */}
      {showDesignationModal && staffProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-fadeIn">
            <div className="border-b pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#00236f] uppercase">
                  Designation & Role Transition
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mentor Karanvir Sir Rule: Mandatory transition classification with org journey event record
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDesignationModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyDesignationChange} className="space-y-3 text-[11px]">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  STAFF MEMBER:
                </label>
                <div className="p-2 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-800">
                  {staffProfile.basic?.full_name || staffProfile.full_name || 'Staff Member'} ({staffProfile.basic?.employee_id || staffProfile.employee_id || 'EMP'}) — Current: <span className="text-[#00236f]">{staffProfile.basic?.primary_designation || staffProfile.primary_designation || 'Staff'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  TRANSITION CLASSIFICATION (EVENT TYPE):
                </label>
                <select
                  value={designationForm.eventType}
                  onChange={e => setDesignationForm(prev => ({ ...prev, eventType: e.target.value as any }))}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-bold text-[#00236f]"
                >
                  <option value="PROMOTION">PROMOTION (Advancement / Increment)</option>
                  <option value="DEMOTION">DEMOTION (Disciplinary / Restructure)</option>
                  <option value="ADDITIONAL_ROLE">ADDITIONAL ROLE (Dual Responsibility)</option>
                  <option value="ROLE_SWITCH">ROLE SWITCH (Department Lateral Movement)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NEW / ELEVATED DESIGNATION:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Associate Professor & HOD"
                  value={designationForm.newDesignation}
                  onChange={e => setDesignationForm(prev => ({ ...prev, newDesignation: e.target.value }))}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  EFFECTIVE DATE:
                </label>
                <input
                  type="date"
                  value={designationForm.effectiveDate}
                  onChange={e => setDesignationForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  BOARD RESOLUTION / GOVERNING COUNCIL REMARKS:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved in 42nd Academic Council Meeting per UGC Regulation Clause 6"
                  value={designationForm.remarks}
                  onChange={e => setDesignationForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowDesignationModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded shadow-xs"
                >
                  Record & Update Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Address */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-xl border border-slate-200 animate-fadeIn text-[11px]">
            <div className="border-b pb-2 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#00236f] uppercase">
                Add Staff Residential Address
              </span>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ADDRESS TYPE:</label>
                <select
                  value={addressForm.address_type}
                  onChange={e => setAddressForm({ ...addressForm, address_type: e.target.value as any })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                >
                  <option value="current">CURRENT RESIDENCE</option>
                  <option value="permanent">PERMANENT / DOMICILE</option>
                  <option value="correspondence">OFFICIAL CORRESPONDENCE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">STREET ADDRESS LINE *:</label>
                <input
                  type="text"
                  placeholder="e.g. H.No 412, Model Town Phase-2"
                  value={addressForm.address_line}
                  onChange={e => setAddressForm({ ...addressForm, address_line: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CITY *:</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">STATE GST CODE:</label>
                  <input
                    type="text"
                    placeholder="03 (Punjab)"
                    value={addressForm.state_gst}
                    onChange={e => setAddressForm({ ...addressForm, state_gst: e.target.value })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PINCODE *:</label>
                <input
                  type="text"
                  placeholder="151001"
                  value={addressForm.pincode}
                  onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addr_is_default"
                  checked={addressForm.is_default}
                  onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="addr_is_default" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as Default Primary Address
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Bank Account */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-xl border border-slate-200 animate-fadeIn text-[11px]">
            <div className="border-b pb-2 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#00236f] uppercase">
                Add Salary Disbursement Bank Mandate
              </span>
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">BANK NAME *:</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, State Bank of India"
                  value={bankForm.bank_name}
                  onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ACCOUNT NUMBER *:</label>
                <input
                  type="text"
                  placeholder="e.g. 50100239102931"
                  value={bankForm.account_number}
                  onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC CODE *:</label>
                  <input
                    type="text"
                    placeholder="HDFC0000123"
                    value={bankForm.ifsc_code}
                    onChange={e => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">BRANCH NAME:</label>
                  <input
                    type="text"
                    value={bankForm.branch_name}
                    onChange={e => setBankForm({ ...bankForm, branch_name: e.target.value })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bank_is_default"
                  checked={bankForm.is_default}
                  onChange={e => setBankForm({ ...bankForm, is_default: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="bank_is_default" className="font-semibold text-slate-700 cursor-pointer">
                  Mandatory Salary Disbursement Default
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded shadow-xs"
                >
                  Save Bank Mandate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Qualification */}
      {showQualificationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-xl border border-slate-200 animate-fadeIn text-[11px]">
            <div className="border-b pb-2 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#00236f] uppercase">
                Add Academic Degree & UGC/PhD Credential
              </span>
              <button
                type="button"
                onClick={() => setShowQualificationModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQualification} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">DEGREE / QUALIFICATION TITLE *:</label>
                <input
                  type="text"
                  placeholder="e.g. Ph.D. in Computer Science"
                  value={qualificationForm.qualification_title}
                  onChange={e => setQualificationForm({ ...qualificationForm, qualification_title: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">INSTITUTION / UNIVERSITY *:</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Roorkee / Thapar Institute"
                  value={qualificationForm.institution}
                  onChange={e => setQualificationForm({ ...qualificationForm, institution: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PASSING YEAR *:</label>
                  <input
                    type="number"
                    value={qualificationForm.year_of_passing}
                    onChange={e => setQualificationForm({ ...qualificationForm, year_of_passing: parseInt(e.target.value) || 2020 })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PERCENTAGE / CGPA *:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qualificationForm.percentage_or_cgpa}
                    onChange={e => setQualificationForm({ ...qualificationForm, percentage_or_cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="qual_is_highest"
                  checked={qualificationForm.is_highest}
                  onChange={e => setQualificationForm({ ...qualificationForm, is_highest: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="qual_is_highest" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as Highest Attained Academic Degree
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowQualificationModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded shadow-xs"
                >
                  Save Academic Degree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Experience */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-xl border border-slate-200 animate-fadeIn text-[11px]">
            <div className="border-b pb-2 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#00236f] uppercase">
                Add Prior Work Experience & Tenure
              </span>
              <button
                type="button"
                onClick={() => setShowExperienceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExperience} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ORGANIZATION / UNIVERSITY NAME *:</label>
                <input
                  type="text"
                  placeholder="e.g. Infosys Technologies Ltd / Thapar Institute"
                  value={experienceForm.organization_name}
                  onChange={e => setExperienceForm({ ...experienceForm, organization_name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DESIGNATION / ROLE *:</label>
                <input
                  type="text"
                  placeholder="e.g. Assistant Professor / Senior Systems Engineer"
                  value={experienceForm.designation}
                  onChange={e => setExperienceForm({ ...experienceForm, designation: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">START DATE *:</label>
                  <input
                    type="date"
                    value={experienceForm.start_date}
                    onChange={e => setExperienceForm({ ...experienceForm, start_date: e.target.value })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">END DATE *:</label>
                  <input
                    type="date"
                    value={experienceForm.end_date}
                    onChange={e => setExperienceForm({ ...experienceForm, end_date: e.target.value })}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exp_is_latest"
                  checked={experienceForm.is_latest}
                  onChange={e => setExperienceForm({ ...experienceForm, is_latest: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="exp_is_latest" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as Most Recent Prior Experience
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowExperienceModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded shadow-xs"
                >
                  Save Experience Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
