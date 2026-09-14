import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StudentProfile } from '../types';
import { AdmissionFormView } from './AdmissionFormView';

interface AdmissionsAdminViewProps {
  onSelectStudent?: (student: StudentProfile) => void;
}

export const AdmissionsAdminView: React.FC<AdmissionsAdminViewProps> = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showManualIntake, setShowManualIntake] = useState(false);

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
        setStatusMessage(`Candidate application has been marked as '${status.toUpperCase()}'.`);
        setTimeout(() => setStatusMessage(null), 4000);
        loadAdmissions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
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
          <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
            Admissions & Enrollment Governance
          </h2>
          <p className="text-sm text-[#444651] mt-1">
            Review applicant credentials, verify merit criteria, and approve freshman enrollments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualIntake(true)}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Manual Intake Form</span>
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
        <div className="p-3.5 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2">
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
          <p className="text-[11px] text-[#757682] mt-0.5">Ledgers initialized</p>
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
              {tab === 'submitted' ? 'Pending Queue' : tab} (
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
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Merit / Academic</th>
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
                        {adm.first_name} {adm.last_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#00236f] font-semibold">
                        {adm.student_id}
                      </td>
                      <td className="py-3.5 px-4 text-[#444651]">
                        {adm.course?.name || adm.course?.code || adm.course_id}
                      </td>
                      <td className="py-3.5 px-4 text-[#757682]">
                        <div>{adm.email}</div>
                        <div className="text-[10px]">{adm.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-[#dce1ff] text-[#00236f] rounded text-[10px] font-bold">
                          Attendance: {adm.attendance_percentage}%
                        </span>
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
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {isSubmitted && (
                          <>
                            <button
                              disabled={actionLoadingId === adm.id}
                              onClick={() => handleStatusUpdate(adm.id, 'approved')}
                              className="px-3 py-1 bg-[#006a61] hover:bg-[#005a52] text-white rounded text-xs font-bold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoadingId === adm.id}
                              onClick={() => handleStatusUpdate(adm.id, 'rejected')}
                              className="px-2.5 py-1 bg-[#ffdad6] hover:bg-[#ffdad6]/80 text-[#ba1a1a] rounded text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isApproved && (
                          <span className="text-[11px] text-[#006a61] font-semibold flex items-center justify-end gap-1">
                            <span className="material-symbols-outlined text-[14px]">check</span> Enrolled
                          </span>
                        )}
                        {isRejected && (
                          <button
                            disabled={actionLoadingId === adm.id}
                            onClick={() => handleStatusUpdate(adm.id, 'approved')}
                            className="px-2 py-0.5 border border-[#e1e3e4] text-[10px] rounded hover:bg-[#f8f9fa] text-[#444651]"
                          >
                            Reconsider
                          </button>
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
    </div>
  );
};
