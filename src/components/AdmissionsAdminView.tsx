import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StudentProfile, User } from '../types';
import { AdmissionFormView } from './AdmissionFormView';

interface AdmissionsAdminViewProps {
  currentUser?: User | null;
  onSelectStudent?: (student: StudentProfile) => void;
}

export const AdmissionsAdminView: React.FC<AdmissionsAdminViewProps> = ({
  currentUser,
  onSelectStudent,
}) => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showManualIntake, setShowManualIntake] = useState(false);

  // Direct Indian College Admission Intake Modal
  const [isDirectAdmitOpen, setIsDirectAdmitOpen] = useState(false);
  const [directForm, setDirectForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'male' as const,
    dob: '2005-05-12',
    guardianName: '',
    guardianRelation: 'parent' as const,
    guardianPhone: '',
    courseId: 'crs-btech-cs',
    sessionId: 'sess-2025-26',
    currentSemester: 1,
    admissionYear: 2025,
    category: 'General' as const,
    quota: 'punjab_85' as const,
    tenthPercentage: '88.5',
    twelfthPercentage: '86.2',
    boardName: 'PSEB (Punjab School Education Board)',
    residentialMode: 'self_commute' as 'self_commute' | 'hosteller' | 'bus_commuter',
    hostelRoomNo: 'BH-1 Room 204',
    transportRoute: 'Route 3 - Mohali / Kharar Bypass',
  });
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Admission & Credentials Slip Modal
  const [credentialsSlip, setCredentialsSlip] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadAdmissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdmissions();
      if (res.success && res.admissions) {
        setAdmissions(res.admissions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoadingId(id);
    try {
      const res = await api.updateAdmissionStatus(id, status);
      if (res.success) {
        setStatusMessage(`Application has been marked as '${status.toUpperCase()}'.`);
        setTimeout(() => setStatusMessage(null), 4000);
        loadAdmissions();
        if (status === 'approved' && res.credentialsSlip) {
          setCredentialsSlip(res.credentialsSlip);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDirectAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError(null);

    if (!directForm.firstName.trim() || !directForm.lastName.trim()) {
      setDirectError('Student first and last names are mandatory.');
      return;
    }
    if (!directForm.email.trim() || !directForm.phone.trim()) {
      setDirectError('Valid student email and phone number are required.');
      return;
    }
    if (!directForm.guardianName.trim()) {
      setDirectError('Father / Guardian name is mandatory.');
      return;
    }

    const isHosteller = directForm.residentialMode === 'hosteller';
    const isTransportUser = directForm.residentialMode === 'bus_commuter';

    setDirectSubmitting(true);
    try {
      const payload = {
        firstName: directForm.firstName.trim(),
        lastName: directForm.lastName.trim(),
        email: directForm.email.trim(),
        phone: directForm.phone.trim(),
        gender: directForm.gender,
        dob: directForm.dob,
        guardianName: directForm.guardianName.trim(),
        guardianRelation: directForm.guardianRelation,
        guardianPhone: directForm.guardianPhone.trim() || directForm.phone.trim(),
        courseId: directForm.courseId,
        sessionId: directForm.sessionId,
        currentSemester: Number(directForm.currentSemester),
        admissionYear: Number(directForm.admissionYear),
        category: directForm.category,
        quota: directForm.quota,
        tenthPercentage: Number(directForm.tenthPercentage) || undefined,
        twelfthPercentage: Number(directForm.twelfthPercentage) || undefined,
        boardName: directForm.boardName,
        isHosteller,
        isTransportUser,
        hostelRoomNo: isHosteller ? directForm.hostelRoomNo : undefined,
        transportRoute: isTransportUser ? directForm.transportRoute : undefined,
      };

      const res = await api.adminAdmitStudent(payload);
      if (res.success) {
        setIsDirectAdmitOpen(false);
        loadAdmissions();
        setCredentialsSlip(res.credentialsSlip);
      } else {
        setDirectError(res.error || 'Failed to admit student');
      }
    } catch (err: any) {
      setDirectError(err.message || 'Error communicating with server');
    } finally {
      setDirectSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredAdmissions = admissions.filter(a => {
    if (activeTab === 'all') return true;
    return a.admission_status === activeTab;
  });

  const totalCount = admissions.length;
  const submittedCount = admissions.filter(a => a.admission_status === 'submitted' || a.admission_status === 'pending').length;
  const approvedCount = admissions.filter(a => a.admission_status === 'approved').length;
  const rejectedCount = admissions.filter(a => a.admission_status === 'rejected').length;

  if (showManualIntake) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-white border-b border-[#e1e3e4] flex items-center justify-between">
          <button
            onClick={() => setShowManualIntake(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#00236f] hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Admissions Adjudication Roster</span>
          </button>
        </div>
        <AdmissionFormView
          onApplicationSubmitted={() => {
            setShowManualIntake(false);
            loadAdmissions();
          }}
        />
      </div>
    );
  }

  return (
    <div id="admissions-admin-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[26px]">how_to_reg</span>
            <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
              Admissions & Enrollment Governance
            </h2>
          </div>
          <p className="text-sm text-[#444651] mt-1">
            Punjab & Indian college intake workflow: enforce domicile quota, verify academic marksheets, and generate login credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setIsDirectAdmitOpen(true)}
              className="px-4 py-2 bg-[#006a61] hover:bg-[#004f48] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Direct College Admission</span>
            </button>
          )}
          <button
            onClick={() => setShowManualIntake(true)}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Applicant Portal Form</span>
          </button>
          <button
            onClick={loadAdmissions}
            className="p-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-[#444651]"
            title="Refresh Admissions Roster"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#757682]">Total Applications</span>
          <h4 className="text-2xl font-black text-[#191c1d] mt-1">{totalCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Academic Session 2025-26</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#b45309]">Pending Verification</span>
          <h4 className="text-2xl font-black text-[#b45309] mt-1">{submittedCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Awaiting committee review</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#006a61]">Approved Enrollments</span>
          <h4 className="text-2xl font-black text-[#006a61] mt-1">{approvedCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Accounts & Ledgers active</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#ba1a1a]">Rejected Applications</span>
          <h4 className="text-2xl font-black text-[#ba1a1a] mt-1">{rejectedCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Eligibility unverified</p>
        </div>
      </div>

      {/* Tab Filter Bar */}
      <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-3">
        <div className="flex items-center gap-2">
          {(['submitted', 'approved', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-white text-[#444651] border border-[#e1e3e4] hover:bg-[#f8f9fa]'
              }`}
            >
              {tab === 'submitted' ? 'Pending Verification' : tab} (
              {tab === 'all'
                ? totalCount
                : tab === 'submitted'
                ? submittedCount
                : tab === 'approved'
                ? approvedCount
                : rejectedCount}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#757682]">Loading applicant records...</div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#757682]">
            No applications found under the '{activeTab}' category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Roll ID</th>
                  <th className="py-3 px-4">Applied Course</th>
                  <th className="py-3 px-4">Quota & Category</th>
                  <th className="py-3 px-4">Residential Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Committee Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {filteredAdmissions.map(adm => {
                  const isSubmitted = adm.admission_status === 'submitted' || adm.admission_status === 'pending';
                  const isApproved = adm.admission_status === 'approved';
                  const isRejected = adm.admission_status === 'rejected';

                  return (
                    <tr key={adm.id} className="hover:bg-[#f8f9fa]">
                      <td className="py-3.5 px-4 font-bold text-[#191c1d]">
                        <div>{adm.first_name} {adm.last_name}</div>
                        <div className="text-[10px] text-[#757682] font-normal">{adm.email} • {adm.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#00236f] font-semibold">
                        {adm.student_id}
                      </td>
                      <td className="py-3.5 px-4 text-[#444651]">
                        <div>{adm.course?.name || adm.course?.code || adm.course_id}</div>
                        <div className="text-[10px] text-[#757682]">Sem {adm.current_semester || 1} • {adm.session?.name || '2025-26'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#191c1d]">
                            {adm.quota === 'punjab_85' ? 'Punjab State (85%)' : (adm.quota === 'other_state_15' ? 'Other State (15%)' : 'Management Quota')}
                          </span>
                          <span className="text-[10px] text-[#757682]">{adm.category || 'General'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {adm.is_hosteller ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            <span className="material-symbols-outlined text-[13px]">hotel</span>
                            <span>Hosteller ({adm.hostel_room_no || 'Room Allotted'})</span>
                          </span>
                        ) : adm.is_transport_user ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            <span className="material-symbols-outlined text-[13px]">directions_bus</span>
                            <span>Bus Commuter</span>
                          </span>
                        ) : (
                          <span className="text-[#757682] text-[11px]">Day Scholar (Self)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isApproved
                              ? 'bg-[#86f2e4]/40 text-[#006a61]'
                              : isRejected
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}
                        >
                          {adm.admission_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSubmitted ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={actionLoadingId === adm.id}
                              onClick={() => handleStatusUpdate(adm.id, 'approved')}
                              className="px-3 py-1 bg-[#006a61] hover:bg-[#004f48] text-white rounded-md text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Admit & Provision User</span>
                            </button>
                            <button
                              disabled={actionLoadingId === adm.id}
                              onClick={() => handleStatusUpdate(adm.id, 'rejected')}
                              className="px-2.5 py-1 border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-md text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#757682]">
                            {isApproved ? 'Enrolled & Verified' : 'Application Voided'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Direct Indian College Admission Intake */}
      {isDirectAdmitOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[24px] text-amber-300">how_to_reg</span>
                <div>
                  <h3 className="text-base font-bold">Direct Institutional Admission Intake</h3>
                  <p className="text-[11px] text-blue-100">Affiliated to Punjab Technical University (PTU) / State Regulatory Board</p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectAdmitOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleDirectAdmitSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {directError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{directError}</span>
                </div>
              )}

              {/* 1. Candidate Personal Details */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#00236f] border-b border-[#e1e3e4] pb-1 mb-3">
                  1. Candidate Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gurpreet"
                      value={directForm.firstName}
                      onChange={e => setDirectForm({ ...directForm, firstName: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Singh"
                      value={directForm.lastName}
                      onChange={e => setDirectForm({ ...directForm, lastName: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Gender *</label>
                    <select
                      value={directForm.gender}
                      onChange={e => setDirectForm({ ...directForm, gender: e.target.value as any })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs font-semibold"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="nonbinary">Non-binary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="gurpreet.singh@gmail.com"
                      value={directForm.email}
                      onChange={e => setDirectForm({ ...directForm, email: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={directForm.phone}
                      onChange={e => setDirectForm({ ...directForm, phone: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={directForm.dob}
                      onChange={e => setDirectForm({ ...directForm, dob: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Father / Guardian Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Harbhajan Singh"
                      value={directForm.guardianName}
                      onChange={e => setDirectForm({ ...directForm, guardianName: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={directForm.guardianPhone}
                      onChange={e => setDirectForm({ ...directForm, guardianPhone: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Program, Quota & Domicile */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#00236f] border-b border-[#e1e3e4] pb-1 mb-3">
                  2. Academic Program, Domicile Quota & Reservation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Degree Program *</label>
                    <select
                      value={directForm.courseId}
                      onChange={e => setDirectForm({ ...directForm, courseId: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs font-semibold"
                    >
                      <option value="crs-btech-cs">B.Tech Computer Science & Engg</option>
                      <option value="crs-btech-me">B.Tech Mechanical Engineering</option>
                      <option value="crs-mba-fin">MBA Financial Management</option>
                      <option value="crs-bsc-phy">B.Sc Applied Physics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Admission Quota *</label>
                    <select
                      value={directForm.quota}
                      onChange={e => setDirectForm({ ...directForm, quota: e.target.value as any })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs font-semibold"
                    >
                      <option value="punjab_85">Punjab State Domicile (85% Quota)</option>
                      <option value="other_state_15">Other States / All India (15% Quota)</option>
                      <option value="management">Management / NRI Quota</option>
                      <option value="sports">State Sports Quota</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Category *</label>
                    <select
                      value={directForm.category}
                      onChange={e => setDirectForm({ ...directForm, category: e.target.value as any })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs font-semibold"
                    >
                      <option value="General">General / Open</option>
                      <option value="SC/ST">SC / ST (Punjab Welfare)</option>
                      <option value="OBC">OBC / Backward Classes</option>
                      <option value="EWS">Economically Weaker Section (EWS)</option>
                      <option value="Sports">Sports Merit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">10th Matriculation %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={directForm.tenthPercentage}
                      onChange={e => setDirectForm({ ...directForm, tenthPercentage: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">12th Intermediate %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={directForm.twelfthPercentage}
                      onChange={e => setDirectForm({ ...directForm, twelfthPercentage: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#444651] mb-1">Board of Examination</label>
                    <input
                      type="text"
                      value={directForm.boardName}
                      onChange={e => setDirectForm({ ...directForm, boardName: e.target.value })}
                      className="w-full p-2 border border-[#c5c5d3] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Strict Indian College Residential Choice (Mutually Exclusive) */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#00236f] border-b border-[#e1e3e4] pb-1 mb-1">
                  3. Residential Accommodation & Commute Selection
                </h4>
                <p className="text-[11px] text-[#757682] mb-3">
                  <strong>Regulatory Mandate:</strong> Hostel and Transport are strictly mutually exclusive. Campus residents cannot have bus fees assigned.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: Day Scholar Self */}
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      directForm.residentialMode === 'self_commute'
                        ? 'border-[#00236f] bg-[#dce1ff]/30 ring-1 ring-[#00236f]'
                        : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="residentialMode"
                        checked={directForm.residentialMode === 'self_commute'}
                        onChange={() => setDirectForm({ ...directForm, residentialMode: 'self_commute' })}
                      />
                      <span className="font-bold text-[#191c1d]">Day Scholar</span>
                    </div>
                    <p className="text-[11px] text-[#757682] mt-1.5 pl-5">
                      Self-commuter (Own vehicle / walk). Zero hostel or transport surcharge.
                    </p>
                  </label>

                  {/* Option 2: Hosteller */}
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      directForm.residentialMode === 'hosteller'
                        ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                        : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="residentialMode"
                        checked={directForm.residentialMode === 'hosteller'}
                        onChange={() => setDirectForm({ ...directForm, residentialMode: 'hosteller' })}
                      />
                      <span className="font-bold text-purple-950">Campus Hosteller</span>
                    </div>
                    <p className="text-[11px] text-purple-800 mt-1.5 pl-5">
                      Resides on campus with mess meal board (+₹38,000/sem). No bus fee.
                    </p>
                  </label>

                  {/* Option 3: Bus Commuter */}
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      directForm.residentialMode === 'bus_commuter'
                        ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-600'
                        : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="residentialMode"
                        checked={directForm.residentialMode === 'bus_commuter'}
                        onChange={() => setDirectForm({ ...directForm, residentialMode: 'bus_commuter' })}
                      />
                      <span className="font-bold text-sky-950">College Bus Transit</span>
                    </div>
                    <p className="text-[11px] text-sky-800 mt-1.5 pl-5">
                      Dedicated transit fleet commuter (+₹14,000/sem). Day scholar only.
                    </p>
                  </label>
                </div>

                {/* Dynamic Sub-Fields based on selection */}
                {directForm.residentialMode === 'hosteller' && (
                  <div className="mt-3 p-3 bg-purple-50/60 border border-purple-200 rounded-xl animate-fadeIn">
                    <label className="block font-bold text-purple-950 mb-1">Hostel Block & Room Preference *</label>
                    <input
                      type="text"
                      placeholder="e.g. Boys Hostel 1 (BH-1) Room 204"
                      value={directForm.hostelRoomNo}
                      onChange={e => setDirectForm({ ...directForm, hostelRoomNo: e.target.value })}
                      className="w-full p-2 border border-purple-300 rounded-lg text-xs"
                    />
                  </div>
                )}

                {directForm.residentialMode === 'bus_commuter' && (
                  <div className="mt-3 p-3 bg-sky-50/60 border border-sky-200 rounded-xl animate-fadeIn">
                    <label className="block font-bold text-sky-950 mb-1">Bus Route & Pick-up Stop *</label>
                    <select
                      value={directForm.transportRoute}
                      onChange={e => setDirectForm({ ...directForm, transportRoute: e.target.value })}
                      className="w-full p-2 border border-sky-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Route 1 - Phase 7 Mohali / Sohana">Route 1 - Phase 7 Mohali / Sohana</option>
                      <option value="Route 2 - Patiala Bus Stand / Rajpura">Route 2 - Patiala Bus Stand / Rajpura</option>
                      <option value="Route 3 - Kharar Bypass / Kurali">Route 3 - Kharar Bypass / Kurali</option>
                      <option value="Route 4 - Chandigarh Sector 43 ISBT">Route 4 - Chandigarh Sector 43 ISBT</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Fee Breakdown Preview */}
              <div className="p-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-[#191c1d]">
                  <span>Itemized Statutory Indian College Fee Structure:</span>
                  <span className="text-[#006a61]">
                    Total Initial Dues: ₹ {
                      (90000 + 5500 + 5000 + (directForm.residentialMode === 'hosteller' ? 38000 : directForm.residentialMode === 'bus_commuter' ? 14000 : 0)).toLocaleString('en-IN')
                    }
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-[#444651]">
                  <div className="p-2 bg-white rounded border border-[#e1e3e4]">
                    <span className="block text-[#757682]">Tuition Fee:</span>
                    <strong>₹ 90,000</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#e1e3e4]">
                    <span className="block text-[#757682]">Univ. Charges & Exam:</span>
                    <strong>₹ 5,500</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#e1e3e4]">
                    <span className="block text-[#757682]">Caution Security (Ref.):</span>
                    <strong>₹ 5,000</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#e1e3e4]">
                    <span className="block text-[#757682]">Residential / Transit:</span>
                    <strong className="text-[#00236f]">
                      {directForm.residentialMode === 'hosteller' ? '₹ 38,000 (Hostel)' : directForm.residentialMode === 'bus_commuter' ? '₹ 14,000 (Bus)' : '₹ 0 (Day Scholar)'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f3f4f5]">
                <button
                  type="button"
                  onClick={() => setIsDirectAdmitOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={directSubmitting}
                  className="px-6 py-2.5 bg-[#006a61] hover:bg-[#004f48] text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>{directSubmitting ? 'Enrolling & Generating...' : 'Confirm Admission & Provision Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Admission & Temporary Credentials Slip */}
      {credentialsSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Printable Slip Header */}
            <div className="p-6 bg-[#00236f] text-white text-center space-y-1">
              <div className="inline-block p-2 bg-white/10 rounded-full mb-1">
                <span className="material-symbols-outlined text-[32px] text-amber-300">verified</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight">EduCore Institute of Higher Education</h3>
              <p className="text-xs text-blue-100">Affiliated to State Technical University • Admission Session 2025-26</p>
              <div className="pt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-[11px] font-mono tracking-wider font-bold">
                  PROVISIONAL ADMISSION & STUDENT PORTAL CREDENTIALS
                </span>
              </div>
            </div>

            {/* Slip Details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
                <div>
                  <span className="text-[#757682] block text-[11px]">Student Roll Number / ID:</span>
                  <strong className="text-[#00236f] text-sm font-mono">{credentialsSlip.studentId}</strong>
                </div>
                <div>
                  <span className="text-[#757682] block text-[11px]">Candidate Full Name:</span>
                  <strong className="text-[#191c1d] text-sm">{credentialsSlip.fullName}</strong>
                </div>
                <div>
                  <span className="text-[#757682] block text-[11px]">Enrolled Course:</span>
                  <span className="font-semibold text-[#191c1d]">{credentialsSlip.course || 'B.Tech CS'}</span>
                </div>
                <div>
                  <span className="text-[#757682] block text-[11px]">Residential Status:</span>
                  <span className="font-semibold text-[#006a61]">{credentialsSlip.residentialStatus || 'Day Scholar'}</span>
                </div>
              </div>

              {/* Portal Login Credentials Box */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>Student Portal Login Credentials (Handover to Student)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#757682] block">Username:</span>
                      <strong className="font-mono text-[#00236f] text-xs">{credentialsSlip.username}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentialsSlip.username, 'usr')}
                      className="text-[#757682] hover:text-[#00236f]"
                      title="Copy Username"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedKey === 'usr' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#757682] block">Temporary Password:</span>
                      <strong className="font-mono text-red-700 text-xs">{credentialsSlip.tempPassword}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentialsSlip.tempPassword, 'pwd')}
                      className="text-[#757682] hover:text-red-700"
                      title="Copy Password"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedKey === 'pwd' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-amber-800 italic">
                  Note: The student should navigate to the EduCore ERP portal and sign in with these credentials.
                </p>
              </div>

              {/* Fee Breakdown */}
              {credentialsSlip.feeBreakdown && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-[#191c1d] block">Assigned Initial Fees:</span>
                  <div className="border border-[#e1e3e4] rounded-lg divide-y divide-[#f3f4f5] text-[11px]">
                    {credentialsSlip.feeBreakdown.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1.5 px-3">
                        <span className="text-[#444651]">{f.title}</span>
                        <strong className="text-[#191c1d]">₹ {f.amount.toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 px-3 bg-[#f8f9fa] font-bold">
                      <span>Total Initial Due Amount:</span>
                      <span className="text-[#006a61]">₹ {credentialsSlip.totalInitialDue?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f5]">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-[#444651]"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setCredentialsSlip(null)}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Dismiss / Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
