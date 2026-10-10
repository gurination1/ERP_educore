import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MasterState, MasterUserType, MasterDegree, MasterDocumentType } from '../types';

interface MasterTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterTablesModal: React.FC<MasterTablesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents'>('states');
  const [data, setData] = useState<{
    states: MasterState[];
    userTypes: MasterUserType[];
    degrees: MasterDegree[];
    documentTypes: MasterDocumentType[];
    universityStandard?: string;
    institutionGstCode?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const masterDepartments = [
    { code: 'CSE', name: 'Computer Science & Engineering', head: 'Dr. Hardeep Singh', facultyCount: 28, programs: 'B.Tech, M.Tech, BCA, MCA', type: 'Engineering & Technology' },
    { code: 'AGRI', name: 'Agriculture & Agronomy', head: 'Dr. Balwinder Singh', facultyCount: 22, programs: 'B.Sc (Hons) Agriculture, M.Sc Agronomy', type: 'Agricultural Sciences' },
    { code: 'MGMT', name: 'Management & Commerce', head: 'Dr. Meenakshi Sharma', facultyCount: 19, programs: 'MBA, BBA, B.Com (Hons)', type: 'Business & Management' },
    { code: 'ME', name: 'Mechanical Engineering', head: 'Er. Rajesh Kumar', facultyCount: 16, programs: 'B.Tech Mechanical, Robotics, CAD', type: 'Engineering & Technology' },
    { code: 'CE', name: 'Civil Engineering', head: 'Er. Harpreet Kaur', facultyCount: 14, programs: 'B.Tech Civil, Structural Design', type: 'Engineering & Technology' },
    { code: 'PHARM', name: 'Pharmaceutical Sciences', head: 'Dr. Surinder Pal', facultyCount: 18, programs: 'B.Pharm, D.Pharm, M.Pharm', type: 'Pharmacy & Health' },
    { code: 'SCI', name: 'Applied & Basic Sciences', head: 'Dr. Gurmeet Kaur', facultyCount: 15, programs: 'B.Sc Physics, Chemistry, Mathematics', type: 'Basic Sciences' },
  ];

  const masterInstitutions = [
    { code: '01', name: 'Baba Farid College of Engineering & Technology', affiliation: 'MRSPTU Affiliated (Autonomous)', type: 'Engineering & Technology', campus: 'Bathinda Main (Campus 01)' },
    { code: '02', name: 'Baba Farid College of Management & Technology', affiliation: 'Punjabi University Patiala (PUP)', type: 'Business & Management', campus: 'Bathinda Campus 02' },
    { code: '03', name: 'Baba Farid Degree College', affiliation: 'Punjabi University Patiala (PUP)', type: 'Humanities, Science & Commerce', campus: 'Bathinda Campus 03' },
    { code: '04', name: 'Baba Farid College of Agriculture', affiliation: 'Punjabi University Patiala (PUP)', type: 'Agricultural Sciences', campus: 'Bathinda Agri Research Center' },
  ];

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getMasterData()
        .then(res => {
          if (res.success) {
            setData(res as any);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] shadow-2xl border border-[#e1e3e4] flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#191c1d]">Tenant-Agnostic Master Relational System</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-[#00236f] border border-blue-200">
                UGC / UNIVERSITY CANONICAL
              </span>
            </div>
            <p className="text-xs text-[#757682]">
              Standardized master definitions consistent across technical institutions and affiliated university campuses.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#757682] hover:bg-[#e1e3e4] hover:text-[#191c1d] transition-all cursor-pointer"
          >
            <span className="font-bold text-[10px]">✕</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-[#e1e3e4] bg-white flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('states')}
            className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'states'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            GST State Codes (03 Punjab)
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'departments'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Departments (CSE, Agri, Mgmt)
          </button>
          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'institutions'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Institutional Types & Campuses
          </button>
          <button
            onClick={() => setActiveTab('userTypes')}
            className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'userTypes'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            User Type Hierarchy (1001 - 9001)
          </button>
          <button
            onClick={() => setActiveTab('degrees')}
            className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'degrees'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            CBCS Master Degrees
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Mandatory Documents Matrix
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fbfbfc]">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-xs text-[#757682]">
              Loading standardized master registry...
            </div>
          ) : !data ? (
            <div className="h-40 flex items-center justify-center text-xs text-[#757682]">
              Unable to load master data.
            </div>
          ) : activeTab === 'states' ? (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">GST State Code</th>
                    <th className="py-2.5 px-4">State / UT Name</th>
                    <th className="py-2.5 px-4">Short Code</th>
                    <th className="py-2.5 px-4">Classification</th>
                    <th className="py-2.5 px-4">Campus Quota Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {data.states.map(s => (
                    <tr key={s.gst_code} className={s.gst_code === '03' ? 'bg-amber-50/50' : 'hover:bg-[#f8f9fa]'}>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{s.gst_code}</td>
                      <td className="py-2.5 px-4 font-bold text-[#191c1d]">
                        {s.state_name}
                        {s.gst_code === '03' && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-bold">
                            PRIMARY CAMPUS STATE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#757682]">{s.state_short_code}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {s.is_union_territory ? 'Union Territory' : 'Full State'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#444651]">
                        {s.gst_code === '03' ? '85% Punjab Domicile Quota Eligible' : '15% All-India Open Quota'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'departments' ? (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Dept Code</th>
                    <th className="py-2.5 px-4">Department Name</th>
                    <th className="py-2.5 px-4">Academic Type</th>
                    <th className="py-2.5 px-4">Department Head</th>
                    <th className="py-2.5 px-4">Degree Programs Offered</th>
                    <th className="py-2.5 px-4 text-right">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {masterDepartments.map(d => (
                    <tr key={d.code} className="hover:bg-[#f8f9fa]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{d.code}</td>
                      <td className="py-2.5 px-4 font-bold text-[#191c1d]">{d.name}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#00236f] border border-blue-200">
                          {d.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">{d.head}</td>
                      <td className="py-2.5 px-4 text-[#757682]">{d.programs}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-right text-[#00236f]">{d.facultyCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'institutions' ? (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Inst Code</th>
                    <th className="py-2.5 px-4">Institution / Constituent College</th>
                    <th className="py-2.5 px-4">Affiliation Model</th>
                    <th className="py-2.5 px-4">Discipline Domain</th>
                    <th className="py-2.5 px-4">Campus Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {masterInstitutions.map(inst => (
                    <tr key={inst.code} className="hover:bg-[#f8f9fa]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{inst.code}</td>
                      <td className="py-2.5 px-4 font-bold text-[#191c1d]">{inst.name}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {inst.affiliation}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{inst.type}</td>
                      <td className="py-2.5 px-4 text-[#757682]">{inst.campus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'userTypes' ? (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Type Code</th>
                    <th className="py-2.5 px-4">Prefix</th>
                    <th className="py-2.5 px-4">Role Display Title</th>
                    <th className="py-2.5 px-4">UID Structural Format</th>
                    <th className="py-2.5 px-4">System Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {data.userTypes.map(u => (
                    <tr key={u.type_code} className={u.role_key === 'super_admin' ? 'bg-amber-50/60' : 'hover:bg-[#f8f9fa]'}>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{u.type_code}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{u.alpha_prefix}</td>
                      <td className="py-2.5 px-4 font-bold text-[#191c1d]">
                        {u.display_title}
                        {u.role_key === 'super_admin' && (
                          <span className="ml-2 text-amber-500">👑 APEX AUTHORITY</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#00236f]">
                        {u.type_code}-XX-03-01
                      </td>
                      <td className="py-2.5 px-4 text-[#757682]">{u.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'degrees' ? (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Degree Code</th>
                    <th className="py-2.5 px-4">Degree Full Name</th>
                    <th className="py-2.5 px-4">Level</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Statutory Body</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {data.degrees.map(d => (
                    <tr key={d.degree_code} className="hover:bg-[#f8f9fa]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{d.degree_code}</td>
                      <td className="py-2.5 px-4 font-bold text-[#191c1d]">{d.degree_name}</td>
                      <td className="py-2.5 px-4 capitalize">{d.level}</td>
                      <td className="py-2.5 px-4 font-mono">{d.duration_years} Years ({d.total_semesters} Semesters)</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-[#00236f] border border-blue-200">
                          {d.statutory_body}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Doc Code</th>
                    <th className="py-2.5 px-4">Certificate Title</th>
                    <th className="py-2.5 px-4">Mandatory Criteria</th>
                    <th className="py-2.5 px-4">Max Size</th>
                    <th className="py-2.5 px-4">Allowed Mime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {data.documentTypes.map(doc => (
                    <tr key={doc.doc_type_code} className="hover:bg-[#f8f9fa]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{doc.doc_type_code}</td>
                      <td className="py-2.5 px-4 font-bold text-[#191c1d]">{doc.title}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {doc.mandatory_for.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">{doc.max_file_size_mb} MB</td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-[#757682]">{doc.allowed_mime_types}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#757682]">
          <span>Standard: {data?.universityStandard || 'UGC / University CBCS Standard'}</span>
          <span>Institution: {data?.institutionGstCode || 'Punjab (03)'}</span>
        </div>
      </div>
    </div>
  );
};
