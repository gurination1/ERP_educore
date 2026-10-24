import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { StudentProfile, User } from '../types';
import { normalizeToCanonicalUID } from '../utils/uid';
import { X, ArrowLeft, Check, CheckCircle2, GraduationCap } from 'lucide-react';

interface StudentProfileModalProps {
  student: StudentProfile;
  currentUser?: User | null;
  onStudentUpdated?: () => void;
  onClose: () => void;
  onPayFee: (studentId: string) => void;
  onOpenAdmitCard?: (studentId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  currentUser,
  onStudentUpdated,
  onClose,
  onPayFee,
  onOpenAdmitCard,
}) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);
  const [studentDocs, setStudentDocs] = useState<any[]>([]);

  useEffect(() => {
    api.getStudentProfile(student.id).then(res => {
      if (res.success) {
        setProfileData(res.student);
      }
      setIsLoading(false);
    });

    api.getDocuments({ owner_id: student.id })
      .then(res => {
        if (res.success && res.documents) {
          setStudentDocs(res.documents);
        }
      })
      .catch(err => console.error('Error fetching student documents:', err));
  }, [student.id]);

  const fullName = `${student.first_name} ${student.last_name}`;

  const handlePromote = async () => {
    const currentSem = profileData?.current_semester || student.current_semester;
    if (currentSem >= 8) {
      alert('Student is already in Semester 8 (final degree semester).');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to promote ${fullName} to Semester ${currentSem + 1}?\n\nThis will reset attendance tracking and assess new semester tuition fees.`
    );
    if (!confirmed) return;

    setIsPromoting(true);
    setPromoteMsg(null);
    try {
      const res = await api.promoteStudent(student.id);
      if (res.success) {
        setPromoteMsg(res.message);
        const freshRes = await api.getStudentProfile(student.id);
        if (freshRes.success) setProfileData(freshRes.student);
        if (onStudentUpdated) onStudentUpdated();
      } else {
        alert(res.error || 'Failed to promote student.');
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with server.');
    } finally {
      setIsPromoting(false);
    }
  };

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isStudentActive = String(profileData?.status || student?.status || 'active').toLowerCase() === 'active';

  const handleToggleStudentStatus = async () => {
    const actionName = isStudentActive ? 'Suspend' : 'Reactivate';
    const reason = window.prompt(
      `Enter administrative reason for student account ${actionName}:`,
      isStudentActive ? 'Administrative disciplinary hold' : 'Account reinstated by Administrator'
    );
    if (!reason) return;

    setIsTogglingStatus(true);
    setStatusMsg(null);
    try {
      const newStatus = isStudentActive ? 'suspended' : 'active';
      const res = await api.updateStudentStatus(student.id, newStatus, reason.trim());
      if (res.success) {
        setStatusMsg(res.message);
        const freshRes = await api.getStudentProfile(student.id);
        if (freshRes.success) setProfileData(freshRes.student);
        if (onStudentUpdated) onStudentUpdated();
      } else {
        alert(res.error || `Failed to ${actionName.toLowerCase()} student account.`);
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with server.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleVerifyDoc = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      const res = await api.verifyDocument(docId, {
        status,
        verified_by: currentUser?.full_name || 'Verification Authority',
        remarks: status === 'verified' ? 'Verified in student profile dossier' : 'Rejected in student profile dossier',
      });
      if (res.success && res.document) {
        setStudentDocs(prev => prev.map(d => d.id === docId ? res.document : d));
        const fresh = await api.getStudentProfile(student.id);
        if (fresh.success) setProfileData(fresh.student);
        if (onStudentUpdated) onStudentUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update document compliance status.');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border-2 border-[#00236f]/30 p-6 sm:p-8 animate-fadeIn my-4 space-y-5">
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00236f] text-white flex items-center justify-center font-bold text-base">
              {student.first_name[0]}
              {student.last_name[0]}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[#00236f] text-[10px] font-black uppercase tracking-wide border border-blue-200 mb-1">
                <span>Scholar Dossier</span>
                <span>•</span>
                <span>Zero-Popup Canvas View</span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#191c1d]">{fullName}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isStudentActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isStudentActive ? '● ACTIVE' : '● SUSPENDED'}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#00236f] font-mono">
                UID: {normalizeToCanonicalUID((student as any).enterprise_uid || student.student_id, 'student')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200/80"
              title="Return to Student Master Directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#757682] hover:bg-[#edeeef] cursor-pointer border border-transparent hover:border-slate-200"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-xs text-[#757682]">Loading student records...</p>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Student Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#f8f9fa] rounded-xl border border-[#edeeef]">
              <div>
                <span className="text-xs uppercase font-bold text-[#757682] block">
                  Course
                </span>
                <span className="font-bold text-[#191c1d] mt-0.5 block text-xs">
                  {student.course?.name || student.course?.code || 'B.Tech'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#757682] block">
                  Current Semester
                </span>
                <span className="font-bold text-[#191c1d] mt-0.5 block text-xs">
                  Semester {student.current_semester}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#757682] block">
                  Session
                </span>
                <span className="font-bold text-[#191c1d] mt-0.5 block text-xs">
                  {student.session?.name || '2025-26'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#757682] block">
                  Email
                </span>
                <span className="font-medium text-[#191c1d] mt-0.5 block truncate text-xs">
                  {student.email}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#757682] block">
                  Phone
                </span>
                <span className="font-medium text-[#191c1d] mt-0.5 block text-xs">{student.phone}</span>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#757682] block">
                  Fees Status
                </span>
                <span
                  className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    student.fees_status === 'paid'
                      ? 'bg-[#ffedd5] text-[#00236f]'
                      : student.fees_status === 'due'
                      ? 'bg-[#fef3c7] text-[#b45309]'
                      : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}
                >
                  {student.fees_status}
                </span>
              </div>
            </div>

            {/* Guardian Info */}
            <div className="p-3 bg-[#ffffff] rounded-lg border border-[#e1e3e4]">
              <span className="font-bold text-[#191c1d] block mb-1 text-xs">Guardian Contact:</span>
              <p className="text-[#444651] text-xs">
                {student.guardian_name} ({student.guardian_relation}) • {student.guardian_phone}
              </p>
            </div>

            {/* Document Compliance Vault & Verification */}
            <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#e1e3e4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191c1d] block text-xs uppercase tracking-wider text-[#757682]">
                  Regulatory Document Compliance ({studentDocs.length} Deposited)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  (profileData?.tenth_doc_verified && profileData?.twelfth_doc_verified && profileData?.aadhaar_doc_verified)
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {(profileData?.tenth_doc_verified && profileData?.twelfth_doc_verified && profileData?.aadhaar_doc_verified)
                    ? '✓ Fully Attested'
                    : '⚠ Verification Incomplete'}
                </span>
              </div>

              {studentDocs.length === 0 ? (
                <p className="text-[11px] text-[#757682]">No digital compliance documents deposited yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {studentDocs.map((doc: any) => {
                    const isVerified = doc.status === 'verified';
                    const canVerify = ['admin', 'super_admin', 'staff', 'hod', 'counselor'].includes(currentUser?.role || '');

                    return (
                      <div
                        key={doc.id}
                        className="p-2 bg-white rounded border border-[#e1e3e4] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#191c1d] truncate block">{doc.title}</span>
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-600">
                              {doc.doc_type_code}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#757682] block truncate">
                            {doc.file_name} • {doc.file_size_kb} KB {doc.verified_by ? `• Attested by ${doc.verified_by}` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {doc.status}
                          </span>

                          {canVerify && (
                            <button
                              type="button"
                              onClick={() => handleVerifyDoc(doc.id, isVerified ? 'rejected' : 'verified')}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                isVerified
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                              title={isVerified ? 'Revoke verification' : 'Attest credential'}
                            >
                              {isVerified ? 'Reject' : (
                                <span className="flex items-center gap-1">
                                  <span>Verify</span>
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fee Items Table */}
            <div>
              <h4 className="font-bold text-[#191c1d] mb-2 uppercase text-xs tracking-wider text-[#757682]">
                Assessed Fee Heads
              </h4>
              <div className="border border-[#e1e3e4] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-xs text-[#757682] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Head</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Paid</th>
                      <th className="py-2.5 px-3">Due</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f5]">
                    {profileData?.fees?.map((f: any) => (
                      <tr key={f.id}>
                        <td className="py-2.5 px-3 font-semibold text-[#191c1d]">
                          {f.fee_head?.title || 'Academic Fee'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">₹ {(f.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-[#00236f]">₹ {(f.paid_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-[#ba1a1a] font-bold">
                          ₹ {(f.due_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 uppercase font-bold text-xs">
                          {f.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {promoteMsg && (
              <div className="p-3 bg-[#ffedd5] border border-[#ea580c] rounded-lg text-[#00236f] text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{promoteMsg}</span>
              </div>
            )}

            {statusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <div className="pt-3 flex items-center justify-between gap-2 border-t border-[#f3f4f5] flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                  <>
                    <button
                      type="button"
                      onClick={handlePromote}
                      disabled={isPromoting || (profileData?.current_semester || student.current_semester) >= 8}
                      className="px-3.5 py-2 bg-[#ea580c] hover:bg-[#9a3412] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                      title="Advance student to next academic term and assess statutory tuition"
                    >
                      <span>
                        {isPromoting
                          ? 'Promoting...'
                          : `Promote to Sem ${(profileData?.current_semester || student.current_semester) + 1}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleStudentStatus}
                      disabled={isTogglingStatus}
                      className={`px-3 py-2 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border transition-colors ${
                        isStudentActive
                          ? 'bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title={isStudentActive ? 'Suspend student account & block examination/portal login' : 'Reactivate student account'}
                    >
                      <span>{isStudentActive ? '⏸' : '▶'}</span>
                      <span>{isTogglingStatus ? 'Updating...' : isStudentActive ? 'Suspend Student' : 'Reactivate Student'}</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa] text-xs cursor-pointer"
                >
                  Close
                </button>
                {onOpenAdmitCard && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmitCard(student.id);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Inspect MRSPTU / PUP Examination Admit Card & Attendance Clearance"
                  >
                    <span>Admit Card & Hall Ticket</span>
                  </button>
                )}
                {(() => {
                  const isAccountsOrAdmin = ['admin', 'super_admin', 'accounts'].includes(currentUser?.role || '');
                  const isStudentUser = currentUser?.role === 'student';
                  return (
                    <button
                      onClick={() => {
                        onClose();
                        if (isAccountsOrAdmin || isStudentUser) {
                          onPayFee(student.id);
                        } else {
                          navigate(`/fees?studentId=${student.id}`);
                        }
                      }}
                      className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      {isAccountsOrAdmin
                        ? 'Collect Fee Payment'
                        : isStudentUser
                        ? 'Pay Tuition Dues'
                        : 'Inspect Fee Ledger'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
