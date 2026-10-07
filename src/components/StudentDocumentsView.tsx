import React, { useState } from 'react';
import { User, DocumentRecord } from '../types';

interface StudentDocumentsViewProps {
  currentUser: User | null;
}

const INITIAL_STUDENT_DOCS: DocumentRecord[] = [
  {
    id: 'doc-stu-001',
    doc_type_code: 'DOC_AADHAAR',
    title: 'UIDAI Aadhaar Card (National ID)',
    owner_id: 'usr-stu-aryan',
    owner_name: 'Aryan Sharma',
    owner_role: 'student',
    file_name: 'aryan_aadhaar_card_masked.pdf',
    file_size_kb: 1420,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Dr. Ramesh Chandra (Registrar)',
    verified_at: '2025-08-15T11:20:00Z',
    remarks: 'UIDAI barcode verified. Name matches 10th marksheet.',
    sha256_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    uploaded_at: '2025-08-12T09:14:00Z',
  },
  {
    id: 'doc-stu-002',
    doc_type_code: 'DOC_10TH',
    title: 'Class 10th Matriculation Certificate',
    owner_id: 'usr-stu-aryan',
    owner_name: 'Aryan Sharma',
    owner_role: 'student',
    file_name: 'cbse_10th_marksheet_2022.pdf',
    file_size_kb: 2180,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Harleen Kaur (Admissions Cell)',
    verified_at: '2025-08-15T14:10:00Z',
    remarks: 'DOB verified as 15-Nov-2005. 89.4% aggregate.',
    sha256_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    uploaded_at: '2025-08-12T09:18:00Z',
  },
  {
    id: 'doc-stu-003',
    doc_type_code: 'DOC_12TH',
    title: 'Class 12th Senior Secondary Marksheet (PCM)',
    owner_id: 'usr-stu-aryan',
    owner_name: 'Aryan Sharma',
    owner_role: 'student',
    file_name: 'pseb_12th_pcm_marksheet.pdf',
    file_size_kb: 3050,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Harleen Kaur (Admissions Cell)',
    verified_at: '2025-08-16T10:05:00Z',
    remarks: 'MRSPTU minimum 45% PCM eligibility criterion met (got 86.2%).',
    sha256_hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    uploaded_at: '2025-08-12T09:22:00Z',
  },
  {
    id: 'doc-stu-004',
    doc_type_code: 'DOC_DOMICILE',
    title: 'Punjab State Domicile Certificate (85% State Quota)',
    owner_id: 'usr-stu-aryan',
    owner_name: 'Aryan Sharma',
    owner_role: 'student',
    file_name: 'punjab_resident_certificate_bathinda.pdf',
    file_size_kb: 1840,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Dr. Ramesh Chandra (Registrar)',
    verified_at: '2025-08-17T16:30:00Z',
    remarks: 'Issued by Tehsildar, District Bathinda. Valid Punjab 85% quota.',
    sha256_hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    uploaded_at: '2025-08-13T11:45:00Z',
  },
  {
    id: 'doc-stu-005',
    doc_type_code: 'DOC_INCOME',
    title: 'Annual Family Income Certificate (PMS Scholarship)',
    owner_id: 'usr-stu-aryan',
    owner_name: 'Aryan Sharma',
    owner_role: 'student',
    file_name: 'annual_family_income_2025_26.pdf',
    file_size_kb: 950,
    mime_type: 'application/pdf',
    status: 'pending',
    remarks: 'Submitted for 2025-26 fee waiver review.',
    sha256_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    uploaded_at: '2026-09-01T08:30:00Z',
  },
  {
    id: 'doc-stu-006',
    doc_type_code: 'DOC_ANTI_RAGGING',
    title: 'UGC / AICTE Anti-Ragging Undertaking',
    owner_id: 'usr-stu-aryan',
    owner_name: 'Aryan Sharma',
    owner_role: 'student',
    file_name: 'anti_ragging_affidavit_aryan.pdf',
    file_size_kb: 720,
    mime_type: 'application/pdf',
    status: 'verified',
    verified_by: 'Proctorial Board Office',
    verified_at: '2025-08-20T12:00:00Z',
    remarks: 'Signed by student and legal guardian.',
    sha256_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    uploaded_at: '2025-08-19T14:10:00Z',
  },
];

export const StudentDocumentsView: React.FC<StudentDocumentsViewProps> = ({ currentUser }) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_STUDENT_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New Upload Form State
  const [uploadType, setUploadType] = useState('DOC_MIGRATION');
  const [uploadTitle, setUploadTitle] = useState('Migration / Character Certificate');
  const [fakeFileName, setFakeFileName] = useState('');

  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'staff';

  const handleSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fakeFileName) {
      alert('Please select or specify a document file to upload.');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: DocumentRecord = {
        id: `doc-stu-${Date.now().toString().slice(-4)}`,
        doc_type_code: uploadType,
        title: uploadTitle,
        owner_id: currentUser?.id || 'usr-stu-aryan',
        owner_name: currentUser?.full_name || 'Aryan Sharma',
        owner_role: 'student',
        file_name: fakeFileName.endsWith('.pdf') ? fakeFileName : `${fakeFileName}.pdf`,
        file_size_kb: Math.floor(800 + Math.random() * 2400),
        mime_type: 'application/pdf',
        status: 'pending',
        remarks: 'Uploaded by student. Awaiting institutional registrar verification.',
        sha256_hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        uploaded_at: new Date().toISOString(),
      };
      setDocuments(prev => [newDoc, ...prev]);
      setIsUploading(false);
      setFakeFileName('');
      setUploadSuccess(`Successfully uploaded ${newDoc.title} to secure compliance vault.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    }, 700);
  };

  const handleVerify = (docId: string, newStatus: 'verified' | 'rejected') => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === docId
          ? {
              ...d,
              status: newStatus,
              verified_by: currentUser?.full_name || 'Authorized Officer',
              verified_at: new Date().toISOString(),
              remarks: newStatus === 'verified' ? 'Verified against physical original records.' : 'Rejected: blur or illegible document.',
            }
          : d
      )
    );
  };

  const filteredDocs = documents.filter(d => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const pendingCount = documents.filter(d => d.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#00236f] via-[#0b3896] to-[#00236f] text-white p-6 rounded-2xl shadow-md border border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-mono text-cyan-200 mb-2 border border-white/10">
            
            <span>MRSPTU STATUTORY REPOSITORY • 256-BIT ENCRYPTED</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Student Regulatory Documents Vault</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl">
            Centralized institutional repository for Punjab 85% domicile quota verification, board marksheets, UIDAI Aadhaar authentication, and scholarship eligibility audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[10px] text-blue-200 block uppercase font-bold">Verified</span>
            <span className="text-xl font-black text-emerald-300">{verifiedCount} / {documents.length}</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[10px] text-blue-200 block uppercase font-bold">Pending Review</span>
            <span className="text-xl font-black text-amber-300">{pendingCount}</span>
          </div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="font-bold text-[10px]">✓</span>
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Main Grid: Upload Card + Document List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload New Document */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f3f4f5] pb-3">
            
            <div>
              <h2 className="text-sm font-bold text-[#191c1d]">Upload Compliance Document</h2>
              <p className="text-[10px] text-[#757682]">PDF, PNG, JPG (Max 5MB)</p>
            </div>
          </div>

          <form onSubmit={handleSimulatedUpload} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                Document Type *
              </label>
              <select
                value={uploadType}
                onChange={e => {
                  setUploadType(e.target.value);
                  const titleMap: Record<string, string> = {
                    DOC_MIGRATION: 'Migration / Character Certificate',
                    DOC_GAP: 'Gap Year Affidavit',
                    DOC_CASTE: 'Caste Certificate (SC/ST/OBC)',
                    DOC_MEDICAL: 'Medical Fitness Certificate',
                    DOC_HOSTEL_UNDERTAKING: 'Hostel Rules & Conduct Undertaking',
                  };
                  setUploadTitle(titleMap[e.target.value] || 'Regulatory Document');
                }}
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium"
              >
                <option value="DOC_MIGRATION">Migration / Transfer Certificate</option>
                <option value="DOC_GAP">Gap Year Affidavit (Stamp Paper)</option>
                <option value="DOC_CASTE">Caste Certificate (SC/ST/OBC)</option>
                <option value="DOC_MEDICAL">Medical Fitness Certificate</option>
                <option value="DOC_HOSTEL_UNDERTAKING">Hostel Undertaking & Dues Bond</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#191c1d] uppercase mb-1">
                Select File (PDF / Scanned Copy)
              </label>
              <div className="border-2 border-dashed border-[#e1e3e4] rounded-xl p-4 text-center hover:bg-[#f8f9fa] transition-colors cursor-pointer">
                
                <p className="text-[11px] font-medium text-[#191c1d]">Drag file here or click to browse</p>
                <p className="text-[9px] text-[#757682] mt-0.5">SHA-256 integrity hash generated automatically</p>
                <input
                  type="text"
                  placeholder="e.g. migration_certificate_verified.pdf"
                  value={fakeFileName}
                  onChange={e => setFakeFileName(e.target.value)}
                  className="mt-2.5 w-full px-2.5 py-1.5 text-[11px] bg-white border border-[#e1e3e4] rounded-lg text-center font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              
              <span>{isUploading ? 'Encrypting & Storing...' : 'Commit to Document Vault'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Document Roster & Audit Status */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#e1e3e4] shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              {['all', 'verified', 'pending', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs capitalize transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-[#00236f] text-white'
                      : 'bg-[#f3f4f5] text-[#444651] hover:bg-[#e1e3e4]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-[#757682]">
              Showing {filteredDocs.length} regulatory record(s)
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredDocs.map(doc => {
              const isVerified = doc.status === 'verified';
              return (
                <div
                  key={doc.id}
                  className="bg-white p-4 rounded-xl border border-[#e1e3e4] hover:border-[#00236f]/40 transition-all shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00236f] border border-blue-200 flex items-center justify-center shrink-0">
                        
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
                          : doc.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                      <span>{doc.status}</span>
                    </span>
                  </div>

                  {/* Verification & Remarks */}
                  <div className="p-2.5 bg-[#f8f9fa] rounded-lg text-[11px] text-[#444651] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#757682]">
                      <span>Owner: <strong>{doc.owner_name}</strong></span>
                      <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    {doc.remarks && <p className="text-[#191c1d]">“{doc.remarks}”</p>}
                    {doc.verified_by && (
                      <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                        <span className="font-bold text-[10px]">✓</span>
                        <span>Attested by {doc.verified_by} on {new Date(doc.verified_at || '').toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Integrity Hash & Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#f3f4f5] text-[10px]">
                    <span className="font-mono text-[#757682] truncate max-w-[260px]" title={doc.sha256_hash}>
                      SHA-256: {doc.sha256_hash.slice(0, 16)}...
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>

                      {isAdminOrStaff && (
                        <>
                          <button
                            onClick={() => handleVerify(doc.id, 'verified')}
                            disabled={isVerified}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-md font-bold transition-colors cursor-pointer"
                          >
                            Attest
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

      {/* Inspect Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[10px]">✓</span>
                <div>
                  <h3 className="text-sm font-bold text-[#191c1d]">{selectedDoc.title}</h3>
                  <p className="text-[10px] text-[#757682] font-mono">{selectedDoc.file_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f3f4f5] text-[#757682] cursor-pointer"
              >
                <span className="font-bold text-[10px]">✕</span>
              </button>
            </div>

            <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#757682]">Document Code:</span>
                <span className="font-mono font-bold text-[#00236f]">{selectedDoc.doc_type_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757682]">Candidate / Owner:</span>
                <span className="font-bold">{selectedDoc.owner_name} ({selectedDoc.owner_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757682]">Verification Status:</span>
                <span className="font-bold uppercase text-emerald-700">{selectedDoc.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757682]">Cryptographic Digest:</span>
                <span className="font-mono text-[10px]">{selectedDoc.sha256_hash.slice(0, 24)}...</span>
              </div>
              {selectedDoc.remarks && (
                <div className="pt-2 border-t border-[#e1e3e4]">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Attestation Remarks:</span>
                  <p className="mt-0.5 text-[#191c1d] italic">“{selectedDoc.remarks}”</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => alert(`Simulated downloading ${selectedDoc.file_name}`)}
                className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-bold text-[#444651] flex items-center gap-1 cursor-pointer"
              >
                <span className="font-bold text-[10px]">[DL]</span>
                <span>Download Vault Copy</span>
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-bold cursor-pointer"
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
