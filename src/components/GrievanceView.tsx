import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { GrievanceItem, User } from '../types';

interface GrievanceViewProps {
  currentUser: User | null;
}

export const GrievanceView: React.FC<GrievanceViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isLodgeModalOpen, setIsLodgeModalOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceItem | null>(null);
  const [isAdjudicateOpen, setIsAdjudicateOpen] = useState(false);

  // New Grievance Form State
  const [newCategory, setNewCategory] = useState<string>('academic');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<string>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Adjudicate Form State
  const [adjudicateStatus, setAdjudicateStatus] = useState<string>('resolved');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  const loadGrievances = async () => {
    setIsLoading(true);
    try {
      const res = await api.getGrievances();
      if (res.success && res.grievances) {
        setGrievances(res.grievances);
      }
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, []);

  const handleLodgeGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newSubject.trim() || newSubject.length < 5) {
      setFormError('Subject must be at least 5 characters.');
      return;
    }
    if (!newDescription.trim() || newDescription.length < 15) {
      setFormError('Description must be at least 15 characters to provide necessary context.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitGrievance({
        category: newCategory,
        subject: newSubject,
        description: newDescription,
        priority: newPriority,
      });

      if (res.success) {
        setSuccessMessage(`Grievance submitted successfully. Tracking Code: ${res.trackingCode}`);
        setTimeout(() => setSuccessMessage(null), 6000);
        setIsLodgeModalOpen(false);
        setNewSubject('');
        setNewDescription('');
        setNewCategory('academic');
        setNewPriority('medium');
        loadGrievances();
      } else {
        setFormError(res.error || 'Failed to submit grievance');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error communicating with server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAdjudication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    if (!adminRemarks.trim()) {
      alert('Please enter official administrative resolution remarks.');
      return;
    }

    setIsSavingResolution(true);
    try {
      const res = await api.resolveGrievance(selectedGrievance.id, adjudicateStatus, adminRemarks);
      if (res.success) {
        setIsAdjudicateOpen(false);
        setSelectedGrievance(null);
        setAdminRemarks('');
        loadGrievances();
      } else {
        alert(res.error || 'Failed to update grievance.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating grievance');
    } finally {
      setIsSavingResolution(false);
    }
  };

  // Filtered grievances
  const filtered = grievances.filter(g => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    if (filterCategory !== 'all' && g.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = g.subject.toLowerCase().includes(q);
      const matchDesc = g.description.toLowerCase().includes(q);
      const matchCode = g.tracking_code.toLowerCase().includes(q);
      const matchName = g.student_name.toLowerCase().includes(q);
      return matchSub || matchDesc || matchCode || matchName;
    }
    return true;
  });

  const totalCount = grievances.length;
  const pendingCount = grievances.filter(g => g.status === 'submitted' || g.status === 'under_investigation').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;
  const urgentCount = grievances.filter(g => g.priority === 'urgent' || g.priority === 'high').length;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'academic':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#dce1ff] text-[#00236f]">Academic</span>;
      case 'examination':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">Exam COE</span>;
      case 'hostel':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900">Hostel & Mess</span>;
      case 'transport':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-900">Bus Transit</span>;
      case 'fee_finance':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900">Fee / Accounts</span>;
      case 'anti_ragging':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-900">Anti-Ragging Cell</span>;
      case 'infrastructure':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-800">Campus Facilities</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800">General</span>;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#006a61] border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
            Resolved
          </span>
        );
      case 'under_investigation':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            In Investigation
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-300">
            Dismissed
          </span>
        );
      case 'submitted':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Lodged / Pending
          </span>
        );
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="text-[10px] uppercase font-black tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">URGENT</span>;
      case 'high':
        return <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">HIGH</span>;
      case 'medium':
        return <span className="text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="text-[10px] uppercase text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">LOW</span>;
    }
  };

  return (
    <div id="grievance-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-700 text-[26px]">gavel</span>
            <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
              UGC Grievance Redressal Cell (SGRC)
            </h2>
          </div>
          <p className="text-sm text-[#444651] mt-1">
            Statutory platform mandated by UGC (Redress of Grievance of Students) Regulations. Timely and transparent grievance resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLodgeModalOpen(true)}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_alert</span>
            <span>Lodge Grievance</span>
          </button>
          <button
            onClick={loadGrievances}
            className="p-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-[#444651]"
            title="Refresh Grievance Records"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#757682]">Total Grievances</span>
          <h4 className="text-2xl font-black text-[#191c1d] mt-1">{totalCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Recorded on institutional portal</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-700">Under Review / Active</span>
          <h4 className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Committee investigation active</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#006a61]">Resolved & Closed</span>
          <h4 className="text-2xl font-black text-[#006a61] mt-1">{resolvedCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Official remarks issued</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-red-700">Urgent Priority</span>
          <h4 className="text-2xl font-black text-red-700 mt-1">{urgentCount}</h4>
          <p className="text-[11px] text-[#757682] mt-0.5">Escalated to Proctorial Board</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#757682] font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-[#e1e3e4] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00236f]"
            >
              <option value="all">All Statuses ({totalCount})</option>
              <option value="submitted">Submitted</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 text-xs ml-2">
            <span className="text-[#757682] font-semibold">Category:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-[#e1e3e4] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00236f]"
            >
              <option value="all">All Domains</option>
              <option value="academic">Academic Curriculum</option>
              <option value="examination">Examination & Grades</option>
              <option value="hostel">Campus Hostel & Mess</option>
              <option value="transport">Bus Fleet & Transport</option>
              <option value="fee_finance">Fee / Dues Accounts</option>
              <option value="anti_ragging">Anti-Ragging Squad</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="general">General Dispute</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#757682]">search</span>
          <input
            type="text"
            placeholder="Search token, keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-[#e1e3e4] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00236f]"
          />
        </div>
      </div>

      {/* Grievances List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#757682] bg-white rounded-xl border border-[#e1e3e4]">
            Loading grievance cell records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#757682] bg-white rounded-xl border border-[#e1e3e4]">
            No grievances match the selected criteria.
          </div>
        ) : (
          filtered.map(g => (
            <div
              key={g.id}
              className="p-5 bg-white rounded-xl border border-[#e1e3e4] hover:border-[#c5c5d3] transition-all shadow-xs space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-[#f3f4f5] pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#00236f] bg-[#dce1ff]/50 px-2 py-0.5 rounded border border-[#dce1ff]">
                    {g.tracking_code}
                  </span>
                  {getCategoryBadge(g.category)}
                  {getPriorityBadge(g.priority)}
                  {getStatusBadge(g.status)}
                </div>

                <div className="text-right text-[11px] text-[#757682]">
                  <span>Lodged on: {new Date(g.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#191c1d]">{g.subject}</h3>
                <p className="text-xs text-[#444651] mt-1.5 leading-relaxed bg-[#f8f9fa] p-3 rounded-lg border border-[#f3f4f5]">
                  {g.description}
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between text-xs text-[#757682] gap-2 pt-1">
                <div>
                  <span>Complainant: </span>
                  <strong className="text-[#191c1d]">{g.student_name}</strong>
                  <span className="ml-1 text-[11px]">({g.student_id})</span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setSelectedGrievance(g);
                      setAdjudicateStatus(g.status === 'submitted' ? 'under_investigation' : g.status);
                      setAdminRemarks(g.admin_remarks || '');
                      setIsAdjudicateOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg text-xs font-bold hover:bg-[#1e3a8a] transition-all flex items-center gap-1 cursor-pointer self-start md:self-auto"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                    <span>Committee Action & Remarks</span>
                  </button>
                )}
              </div>

              {/* Committee Remarks Display */}
              {g.admin_remarks && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#006a61] font-bold">
                    <span className="material-symbols-outlined text-[15px]">assignment_turned_in</span>
                    <span>Official SGRC Committee Resolution:</span>
                    {g.resolved_by && <span className="text-[10px] text-emerald-800">({g.resolved_by})</span>}
                  </div>
                  <p className="text-emerald-950 pl-5">{g.admin_remarks}</p>
                  {g.resolved_at && (
                    <div className="text-[10px] text-emerald-700 pl-5 pt-0.5">
                      Decision timestamp: {new Date(g.resolved_at).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Lodge Grievance */}
      {isLodgeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] to-[#1e3a8a] text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-amber-300">shield_with_heart</span>
                <h3 className="text-base font-bold">Lodge Formal UGC Grievance</h3>
              </div>
              <button
                onClick={() => setIsLodgeModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLodgeGrievance} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] leading-relaxed">
                <strong>UGC Mandate Note:</strong> Under the Student Grievance Redressal Regulations, this complaint is legally logged and tracked. Confidentiality is preserved. Frivolous or malicious statements may invite academic inquiry.
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#444651] mb-1">Redressal Domain *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full p-2 border border-[#c5c5d3] rounded-lg focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="academic">Academic & Curriculum</option>
                    <option value="examination">Examination & Grades</option>
                    <option value="hostel">Hostel & Mess Boarding</option>
                    <option value="transport">Bus Fleet & Transport</option>
                    <option value="fee_finance">Fee Dues & Financial Accounts</option>
                    <option value="anti_ragging">Anti-Ragging Cell (Highest Priority)</option>
                    <option value="infrastructure">Infrastructure / Laboratories</option>
                    <option value="general">General Administrative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#444651] mb-1">Perceived Priority *</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full p-2 border border-[#c5c5d3] rounded-lg focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="low">Low (Standard Advisory)</option>
                    <option value="medium">Medium (Routine Dispute)</option>
                    <option value="high">High (Academic Loss / Severe Disruption)</option>
                    <option value="urgent">Urgent (Safety / Harassment / Proctorial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#444651] mb-1">Subject / Dispute Title *</label>
                <input
                  type="text"
                  placeholder="Concise summary of the grievance (e.g. Discrepancy in Semester 3 marksheet)"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full p-2 border border-[#c5c5d3] rounded-lg focus:ring-1 focus:ring-[#00236f] focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#444651] mb-1">Detailed Description of Incident / Concern *</label>
                <textarea
                  rows={5}
                  placeholder="Provide precise details, dates, room or bus numbers, faculty or staff involved, and specific relief requested..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full p-2 border border-[#c5c5d3] rounded-lg focus:ring-1 focus:ring-[#00236f] focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f3f4f5]">
                <button
                  type="button"
                  onClick={() => setIsLodgeModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering Token...' : 'Register Formal Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjudicate Grievance (Admin) */}
      {isAdjudicateOpen && selectedGrievance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-[#191c1d] text-white">
              <div>
                <h3 className="text-base font-bold">Committee Adjudication & Action</h3>
                <p className="text-[11px] text-gray-300 font-mono">Token: {selectedGrievance.tracking_code}</p>
              </div>
              <button
                onClick={() => setIsAdjudicateOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjudication} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#e1e3e4] space-y-1">
                <div className="flex justify-between font-bold text-[#191c1d]">
                  <span>{selectedGrievance.subject}</span>
                  <span>{selectedGrievance.student_name}</span>
                </div>
                <p className="text-[#757682] text-[11px] line-clamp-3">{selectedGrievance.description}</p>
              </div>

              <div>
                <label className="block font-bold text-[#444651] mb-1">Adjudication Decision *</label>
                <select
                  value={adjudicateStatus}
                  onChange={e => setAdjudicateStatus(e.target.value)}
                  className="w-full p-2 border border-[#c5c5d3] rounded-lg focus:ring-1 focus:ring-[#00236f] focus:outline-none font-semibold text-xs"
                >
                  <option value="under_investigation">Under Investigation (Assigned to Department / Hostel Warden)</option>
                  <option value="resolved">Resolved & Closed (Corrective Action Completed)</option>
                  <option value="dismissed">Dismissed (Unsubstantiated / Frivolous)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#444651] mb-1">Official Committee Remarks / Relief Action *</label>
                <textarea
                  rows={4}
                  placeholder="Record factual findings, assigned technician/officer, corrective actions taken, and formal resolution for student record..."
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                  className="w-full p-2 border border-[#c5c5d3] rounded-lg focus:ring-1 focus:ring-[#00236f] focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f3f4f5]">
                <button
                  type="button"
                  onClick={() => setIsAdjudicateOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResolution}
                  className="px-5 py-2 bg-[#006a61] hover:bg-[#004f48] text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSavingResolution ? 'Recording Resolution...' : 'Commit SGRC Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
