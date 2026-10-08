import React, { useState } from 'react';
import { safeGoBack } from '../utils/navigation';
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
    remarks: 'AICTE Faculty ID 1-9482810 mapped to statutory university portal.',
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
    file_size_kb: 8900,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Registrar & Establishment Section',
    verified_at: '2025-01-05T11:00:00Z',
    remarks: 'Previous 4.5 years experience as Assistant Professor vetted for CAS promotion criteria.',
    sha256_hash: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    uploaded_at: '2025-01-02T10:15:00Z',
  },
  {
    id: 'doc-fac-004',
    doc_type_code: 'DOC_SCOPUS_REPRINT',
    title: 'Q1 Scopus Journal First Page Reprint (IEEE Trans. Computers)',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'ieee_transactions_paper_vol42_2024.pdf',
    file_size_kb: 2100,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Dean Research & Consultancy',
    verified_at: '2025-03-01T16:45:00Z',
    remarks: 'Impact Factor 4.8. Indexed in Web of Science Core Collection & Scopus.',
    sha256_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    uploaded_at: '2025-02-28T12:00:00Z',
  },
  {
    id: 'doc-fac-005',
    doc_type_code: 'DOC_PATENT_DEED',
    title: 'Indian Patent Office (IPO) Published Patent Grant Deed',
    owner_id: 'usr-staff-01',
    owner_name: 'Prof. Sunita Rao',
    owner_role: 'staff',
    file_name: 'ipo_patent_grant_202411039821.pdf',
    file_size_kb: 3400,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'IPR Cell Convener & Provost',
    verified_at: '2025-04-12T10:30:00Z',
    remarks: 'Application #202411039821, Published in Official Patent Gazette #15/2024.',
    sha256_hash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    uploaded_at: '2025-04-10T14:15:00Z',
  },
  {
    id: 'doc-fac-006',
    doc_type_code: 'DOC_FORM_16',
    title: 'Income Tax Form 16 (Part A & B) TDS Certificate',
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
        file_size_kb: 1450,
        mime_type: 'application/pdf',
        status: 'pending',
        remarks: 'Directly submitted for Provost & R&D attestation.',
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
    <div className="space-y-3 animate-fadeIn text-xs">
      {/* Sleek Action Toolbar (Eliminates bloated purple hero banner) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <h2 className="font-extrabold text-sm text-[#00236f] tracking-tight">
            Faculty Credentials & Regulatory Portfolio
          </h2>
          <span className="text-[10px] text-slate-300 font-semibold">•</span>
          <span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
            AICTE • UGC • NBA • NAAC
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-[#00236f] border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            NAAC Criteria 3: 100% Attested
          </span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            NBA Criteria 5: SFR 1:15 Ready
          </span>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="font-bold text-[10px]">✓</span>
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Grid: Upload Box + Documents Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Deposit New Faculty Asset */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-xs font-bold text-[#00236f]">Deposit Faculty Credential</h2>
              <p className="text-[10px] text-slate-500">AICTE & University Affiliation Audit</p>
            </div>
            <span className="bg-[#00236f]/10 text-[#00236f] px-2 py-0.5 rounded-full text-[9px] font-bold font-mono">
              PORTFOLIO
            </span>
          </div>

          <form onSubmit={handleSimulatedUpload} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
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
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00236f]"
              >
                <option value="DOC_CONFERENCE">International Conference Proceeding (IEEE/Springer)</option>
                <option value="DOC_BOOK_CHAPTER">Book Chapter / Monograph (Scopus / ISBN)</option>
                <option value="DOC_CONSULTANCY">Industry Consultancy & Testing Report</option>
                <option value="DOC_FDP_CERT">AICTE ATAL / NPTEL FDP Certificate</option>
                <option value="DOC_REVIEWER">SCI / Scopus Journal Reviewer Honor</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Document / Paper Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00236f]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Proof Document File (PDF)
              </label>
              <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer">
                <p className="text-[10px] font-medium text-slate-700">Drop attested PDF or research reprint</p>
                <input
                  type="text"
                  placeholder="e.g. ieee_cloud_paper_reprint.pdf"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-md text-center font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isUploading ? 'Securing & Anchoring...' : 'Deposit to Faculty Portfolio'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Faculty Dossier */}
        <div className="lg:col-span-2 space-y-3">
          {/* Category Filter Pills */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2 text-xs overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
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
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                    filterType === f.id
                      ? 'bg-[#00236f] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-500 shrink-0">
              {filteredDocs.length} credential(s)
            </span>
          </div>

          {/* Documents Grid */}
          <div className="space-y-2.5">
            {filteredDocs.map(doc => {
              const isVerified = doc.status === 'verified';
              return (
                <div
                  key={doc.id}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00236f] border border-blue-200 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                        DOC
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#00236f]">{doc.title}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {doc.file_name} • {(doc.file_size_kb / 1024).toFixed(2)} MB • Code: {doc.doc_type_code}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                      <span>{doc.status}</span>
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50/80 rounded-lg text-[10px] text-slate-700 space-y-0.5 border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Faculty Member: <strong>{doc.owner_name}</strong></span>
                      <span>Deposited: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    {doc.remarks && <p className="text-slate-800 italic">“{doc.remarks}”</p>}
                    {doc.verified_by && (
                      <div className="text-[9px] text-[#00236f] font-semibold flex items-center gap-1">
                        <span className="font-bold">✓</span>
                        <span>Attested by {doc.verified_by} on {new Date(doc.verified_at || '').toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span className="font-mono text-slate-400 truncate max-w-[260px] text-[9px]">
                      SHA-256: {doc.sha256_hash.slice(0, 18)}...
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>

                      {isProvostOrAdmin && (
                        <>
                          <button
                            onClick={() => handleVerify(doc.id, 'verified')}
                            disabled={isVerified}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Provost Attest
                          </button>
                          <button
                            onClick={() => handleVerify(doc.id, 'rejected')}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#00236f] text-xs">DOC</span>
                <div>
                  <h3 className="text-xs font-bold text-[#00236f]">{selectedDoc.title}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedDoc.file_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <span className="font-bold text-[10px]">✕</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Credential Code:</span>
                <span className="font-mono font-bold text-[#00236f]">{selectedDoc.doc_type_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Appointed Faculty:</span>
                <span className="font-bold">{selectedDoc.owner_name} ({selectedDoc.owner_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accreditation Status:</span>
                <span className="font-bold uppercase text-emerald-700">{selectedDoc.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Digest:</span>
                <span className="font-mono text-[10px]">{selectedDoc.sha256_hash.slice(0, 24)}...</span>
              </div>
              {selectedDoc.remarks && (
                <div className="pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Audit Remarks:</span>
                  <p className="mt-0.5 text-slate-800 italic text-[11px]">“{selectedDoc.remarks}”</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => alert(`Simulated downloading ${selectedDoc.file_name}`)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Download Certified PDF</span>
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 bg-[#00236f] text-white rounded-lg text-xs font-bold cursor-pointer"
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
