import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ScholarshipScheme, ScholarshipApp, User } from '../types';

interface ScholarshipsViewProps {
  currentUser: User | null;
}

export const ScholarshipsView: React.FC<ScholarshipsViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  const [schemes, setSchemes] = useState<ScholarshipScheme[]>([]);
  const [applications, setApplications] = useState<ScholarshipApp[]>([]);
  const [activeTab, setActiveTab] = useState<'schemes' | 'applications'>(currentUser?.role === 'admin' ? 'applications' : 'schemes');
  const [selectedScheme, setSelectedScheme] = useState<ScholarshipScheme | null>(null);

  // Admin New Scheme state
  const [isCreatingScheme, setIsCreatingScheme] = useState(false);
  const [newSchemeTitle, setNewSchemeTitle] = useState('');
  const [newSchemeCode, setNewSchemeCode] = useState('');
  const [newSchemeAmount, setNewSchemeAmount] = useState('45000');
  const [newSchemeDeadline, setNewSchemeDeadline] = useState('2025-12-31');
  const [newSchemeCriteria, setNewSchemeCriteria] = useState('');
  const [newSchemeDesc, setNewSchemeDesc] = useState('');

  // Application form state
  const [income, setIncome] = useState('350000');
  const [gpa, setGpa] = useState('8.85');
  const [reason, setReason] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  // Admin Review state
  const [reviewApp, setReviewApp] = useState<ScholarshipApp | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const loadData = async () => {
    const resSchemes = await api.getScholarshipSchemes();
    if (resSchemes.success && resSchemes.schemes) {
      setSchemes(resSchemes.schemes);
    }
    const resApps = await api.getScholarshipApplications();
    if (resApps.success && resApps.applications) {
      setApplications(resApps.applications);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme || !reason) return;

    setIsApplying(true);
    try {
      const res = await api.applyScholarship({
        schemeId: selectedScheme.id,
        annualFamilyIncome: income,
        previousGpa: gpa,
        reasonForApplication: reason,
      });

      if (res.success) {
        setApplySuccessMsg(`Application for ${selectedScheme.title} submitted successfully.`);
        setSelectedScheme(null);
        setReason('');
        loadData();
        setTimeout(() => setApplySuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!reviewApp) return;
    setIsReviewing(true);
    try {
      const res = await api.reviewScholarship(reviewApp.id, status, adminRemarks);
      if (res.success) {
        setReviewApp(null);
        setAdminRemarks('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeTitle || !newSchemeAmount) return;
    try {
      const res = await api.createScholarshipScheme({
        title: newSchemeTitle,
        code: newSchemeCode || `SCH-${Date.now().toString().slice(-4)}`,
        award_amount: parseFloat(newSchemeAmount),
        deadline: newSchemeDeadline,
        eligibility_criteria: newSchemeCriteria || 'Academic merit and verified financial eligibility.',
        description: newSchemeDesc || 'Institutional scholarship endowment.',
      });
      if (res.success) {
        setIsCreatingScheme(false);
        setNewSchemeTitle('');
        setNewSchemeCode('');
        setNewSchemeCriteria('');
        setNewSchemeDesc('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalDisbursed = applications
    .filter(a => a.status === 'approved')
    .reduce((acc, a) => {
      const scheme = schemes.find(s => s.id === a.scheme_id || s.title === a.schemeTitle);
      return acc + (scheme?.award_amount || 40000);
    }, 0);

  const pendingCount = applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  return (
    <div id="scholarships-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
            {isAdmin ? 'Scholarships & Financial Aid Governance' : 'Institutional Scholarships & Financial Schemes'}
          </h2>
          <p className="text-sm text-[#444651] mt-1">
            {isAdmin
              ? 'Adjudicate student grant requests, manage endowment schemes, and allocate institutional fee concessions.'
              : 'Explore grant opportunities, submit fee concession requests, and track committee status.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsCreatingScheme(true)}
              className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create Scheme</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-white border border-[#e1e3e4] rounded-lg shadow-xs">
            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'schemes'
                  ? 'bg-[#00236f] text-white'
                  : 'text-[#444651] hover:text-[#191c1d]'
              }`}
            >
              Available Schemes ({schemes.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'applications'
                  ? 'bg-[#00236f] text-white'
                  : 'text-[#444651] hover:text-[#191c1d]'
              }`}
            >
              {isAdmin ? 'Adjudication Queue' : 'Track Applications'} ({applications.length})
            </button>
          </div>
        </div>
      </div>

      {applySuccessMsg && (
        <div className="p-3.5 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{applySuccessMsg}</span>
        </div>
      )}

      {/* Admin Executive Summary Banner on Applications Tab */}
      {isAdmin && activeTab === 'applications' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#757682]">Total Applications</span>
            <h4 className="text-2xl font-black text-[#191c1d] mt-1">{applications.length}</h4>
            <p className="text-[11px] text-[#757682] mt-0.5">Across all departments</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#b45309]">Pending Adjudication</span>
            <h4 className="text-2xl font-black text-[#b45309] mt-1">{pendingCount}</h4>
            <p className="text-[11px] text-[#757682] mt-0.5">Requires committee review</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#006a61]">Approved Grants</span>
            <h4 className="text-2xl font-black text-[#006a61] mt-1">{approvedCount}</h4>
            <p className="text-[11px] text-[#757682] mt-0.5">Fee waivers credited</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#00236f]">Total Disbursed Aid</span>
            <h4 className="text-2xl font-black text-[#00236f] mt-1">₹ {totalDisbursed.toLocaleString('en-IN')}</h4>
            <p className="text-[11px] text-[#757682] mt-0.5">Approved allocations</p>
          </div>
        </div>
      )}

      {/* Available Schemes Tab */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schemes.map(scheme => (
            <div
              key={scheme.id}
              className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between hover:border-[#00236f]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-[#dce1ff] text-[#00236f] rounded text-[11px] font-bold">
                    {scheme.code}
                  </span>
                  <span className="text-xs text-[#757682]">Deadline: {scheme.deadline}</span>
                </div>

                <h3 className="text-base font-bold text-[#191c1d] mt-3">{scheme.title}</h3>
                <p className="text-xs text-[#444651] mt-2 leading-relaxed">{scheme.description}</p>

                <div className="mt-4 p-3 bg-[#f8f9fa] rounded-lg border border-[#edeeef] text-xs">
                  <span className="font-bold text-[#191c1d] block">Eligibility:</span>
                  <span className="text-[#757682] mt-0.5 block">{scheme.eligibility_criteria}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f3f4f5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#757682] block">Award Amount</span>
                  <span className="text-lg font-extrabold text-[#006a61]">
                    ₹ {scheme.award_amount.toLocaleString('en-IN')}
                  </span>
                </div>

                {isAdmin ? (
                  <span className="px-3 py-1.5 bg-[#86f2e4]/30 text-[#006a61] rounded-lg text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>Active Scheme</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedScheme(scheme)}
                    className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications Tracking Tab */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#e1e3e4]">
            <h3 className="text-base font-bold text-[#191c1d]">Submitted Grant Applications</h3>
            <p className="text-xs text-[#757682] mt-0.5">Real-time status from the scholarship assessment committee</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                  <th className="py-3 px-4">Scheme</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Prior CGPA</th>
                  <th className="py-3 px-4">Family Income</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Committee Remarks</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Review</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-[#f8f9fa]">
                    <td className="py-3.5 px-4 font-bold text-[#00236f]">{app.schemeTitle}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#191c1d]">
                      {app.studentName} ({app.studentId})
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#006a61]">{app.previous_gpa}</td>
                    <td className="py-3.5 px-4 text-[#444651]">
                      ₹ {app.annual_family_income.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'approved'
                            ? 'bg-[#86f2e4]/40 text-[#006a61]'
                            : app.status === 'rejected'
                            ? 'bg-[#ffdad6] text-[#ba1a1a]'
                            : 'bg-[#fef3c7] text-[#b45309]'
                        }`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#757682] max-w-xs truncate">
                      {app.admin_remarks || 'Document under formal committee verification.'}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setReviewApp(app);
                            setAdminRemarks(app.admin_remarks || '');
                          }}
                          className="px-3 py-1 bg-[#dce1ff] text-[#00236f] rounded text-xs font-bold hover:bg-[#b6c4ff] transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#e1e3e4] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#191c1d]">Apply for {selectedScheme.title}</h3>
              <button
                onClick={() => setSelectedScheme(null)}
                className="text-[#757682] hover:text-[#191c1d]"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#757682]">
              Award Grant Amount:{' '}
              <strong className="text-[#006a61]">
                ₹ {selectedScheme.award_amount.toLocaleString('en-IN')}
              </strong>
            </p>

            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#191c1d] mb-1">
                  Annual Family Income (INR)
                </label>
                <input
                  type="number"
                  required
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191c1d] mb-1">
                  Previous Semester GPA / Score
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={gpa}
                  onChange={e => setGpa(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191c1d] mb-1">
                  Statement of Purpose / Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why you are eligible and how this scholarship supports your academic goals..."
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-dashed border-[#c5c5d3] rounded-lg text-center">
                <span className="material-symbols-outlined text-[24px] text-[#00236f]">
                  attach_file
                </span>
                <p className="text-[11px] font-bold text-[#191c1d]">
                  Income Certificate / Marksheet attached (demo.pdf)
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedScheme(null)}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplying}
                  className="px-5 py-2 bg-[#00236f] text-white font-bold rounded-lg hover:bg-[#1e3a8a]"
                >
                  {isApplying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Review Drawer / Modal */}
      {reviewApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#e1e3e4] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#191c1d]">Review Scholarship Application</h3>
              <button onClick={() => setReviewApp(null)} className="text-[#757682] hover:text-[#191c1d]">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="text-xs space-y-2 p-3 bg-[#f8f9fa] rounded-lg border border-[#edeeef]">
              <p>
                <strong>Applicant:</strong> {reviewApp.studentName} ({reviewApp.studentId})
              </p>
              <p>
                <strong>Scheme:</strong> {reviewApp.schemeTitle}
              </p>
              <p>
                <strong>CGPA:</strong> {reviewApp.previous_gpa} | <strong>Income:</strong> ₹{' '}
                {reviewApp.annual_family_income.toLocaleString('en-IN')}
              </p>
              <p className="text-[#444651] italic">"{reviewApp.reason_for_application}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1">
                Committee Remarks / Decision Notes
              </label>
              <textarea
                rows={2}
                value={adminRemarks}
                onChange={e => setAdminRemarks(e.target.value)}
                placeholder="e.g. Verified income certificate and department marksheet."
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
              />
            </div>

            <div className="pt-2 flex justify-between gap-3">
              <button
                disabled={isReviewing}
                onClick={() => handleReviewAction('rejected')}
                className="flex-1 py-2 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/80 font-bold rounded-lg text-xs transition-colors"
              >
                Reject Application
              </button>
              <button
                disabled={isReviewing}
                onClick={() => handleReviewAction('approved')}
                className="flex-1 py-2 bg-[#006a61] text-white hover:bg-[#005a52] font-bold rounded-lg text-xs transition-colors"
              >
                Approve Grant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Scheme Modal */}
      {isAdmin && isCreatingScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#e1e3e4] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#191c1d]">Create Scholarship Scheme</h3>
                <p className="text-xs text-[#757682]">Define new institutional financial aid or grant endowment</p>
              </div>
              <button onClick={() => setIsCreatingScheme(false)} className="text-[#757682] hover:text-[#191c1d]">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateScheme} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Scheme Title *</label>
                  <input
                    type="text"
                    required
                    value={newSchemeTitle}
                    onChange={e => setNewSchemeTitle(e.target.value)}
                    placeholder="e.g. Dean's Academic Merit Fellowship"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Scheme Code</label>
                  <input
                    type="text"
                    value={newSchemeCode}
                    onChange={e => setNewSchemeCode(e.target.value)}
                    placeholder="e.g. DEAN-MERIT-2025"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Award Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newSchemeAmount}
                    onChange={e => setNewSchemeAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#006a61]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={newSchemeDeadline}
                    onChange={e => setNewSchemeDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#191c1d] mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={newSchemeCriteria}
                  onChange={e => setNewSchemeCriteria(e.target.value)}
                  placeholder="e.g. Minimum 8.5 CGPA with no active backlogs"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191c1d] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newSchemeDesc}
                  onChange={e => setNewSchemeDesc(e.target.value)}
                  placeholder="Details regarding endowment committee and criteria..."
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#f3f4f5]">
                <button
                  type="button"
                  onClick={() => setIsCreatingScheme(false)}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00236f] text-white font-bold rounded-lg hover:bg-[#1e3a8a]"
                >
                  Publish Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
