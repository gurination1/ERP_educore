import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { MasterState, MasterUserType, MasterDegree, MasterDocumentType, MasterDepartment, MasterInstitutionType, MasterEmployeeStatus } from '../types';
import { Crown, Plus, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

interface MasterTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents';
  isEmbeddedView?: boolean;
}

export const MasterTablesModal: React.FC<MasterTablesModalProps> = ({ isOpen, onClose, initialTab, isEmbeddedView = false }) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents' | null;
  const [activeTab, setActiveTab] = useState<'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents'>(urlTab || initialTab || 'states');
  
  const [data, setData] = useState<{
    states: MasterState[];
    userTypes: MasterUserType[];
    degrees: MasterDegree[];
    documentTypes: MasterDocumentType[];
    departments?: MasterDepartment[];
    institutionTypes?: MasterInstitutionType[];
    employeeStatuses?: MasterEmployeeStatus[];
    universityStandard?: string;
    institutionGstCode?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for adding records
  const [stateForm, setStateForm] = useState({ gst_code: '', state_name: '', state_short_code: '', is_union_territory: false });
  const [deptForm, setDeptForm] = useState({ dept_code: '', dept_name: '', head_of_dept: '', established_year: 2025, tags: 'Engineering, UG, AI' });
  const [instForm, setInstForm] = useState({ code: '', name: '', regulatory_authority: 'AICTE / MRSPTU', description: '' });
  const [degreeForm, setDegreeForm] = useState({ degree_code: '', degree_name: '', level: 'undergraduate', duration_years: 4, total_semesters: 8, statutory_body: 'AICTE' });

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [urlTab, initialTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getMasterData()
        .then(res => {
          if (res.success) {
            setData((res.data && res.data.states) ? res.data : (res as any));
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (activeTab === 'states') {
        const res = await api.addMasterState(stateForm);
        if (res.success) {
          setData(prev => prev ? { ...prev, states: [...(prev.states || []), res.state] } : null);
          setFeedback({ type: 'success', message: `GST State ${stateForm.state_name} (${stateForm.gst_code}) registered into Master Tables.` });
          setStateForm({ gst_code: '', state_name: '', state_short_code: '', is_union_territory: false });
          setShowAddForm(false);
        }
      } else if (activeTab === 'departments') {
        const res = await api.addMasterDepartment({
          dept_code: deptForm.dept_code.toUpperCase(),
          dept_name: deptForm.dept_name,
          head_of_dept: deptForm.head_of_dept,
          established_year: Number(deptForm.established_year) || 2025,
          tags: deptForm.tags.split(',').map(s => s.trim()).filter(Boolean),
          is_active: true,
        });
        if (res.success) {
          setData(prev => prev ? { ...prev, departments: [...(prev.departments || []), res.department] } : null);
          setFeedback({ type: 'success', message: `Department ${deptForm.dept_name} (${deptForm.dept_code}) added to Master Architecture.` });
          setDeptForm({ dept_code: '', dept_name: '', head_of_dept: '', established_year: 2025, tags: 'Engineering, UG, AI' });
          setShowAddForm(false);
        }
      } else if (activeTab === 'institutions') {
        const res = await api.addMasterInstitutionType(instForm);
        if (res.success) {
          setData(prev => prev ? { ...prev, institutionTypes: [...(prev.institutionTypes || []), res.institutionType] } : null);
          setFeedback({ type: 'success', message: `Institution Type ${instForm.name} registered.` });
          setInstForm({ code: '', name: '', regulatory_authority: 'AICTE / MRSPTU', description: '' });
          setShowAddForm(false);
        }
      } else if (activeTab === 'degrees') {
        const res = await api.addMasterDegree(degreeForm);
        if (res.success) {
          setData(prev => prev ? { ...prev, degrees: [...(prev.degrees || []), res.degree] } : null);
          setFeedback({ type: 'success', message: `Degree Program ${degreeForm.degree_name} added.` });
          setDegreeForm({ degree_code: '', degree_name: '', level: 'undergraduate', duration_years: 4, total_semesters: 8, statutory_body: 'AICTE' });
          setShowAddForm(false);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add master record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const states = data?.states || [];
  const departments = data?.departments || [
    { id: 'dept-cse', dept_code: 'CSE', dept_name: 'Computer Science & Engineering', head_of_dept: 'Dr. Hardeep Singh', established_year: 2005, is_active: true, tags: ['Engineering', 'IT', 'Software', 'AI'] },
    { id: 'dept-agri', dept_code: 'AGRI', dept_name: 'Agriculture & Agronomy', head_of_dept: 'Dr. Balwinder Singh', established_year: 2012, is_active: true, tags: ['Agricultural Sciences', 'Soil Science'] },
    { id: 'dept-mgmt', dept_code: 'MGMT', dept_name: 'Management & Commerce', head_of_dept: 'Dr. Meenakshi Sharma', established_year: 2008, is_active: true, tags: ['Business', 'Fintech', 'HR'] },
    { id: 'dept-me', dept_code: 'ME', dept_name: 'Mechanical Engineering', head_of_dept: 'Er. Rajesh Kumar', established_year: 2006, is_active: true, tags: ['Engineering', 'Robotics', 'CAD'] },
    { id: 'dept-ce', dept_code: 'CE', dept_name: 'Civil Engineering', head_of_dept: 'Er. Harpreet Kaur', established_year: 2007, is_active: true, tags: ['Engineering', 'Structures'] },
    { id: 'dept-pharm', dept_code: 'PHARM', dept_name: 'Pharmaceutical Sciences', head_of_dept: 'Dr. Surinder Pal', established_year: 2015, is_active: true, tags: ['Pharmacy', 'Clinical'] },
  ];
  const institutions = data?.institutionTypes || [
    { code: 'ENG_COLLEGE', name: 'Engineering & Technology College', regulatory_authority: 'AICTE / MRSPTU', description: 'Technical institution imparting engineering and applied computer science degrees' },
    { code: 'MGMT_INST', name: 'Management & Business Institute', regulatory_authority: 'AICTE / UGC', description: 'Business school offering MBA, BBA, and commerce degrees' },
    { code: 'AGRI_COLLEGE', name: 'College of Agriculture & Agronomy', regulatory_authority: 'ICAR / PAU Standard', description: 'Agricultural degree programs with research farms' },
    { code: 'PHARM_COLLEGE', name: 'College of Pharmaceutical Sciences', regulatory_authority: 'PCI (Pharmacy Council of India)', description: 'Pharmaceutical degree and clinical research campus' },
  ];
  const degrees = data?.degrees || [];
  const userTypes = data?.userTypes || [];
  const docTypes = data?.documentTypes || [];

  const content = (
    <div className={`bg-white rounded-2xl w-full ${isEmbeddedView ? 'min-h-[70vh] border border-slate-200/90 shadow-sm' : 'max-w-4xl h-[85vh] shadow-2xl border border-[#e1e3e4]'} animate-scaleUp flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between shrink-0">
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
        <div className="flex items-center gap-2">
          {['states', 'departments', 'institutions', 'degrees'].includes(activeTab) && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-[#00236f] hover:bg-[#001744] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showAddForm ? 'Cancel' : '+ Add Record'}</span>
            </button>
          )}
          {!isEmbeddedView && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#757682] hover:bg-[#e1e3e4] hover:text-[#191c1d] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="px-6 border-b border-[#e1e3e4] bg-white flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => { setActiveTab('states'); setShowAddForm(false); }}
          className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'states'
              ? 'border-[#00236f] text-[#00236f]'
              : 'border-transparent text-[#757682] hover:text-[#191c1d]'
          }`}
        >
          <span>GST State Codes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-mono font-bold text-slate-600">{states.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('departments'); setShowAddForm(false); }}
          className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'departments'
              ? 'border-[#00236f] text-[#00236f]'
              : 'border-transparent text-[#757682] hover:text-[#191c1d]'
          }`}
        >
          <span>Departments</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-mono font-bold text-slate-600">{departments.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('institutions'); setShowAddForm(false); }}
          className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'institutions'
              ? 'border-[#00236f] text-[#00236f]'
              : 'border-transparent text-[#757682] hover:text-[#191c1d]'
          }`}
        >
          <span>Institutional Types</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-mono font-bold text-slate-600">{institutions.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('userTypes'); setShowAddForm(false); }}
          className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'userTypes'
              ? 'border-[#00236f] text-[#00236f]'
              : 'border-transparent text-[#757682] hover:text-[#191c1d]'
          }`}
        >
          <span>User Type Hierarchy</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-mono font-bold text-slate-600">{userTypes.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('degrees'); setShowAddForm(false); }}
          className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'degrees'
              ? 'border-[#00236f] text-[#00236f]'
              : 'border-transparent text-[#757682] hover:text-[#191c1d]'
          }`}
        >
          <span>CBCS Master Degrees</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-mono font-bold text-slate-600">{degrees.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('documents'); setShowAddForm(false); }}
          className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-[#00236f] text-[#00236f]'
              : 'border-transparent text-[#757682] hover:text-[#191c1d]'
          }`}
        >
          <span>Mandatory Documents</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-mono font-bold text-slate-600">{docTypes.length}</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#fbfbfc] space-y-4">
        {/* Inline Add Record Drawer Form */}
        {showAddForm && (
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm animate-fadeIn space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-[#00236f] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00236f]" />
                <span>Add Record to Master Table: {activeTab.toUpperCase()}</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-500">Universal Master DB Sync</span>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3">
              {activeTab === 'states' && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">GST State Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 08"
                      value={stateForm.gst_code}
                      onChange={e => setStateForm({ ...stateForm, gst_code: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">State / UT Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajasthan"
                      value={stateForm.state_name}
                      onChange={e => setStateForm({ ...stateForm, state_name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Short Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RJ"
                      value={stateForm.state_short_code}
                      onChange={e => setStateForm({ ...stateForm, state_short_code: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_ut"
                      checked={stateForm.is_union_territory}
                      onChange={e => setStateForm({ ...stateForm, is_union_territory: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f]"
                    />
                    <label htmlFor="is_ut" className="font-semibold text-slate-700 cursor-pointer select-none">
                      Union Territory (UT)
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'departments' && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Dept Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI_DS"
                      value={deptForm.dept_code}
                      onChange={e => setDeptForm({ ...deptForm, dept_code: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Department Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Artificial Intelligence & Data Science"
                      value={deptForm.dept_name}
                      onChange={e => setDeptForm({ ...deptForm, dept_name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Department Head</label>
                    <input
                      type="text"
                      placeholder="Dr. Harpreet Singh"
                      value={deptForm.head_of_dept}
                      onChange={e => setDeptForm({ ...deptForm, head_of_dept: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Established Year</label>
                    <input
                      type="number"
                      value={deptForm.established_year}
                      onChange={e => setDeptForm({ ...deptForm, established_year: parseInt(e.target.value) || 2025 })}
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'institutions' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Type Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POLYTECHNIC"
                      value={instForm.code}
                      onChange={e => setInstForm({ ...instForm, code: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Institution Type Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Polytechnic & Diploma Institute"
                      value={instForm.name}
                      onChange={e => setInstForm({ ...instForm, name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Regulatory Authority</label>
                    <input
                      type="text"
                      placeholder="AICTE / PSBTE"
                      value={instForm.regulatory_authority}
                      onChange={e => setInstForm({ ...instForm, regulatory_authority: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'degrees' && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Degree Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BTECH_AIDS"
                      value={degreeForm.degree_code}
                      onChange={e => setDegreeForm({ ...degreeForm, degree_code: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Degree Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech in Artificial Intelligence"
                      value={degreeForm.degree_name}
                      onChange={e => setDegreeForm({ ...degreeForm, degree_name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Duration & Semesters</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Years"
                        value={degreeForm.duration_years}
                        onChange={e => setDegreeForm({ ...degreeForm, duration_years: parseInt(e.target.value) || 4 })}
                        className="w-1/2 p-2 bg-slate-50 border rounded-lg font-mono focus:bg-white focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Semesters"
                        value={degreeForm.total_semesters}
                        onChange={e => setDegreeForm({ ...degreeForm, total_semesters: parseInt(e.target.value) || 8 })}
                        className="w-1/2 p-2 bg-slate-50 border rounded-lg font-mono focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Statutory Body</label>
                    <input
                      type="text"
                      placeholder="AICTE / UGC"
                      value={degreeForm.statutory_body}
                      onChange={e => setDegreeForm({ ...degreeForm, statutory_body: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#00236f] hover:bg-[#001744] text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Commit to Master DB'}
                </button>
              </div>
            </form>
          </div>
        )}

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
                {states.map(s => (
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
                  <th className="py-2.5 px-4">Department Head</th>
                  <th className="py-2.5 px-4">Established Year</th>
                  <th className="py-2.5 px-4">Tags</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {departments.map((d: any) => (
                  <tr key={d.dept_code || d.id} className="hover:bg-[#f8f9fa]">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{d.dept_code}</td>
                    <td className="py-2.5 px-4 font-bold text-[#191c1d]">{d.dept_name}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">{d.head_of_dept || '—'}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{d.established_year || 2020}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(d.tags) ? d.tags : typeof d.tags_json === 'string' ? JSON.parse(d.tags_json) : []).slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-[#00236f] border border-blue-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
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
                  <th className="py-2.5 px-4">Institution / Constituent Type</th>
                  <th className="py-2.5 px-4">Regulatory Authority</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {institutions.map((inst: any) => (
                  <tr key={inst.code} className="hover:bg-[#f8f9fa]">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{inst.code}</td>
                    <td className="py-2.5 px-4 font-bold text-[#191c1d]">{inst.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {inst.regulatory_authority}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{inst.description}</td>
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
                {userTypes.map(u => (
                  <tr key={u.type_code} className={u.role_key === 'super_admin' ? 'bg-amber-50/60' : 'hover:bg-[#f8f9fa]'}>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#00236f]">{u.type_code}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{u.alpha_prefix}</td>
                    <td className="py-2.5 px-4 font-bold text-[#191c1d]">
                      {u.display_title}
                      {u.role_key === 'super_admin' && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>APEX AUTHORITY</span>
                        </span>
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
                {degrees.map(d => (
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
                {docTypes.map(doc => (
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
    </div>
  );

  if (isEmbeddedView) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {content}
    </div>
  );
};