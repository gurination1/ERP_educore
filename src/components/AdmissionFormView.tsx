import React, { useState } from 'react';
import { api } from '../api/client';

interface AdmissionFormViewProps {
  onApplicationSubmitted?: (data: any) => void;
}

export const AdmissionFormView: React.FC<AdmissionFormViewProps> = ({ onApplicationSubmitted }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    dob: '2005-06-15',
    gender: 'male',
    email: '',
    phone: '',
    guardianName: '',
    relationship: 'parent',
    guardianPhone: '',
    // Step 2: Course & Academics
    courseId: 'crs-btech-cs',
    session: '2025-26',
    semester: '1',
    previousSchool: 'Delhi Public School, R.K. Puram',
    previousScore: '92.4%',
    // Step 3: Files
    photoUploaded: true,
    transcriptUploaded: true,
    idProofUploaded: true,
    agreedToTerms: false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    try {
      const res = await api.saveAdmissionDraft(formData);
      if (res.success) {
        setDraftSavedMsg(`Draft saved successfully at ${new Date().toLocaleTimeString()} (ID: ${res.draftId})`);
        setTimeout(() => setDraftSavedMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setErrorMsg('Please complete all mandatory personal information fields.');
        return;
      }
      setErrorMsg(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setErrorMsg(null);
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      setErrorMsg('Please accept the institutional accuracy declaration before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.submitAdmission({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        email: formData.email,
        phone: formData.phone,
        guardianName: formData.guardianName,
        relationship: formData.relationship,
        guardianPhone: formData.guardianPhone,
        courseId: formData.courseId,
        admissionYear: 2025,
      });

      if (res.success) {
        setSubmittedSuccess(res);
        if (onApplicationSubmitted) onApplicationSubmitted(res);
      } else {
        setErrorMsg(res.error || 'Submission failed. Please verify the inputs.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="p-8 max-w-3xl mx-auto animate-fadeIn text-center space-y-6">
        <div className="w-16 h-16 bg-[#86f2e4]/30 text-[#006a61] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[36px]">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-[#191c1d]">Application Submitted Successfully!</h2>
        <p className="text-sm text-[#444651]">
          Your admission enrollment application has been recorded in the EduCore ERP database.
        </p>

        <div className="p-6 bg-white rounded-xl border border-[#e1e3e4] text-left max-w-md mx-auto space-y-2 text-sm shadow-xs">
          <div className="flex justify-between py-1 border-b border-[#f3f4f5]">
            <span className="text-[#757682]">Application No:</span>
            <strong className="text-[#00236f]">{submittedSuccess.applicationNumber}</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-[#f3f4f5]">
            <span className="text-[#757682]">Candidate Name:</span>
            <span className="font-semibold text-[#191c1d]">
              {formData.firstName} {formData.lastName}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#f3f4f5]">
            <span className="text-[#757682]">Email:</span>
            <span className="text-[#191c1d]">{formData.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#f3f4f5]">
            <span className="text-[#757682]">Course:</span>
            <span className="text-[#191c1d]">B.Tech in Computer Science</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#757682]">Status:</span>
            <span className="px-2 py-0.5 bg-[#86f2e4]/40 text-[#006a61] rounded text-xs font-bold">
              Submitted (Under Review)
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSubmittedSuccess(null);
            setCurrentStep(1);
            setFormData({
              firstName: '',
              lastName: '',
              dob: '2005-06-15',
              gender: 'male',
              email: '',
              phone: '',
              guardianName: '',
              relationship: 'parent',
              guardianPhone: '',
              courseId: 'crs-btech-cs',
              session: '2025-26',
              semester: '1',
              previousSchool: '',
              previousScore: '',
              photoUploaded: true,
              transcriptUploaded: true,
              idProofUploaded: true,
              agreedToTerms: false,
            });
          }}
          className="px-6 py-2.5 bg-[#00236f] text-white font-semibold rounded-lg text-sm hover:bg-[#1e3a8a] transition-colors"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  return (
    <div id="student-admission-screen" className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">Student Admission</h2>
        <p className="text-sm text-[#444651] mt-1">
          Complete the multi-step admission enrollment process for the academic session 2025-26.
        </p>
      </div>

      {/* 3-Step Progress Header */}
      <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
              currentStep === 1
                ? 'bg-[#dce1ff] text-[#00236f]'
                : currentStep > 1
                ? 'bg-[#86f2e4]/20 text-[#006a61]'
                : 'text-[#757682] hover:bg-[#f8f9fa]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 1
                  ? 'bg-[#00236f] text-white'
                  : currentStep > 1
                  ? 'bg-[#006a61] text-white'
                  : 'bg-[#e1e3e4] text-[#757682]'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div>
              <p className="text-xs font-bold">1. Personal Info</p>
              <p className="text-[10px] opacity-80">Applicant & Guardian</p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
              currentStep === 2
                ? 'bg-[#dce1ff] text-[#00236f]'
                : currentStep > 2
                ? 'bg-[#86f2e4]/20 text-[#006a61]'
                : 'text-[#757682] hover:bg-[#f8f9fa]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 2
                  ? 'bg-[#00236f] text-white'
                  : currentStep > 2
                  ? 'bg-[#006a61] text-white'
                  : 'bg-[#e1e3e4] text-[#757682]'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <div>
              <p className="text-xs font-bold">2. Course Selection</p>
              <p className="text-[10px] opacity-80">Degree & Prior Scores</p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
              currentStep === 3
                ? 'bg-[#dce1ff] text-[#00236f]'
                : 'text-[#757682] hover:bg-[#f8f9fa]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3
                  ? 'bg-[#00236f] text-white'
                  : 'bg-[#e1e3e4] text-[#757682]'
              }`}
            >
              3
            </div>
            <div>
              <p className="text-xs font-bold">3. Document Upload</p>
              <p className="text-[10px] opacity-80">Verification & Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {draftSavedMsg && (
        <div className="p-3 bg-[#86f2e4]/20 border border-[#86f2e4] text-[#006a61] rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{draftSavedMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl p-8 border border-[#e1e3e4] shadow-xs">
        {/* STEP 1: Personal Info & Guardian */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Applicant Details</h3>
              <p className="text-xs text-[#757682] mt-0.5">
                Enter your legal personal details as per official government records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  First Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => handleChange('firstName', e.target.value)}
                  placeholder="e.g. Aryan"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Last Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => handleChange('lastName', e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                    Date of Birth <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <span
                    className="material-symbols-outlined text-[14px] text-[#757682] cursor-help"
                    title="Format: YYYY-MM-DD"
                  >
                    info
                  </span>
                </div>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={e => handleChange('dob', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Gender <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="nonbinary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f3f4f5]">
              <h3 className="text-base font-bold text-[#191c1d]">Contact Information</h3>
              <p className="text-xs text-[#757682] mt-0.5">
                Official contact channel for admission confirmation and notices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                    Email Address <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <span
                    className="material-symbols-outlined text-[14px] text-[#757682] cursor-help"
                    title="Institutional & verification emails will be sent here"
                  >
                    info
                  </span>
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="e.g. aryan.sharma@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#f3f4f5]">
              <h3 className="text-base font-bold text-[#191c1d]">Guardian Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={e => handleChange('guardianName', e.target.value)}
                  placeholder="e.g. Sunil Sharma"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Relationship
                </label>
                <select
                  value={formData.relationship}
                  onChange={e => handleChange('relationship', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse</option>
                  <option value="other">Legal Guardian / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Guardian Phone
                </label>
                <input
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={e => handleChange('guardianPhone', e.target.value)}
                  placeholder="+91 98765 43200"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-6 border-t border-[#e1e3e4] flex items-center justify-between">
              <button
                type="button"
                id="admission-save-draft-btn"
                onClick={handleSaveDraft}
                className="px-5 py-2.5 border border-[#e1e3e4] bg-[#ffffff] hover:bg-[#f8f9fa] text-[#191c1d] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#757682]">save</span>
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                id="admission-step1-next-btn"
                onClick={handleNext}
                className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Next Step</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Course Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Course Selection & Academics</h3>
              <p className="text-xs text-[#757682] mt-0.5">
                Select your intended program of study and record your qualifying test score.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Academic Degree / Course <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={e => handleChange('courseId', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  <option value="crs-btech-cs">B.Tech - Computer Science & Engineering</option>
                  <option value="crs-btech-me">B.Tech - Mechanical Engineering</option>
                  <option value="crs-mba-fin">MBA - Financial Management</option>
                  <option value="crs-bsc-phy">B.Sc - Applied Physics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Academic Session
                </label>
                <input
                  type="text"
                  disabled
                  value="2025-26 (Fall Admissions)"
                  className="w-full px-3.5 py-2.5 bg-[#f3f4f5] border border-[#e1e3e4] rounded-lg text-sm text-[#757682]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  Previous School / Board
                </label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={e => handleChange('previousSchool', e.target.value)}
                  placeholder="e.g. CBSE / Central Board of Secondary Education"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5">
                  12th Standard Percentage / Score
                </label>
                <input
                  type="text"
                  value={formData.previousScore}
                  onChange={e => handleChange('previousScore', e.target.value)}
                  placeholder="e.g. 92.4%"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-6 border-t border-[#e1e3e4] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-[#e1e3e4] bg-[#ffffff] hover:bg-[#f8f9fa] text-[#191c1d] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                id="admission-step2-next-btn"
                onClick={handleNext}
                className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Documents</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Document Upload & Final Submission */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Document Upload & Review</h3>
              <p className="text-xs text-[#757682] mt-0.5">
                Upload verified digital copies of required certificates (PDF or Image under 10MB).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Document 1 */}
              <div className="p-4 border-2 border-dashed border-[#c5c5d3] hover:border-[#00236f] rounded-xl text-center bg-[#f8f9fa] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[32px] text-[#00236f] mb-2">
                  description
                </span>
                <p className="text-xs font-bold text-[#191c1d]">10th & 12th Marksheet</p>
                <p className="text-[10px] text-[#757682] mt-1">PDF or scanned JPG</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded text-[10px] font-bold">
                  ✓ File Attached
                </span>
              </div>

              {/* Document 2 */}
              <div className="p-4 border-2 border-dashed border-[#c5c5d3] hover:border-[#00236f] rounded-xl text-center bg-[#f8f9fa] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[32px] text-[#00236f] mb-2">
                  badge
                </span>
                <p className="text-xs font-bold text-[#191c1d]">Government Photo ID</p>
                <p className="text-[10px] text-[#757682] mt-1">Aadhaar / Passport</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded text-[10px] font-bold">
                  ✓ File Attached
                </span>
              </div>

              {/* Document 3 */}
              <div className="p-4 border-2 border-dashed border-[#c5c5d3] hover:border-[#00236f] rounded-xl text-center bg-[#f8f9fa] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[32px] text-[#00236f] mb-2">
                  account_box
                </span>
                <p className="text-xs font-bold text-[#191c1d]">Passport Photograph</p>
                <p className="text-[10px] text-[#757682] mt-1">Clear white backdrop</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded text-[10px] font-bold">
                  ✓ Ready
                </span>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="p-4 bg-[#f8f9fa] rounded-lg border border-[#e1e3e4]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreedToTerms}
                  onChange={e => handleChange('agreedToTerms', e.target.checked)}
                  className="mt-0.5 rounded border-[#e1e3e4] text-[#00236f] focus:ring-[#00236f]"
                />
                <span className="text-xs text-[#444651] leading-relaxed">
                  I hereby declare that the information provided in this admission application is true,
                  complete, and accurate to the best of my knowledge. I agree to abide by the rules and
                  disciplinary regulations of EduCore Institute of Higher Learning.
                </span>
              </label>
            </div>

            {/* Step 3 Actions */}
            <div className="pt-6 border-t border-[#e1e3e4] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 border border-[#e1e3e4] bg-[#ffffff] hover:bg-[#f8f9fa] text-[#191c1d] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Back</span>
              </button>

              <button
                type="submit"
                id="admission-final-submit-btn"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span>Processing Application...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Submit Admission Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
