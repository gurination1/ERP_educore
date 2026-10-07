import React, { useState } from 'react';
import { User, DocumentRecord } from '../types';

interface TeacherDocumentsViewProps {
  currentUser: User | null;
}

const INITIAL_TEACHER_DOCS: DocumentRecord[] = [
  {
    id: 'doc-fac-001',
    doc_type_code: 'DOC_PHD_DEGREE',
    title: 'Ph.D. Doctorate Degree & Gazette Notification',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'sunita_rao_phd_certificate_iit_roorkee.pdf',
    file_size_kb: 4200,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Executive Directorate & Provost Office',
    verified_at: '2025-01-10T10:00:00Z',
    remarks: 'Doctor of Philosophy in Computer Science. AICTE & UGC Section 12(B) compliance checked.',
    sha256_hash: '3f786850e387550fdab836ed7e6dc881de23001b70e87038c013622150c3d33a',
    uploaded_at: '2025-01-08T09:00:00Z',
  },
  {
    id: 'doc-fac-002',
    doc_type_code: 'DOC_AICTE_FACULTY_ID',
    title: 'AICTE Mandatory Faculty ID & Portal Mandate',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'aicte_faculty_verification_1_9482810.pdf',
    file_size_kb: 1650,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Dr. Ramesh Chandra (Registrar)',
    verified_at: '2025-02-01T15:20:00Z',
    remarks: 'AICTE Faculty ID 1-9482810 mapped to MRSPTU portal.',
    sha256_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    uploaded_at: '2025-01-28T14:30:00Z',
  },
  {
    id: 'doc-fac-003',
    doc_type_code: 'DOC_SERVICE_BOOK',
    title: 'Institutional Service Book & Past Experience Relieving',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'service_book_thapar_institute_relieving.pdf',
    file_size_kb: 5120,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Registrar Office',
    verified_at: '2025-02-10T11:45:00Z',
    remarks: '4 Years 6 Months prior Assistant Professor service verified for pay-scale fixation.',
    sha256_hash: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    uploaded_at: '2025-02-05T10:15:00Z',
  },
  {
    id: 'doc-fac-004',
    doc_type_code: 'DOC_SCOPUS_REPRINT',
    title: 'Scopus / SCI First-Page Research Paper Reprints',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'ieee_trans_cloud_scopus_reprint_2024.pdf',
    file_size_kb: 2840,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Dean R&D / Research Council',
    verified_at: '2025-03-04T12:00:00Z',
    remarks: 'IEEE Transactions on Cloud Computing (Impact Factor: 6.8). Eligible for annual research incentive.',
    sha256_hash: '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
    uploaded_at: '2025-03-01T16:20:00Z',
  },
  {
    id: 'doc-fac-005',
    doc_type_code: 'DOC_PATENT_DEED',
    title: 'Indian Patent Office (IPO) Published Grant Deed',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'ipo_patent_grant_202311048291_iot_energy.pdf',
    file_size_kb: 3450,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Dean R&D / Research Council',
    verified_at: '2025-04-12T14:15:00Z',
    remarks: 'Patent Application No. 202311048291. System for Automated Edge Computing Energy Optimization.',
    sha256_hash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    uploaded_at: '2025-04-10T11:00:00Z',
  },
  {
    id: 'doc-fac-006',
    doc_type_code: 'DOC_FORM16',
    title: 'Annual Form 16 & Income Tax Return Certificate',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'form_16_ay_2025_26_signed_bursar.pdf',
    file_size_kb: 1200,
    mime_type: 'application/pdf',
    status: 'pending',
    remarks: 'Awaiting signature from Chief Accounts Officer.',
    sha256_hash: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    uploaded_at: '2026-06-15T09:30:00Z',
  },
];

export const TeacherDocumentsView: React.FC<TeacherDocumentsViewProps> = ({ currentUser }) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_TEACHER_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Upload state
  const [newTitle, setNewTitle] = useState('Conference Proceedings First Page');
  const [newType, setNewType] = useState('DOC_CONFERENCE');
  const [fileName, setFileName] = useState('');

  const isProvostOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      alert('Please enter or select a document file to upload.');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: DocumentRecord = {
        id: `doc-fac-${Date.now().toString().slice(-4)}`,
        doc_type_code: newType,
        title: newTitle,
        owner_id: currentUser?.id || 'usr-staff-01',
        owner_name: currentUser?.full_name || 'Prof. Sunita Rao',
        owner_role: 'staff',
        file_name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        file_size_kb: Math.floor(1200 + Math.random() * 3200),
        mime_type: 'application/pdf',
        status: 'pending',
        remarks: 'Uploaded by faculty. Awaiting Dean R&D / Provost attestation.',
        sha256_hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        uploaded_at: new Date().toISOString(),
      };
      setDocuments(prev => [newDoc, ...prev]);
      setIsUploading(false);
      setFileName('');
      setUploadSuccess(`Successfully deposited ${newDoc.title} to Faculty Regulatory Portfolio.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    }, 700);
  };

  const handleVerify = (docId: string, status: 'verified' | 'rejected') => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === docId
          ? {
              ...d,
              status,
              verified_by: currentUser?.full_name || 'Dean R&D & Academic Provost',
              verified_at: new Date().toISOString(),
              remarks: status === 'verified' ? 'Attested against university physical records & UGC gazette.' : 'Rejected: missing official signature or seal.',
            }
          : d
      )
    );
  };

  const filteredDocs = documents.filter(d => {
    if (filterType === 'all') return true;
    return d.doc_type_code === filterType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-950 to-[#00236f] text-white p-6 rounded-2xl shadow-md border border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-mono text-purple-200 mb-2 border border-white/10">
            <span className="material-symbols-outlined text-[14px]">school</span>
            <span>AICTE • UGC • NBA • NAAC COMPLIANCE PORTFOLIO</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Faculty & Teachers Credentials Vault</h1>
          <p className="text-xs text-purple-100 mt-1 max-w-2xl">
            Accreditation-grade digital locker storing verified Ph.D. degree awards, AICTE faculty identification, Scopus / SCI research publications, patents granted, and service books.
          </p>
        </div>

        {/* Accreditation Readiness Pills */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase block font-bold">NAAC Criteria 3</span>
            <span className="text-lg font-black text-amber-300">100% Attested</span>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase block font-bold">NBA Criteria 5</span>
            <span className="text-lg font-black text-emerald-300">SFR 1:15 Ready</span>
          </div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Grid: Upload Box + Documents Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deposit New Faculty Asset */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f3f4f5] pb-3">
            <span className="material-symbols-outlined text-purple-700 text-[22px]">workspace_premium</span>
            <div>
              <h2 className="text-sm font-bold text-[#191c1d]">Deposit Faculty Credential</h2>
              <p className="text-[10px] text-[#757682]">AICTE & University Affiliation Audit</p>
            </div>
          </div>

          <form onSubmit={handleSimulatedUpload} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                Credential Category *
              </label>
              <select
                value={newType}
                onChange={e => {
                  setNewType(e.target.value);
                  const titleMap: Record<string, string> = {
                    DOC_CONFERENCE: 'International Conference First Page Reprint',
                    DOC_BOOK_CHAPTER: 'Scopus Indexed Book Chapter (ISBN)',
                    DOC_CONSULTANCY: 'Industrial Consultancy Project Grant Deed',
                    DOC_FDP_CERT: 'AICTE ATAL FDP 1-Week Completion Certificate',
                    DOC_REVIEWER: 'SCI Journal Editorial Reviewer Certificate',
                  };
                  setNewTitle(titleMap[e.target.value] || 'Faculty Research Asset');
                }}
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium"
              >
                <option value="DOC_CONFERENCE">International Conference Proceeding (IEEE/Springer)</option>
                <option value="DOC_BOOK_CHAPTER">Book Chapter / Monograph (Scopus / ISBN)</option>
                <option value="DOC_CONSULTANCY">Industry Consultancy & Testing Report</option>
                <option value="DOC_FDP_CERT">AICTE ATAL / NPTEL FDP Certificate</option>
                <option value="DOC_REVIEWER">SCI / Scopus Journal Reviewer Honor</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                Document / Paper Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                Proof Document File (PDF)
              </label>
              <div className="border-2 border-dashed border-[#e1e3e4] rounded-xl p-4 text-center hover:bg-[#f8f9fa] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[28px] text-purple-600 mb-1">upload_file</span>
                <p className="text-[11px] font-medium text-[#191c1d]">Drop attested PDF or research reprint</p>
                <input
                  type="text"
                  placeholder="e.g. ieee_cloud_paper_reprint.pdf"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  className="mt-2.5 w-full px-2.5 py-1.5 text-[11px] bg-white border border-[#e1e3e4] rounded-lg text-center font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>{isUploading ? 'Securing & Anchoring...' : 'Deposit to Faculty Portfolio'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Faculty Dossier */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter Pills */}
          <div className="bg-white p-3 rounded-xl border border-[#e1e3e4] shadow-xs flex items-center justify-between gap-3 text-xs overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 'all', label: 'All Dossiers' },
                { id: 'DOC_PHD_DEGREE', label: 'Doctorate Degree' },
                { id: 'DOC_AICTE_FACULTY_ID', label: 'AICTE ID' },
                { id: 'DOC_SCOPUS_REPRINT', label: 'Scopus Reprints' },
                { id: 'DOC_PATENT_DEED', label: 'Patents' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    filterType === f.id
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-[#f3f4f5] text-[#444651] hover:bg-[#e1e3e4]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-[#757682] shrink-0">
              {filteredDocs.length} credential(s)
            </span>
          </div>

          {/* Documents Grid */}
          <div className="space-y-3">
            {filteredDocs.map(doc => {
              const isVerified = doc.status === 'verified';
              return (
                <div
                  key={doc.id}
                  className="bg-white p-4 rounded-xl border border-[#e1e3e4] hover:border-purple-300 transition-all shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">badge</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#191c1d]">{doc.title}</h3>
                        <p className="text-[10px] text-[#757682] font-mono mt-0.5">
                          {doc.file_name} • {(doc.file_size_kb / 1024).toFixed(2)} MB • Code: {doc.doc_type_code}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                      <span>{doc.status}</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#f8f9fa] rounded-lg text-[11px] text-[#444651] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#757682]">
                      <span>Faculty Member: <strong>{doc.owner_name}</strong></span>
                      <span>Deposited: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    {doc.remarks && <p className="text-[#191c1d] italic">“{doc.remarks}”</p>}
                    {doc.verified_by && (
                      <div className="text-[10px] text-purple-900 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-purple-600">verified</span>
                        <span>Attested by {doc.verified_by} on {new Date(doc.verified_at || '').toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#f3f4f5] text-[10px]">
                    <span className="font-mono text-[#757682] truncate max-w-[260px]">
                      SHA-256: {doc.sha256_hash.slice(0, 18)}...
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>

                      {isProvostOrAdmin && (
                        <>
                          <button
                            onClick={() => handleVerify(doc.id, 'verified')}
                            disabled={isVerified}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-md font-bold transition-colors cursor-pointer"
                          >
                            Provost Attest
                          </button>
                          <button
                            onClick={() => handleVerify(doc.id, 'rejected')}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-700 text-[24px]">verified</span>
                <div>
                  <h3 className="text-sm font-bold text-[#191c1d]">{selectedDoc.title}</h3>
                  <p className="text-[10px] text-[#757682] font-mono">{selectedDoc.file_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f3f4f5] text-[#757682] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#757682]">Credential Code:</span>
                <span className="font-mono font-bold text-purple-900">{selectedDoc.doc_type_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757682]">Appointed Faculty:</span>
                <span className="font-bold">{selectedDoc.owner_name} ({selectedDoc.owner_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757682]">Accreditation Status:</span>
                <span className="font-bold uppercase text-emerald-700">{selectedDoc.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757682]">Digest:</span>
                <span className="font-mono text-[10px]">{selectedDoc.sha256_hash.slice(0, 24)}...</span>
              </div>
              {selectedDoc.remarks && (
                <div className="pt-2 border-t border-purple-200">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Audit Remarks:</span>
                  <p className="mt-0.5 text-[#191c1d] italic">“{selectedDoc.remarks}”</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => alert(`Simulated downloading ${selectedDoc.file_name}`)}
                className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-bold text-[#444651] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download Certified PDF</span>
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-purple-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
