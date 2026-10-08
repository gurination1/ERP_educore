import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface PartnerPortalViewProps {
  currentUser: User | null;
}

export const PartnerPortalView: React.FC<PartnerPortalViewProps> = ({ currentUser }) => {
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerDetails, setPartnerDetails] = useState<any | null>(null);
  const [talentPool, setTalentPool] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'partners' | 'jobs' | 'talent' | 'applications'>('partners');
  const [loading, setLoading] = useState(false);

  // Filters
  const [talentMinCgpa, setTalentMinCgpa] = useState<number>(7.0);
  const [talentDept, setTalentDept] = useState('all');

  // New Job modal
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState({
    title: '',
    type: 'internship',
    stipend_salary: '₹ 20,000 / month',
    eligible_departments: 'CSE,ECE',
    min_cgpa: 7.0,
    description: '',
  });

  // New Partner modal
  const [showNewPartnerModal, setShowNewPartnerModal] = useState(false);
  const [newPartnerData, setNewPartnerData] = useState({
    firm_name: '',
    partner_type: 'Private Limited',
    pan_number: '',
    gst_number: '',
    tan_number: '',
    email: '',
    phone: '',
    address: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    const res = await api.getPartners();
    if (res.success && res.partners) {
      setPartners(res.partners);
      if (!selectedPartnerId && res.partners.length > 0) {
        setSelectedPartnerId(res.partners[0].id);
      }
    }
    setLoading(false);
  };

  const fetchPartnerDetails = async (id: string) => {
    const res = await api.getPartner(id);
    if (res.success && res.partner) {
      setPartnerDetails(res.partner);
    }
  };

  const fetchJobs = async () => {
    const res = await api.getPartnerJobs();
    if (res.success && res.jobs) {
      setAllJobs(res.jobs);
      if (!selectedJobId && res.jobs.length > 0) {
        setSelectedJobId(res.jobs[0].id);
      }
    }
  };

  const fetchTalent = async () => {
    const res = await api.getTalentPool(talentMinCgpa, talentDept !== 'all' ? talentDept : undefined);
    if (res.success && res.talentPool) {
      setTalentPool(res.talentPool);
    }
  };

  const fetchApplications = async (jobId: string) => {
    const res = await api.getPartnerApplications(jobId);
    if (res.success && res.applications) {
      setJobApplications(res.applications);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchJobs();
    fetchTalent();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerDetails(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  useEffect(() => {
    if (selectedJobId) {
      fetchApplications(selectedJobId);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchTalent();
  }, [talentMinCgpa, talentDept]);

  const handleCreateJob = async () => {
    if (!selectedPartnerId || !newJobData.title) return;
    const res = await api.createPartnerJob(selectedPartnerId, newJobData);
    if (res.success) {
      setShowNewJobModal(false);
      setFeedbackMsg(`Job posting "${newJobData.title}" published successfully!`);
      fetchJobs();
      if (selectedPartnerId) fetchPartnerDetails(selectedPartnerId);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleCreatePartner = async () => {
    if (!newPartnerData.firm_name || !newPartnerData.email || !newPartnerData.pan_number || !newPartnerData.gst_number) {
      alert('Firm Name, Email, PAN, and GST are mandatory.');
      return;
    }
    const res = await api.createPartner({
      partner: {
        firm_name: newPartnerData.firm_name,
        partner_type: newPartnerData.partner_type,
        pan_number: newPartnerData.pan_number,
        gst_number: newPartnerData.gst_number,
        tan_number: newPartnerData.tan_number || undefined,
        email: newPartnerData.email,
        phone: newPartnerData.phone,
        address: newPartnerData.address,
        is_active: true,
      },
      contact: newPartnerData.contact_name ? {
        contact_name: newPartnerData.contact_name,
        designation: 'University Relations Lead',
        email: newPartnerData.contact_email || newPartnerData.email,
        phone: newPartnerData.contact_phone || newPartnerData.phone,
        is_default: true,
      } : undefined,
    });

    if (res.success) {
      setShowNewPartnerModal(false);
      setFeedbackMsg(`Partner entity "${newPartnerData.firm_name}" onboarded!`);
      fetchPartners();
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    const res = await api.updatePartnerApplication(appId, status, `Reviewed by recruitment committee.`);
    if (res.success && selectedJobId) {
      fetchApplications(selectedJobId);
      setFeedbackMsg(`Application marked as ${status.toUpperCase()}.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-3 font-sans text-xs text-[#00236f]">
      {/* Sleek Action Toolbar (Saves 140px vertical space) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <h2 className="font-extrabold text-sm text-[#00236f] tracking-tight">
            Corporate Partners & Talent Share
          </h2>
          <span className="text-[10px] text-slate-300 font-semibold">•</span>
          <span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
            T&P Cell Hub
          </span>
          <span className="text-[10px] text-slate-500 hidden md:inline-flex">
            Statutory PAN/GST/TAN verified entities & campus openings
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewPartnerModal(true)}
            className="h-7 px-3 bg-white hover:bg-slate-50 text-[#00236f] border border-slate-200 font-bold rounded-lg text-[11px] transition cursor-pointer shadow-2xs"
          >
            + Register Partner
          </button>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="h-7 px-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg text-[11px] transition shadow-2xs cursor-pointer"
          >
            + Post Job / Internship
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-medium flex items-center gap-2 shadow-xs">
          <span className="font-bold text-[10px] bg-emerald-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center">✓</span>
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex p-1.5 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-black/[0.06] overflow-x-auto gap-1 shadow-2xs">
        {[
          { id: 'partners', label: 'Partner Entities & Contracts' },
          { id: 'jobs', label: `Campus Openings (${allJobs.length})` },
          { id: 'talent', label: `Verified Talent Pool (${talentPool.length})` },
          { id: 'applications', label: 'Candidate Applications' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === s.id
                ? 'bg-white text-[#00236f] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: PARTNERS */}
      {activeSection === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 apple-glass-card rounded-2xl p-5 border border-black/[0.06] space-y-3 shadow-sm">
            <span className="font-semibold text-[#00236f] block border-b border-black/[0.06] pb-2 text-xs">Registered Corporate Partners</span>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {partners.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPartnerId(p.id)}
                  className={`p-2.5 rounded border cursor-pointer transition ${
                    selectedPartnerId === p.id
                      ? 'border-[#00236f] bg-[#00236f]/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#00236f] text-[11px]">{p.firm_name}</span>
                    <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                      {p.partner_type}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 flex justify-between">
                    <span>PAN: <strong className="font-mono">{p.pan_number}</strong></span>
                    <span>GSTIN: <strong className="font-mono">{p.gst_number}</strong></span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 pt-1 border-t flex justify-between">
                    <span>PRIMARY: {p.default_contact?.contact_name || 'HR Team'}</span>
                    <span>ACTIVE POSTINGS: {p.active_jobs_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 apple-glass-card rounded-2xl p-5 border border-black/[0.06] space-y-4 shadow-sm">
            {partnerDetails ? (
              <>
                <div className="border-b pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-[13px] text-[#00236f]">{partnerDetails.firm_name}</h3>
                    <p className="text-[10px] text-gray-500">{partnerDetails.address}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    MOU STATUS: ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded border text-[10px]">
                  <div>
                    <span className="text-gray-500 block">ENTITY TYPE:</span>
                    <span className="font-bold text-gray-800">{partnerDetails.partner_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">PAN NUMBER:</span>
                    <span className="font-mono font-bold text-gray-800">{partnerDetails.pan_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">GST NUMBER:</span>
                    <span className="font-mono font-bold text-gray-800">{partnerDetails.gst_number}</span>
                  </div>
                  {partnerDetails.tan_number && (
                    <div>
                      <span className="text-gray-500 block">TAN NUMBER:</span>
                      <span className="font-mono font-bold text-gray-800">{partnerDetails.tan_number}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block">EMAIL:</span>
                    <span className="font-bold text-gray-800">{partnerDetails.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">PHONE:</span>
                    <span className="font-bold text-gray-800">{partnerDetails.phone}</span>
                  </div>
                </div>

                {/* Contacts Multi-Table */}
                <div className="space-y-1.5">
                  <span className="font-bold text-[#00236f] block">KEY CORPORATE LIAISONS & CONTACTS:</span>
                  {partnerDetails.contacts?.map((c: any) => (
                    <div key={c.id} className="border p-2 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{c.contact_name}</span>
                          <span className="text-gray-500">({c.designation})</span>
                          {c.is_default && (
                            <span className="bg-[#00236f] text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500">{c.email} | {c.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bank Accounts Multi-Table */}
                <div className="space-y-1.5">
                  <span className="font-bold text-[#00236f] block">STIPEND ESCROW / CORPORATE BANK ACCOUNTS:</span>
                  {partnerDetails.bankAccounts?.map((b: any) => (
                    <div key={b.id} className="border p-2 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{b.bank_name}</span>
                          {b.is_default && (
                            <span className="bg-[#00236f] text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-gray-600">A/C: {b.account_number} | IFSC: {b.ifsc_code} ({b.branch_name})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">Select a partner to inspect details.</div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: CAMPUS OPENINGS */}
      {activeSection === 'jobs' && (
        <div className="apple-glass-card rounded-2xl p-5 border border-black/[0.06] space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-black/[0.06] pb-3">
            <span className="font-semibold text-[#00236f] text-sm">Active On-Campus & Remote Recruitment Drives</span>
            <span className="text-slate-500 text-xs">Total: {allJobs.length} Openings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allJobs.map(job => (
              <div key={job.id} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[12px] text-[#00236f]">{job.title}</h4>
                    <span className="text-[10px] text-gray-600 font-semibold">{job.partner_name}</span>
                  </div>
                  <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                    {job.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] bg-white p-2 rounded border">
                  <div>
                    <span className="text-gray-500 block">COMPENSATION / STIPEND:</span>
                    <strong className="text-gray-800">{job.stipend_salary}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">MINIMUM CGPA REQUIRED:</span>
                    <strong className="text-gray-800">{job.min_cgpa} CGPA</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block">ELIGIBLE DEPARTMENTS:</span>
                    <span className="font-mono text-gray-700">{job.eligible_departments}</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-600 line-clamp-2">{job.description}</p>

                <div className="border-t pt-2 flex justify-between items-center text-[10px]">
                  <span>APPLICANTS: <strong>{job.applications_count}</strong></span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setActiveSection('applications');
                      }}
                      className="border border-[#00236f] text-[#00236f] px-2 py-0.5 rounded font-bold hover:bg-[#00236f]/5"
                    >
                      [VIEW APPLICANTS]
                    </button>
                    {currentUser?.role === 'student' && (
                      <button
                        onClick={async () => {
                          const res = await api.applyPartnerJob(job.id, {});
                          if (res.success) {
                            setFeedbackMsg(`Application submitted for ${job.title}!`);
                            fetchJobs();
                            setTimeout(() => setFeedbackMsg(null), 5000);
                          }
                        }}
                        className="bg-[#00236f] text-white px-2 py-0.5 rounded font-bold hover:bg-[#00236f]/90"
                      >
                        [APPLY NOW]
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: TALENT POOL */}
      {activeSection === 'talent' && (
        <div className="apple-glass-card rounded-2xl p-5 border border-black/[0.06] space-y-4 shadow-sm">
          <div className="flex flex-wrap justify-between items-center border-b border-black/[0.06] pb-3 gap-2">
            <div>
              <span className="font-semibold text-[#00236f] text-sm">Verified Student Talent Pool & Academic Dossier</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Shared directly with authorized corporate recruiters. Academic records certified by Institutional Provost.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <div>
                <span className="text-gray-500 font-semibold mr-1">MIN CGPA:</span>
                <select
                  value={talentMinCgpa}
                  onChange={e => setTalentMinCgpa(parseFloat(e.target.value))}
                  className="border rounded p-1"
                >
                  <option value={6.0}>6.0+ CGPA</option>
                  <option value={7.0}>7.0+ CGPA (FIRST CLASS)</option>
                  <option value={8.0}>8.0+ CGPA (DISTINCTION)</option>
                  <option value={8.5}>8.5+ CGPA (TOP TIER)</option>
                </select>
              </div>

              <div>
                <span className="text-gray-500 font-semibold mr-1">DEPT:</span>
                <select
                  value={talentDept}
                  onChange={e => setTalentDept(e.target.value)}
                  className="border rounded p-1"
                >
                  <option value="all">ALL DEPARTMENTS</option>
                  <option value="CSE">COMPUTER SCIENCE</option>
                  <option value="AGRI">AGRICULTURE</option>
                  <option value="CE">CIVIL</option>
                  <option value="ME">MECHANICAL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {talentPool.map(stu => (
              <div key={stu.id} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[11px] text-[#00236f]">{stu.full_name}</h4>
                    <span className="font-mono text-[9px] text-gray-500">{stu.student_id}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    {stu.cgpa} CGPA
                  </span>
                </div>

                <div className="text-[10px] space-y-1 bg-white p-2 rounded border">
                  <div className="flex justify-between">
                    <span className="text-gray-500">COURSE:</span>
                    <strong className="text-gray-800">{stu.course_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SEMESTER:</span>
                    <span>SEM {stu.current_semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ATTENDANCE:</span>
                    <span>{stu.attendance_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CREDENTIALS:</span>
                    <span className="text-emerald-700 font-bold">
                      {stu.documents_verified ? '[VERIFIED]' : '[PENDING]'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-1.5 flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">10TH: {stu.tenth_percentage}% | 12TH: {stu.twelfth_percentage}%</span>
                  <button className="text-[#00236f] font-bold hover:underline">
                    [VIEW TRANSCRIPT]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: APPLICATIONS */}
      {activeSection === 'applications' && (
        <div className="apple-glass-card rounded-2xl p-5 border border-black/[0.06] space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-black/[0.06] pb-3">
            <span className="font-semibold text-[#00236f] text-sm">Campus Candidate Applications</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">Filter by Opening:</span>
              <select
                value={selectedJobId || ''}
                onChange={e => setSelectedJobId(e.target.value)}
                className="border p-1 rounded text-[10px]"
              >
                {allJobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.partner_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {jobApplications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No candidate applications submitted for this opening yet.
              </div>
            ) : (
              jobApplications.map(app => (
                <div key={app.id} className="border p-3 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#00236f] text-[11px]">{app.student_name}</span>
                      <span className="bg-gray-200 text-gray-800 px-1.5 py-0.2 rounded font-mono">
                        {app.cgpa} CGPA
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                          app.status === 'selected'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'shortlisted'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1 italic">Notes: {app.remarks || 'Standard application dossier.'}</p>
                    <span className="text-gray-400 text-[9px]">Applied On: {app.applied_at}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateAppStatus(app.id, 'shortlisted')}
                      className="border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 px-2 py-1 rounded font-bold"
                    >
                      [SHORTLIST]
                    </button>
                    <button
                      onClick={() => handleUpdateAppStatus(app.id, 'selected')}
                      className="border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-1 rounded font-bold"
                    >
                      [SELECT / OFFER]
                    </button>
                    <button
                      onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                      className="border border-rose-600 text-rose-700 bg-white hover:bg-rose-50 px-2 py-1 rounded font-bold"
                    >
                      [REJECT]
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Post New Job */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-md p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">POST CAMPUS RECRUITMENT OPENING</span>
              <button onClick={() => setShowNewJobModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block font-semibold mb-0.5">JOB / INTERNSHIP TITLE *:</label>
                <input
                  type="text"
                  placeholder="e.g. Associate Cloud Engineer"
                  value={newJobData.title}
                  onChange={e => setNewJobData({ ...newJobData, title: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5">TYPE:</label>
                  <select
                    value={newJobData.type}
                    onChange={e => setNewJobData({ ...newJobData, type: e.target.value })}
                    className="w-full border p-1.5 rounded"
                  >
                    <option value="internship">INTERNSHIP</option>
                    <option value="full_time">FULL-TIME EMPLOYMENT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">STIPEND / CTC:</label>
                  <input
                    type="text"
                    value={newJobData.stipend_salary}
                    onChange={e => setNewJobData({ ...newJobData, stipend_salary: e.target.value })}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5">ELIGIBLE DEPTS:</label>
                  <input
                    type="text"
                    value={newJobData.eligible_departments}
                    onChange={e => setNewJobData({ ...newJobData, eligible_departments: e.target.value })}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">MIN CGPA:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newJobData.min_cgpa}
                    onChange={e => setNewJobData({ ...newJobData, min_cgpa: parseFloat(e.target.value) })}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-0.5">DESCRIPTION & SKILLS:</label>
                <textarea
                  rows={3}
                  value={newJobData.description}
                  onChange={e => setNewJobData({ ...newJobData, description: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowNewJobModal(false)}
                className="px-3 py-1 border rounded text-gray-600"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateJob}
                className="px-3 py-1 bg-[#00236f] text-white font-bold rounded"
              >
                PUBLISH OPENING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register New Partner Entity */}
      {showNewPartnerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-lg p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">REGISTER CORPORATE / HIRING PARTNER</span>
              <button onClick={() => setShowNewPartnerModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-0.5">FIRM / ENTITY NAME *:</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Consultancy Services"
                  value={newPartnerData.firm_name}
                  onChange={e => setNewPartnerData({ ...newPartnerData, firm_name: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-0.5">PARTNER ENTITY TYPE:</label>
                <select
                  value={newPartnerData.partner_type}
                  onChange={e => setNewPartnerData({ ...newPartnerData, partner_type: e.target.value })}
                  className="w-full border p-1.5 rounded"
                >
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="NGO">NGO / Trust</option>
                  <option value="MNC">Multinational Corporation (MNC)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-0.5">PAN NUMBER *:</label>
                <input
                  type="text"
                  placeholder="AAACT1234F"
                  value={newPartnerData.pan_number}
                  onChange={e => setNewPartnerData({ ...newPartnerData, pan_number: e.target.value })}
                  className="w-full border p-1.5 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-0.5">GST NUMBER *:</label>
                <input
                  type="text"
                  placeholder="03AAACT1234F1Z5"
                  value={newPartnerData.gst_number}
                  onChange={e => setNewPartnerData({ ...newPartnerData, gst_number: e.target.value })}
                  className="w-full border p-1.5 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5">CORPORATE EMAIL *:</label>
                <input
                  type="email"
                  value={newPartnerData.email}
                  onChange={e => setNewPartnerData({ ...newPartnerData, email: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-0.5">PHONE NUMBER:</label>
                <input
                  type="text"
                  value={newPartnerData.phone}
                  onChange={e => setNewPartnerData({ ...newPartnerData, phone: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold mb-0.5">REGISTERED ADDRESS:</label>
                <input
                  type="text"
                  value={newPartnerData.address}
                  onChange={e => setNewPartnerData({ ...newPartnerData, address: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5">LIAISON OFFICER NAME:</label>
                <input
                  type="text"
                  value={newPartnerData.contact_name}
                  onChange={e => setNewPartnerData({ ...newPartnerData, contact_name: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-0.5">LIAISON PHONE:</label>
                <input
                  type="text"
                  value={newPartnerData.contact_phone}
                  onChange={e => setNewPartnerData({ ...newPartnerData, contact_phone: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowNewPartnerModal(false)}
                className="px-3 py-1 border rounded text-gray-600"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreatePartner}
                className="px-3 py-1 bg-[#00236f] text-white font-bold rounded"
              >
                REGISTER PARTNER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
