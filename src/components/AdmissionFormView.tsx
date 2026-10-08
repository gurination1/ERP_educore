import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AIAssistantModal } from './AIAssistantModal';

interface AdmissionFormViewProps {
  initialStudent?: any | null;
  onApplicationSubmitted?: (data: any) => void;
  onClose?: () => void;
}

export const AdmissionFormView: React.FC<AdmissionFormViewProps> = ({
  initialStudent,
  onApplicationSubmitted,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(
    initialStudent?.intake_step === 2 ? 2 : (initialStudent?.intake_step === 3 ? 3 : 1)
  );
  const [studentRecordId, setStudentRecordId] = useState<string | null>(initialStudent?.id || null);
  const [assignedRollId, setAssignedRollId] = useState<string | null>(initialStudent?.student_id || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiExtractedBadge, setAiExtractedBadge] = useState<any | null>(null);
  const [credentialsSlip, setCredentialsSlip] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Contact & Campus Visit Inquiry
    firstName: initialStudent?.first_name || '',
    lastName: initialStudent?.last_name || '',
    email: initialStudent?.email || '',
    phone: initialStudent?.phone || '',
    address: initialStudent?.address || '',
    city: initialStudent?.city || '',
    district: initialStudent?.district || 'Bathinda',
    state: initialStudent?.state || 'Punjab',
    pincode: initialStudent?.pincode || '',
    courseId: initialStudent?.course_id || 'crs-btech-cs',
    sessionId: initialStudent?.session_id || 'sess-2025-26',
    counselingNotes: initialStudent?.counseling_notes || 'Walk-in campus counseling inquiry. Discussed curriculum & placement track.',

    // Step 2: Parental & Domicile / Quota Profile
    guardianName: initialStudent?.guardian_name || '',
    guardianPhone: initialStudent?.guardian_phone || '',
    motherName: initialStudent?.mother_name || '',
    relationship: initialStudent?.guardian_relation || 'parent',
    gender: initialStudent?.gender || 'male',
    dob: initialStudent?.dob || '2005-06-15',
    category: initialStudent?.category || 'General',
    quota: initialStudent?.quota || 'punjab_85',
    annualFamilyIncome: initialStudent?.annual_family_income ? String(initialStudent.annual_family_income) : '350000',
    residentialMode: initialStudent?.is_hosteller
      ? 'hosteller'
      : (initialStudent?.is_transport_user ? 'bus_commuter' : 'self_commute'),
    hostelRoomNo: initialStudent?.hostel_room_no || 'BH-1 (Allotment on Arrival)',
    transportRoute: initialStudent?.transport_route || 'Route 2 - Bathinda City / Rose Garden Bypass',

    // Step 3: Crucial Documents, 12-Digit Aadhaar & Token Admission Fee
    aadhaarNo: initialStudent?.aadhaar_no || '',
    tenthBoard: initialStudent?.board_name || 'PSEB (Punjab School Education Board)',
    tenthRollNo: initialStudent?.tenth_roll_no || '',
    tenthPercentage: initialStudent?.tenth_percentage ? String(initialStudent.tenth_percentage) : '85.5',
    tenthDocVerified: initialStudent?.tenth_doc_verified ?? true,

    twelfthBoard: initialStudent?.board_name || 'PSEB (Punjab School Education Board)',
    twelfthRollNo: initialStudent?.twelfth_roll_no || '',
    twelfthPercentage: initialStudent?.twelfth_percentage ? String(initialStudent.twelfth_percentage) : '82.0',
    twelfthDocVerified: initialStudent?.twelfth_doc_verified ?? true,

    aadhaarDocVerified: initialStudent?.aadhaar_doc_verified ?? true,
    tokenFeeReceipt: initialStudent?.token_fee_receipt || `REC-ADM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    tokenFeeAmount: initialStudent?.token_fee_amount ? String(initialStudent.token_fee_amount) : '15000',
    tokenFeeMode: initialStudent?.token_fee_mode || 'online_upi',
    tokenFeeDate: initialStudent?.token_fee_date || new Date().toISOString().split('T')[0],
    agreedToTerms: false,
  });

  useEffect(() => {
    if (initialStudent) {
      setStudentRecordId(initialStudent.id);
      setAssignedRollId(initialStudent.student_id);
      if (initialStudent.intake_step === 2) setCurrentStep(2);
      else if (initialStudent.intake_step === 3) setCurrentStep(3);
    }
  }, [initialStudent]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleApplyAIData = (extracted: any) => {
    setFormData(prev => ({
      ...prev,
      firstName: extracted.firstName || prev.firstName,
      lastName: extracted.lastName || prev.lastName,
      email: extracted.email || prev.email,
      phone: extracted.phone || prev.phone,
      gender: extracted.gender || prev.gender,
      dob: extracted.dob || prev.dob,
      guardianName: extracted.guardianName || prev.guardianName,
      relationship: extracted.relationship || prev.relationship,
      guardianPhone: extracted.guardianPhone || prev.guardianPhone,
      courseId: extracted.courseId || prev.courseId,
    }));
    setAiExtractedBadge({
      meritScore: extracted.meritScore,
      quota: extracted.recommendedQuota,
      summary: extracted.aiSummary,
      courseName: extracted.courseName,
    });
    setStatusFeedback({
      type: 'success',
      message: 'Applicant details auto-extracted via Gemini Multimodal Scrutiny!',
    });
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  // Step 1 Save & Continue
  const handleSaveStep1 = async (advance: boolean = true) => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setStatusFeedback({ type: 'error', message: 'Candidate First Name and Last Name are required.' });
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setStatusFeedback({ type: 'error', message: 'Valid 10-digit mobile contact number is mandatory for campus follow-up.' });
      return;
    }
    if (!formData.email || !formData.email.includes('@')) {
      setStatusFeedback({ type: 'error', message: 'Valid email address is mandatory.' });
      return;
    }

    setIsSavingDraft(true);
    setStatusFeedback(null);
    try {
      const res = await api.saveProgressiveIntake({
        id: studentRecordId || undefined,
        step: 1,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        courseId: formData.courseId,
        sessionId: formData.sessionId,
        counselingNotes: formData.counselingNotes,
      });

      if (res.success && res.student) {
        setStudentRecordId(res.student.id);
        setAssignedRollId(res.student.student_id);
        setStatusFeedback({
          type: 'success',
          message: res.message || 'Campus visit inquiry recorded (Step 1 Complete)!',
        });
        if (advance) {
          setCurrentStep(2);
        }
      } else {
        setStatusFeedback({ type: 'error', message: res.error || 'Failed to save campus inquiry.' });
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Network error saving campus inquiry.' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Step 2 Save & Continue
  const handleSaveStep2 = async (advance: boolean = true) => {
    if (!formData.guardianName.trim()) {
      setStatusFeedback({ type: 'error', message: "Father's / Guardian's name is required for registration." });
      return;
    }

    setIsSavingDraft(true);
    setStatusFeedback(null);
    try {
      const res = await api.saveProgressiveIntake({
        id: studentRecordId || undefined,
        step: 2,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone || formData.phone,
        motherName: formData.motherName,
        relationship: formData.relationship,
        gender: formData.gender,
        dob: formData.dob,
        category: formData.category,
        quota: formData.quota,
        annualFamilyIncome: formData.annualFamilyIncome,
        residentialMode: formData.residentialMode,
        hostelRoomNo: formData.hostelRoomNo,
        transportRoute: formData.transportRoute,
      });

      if (res.success && res.student) {
        setStudentRecordId(res.student.id);
        setAssignedRollId(res.student.student_id);
        setStatusFeedback({
          type: 'success',
          message: res.message || 'Parental profile & quota details saved (Step 2 Complete)!',
        });
        if (advance) {
          setCurrentStep(3);
        }
      } else {
        setStatusFeedback({ type: 'error', message: res.error || 'Failed to save registration profile.' });
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Network error saving registration profile.' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Step 3 Final Submission
  const handleFinalizeStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = formData.aadhaarNo.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setStatusFeedback({
        type: 'error',
        message: 'Aadhaar Card number must be exactly 12 digits (format: XXXX XXXX XXXX).',
      });
      return;
    }

    if (!formData.agreedToTerms) {
      setStatusFeedback({
        type: 'error',
        message: 'Please confirm the academic document verification declaration.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);
    try {
      const res = await api.saveProgressiveIntake({
        id: studentRecordId || undefined,
        step: 3,
        aadhaarNo: cleanAadhaar,
        tenthRollNo: formData.tenthRollNo,
        tenthPercentage: formData.tenthPercentage,
        boardName: formData.tenthBoard,
        tenthDocVerified: formData.tenthDocVerified,
        twelfthRollNo: formData.twelfthRollNo,
        twelfthPercentage: formData.twelfthPercentage,
        twelfthDocVerified: formData.twelfthDocVerified,
        aadhaarDocVerified: formData.aadhaarDocVerified,
        tokenFeeReceipt: formData.tokenFeeReceipt,
        tokenFeeAmount: formData.tokenFeeAmount,
        tokenFeeMode: formData.tokenFeeMode,
        tokenFeeDate: formData.tokenFeeDate,
      });

      if (res.success && res.student) {
        setStudentRecordId(res.student.id);
        setAssignedRollId(res.student.student_id);
        setCredentialsSlip(res.credentialsSlip);
        setStatusFeedback({
          type: 'success',
          message: 'Admission officially finalized, student portal credentials issued and fee ledger created!',
        });
        if (onApplicationSubmitted) {
          onApplicationSubmitted(res);
        }
      } else {
        setStatusFeedback({ type: 'error', message: res.error || 'Failed to finalize admission.' });
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Network error finalizing admission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If Admission finalized, show the Credentials Slip
  if (credentialsSlip) {
    return (
      <div id="admission-credentials-slip" className="p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <span className="font-bold text-[10px]">✓</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Admission Formally Approved & Provisioned
                </span>
                <h2 className="text-2xl font-black text-[#191c1d] mt-1.5">
                  Official Admission & Credentials Slip
                </h2>
                <p className="text-xs text-[#757682]">
                  Multi-University Affiliated • PUP Patiala • MRSPTU • Panjab University
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[#757682] hover:text-[#191c1d] p-1.5 rounded-lg hover:bg-[#f1f2f4]"
              >
                <span className="font-bold text-[10px]">✕</span>
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#757682]">Student Roll ID</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-lg font-black text-[#00236f]">{credentialsSlip.studentId}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(credentialsSlip.studentId, 'roll')}
                  className="text-xs text-[#00236f] hover:underline flex items-center gap-1 font-bold"
                >
                  
                  {copiedKey === 'roll' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#757682]">Student Full Name</p>
              <p className="text-lg font-black text-[#191c1d] mt-1">{credentialsSlip.fullName}</p>
            </div>

            <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#757682]">Portal Login Username</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-base font-bold text-[#191c1d]">{credentialsSlip.username}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(credentialsSlip.username, 'usr')}
                  className="text-xs text-[#00236f] hover:underline flex items-center gap-1 font-bold"
                >
                  
                  {copiedKey === 'usr' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#757682]">Temporary Password</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-base font-bold text-amber-700 font-mono">{credentialsSlip.tempPassword}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(credentialsSlip.tempPassword, 'pwd')}
                  className="text-xs text-[#00236f] hover:underline flex items-center gap-1 font-bold"
                >
                  
                  {copiedKey === 'pwd' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#757682]">Enrolled Program & Quota</p>
              <p className="text-sm font-bold text-[#191c1d] mt-1">{credentialsSlip.course}</p>
              <p className="text-xs text-[#555] mt-0.5">{credentialsSlip.quota}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Token Fee Received</p>
              <p className="text-lg font-black text-emerald-700 mt-1">₹ {Number(credentialsSlip.tokenFeeAmount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-emerald-800 mt-0.5">Receipt: {credentialsSlip.tokenFeeReceipt}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              <p className="text-xs text-[#00236f]">
                Admitted and authenticated by: <span className="font-bold">{credentialsSlip.admittedBy || 'Faculty Admissions Committee'}</span>
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-[#00236f] text-white text-xs font-bold rounded-lg hover:bg-[#1a388a] flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-bold text-[10px]">[PRINT]</span>
              Print Slip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="student-admission-screen" className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Title & AI Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
                window.history.back();
              } else {
                window.location.href = '/dashboard';
              }
            }}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-base transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
            title="Return to Previous (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#dce1ff] text-[#00236f] rounded-full">
                Punjab & Indian College Workflow
              </span>
              {assignedRollId && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  ID: {assignedRollId}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-[#191c1d] tracking-tight mt-1">
              3-Step Progressive Student Intake
            </h2>
            <p className="text-sm text-[#444651]">
              Walk-in campus counseling inquiry → Domicile & Parental profile → 12-Digit Aadhaar, Marksheets & Token Admission Fee
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAIAssistant(true)}
            className="px-4 py-2.5 bg-linear-to-r from-[#00236f] to-[#1a4bb0] text-white text-xs font-bold rounded-xl shadow-md hover:brightness-110 flex items-center gap-2 transition-all cursor-pointer"
          >
            
            AI Smart Auto-Fill
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          
          <p className="text-xs font-semibold">{statusFeedback.message}</p>
        </div>
      )}

      {/* AI Extracted Banner if active */}
      {aiExtractedBadge && (
        <div className="p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[10px]">✓</span>
            <div>
              <p className="text-xs font-bold text-emerald-900">
                AI Parsed Profile: {formData.firstName} {formData.lastName}
              </p>
              <p className="text-[11px] text-emerald-700">
                Merit Rating: <span className="font-bold">{aiExtractedBadge.meritScore || 90}%</span> • Quota: <span className="font-semibold uppercase">{aiExtractedBadge.quota || 'Punjab 85%'}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
            Gemini Infused
          </span>
        </div>
      )}

      {/* Progressive Step Indicator */}
      <div className="bg-white border border-[#e1e3e4] rounded-2xl p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-4 rounded-xl text-left border transition-all ${
              currentStep === 1
                ? 'border-[#00236f] bg-blue-50/50 shadow-xs'
                : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 1
                    ? 'bg-[#00236f] text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                1
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">
                Stage 1
              </span>
            </div>
            <p className="text-sm font-bold text-[#191c1d] mt-2">Campus Visit & Inquiry</p>
            <p className="text-xs text-[#757682] mt-0.5">Name, phone, address & target course</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`p-4 rounded-xl text-left border transition-all ${
              currentStep === 2
                ? 'border-[#00236f] bg-blue-50/50 shadow-xs'
                : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 2
                    ? 'bg-[#00236f] text-white'
                    : (currentStep > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700')
                }`}
              >
                2
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">
                Stage 2
              </span>
            </div>
            <p className="text-sm font-bold text-[#191c1d] mt-2">Parental & Quota Profile</p>
            <p className="text-xs text-[#757682] mt-0.5">Father/Mother, Punjab 85% domicile & quota</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`p-4 rounded-xl text-left border transition-all ${
              currentStep === 3
                ? 'border-[#00236f] bg-blue-50/50 shadow-xs'
                : 'border-[#e1e3e4] hover:bg-[#f8f9fa]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3
                    ? 'bg-[#00236f] text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                3
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">
                Final Stage
              </span>
            </div>
            <p className="text-sm font-bold text-[#191c1d] mt-2">Aadhaar & Token Fee</p>
            <p className="text-xs text-[#757682] mt-0.5">12-Digit Aadhaar, Marksheets & Token Receipt</p>
          </button>
        </div>
      </div>

      {/* Step 1: Campus Visit & Inquiry */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#e1e3e4] rounded-2xl p-8 shadow-xs space-y-6">
          <div className="border-b border-[#e1e3e4] pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00236f] bg-blue-50 px-2.5 py-1 rounded-md">
              Step 1 • Initial Contact & Walk-in Inquiry
            </span>
            <h3 className="text-lg font-black text-[#191c1d] mt-2">Candidate Basic Information</h3>
            <p className="text-xs text-[#757682]">
              Record walk-in campus visitors, counseling attendees, or prospective candidates. Can be saved independently as an inquiry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                placeholder="e.g. Gurpreet"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                placeholder="e.g. Singh"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Mobile Number (SMS & WhatsApp updates) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="e.g. candidate@example.com"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Permanent Address / Street
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="e.g. House No. 248, Model Town Phase 2"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">District / City</label>
              <input
                type="text"
                value={formData.district}
                onChange={e => handleChange('district', e.target.value)}
                placeholder="e.g. Bathinda / Patiala / Ludhiana"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">State & Pincode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => handleChange('state', e.target.value)}
                  placeholder="Punjab"
                  className="w-2/3 px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
                />
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="151001"
                  className="w-1/3 px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Target Degree Program
              </label>
              <select
                value={formData.courseId}
                onChange={e => handleChange('courseId', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden font-medium"
              >
                <option value="crs-btech-cs">B.Tech Computer Science & Engineering (4 Years)</option>
                <option value="crs-btech-me">B.Tech Mechanical Engineering (4 Years)</option>
                <option value="crs-mba-fin">MBA Financial Management (2 Years)</option>
                <option value="crs-bsc-phy">B.Sc Applied Physics (3 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">Academic Session</label>
              <select
                value={formData.sessionId}
                onChange={e => handleChange('sessionId', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden font-medium"
              >
                <option value="sess-2025-26">2025-26 (Active Intake)</option>
                <option value="sess-2024-25">2024-25 (Lateral Entry)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Campus Visit Counseling Notes / Inquiry Remarks
              </label>
              <textarea
                rows={2}
                value={formData.counselingNotes}
                onChange={e => handleChange('counselingNotes', e.target.value)}
                placeholder="Notes from Admission Counselor or Faculty Advisor on student query, stream interest, hostel visit, etc."
                className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-xs focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e1e3e4]">
            <button
              type="button"
              disabled={isSavingDraft}
              onClick={() => handleSaveStep1(false)}
              className="px-5 py-2.5 bg-[#f1f2f4] hover:bg-[#e1e3e4] text-[#191c1d] font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              
              Save Visit Inquiry (Resume Later)
            </button>

            <button
              type="button"
              disabled={isSavingDraft}
              onClick={() => handleSaveStep1(true)}
              className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1a388a] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              Save & Proceed to Step 2
              <span className="font-bold text-[10px]">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Parental & Domicile / Quota Profile */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#e1e3e4] rounded-2xl p-8 shadow-xs space-y-6">
          <div className="border-b border-[#e1e3e4] pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00236f] bg-blue-50 px-2.5 py-1 rounded-md">
              Step 2 • Parental & Domicile Quota Profile
            </span>
            <h3 className="text-lg font-black text-[#191c1d] mt-2">Family & Admission Quota</h3>
            <p className="text-xs text-[#757682]">
              Record parental credentials, Punjab state 85% domicile reservation, category, and residential modes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Father's / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={e => handleChange('guardianName', e.target.value)}
                placeholder="e.g. Sardar Baldev Singh"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Father's / Guardian Mobile Number
              </label>
              <input
                type="tel"
                value={formData.guardianPhone}
                onChange={e => handleChange('guardianPhone', e.target.value)}
                placeholder="e.g. +91 98765 11223"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">Mother's Name</label>
              <input
                type="text"
                value={formData.motherName}
                onChange={e => handleChange('motherName', e.target.value)}
                placeholder="e.g. Jaswinder Kaur"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">Date of Birth & Gender</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.dob}
                  onChange={e => handleChange('dob', e.target.value)}
                  className="w-3/5 px-3 py-2 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-xs focus:bg-white focus:border-[#00236f] focus:outline-hidden"
                />
                <select
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                  className="w-2/5 px-2.5 py-2 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-xs focus:bg-white focus:border-[#00236f] focus:outline-hidden font-medium"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="nonbinary">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Domicile Admission Quota (Punjab State University Standard)
              </label>
              <select
                value={formData.quota}
                onChange={e => handleChange('quota', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden font-bold text-[#00236f]"
              >
                <option value="punjab_85">Punjab State Domicile Quota (85% Reserved)</option>
                <option value="other_state_15">All India Quota (15% Open)</option>
                <option value="management">Direct Management / NRI Quota</option>
                <option value="sports">State / National Sports Quota</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">Social Category</label>
              <select
                value={formData.category}
                onChange={e => handleChange('category', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden font-medium"
              >
                <option value="General">General / Open Category</option>
                <option value="SC/ST">Scheduled Caste (SC) / Scheduled Tribe (ST)</option>
                <option value="OBC">Other Backward Class (OBC / BC)</option>
                <option value="EWS">Economically Weaker Section (EWS)</option>
                <option value="Sports">Sports Person</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Annual Family Income (₹ INR)
              </label>
              <input
                type="number"
                value={formData.annualFamilyIncome}
                onChange={e => handleChange('annualFamilyIncome', e.target.value)}
                placeholder="350000"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden"
              />
              {Number(formData.annualFamilyIncome) <= 250000 && formData.category === 'SC/ST' && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                  
                  Eligible for 100% Tuition Fee Waiver under Dr. Ambedkar Punjab PMS Portal!
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1.5">
                Residential & Commuter Preference
              </label>
              <select
                value={formData.residentialMode}
                onChange={e => handleChange('residentialMode', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#c4c6d0] rounded-xl text-sm focus:bg-white focus:border-[#00236f] focus:outline-hidden font-medium"
              >
                <option value="self_commute">Day Scholar (Self-Commute / Walking)</option>
                <option value="hosteller">Campus Hosteller (Boys/Girls Residential Hall)</option>
                <option value="bus_commuter">College Bus Transit (Fleet Pass User)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e1e3e4]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 border border-[#c4c6d0] hover:bg-[#f1f2f4] text-[#444651] font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Back to Step 1
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSavingDraft}
                onClick={() => handleSaveStep2(false)}
                className="px-5 py-2.5 bg-[#f1f2f4] hover:bg-[#e1e3e4] text-[#191c1d] font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                
                Save Registration (Resume Later)
              </button>

              <button
                type="button"
                disabled={isSavingDraft}
                onClick={() => handleSaveStep2(true)}
                className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1a388a] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                Proceed to Step 3 (Verification & Fees)
                <span className="font-bold text-[10px]">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Crucial Documents, 12-Digit Aadhaar & Token Admission Fee */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalizeStep3} className="bg-white border border-[#e1e3e4] rounded-2xl p-8 shadow-xs space-y-6">
          <div className="border-b border-[#e1e3e4] pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Step 3 • Crucial Documents, 12-Digit Aadhaar & Token Fee Deposit
            </span>
            <h3 className="text-lg font-black text-[#191c1d] mt-2">Document Scrutiny & Admission Finalization</h3>
            <p className="text-xs text-[#757682]">
              Strictly verify 12-digit Aadhaar Card, 10th and 10+2 marksheet certificates, and record Token Admission Fee payment.
            </p>
          </div>

          {/* Aadhaar Verification Box */}
          <div className="p-5 bg-blue-50/60 border-2 border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              
              <div>
                <label className="block text-xs font-bold text-[#00236f] uppercase tracking-wider">
                  12-Digit Aadhaar Card Number <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#555]">
                  Mandatory statutory identification required for Punjab State Scholarship Portal & University Registration.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  maxLength={14}
                  value={formData.aadhaarNo}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                    handleChange('aadhaarNo', formatted);
                  }}
                  placeholder="e.g. 5482 9104 3821"
                  className="w-full px-4 py-2.5 bg-white border border-[#00236f] rounded-xl text-base font-mono font-bold tracking-widest text-[#00236f] focus:outline-hidden shadow-xs"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2.5 rounded-xl border border-blue-200">
                <input
                  type="checkbox"
                  checked={formData.aadhaarDocVerified}
                  onChange={e => handleChange('aadhaarDocVerified', e.target.checked)}
                  className="w-4 h-4 text-[#00236f] rounded-sm focus:ring-0"
                />
                <span className="text-xs font-bold text-[#191c1d]">Physical Aadhaar Verified</span>
              </label>
            </div>
          </div>

          {/* Academic Marksheets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 10th Class Marksheet */}
            <div className="p-5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00236f] flex items-center gap-1.5">
                  
                  10th Matriculation Certificate
                </span>
                <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tenthDocVerified}
                    onChange={e => handleChange('tenthDocVerified', e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded-sm"
                  />
                  Marksheet Verified
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">Education Board</label>
                <select
                  value={formData.tenthBoard}
                  onChange={e => handleChange('tenthBoard', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#c4c6d0] rounded-xl text-xs"
                >
                  <option value="PSEB (Punjab School Education Board)">PSEB (Punjab School Education Board)</option>
                  <option value="CBSE (Central Board of Secondary Education)">CBSE (Central Board of Secondary Education)</option>
                  <option value="ICSE (Indian Certificate of Secondary Education)">ICSE (Indian Certificate of Secondary Education)</option>
                  <option value="Haryana Board / Others">Haryana Board / Others</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">10th Roll Number</label>
                  <input
                    type="text"
                    value={formData.tenthRollNo}
                    onChange={e => handleChange('tenthRollNo', e.target.value)}
                    placeholder="e.g. 1029384"
                    className="w-full px-3 py-2 bg-white border border-[#c4c6d0] rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">Percentage (%)</label>
                  <input
                    type="text"
                    value={formData.tenthPercentage}
                    onChange={e => handleChange('tenthPercentage', e.target.value)}
                    placeholder="85.5"
                    className="w-full px-3 py-2 bg-white border border-[#c4c6d0] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 12th Class Marksheet */}
            <div className="p-5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00236f] flex items-center gap-1.5">
                  
                  10+2 / Qualifying Marksheet
                </span>
                <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.twelfthDocVerified}
                    onChange={e => handleChange('twelfthDocVerified', e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded-sm"
                  />
                  Marksheet Verified
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">Education Board</label>
                <select
                  value={formData.twelfthBoard}
                  onChange={e => handleChange('twelfthBoard', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#c4c6d0] rounded-xl text-xs"
                >
                  <option value="PSEB (Punjab School Education Board)">PSEB (Punjab School Education Board)</option>
                  <option value="CBSE (Central Board of Secondary Education)">CBSE (Central Board of Secondary Education)</option>
                  <option value="ICSE (Indian Certificate of Secondary Education)">ICSE (Indian Certificate of Secondary Education)</option>
                  <option value="Haryana Board / Others">Haryana Board / Others</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">12th Roll Number</label>
                  <input
                    type="text"
                    value={formData.twelfthRollNo}
                    onChange={e => handleChange('twelfthRollNo', e.target.value)}
                    placeholder="e.g. 2049182"
                    className="w-full px-3 py-2 bg-white border border-[#c4c6d0] rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">Percentage (%)</label>
                  <input
                    type="text"
                    value={formData.twelfthPercentage}
                    onChange={e => handleChange('twelfthPercentage', e.target.value)}
                    placeholder="82.0"
                    className="w-full px-3 py-2 bg-white border border-[#c4c6d0] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Token Admission Fee Received Section */}
          <div className="p-6 bg-emerald-50/50 border border-emerald-300 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950">
                    Token Admission Fee Receipt (Admission Confirmation Deposit)
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Standard Punjab college practice: Token amount credited directly against tuition ledger.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
                Official Treasury Receipt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={formData.tokenFeeReceipt}
                  onChange={e => handleChange('tokenFeeReceipt', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">
                  Token Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={formData.tokenFeeAmount}
                  onChange={e => handleChange('tokenFeeAmount', e.target.value)}
                  placeholder="15000"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">Payment Mode</label>
                <select
                  value={formData.tokenFeeMode}
                  onChange={e => handleChange('tokenFeeMode', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium"
                >
                  <option value="online_upi">UPI (PhonePe / GPay / Paytm)</option>
                  <option value="cash">Cash at Counter</option>
                  <option value="net_banking">Net Banking / RTGS / NEFT</option>
                  <option value="cheque">Bank Demand Draft (DD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">Collection Date</label>
                <input
                  type="date"
                  value={formData.tokenFeeDate}
                  onChange={e => handleChange('tokenFeeDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Statutory Verification Declaration */}
          <div className="p-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="declaration-checkbox"
              checked={formData.agreedToTerms}
              onChange={e => handleChange('agreedToTerms', e.target.checked)}
              className="mt-1 w-4 h-4 text-[#00236f] rounded-sm focus:ring-0 cursor-pointer"
            />
            <label htmlFor="declaration-checkbox" className="text-xs text-[#444651] cursor-pointer">
              <span className="font-bold text-[#191c1d]">Admissions Committee Verification Affirmation:</span> I certify that I have inspected the candidate's original 12-digit Aadhaar Card, 10th and 10+2 marksheets, verified Punjab domicile eligibility, and recorded receipt of the token admission fee.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e1e3e4]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 border border-[#c4c6d0] hover:bg-[#f1f2f4] text-[#444651] font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Back to Step 2
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-linear-to-r from-emerald-700 to-[#00236f] hover:brightness-110 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  
                  Finalizing & Generating Credentials...
                </>
              ) : (
                <>
                  <span className="font-bold text-[10px]">✓</span>
                  Finalize Admission & Provision Student Account (Step 3 Complete)
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* AI Assistant Modal for Extraction */}
      <AIAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplyData={handleApplyAIData}
      />
    </div>
  );
};
