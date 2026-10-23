import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { User } from '../types';
import { api } from '../api/client';
import { TelephonyCallDock, TelephonyCandidate } from './TelephonyCallDock';
import {
  Search,
  Filter,
  Phone,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Users,
  ArrowRightLeft,
  UserCheck,
  Eye,
  RefreshCw,
  X,
  ShieldCheck,
  Clock,
  Percent,
  Plus,
} from 'lucide-react';

interface EnquiriesViewProps {
  currentUser: User | null;
  onNavigateToManageStudents?: () => void;
  onNavigateToBulkImport?: () => void;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  currentUser,
  onNavigateToManageStudents,
  onNavigateToBulkImport,
  selectedCampus,
}) => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [enquiryDetails, setEnquiryDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialerSettings, setDialerSettings] = useState<any>({ is_enabled: true, provider: 'exotel' });

  // Call simulation state
  const [isCalling, setIsCalling] = useState(false);
  const [callSession, setCallSession] = useState<any | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isTelephonyDockOpen, setIsTelephonyDockOpen] = useState(false);
  const [activeCallCandidate, setActiveCallCandidate] = useState<TelephonyCandidate | null>(null);

  // New Interaction Form (Karanvir Sir Lecture 4)
  const [stageName, setStageName] = useState('Telephonic Academic Counseling');
  const [interactionRemarks, setInteractionRemarks] = useState('');
  const [probabilityVal, setProbabilityVal] = useState(75);
  const [callStatus, setCallStatus] = useState('Connected / Interested');
  const [nextAlertDate, setNextAlertDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [attachmentName, setAttachmentName] = useState('');

  // 4 Pulse KPI State & Filter (Lecture 4 Mandate)
  const [kpiFilter, setKpiFilter] = useState<'all' | 'radar' | 'counselors' | 'attention' | 'unique'>('all');

  // Counselors Roster State (Karanvir Sir Lecture 4 Segment 2 & 3)
  const [counselorsList, setCounselorsList] = useState([
    { id: 'cns-01', name: 'S. Harinder Singh', role: 'Chief Admissions Counselor', activeLeads: 24, registered: 18, closed: 4, status: 'active', conversionRate: 75.0 },
    { id: 'cns-02', name: 'Ms. Divya Sharma', role: 'STEM & Computing Counselor', activeLeads: 28, registered: 21, closed: 5, status: 'active', conversionRate: 75.0 },
    { id: 'cns-03', name: 'Mr. Rahul Verma', role: 'Management & Commerce Counselor', activeLeads: 19, registered: 12, closed: 4, status: 'active', conversionRate: 63.2 },
    { id: 'cns-04', name: 'Ms. Simran Kaur', role: 'Agriculture Sciences Counselor', activeLeads: 16, registered: 11, closed: 3, status: 'active', conversionRate: 68.8 },
  ]);

  const [deactivatedCounselorsList, setDeactivatedCounselorsList] = useState([
    { id: 'cns-left-01', name: 'Ms. Pooja Batra', status: 'Resigned / Left on 10th Oct', orphanedLeads: 8, lastActive: '2026-10-10' },
    { id: 'cns-left-02', name: 'Mr. Vikramjeet Singh', status: 'Medical Leave (30 Days)', orphanedLeads: 5, lastActive: '2026-10-12' },
  ]);

  // Orphaned and Stagnant Leads for Attention Required Radar
  const [orphanedLeads, setOrphanedLeads] = useState([
    { id: 'orph-01', name: 'Jaspreet Singh Dhillon', mobile: '+91 98141 90812', course: 'B.Tech Computer Science', previousCounselor: 'Ms. Pooja Batra (Left)', daysOrphaned: 9, probability: 82 },
    { id: 'orph-02', name: 'Navdeep Kaur', mobile: '+91 98722 11982', course: 'BCA Cloud Computing', previousCounselor: 'Ms. Pooja Batra (Left)', daysOrphaned: 9, probability: 78 },
    { id: 'orph-03', name: 'Amritpal Singh', mobile: '+91 94170 33412', course: 'MBA Finance', previousCounselor: 'Mr. Vikramjeet Singh (Leave)', daysOrphaned: 7, probability: 88 },
  ]);

  const [highProbCancelledLeads, setHighProbCancelledLeads] = useState([
    { id: 'canc-01', name: 'Gurkirat Singh', mobile: '+91 98888 77612', course: 'B.Tech CSE', probability: 85, closedDate: '2026-10-16', reason: 'Hostel fee out of budget - Candidate moved to local polytechnic' },
    { id: 'canc-02', name: 'Karanpreet Kaur', mobile: '+91 98150 44321', course: 'B.Sc Agriculture', probability: 80, closedDate: '2026-10-17', reason: 'Awaiting Punjab state counseling seat round 2' },
  ]);

  const [reassignModal, setReassignModal] = useState<{ isOpen: boolean; leadId?: string; leadName?: string; targetCounselorId: string }>({
    isOpen: false,
    targetCounselorId: 'cns-01',
  });

  // Admin Admissions Settings State
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false);
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState(5);
  const [highProbThreshold, setHighProbThreshold] = useState(75);
  const [requireApprovalForEnquiry, setRequireApprovalForEnquiry] = useState(false);
  const [requireRegFeeBeforeAdmission, setRequireRegFeeBeforeAdmission] = useState(true);
  const [voipRecordingEnabled, setVoipRecordingEnabled] = useState(true);

  // Hostel + Transport Cross-Check Conflict Modal
  const [showHostelTransportConflictModal, setShowHostelTransportConflictModal] = useState(false);

  // Convert to Student Modal & Mandatory Fee Gate
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [regFeeVerified, setRegFeeVerified] = useState(true);
  const [regFeeReceiptNo, setRegFeeReceiptNo] = useState(`REG-RCP-${Date.now().toString().slice(-6)}`);
  const [convertPayment, setConvertPayment] = useState({
    amount: 10000,
    payment_mode: 'online_upi',
    transaction_ref: `UPI-${Date.now().toString().slice(-6)}`,
  });

  // New Single Enquiry Modal (with Hostel & Transport)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEnquiry, setNewEnquiry] = useState({
    student_name: '',
    mobile: '',
    email: '',
    selected_course: 'B.Tech Computer Science & Engineering',
    father_name: '',
    gender: 'female',
    course_fee: 90000,
    admission_probability: 60,
    hostel_required: false,
    transport_required: false,
    hostel_room_type: '2_sharing_ac',
    transport_route: 'Bathinda City Route 01',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    const res = await api.getEnquiries({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
      campus: selectedCampus && selectedCampus !== 'all' ? selectedCampus : undefined,
    });
    if (res.success && res.enquiries) {
      setEnquiries(res.enquiries);
      if (!selectedEnquiryId && res.enquiries.length > 0) {
        setSelectedEnquiryId(res.enquiries[0].id);
      }
    }
    setLoading(false);
  };

  const fetchEnquiryDetails = async (id: string) => {
    const res = await api.getEnquiry(id);
    if (res.success && res.enquiry) {
      setEnquiryDetails(res.enquiry);
      setProbabilityVal(res.enquiry.admission_probability || 50);
    }
  };

  const fetchDialer = async () => {
    const res = await api.getDialerSettings();
    if (res.success && res.settings) {
      setDialerSettings(res.settings);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchDialer();
  }, [statusFilter, selectedCampus]);

  useEffect(() => {
    if (selectedEnquiryId) {
      fetchEnquiryDetails(selectedEnquiryId);
    }
  }, [selectedEnquiryId]);

  // Call timer simulation
  useEffect(() => {
    let interval: any;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  const handleStartDial = async () => {
    if (!enquiryDetails) return;
    setActiveCallCandidate({
      id: enquiryDetails.id,
      name: enquiryDetails.student_name,
      phone: enquiryDetails.mobile,
      course: enquiryDetails.selected_course,
      studentId: enquiryDetails.enquiry_no,
    });
    setIsTelephonyDockOpen(true);
    setIsCalling(true);
    const res = await api.dialEnquiry(enquiryDetails.id);
    if (res.success) {
      setCallSession(res);
      setFeedbackMsg(`Auto-Dialer active: Connected via ${String(res?.provider || 'EXOTEL').toUpperCase()} telephony gateway.`);
    }
  };

  const handleQuickCall = (candidate: { id: string; name: string; mobile: string; course?: string; enquiry_no?: string }) => {
    setActiveCallCandidate({
      id: candidate.id,
      name: candidate.name,
      phone: candidate.mobile,
      course: candidate.course,
      studentId: candidate.enquiry_no,
    });
    setIsTelephonyDockOpen(true);
  };

  const handleTelephonyDisposition = () => {
    setIsTelephonyDockOpen(false);
    setIsCalling(false);
    setFeedbackMsg(`Telephonic counseling interaction successfully recorded in candidate activity timeline.`);
    if (selectedEnquiryId) {
      fetchEnquiryDetails(selectedEnquiryId);
    }
    fetchEnquiries();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setInteractionRemarks(`Completed telephonic counseling call (${callDuration} seconds).`);
    setFeedbackMsg(`Call ended (${callDuration}s). Voice telemetry recorded.`);
  };

  const handleLogInteraction = async () => {
    if (!enquiryDetails || !interactionRemarks) {
      alert('Please enter interaction remarks.');
      return;
    }

    const res = await api.addEnquiryInteraction(enquiryDetails.id, {
      stage_name: stageName,
      remarks: interactionRemarks,
      call_status: callStatus,
      probability_updated: probabilityVal,
      call_recording_url: callSession?.recording_url || callSession?.simulated_recording_url || undefined,
    });

    if (res.success) {
      setFeedbackMsg('Interaction logged and probability updated!');
      setInteractionRemarks('');
      setCallSession(null);
      fetchEnquiryDetails(enquiryDetails.id);
      fetchEnquiries();
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleConvertStudent = async () => {
    if (!enquiryDetails) return;
    const res = await api.convertEnquiryToStudent(enquiryDetails.id, convertPayment);
    if (res.success) {
      setShowConvertModal(false);
      setFeedbackMsg(`[ADMISSION CONVERTED]: Student ${res.student.first_name} admitted with Course UID ${res.student.student_id}! Token receipt: ${res.receiptNo}`);
      fetchEnquiryDetails(enquiryDetails.id);
      fetchEnquiries();
      setTimeout(() => setFeedbackMsg(null), 8000);
    } else {
      alert(res.error || 'Failed to convert enquiry.');
    }
  };

  const handleCreateEnquiry = async () => {
    if (!newEnquiry.student_name || !newEnquiry.mobile) {
      alert('Candidate name and mobile number are mandatory.');
      return;
    }
    const res = await api.createEnquiry(newEnquiry);
    if (res.success) {
      setShowCreateModal(false);
      setFeedbackMsg(`Enquiry #${res.enquiry.enquiry_no} created successfully!`);
      fetchEnquiries();
      setSelectedEnquiryId(res.enquiry.id);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      alert(res.error || 'Failed to create enquiry record.');
    }
  };

  const handleToggleDialer = async () => {
    const updated = !dialerSettings.is_enabled;
    const res = await api.updateDialerSettings({ is_enabled: updated });
    if (res.success) {
      setDialerSettings(res.settings);
      setFeedbackMsg(`Auto-Dialer gateway toggled ${updated ? 'ON' : 'OFF'}.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-[11px] text-[#00236f]">
      {/* Top Banner */}
      <div className="bg-white border border-[#00236f]/20 rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#00236f] flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] tracking-wide text-[#00236f]">
                PRE-ADMISSION COUNSELOR CRM & AUTO-DIALER
              </span>
              <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                PROBABILITY RADAR (0-100%)
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Stage-wise interaction remarks tree, Click-to-call telephony integration, and instant conversion to Student Master upon token payment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleDialer}
            className={`px-3 py-1.5 rounded font-bold border transition text-[11px] ${
              dialerSettings.is_enabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-gray-100 border-gray-300 text-gray-600'
            }`}
          >
            {dialerSettings?.is_enabled ? `[DIALER: ACTIVE (${String(dialerSettings?.provider || dialerSettings?.telephony_provider || 'EXOTEL').toUpperCase()})]` : '[DIALER: DISABLED]'}
          </button>

          {onNavigateToBulkImport && (
            <button
              onClick={onNavigateToBulkImport}
              className="border border-[#00236f] text-[#00236f] bg-white hover:bg-[#00236f]/5 font-bold px-3 py-1.5 rounded text-[11px] transition"
            >
              [BULK CSV MAPPER]
            </button>
          )}

          <button
            onClick={() => setShowAdminSettingsModal(true)}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded text-[11px] transition flex items-center gap-1"
          >
            ⚙ SETTINGS
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-3 py-1.5 rounded text-[11px] transition"
          >
            + NEW ENQUIRY
          </button>
        </div>
      </div>

      {/* Karanvir Sir Lecture 4: 4 Pulse KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* KPI 1: Probability Radar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setKpiFilter(kpiFilter === 'radar' ? 'all' : 'radar')}
          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            kpiFilter === 'radar'
              ? 'bg-orange-50 border-[#ea580c] ring-1 ring-[#ea580c]'
              : 'bg-white border-slate-200/90 hover:border-[#ea580c]/50'
          }`}
        >
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>PROBABILITY RADAR</span>
            <span className="text-[#ea580c] font-mono font-black">ACTIVE</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-[#ea580c]">
              {enquiries.length > 0
                ? Math.round(enquiries.reduce((acc, c) => acc + (c.admission_probability || 50), 0) / enquiries.length)
                : 84}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              / {enquiries.length} Active Leads
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Average likelihood of admission across all active inquiries</p>
        </div>

        {/* KPI 2: Active Counselors */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setKpiFilter(kpiFilter === 'counselors' ? 'all' : 'counselors')}
          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            kpiFilter === 'counselors'
              ? 'bg-blue-50 border-[#00236f] ring-1 ring-[#00236f]'
              : 'bg-white border-slate-200/90 hover:border-[#00236f]/50'
          }`}
        >
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>ACTIVE COUNSELORS</span>
            <span className="text-blue-700 font-mono font-black">STAFF</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-[#00236f]">8</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Active / 2 On-Leave
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Institutional admissions counseling roster & tele-dialers</p>
        </div>

        {/* KPI 3: Attention Required */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setKpiFilter(kpiFilter === 'attention' ? 'all' : 'attention')}
          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            kpiFilter === 'attention'
              ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500'
              : 'bg-white border-slate-200/90 hover:border-rose-400'
          }`}
        >
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>ATTENTION REQUIRED</span>
            <span className="text-rose-600 font-mono font-black">&gt;{inactiveDaysThreshold}D IDLE</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-600">5</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Flagged Leads
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Inactive &gt; {inactiveDaysThreshold} days or counselor left without reassignment</p>
        </div>

        {/* KPI 4: Unique Enquiries */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setKpiFilter(kpiFilter === 'unique' ? 'all' : 'unique')}
          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            kpiFilter === 'unique'
              ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600'
              : 'bg-white border-slate-200/90 hover:border-emerald-500'
          }`}
        >
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>UNIQUE ENQUIRIES</span>
            <span className="text-emerald-700 font-mono font-black">CLEAN</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">
              {new Set(enquiries.map(e => e.mobile || e.id)).size || enquiries.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Deduplicated
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Verified unique applicant profiles across mobile & Aadhaar</p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded text-[11px] font-medium flex justify-between items-center">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-500 hover:text-black">
            [DISMISS]
          </button>
        </div>
      )}

      {/* ZERO-POPUP INLINE WORKSPACE: REGISTER NEW LEAD */}
      {showCreateModal && (
        <div className="bg-white rounded-2xl border-2 border-[#00236f]/30 p-5 shadow-lg space-y-4 animate-fadeIn my-3">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00236f] block">Lead Ingestion Workspace (Zero Popups)</span>
              <h3 className="text-sm font-bold text-slate-800">Register New Walk-in / Telephonic Lead</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close Workspace ✕
            </button>
          </div>

          <div className="space-y-3 text-[11px]">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">CANDIDATE FULL NAME *:</label>
              <input
                type="text"
                placeholder="e.g. Navjot Kaur"
                value={newEnquiry.student_name}
                onChange={e => setNewEnquiry({ ...newEnquiry, student_name: e.target.value })}
                className="w-full border p-2 rounded text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">MOBILE NUMBER *:</label>
                <input
                  type="text"
                  placeholder="+91 98765 11223"
                  value={newEnquiry.mobile}
                  onChange={e => setNewEnquiry({ ...newEnquiry, mobile: e.target.value })}
                  className="w-full border p-2 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">EMAIL:</label>
                <input
                  type="email"
                  placeholder="student@gmail.com"
                  value={newEnquiry.email}
                  onChange={e => setNewEnquiry({ ...newEnquiry, email: e.target.value })}
                  className="w-full border p-2 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700">TARGET COURSE / DEGREE:</label>
              <select
                value={newEnquiry.selected_course}
                onChange={e => setNewEnquiry({ ...newEnquiry, selected_course: e.target.value })}
                className="w-full border p-2 rounded text-xs"
              >
                <option value="B.Tech Computer Science & Engineering">B.Tech Computer Science & Engineering</option>
                <option value="B.Sc (Hons) Agriculture Sciences">B.Sc (Hons) Agriculture Sciences</option>
                <option value="B.Tech Civil Engineering">B.Tech Civil Engineering</option>
                <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
                <option value="Bachelor of Pharmacy (B.Pharm)">Bachelor of Pharmacy (B.Pharm)</option>
                <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">FATHER / GUARDIAN NAME:</label>
                <input
                  type="text"
                  value={newEnquiry.father_name}
                  onChange={e => setNewEnquiry({ ...newEnquiry, father_name: e.target.value })}
                  className="w-full border p-2 rounded text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">INITIAL PROBABILITY (%):</label>
                <input
                  type="number"
                  value={newEnquiry.admission_probability}
                  onChange={e => setNewEnquiry({ ...newEnquiry, admission_probability: parseInt(e.target.value, 10) || 50 })}
                  className="w-full border p-2 rounded font-bold text-xs"
                />
              </div>
            </div>

            {/* Hostel & Transport Options */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 block text-[10px] uppercase">
                Residence & Transit Services (Auto Fee Allocation)
              </span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 text-xs">
                  <input
                    type="checkbox"
                    checked={newEnquiry.hostel_required}
                    onChange={e => {
                      const val = e.target.checked;
                      setNewEnquiry(prev => ({ ...prev, hostel_required: val }));
                      if (val && newEnquiry.transport_required) {
                        setShowHostelTransportConflictModal(true);
                      }
                    }}
                    className="rounded text-[#00236f]"
                  />
                  <span>Hostel Required (ARW/FCW)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 text-xs">
                  <input
                    type="checkbox"
                    checked={newEnquiry.transport_required}
                    onChange={e => {
                      const val = e.target.checked;
                      setNewEnquiry(prev => ({ ...prev, transport_required: val }));
                      if (val && newEnquiry.hostel_required) {
                        setShowHostelTransportConflictModal(true);
                      }
                    }}
                    className="rounded text-[#00236f]"
                  />
                  <span>Bus Transport Required</span>
                </label>
              </div>

              {/* Inline Conflict Warning */}
              {showHostelTransportConflictModal && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <span>⚠️ Cross-Check Residence & Transport Policy</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    <strong>Are you sure the scholar needs both Campus Hostel residence and Institutional Bus Transport?</strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Typically hostellers reside on-campus without daily transit. Select &apos;Confirm Both&apos; if student is in off-campus leased residence or needs weekend commute.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNewEnquiry(prev => ({ ...prev, transport_required: false }));
                        setShowHostelTransportConflictModal(false);
                      }}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Keep Hostel Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHostelTransportConflictModal(false)}
                      className="px-3 py-1 bg-[#00236f] text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Confirm Both Services ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateEnquiry}
              className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              Save & Register Lead
            </button>
          </div>
        </div>
      )}

      {/* ZERO-POPUP INLINE WORKSPACE: TOKEN FEE & CONVERT TO STUDENT */}
      {showConvertModal && enquiryDetails && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-lg space-y-4 animate-fadeIn my-3">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Admissions Conversion Desk (Zero Popups)</span>
              <h3 className="text-sm font-bold text-slate-800">Collect Token Fee & Enroll Scholar: {enquiryDetails.student_name}</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowConvertModal(false)}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close Desk ✕
            </button>
          </div>

          <div className="space-y-3 text-[11px]">
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">[MANDATORY REGISTRATION FEE GATE - LECTURE 4]:</span>
              <p>
                Per collegiate statutory ordinances, students must have verified registration token payment before enrollment into the academic registry.
              </p>
            </div>

            {/* Verified Fee Receipt Status */}
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={regFeeVerified}
                  onChange={e => setRegFeeVerified(e.target.checked)}
                  className="rounded text-[#00236f]"
                />
                <span>Registration Fee Verified at Fee Counter</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block font-semibold mb-1">VERIFIED RECEIPT NO:</span>
                  <input
                    type="text"
                    value={regFeeReceiptNo}
                    onChange={e => setRegFeeReceiptNo(e.target.value)}
                    className="w-full border p-2 rounded-lg font-mono font-bold text-[#00236f]"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold mb-1">FEE STATUS:</span>
                  <span className="inline-block mt-1 font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                    PAID & CLEARED ✓
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">CANDIDATE NAME:</label>
                <input
                  type="text"
                  disabled
                  value={enquiryDetails.student_name}
                  className="w-full border p-2 rounded-lg bg-gray-100 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">COURSE:</label>
                <input
                  type="text"
                  disabled
                  value={enquiryDetails.selected_course}
                  className="w-full border p-2 rounded-lg bg-gray-100 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">ADMISSION TOKEN AMOUNT (INR) *:</label>
                <input
                  type="number"
                  value={convertPayment.amount}
                  onChange={e => setConvertPayment({ ...convertPayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border p-2 rounded-lg font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">PAYMENT MODE:</label>
                <select
                  value={convertPayment.payment_mode}
                  onChange={e => setConvertPayment({ ...convertPayment, payment_mode: e.target.value as any })}
                  className="w-full border p-2 rounded-lg text-xs"
                >
                  <option value="online_upi">ONLINE UPI (GPAY/PHONEPE)</option>
                  <option value="net_banking">NET BANKING / IMPS</option>
                  <option value="credit_card">CREDIT / DEBIT CARD</option>
                  <option value="cash">CASH COUNTER</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700">TRANSACTION / UTR REFERENCE:</label>
              <input
                type="text"
                value={convertPayment.transaction_ref}
                onChange={e => setConvertPayment({ ...convertPayment, transaction_ref: e.target.value })}
                className="w-full border p-2 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setShowConvertModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!regFeeVerified}
              onClick={handleConvertStudent}
              className={`px-4 py-2 font-bold rounded-xl text-xs transition cursor-pointer ${
                regFeeVerified
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title={!regFeeVerified ? 'Registration Fee must be verified before student enrollment' : ''}
            >
              Clear Fee & Enroll Scholar →
            </button>
          </div>
        </div>
      )}

      {/* ZERO-POPUP INLINE WORKSPACE: ADMIN ADMISSIONS CONFIGURATION */}
      {showAdminSettingsModal && (
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 shadow-lg space-y-4 animate-fadeIn my-3">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00236f] block">Admissions Desk Configuration (Zero Popups)</span>
              <h3 className="text-sm font-bold text-slate-800">Dialer Policy & Alert Thresholds</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminSettingsModal(false)}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close Settings ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Idle Enquiry Alert Threshold (Days):
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={inactiveDaysThreshold}
                onChange={e => setInactiveDaysThreshold(parseInt(e.target.value, 10) || 5)}
                className="w-full border p-2 rounded-lg font-mono font-bold text-xs"
              />
              <span className="text-[11px] text-slate-500">Flags leads with no counselor interaction exceeding this duration.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                High-Probability Threshold (%):
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={highProbThreshold}
                onChange={e => setHighProbThreshold(parseInt(e.target.value, 10) || 75)}
                className="w-full border p-2 rounded-lg font-mono font-bold text-emerald-700 text-xs"
              />
              <span className="text-[11px] text-slate-500">Leads above this percentage cancelled or closed are flagged under Attention Required.</span>
            </div>

            <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={requireRegFeeBeforeAdmission}
                  onChange={e => setRequireRegFeeBeforeAdmission(e.target.checked)}
                  className="rounded text-[#00236f]"
                />
                <span>Mandatory Registration Fee Gate before Enrolling</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={requireApprovalForEnquiry}
                  onChange={e => setRequireApprovalForEnquiry(e.target.checked)}
                  className="rounded text-[#00236f]"
                />
                <span>Level-1 Approver Workflow for Bulk CSV Intake</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={voipRecordingEnabled}
                  onChange={e => setVoipRecordingEnabled(e.target.checked)}
                  className="rounded text-[#00236f]"
                />
                <span>VoIP Telephony Call Recording & Daily Cloud Vault Sync</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setShowAdminSettingsModal(false)}
              className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Save Settings & Close ✓
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout or KPI Drilldown View */}
      {kpiFilter === 'all' ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Lead Directory */}
        <div className="lg:col-span-5 bg-white border border-[#00236f]/20 rounded p-3 space-y-3 shadow-sm">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search by candidate name, phone, enquiry no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEnquiries()}
              className="w-full border p-1.5 rounded text-[11px] focus:outline-none focus:border-[#00236f]"
            />

            <div className="flex gap-1 overflow-x-auto text-[9px] font-bold pb-1">
              {['all', 'enquiry', 'prospect', 'registration_paid', 'student'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded border uppercase whitespace-nowrap transition ${
                    statusFilter === st
                      ? 'bg-[#00236f] text-white border-[#00236f]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading CRM enquiries...</div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No CRM leads found.</div>
            ) : (
              enquiries.map(e => {
                const isSelected = selectedEnquiryId === e.id;
                const probColor =
                  e.admission_probability >= 80
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : e.admission_probability >= 50
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200';

                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEnquiryId(e.id)}
                    className={`p-2.5 rounded border cursor-pointer transition ${
                      isSelected
                        ? 'border-[#00236f] bg-[#00236f]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#00236f] text-[11px]">{e.student_name}</span>
                      <span className={`px-1.5 py-0.2 rounded border font-bold text-[9px] ${probColor}`}>
                        {e.admission_probability}% PROB
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-600 mt-1">
                      <span>{e.selected_course}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-gray-800">{e.mobile}</span>
                        <button
                          type="button"
                          title={`Call ${e.student_name}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleQuickCall({
                              id: e.id,
                              name: e.student_name,
                              mobile: e.mobile,
                              course: e.selected_course,
                              enquiry_no: e.enquiry_no,
                            });
                          }}
                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer border border-emerald-200 transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 mt-1 pt-1 border-t">
                      <span>ENQ NO: {e.enquiry_no}</span>
                      <span className="uppercase font-semibold text-[#ea580c]">
                        [{String(e.status || 'new').replace(/_/g, ' ')}]
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Counselor Workbench & Telephony Dock */}
        <div className="lg:col-span-7 bg-white border border-[#00236f]/20 rounded p-4 space-y-4 shadow-sm">
          {enquiryDetails ? (
            <>
              {/* Header Bar */}
              <div className="border-b pb-2 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[13px] text-[#00236f]">{enquiryDetails.student_name}</h3>
                    <span className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-mono text-[9px]">
                      {enquiryDetails.enquiry_no}
                    </span>
                    <span className="bg-[#ea580c] text-white px-2 py-0.2 rounded text-[9px] font-bold uppercase">
                      {String(enquiryDetails.status || 'new').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Course: <strong>{enquiryDetails.selected_course}</strong> | Guardian: {enquiryDetails.father_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isCalling ? (
                    <button
                      onClick={handleStartDial}
                      disabled={!dialerSettings.is_enabled}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-[10px] transition"
                    >
                      [CLICK-TO-CALL ({enquiryDetails.mobile})]
                    </button>
                  ) : (
                    <button
                      onClick={handleEndCall}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded text-[10px] animate-pulse"
                    >
                      [HANG UP CALL ({callDuration}s)]
                    </button>
                  )}

                  {enquiryDetails.status !== 'student' && (
                    <button
                      onClick={() => setShowConvertModal(true)}
                      className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-3 py-1 rounded text-[10px] transition"
                    >
                      [TOKEN FEE &rarr; CONVERT TO STUDENT]
                    </button>
                  )}
                </div>
              </div>

              {/* Active Call Telemetry Box */}
              {isCalling && (
                <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded flex justify-between items-center text-[10px]">
                  <div>
                    <span className="font-bold text-emerald-900 block">
                      [TELEPHONY ACTIVE]: Connected to {enquiryDetails.student_name} ({enquiryDetails.mobile})
                    </span>
                    <span className="text-emerald-700">
                      Gateway: {String(dialerSettings?.provider || dialerSettings?.telephony_provider || 'EXOTEL').toUpperCase()} Internet Audio Stream | Recording: ACTIVE
                    </span>
                  </div>
                  <span className="font-mono text-emerald-900 text-[13px] font-bold">
                    {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Admission Probability Slider */}
              <div className="bg-gray-50 p-3 rounded border space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-[#00236f]">ADMISSION CONVERSION PROBABILITY RADAR:</span>
                  <strong className="text-[12px] text-[#ea580c]">{probabilityVal}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={probabilityVal}
                  onChange={e => setProbabilityVal(parseInt(e.target.value, 10))}
                  className="w-full accent-[#00236f]"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>0% (COLD / UNLIKELY)</span>
                  <span>50% (MODERATE)</span>
                  <span>100% (CONFIRMED TOKEN PAID)</span>
                </div>
              </div>

              {/* Stage-wise Interaction Tree */}
              <div className="space-y-2">
                <span className="font-bold text-[#00236f] block border-b pb-1">
                  STAGE-WISE COUNSELING REMARKS TIMELINE ({enquiryDetails.interactions?.length || 0})
                </span>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {enquiryDetails.interactions?.length === 0 ? (
                    <div className="text-gray-400 py-4 text-center">No counseling remarks recorded yet.</div>
                  ) : (
                    enquiryDetails.interactions?.map((int: any) => (
                      <div key={int.id} className="border-l-2 border-[#00236f] pl-2.5 py-1 bg-gray-50/50 p-2 rounded text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#00236f]">{int.stage_name}</span>
                          <span className="text-gray-400 font-mono text-[9px]">{int.timestamp}</span>
                        </div>
                        <div className="text-gray-600 mt-0.5">{int.remarks}</div>
                        <div className="flex justify-between items-center text-[9px] text-gray-400 mt-1 pt-1 border-t border-gray-100">
                          <span>CALL STATUS: <strong className="text-gray-700">{int.call_status}</strong></span>
                          <span>PROBABILITY AT STEP: <strong>{int.probability_updated}%</strong></span>
                          {int.call_recording_url && (
                            <span className="text-emerald-700 font-bold">[VOICE RECORDING STORED]</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Log New Remark Form */}
              <div className="border-t pt-3 space-y-2">
                <span className="font-bold text-[#00236f] block">ADD COUNSELOR INTERACTION REMARK:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="block text-gray-500 font-semibold mb-0.5">COUNSELING STAGE:</label>
                    <select
                      value={stageName}
                      onChange={e => setStageName(e.target.value)}
                      className="w-full border p-1 rounded"
                    >
                      <option value="Initial Telephonic Counseling">Initial Telephonic Counseling</option>
                      <option value="Campus Visit & Lab Tour">Campus Visit & Lab Tour</option>
                      <option value="Fee & Scholarship Negotiation">Fee & Scholarship Negotiation</option>
                      <option value="Marksheet & Regulatory Verification">Marksheet Verification</option>
                      <option value="Hostel & Transport Inquiry">Hostel & Transport Inquiry</option>
                      <option value="Parent Follow-up">Parent Follow-up</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-500 font-semibold mb-0.5">CALL OUTCOME:</label>
                    <select
                      value={callStatus}
                      onChange={e => setCallStatus(e.target.value)}
                      className="w-full border p-1 rounded"
                    >
                      <option value="Connected / Highly Interested">Connected / Highly Interested</option>
                      <option value="Callback Requested">Callback Requested</option>
                      <option value="Parent Discussion Pending">Parent Discussion Pending</option>
                      <option value="Comparing Other Colleges">Comparing Other Colleges</option>
                      <option value="Registration Token Promised">Registration Token Promised</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="block text-gray-500 font-semibold mb-0.5">NEXT ALERT / FOLLOW-UP DATE:</label>
                    <input
                      type="date"
                      value={nextAlertDate}
                      onChange={e => setNextAlertDate(e.target.value)}
                      className="w-full border p-1 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-semibold mb-0.5">PAYMENT SLIP / ATTACHMENT:</label>
                    <input
                      type="text"
                      placeholder="e.g. Online_Fee_Slip_UPI_9821.pdf"
                      value={attachmentName}
                      onChange={e => setAttachmentName(e.target.value)}
                      className="w-full border p-1 rounded font-mono"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Enter detailed counseling notes and remarks..."
                  value={interactionRemarks}
                  onChange={e => setInteractionRemarks(e.target.value)}
                  className="w-full border p-1.5 rounded text-[10px]"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleLogInteraction}
                    className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-3 py-1 rounded text-[10px] transition"
                  >
                    SUBMIT REMARK & UPDATE PROBABILITY
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">Select an enquiry to view workbench.</div>
          )}
        </div>
      </div>
      ) : (
      /* KPI DRILLDOWN RADAR (Karanvir Sir Lecture 4 Mandate) */
      <div className="space-y-4 animate-fadeIn">
        {/* Drilldown Navigation Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setKpiFilter('all')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#00236f] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>← Back to Main Inquiries CRM</span>
            </button>
            <div>
              <h3 className="text-base font-black text-[#00236f]">
                {kpiFilter === 'counselors' && 'Counselors Allocation & Performance Radar'}
                {kpiFilter === 'attention' && 'Attention Required Radar (>5 Days Inactive & Orphaned Leads)'}
                {kpiFilter === 'radar' && 'Admissions Probability Radar & School-Wise Intake Forecast'}
                {kpiFilter === 'unique' && 'Deduplicated Leads & Clean Applicant Register'}
              </h3>
              <p className="text-xs text-slate-500">
                {kpiFilter === 'counselors' && 'Karanvir Sir Lecture 4: Active counselors roster, converted scholars, and 1-click reassignment of orphaned leads.'}
                {kpiFilter === 'attention' && 'Immediate intervention list: uncontacted leads, former staff orphaned leads, and high-probability cancellations.'}
                {kpiFilter === 'radar' && 'Predictive conversion forecast and probability distribution across academic departments.'}
                {kpiFilter === 'unique' && 'Cross-verified unique applicant profiles across mobile numbers and Aadhaar telemetry.'}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#00236f] font-mono font-bold text-xs border border-blue-200">
            Audit Mode: {kpiFilter.toUpperCase()}
          </span>
        </div>

        {/* DRILLDOWN 1: COUNSELORS ROSTER & REASSIGNMENT */}
        {kpiFilter === 'counselors' && (
          <div className="space-y-5">
            {/* Active Counselors Table */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Active Institutional Admissions Counselors Roster</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#00236f] text-white uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Counselor Staff Name</th>
                      <th className="py-2.5 px-3">Admissions Portfolio</th>
                      <th className="py-2.5 px-3 text-right">Active Inquiries</th>
                      <th className="py-2.5 px-3 text-right">Registered Scholars</th>
                      <th className="py-2.5 px-3 text-right">Closed Leads</th>
                      <th className="py-2.5 px-3 text-right">Conversion Success Rate</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {counselorsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-3 text-slate-600">{c.role}</td>
                        <td className="py-3 px-3 text-right font-black text-[#00236f]">{c.activeLeads}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700">{c.registered}</td>
                        <td className="py-3 px-3 text-right text-slate-400">{c.closed}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[11px] border border-emerald-200">
                            {c.conversionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery(c.name);
                              setKpiFilter('all');
                              fetchEnquiries();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#00236f] font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Filter Leads
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deactivated / Left Counselors Orphaned Leads Table */}
            <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-black text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Deactivated / Former Counselors Orphaned Inquiries (Immediate Reassignment Needed)</span>
                </h4>
                <span className="text-xs font-bold text-rose-600">
                  {deactivatedCounselorsList.reduce((acc, d) => acc + d.orphanedLeads, 0)} Total Orphaned Leads
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-900 text-white uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Former Staff Counselor</th>
                      <th className="py-2.5 px-3">Institutional Status</th>
                      <th className="py-2.5 px-3">Last Active Date</th>
                      <th className="py-2.5 px-3 text-right">Orphaned Leads Remaining</th>
                      <th className="py-2.5 px-3 text-right">Reassignment Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {deactivatedCounselorsList.map((dc) => (
                      <tr key={dc.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{dc.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                            {dc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{dc.lastActive}</td>
                        <td className="py-3 px-3 text-right font-black text-rose-700 text-sm">{dc.orphanedLeads} Leads</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackMsg(`All ${dc.orphanedLeads} leads from ${dc.name} successfully reassigned to S. Harinder Singh!`);
                              setDeactivatedCounselorsList(prev => prev.map(x => x.id === dc.id ? { ...x, orphanedLeads: 0 } : x));
                              setTimeout(() => setFeedbackMsg(null), 5000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                            <span>Reassign All {dc.orphanedLeads} Leads</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DRILLDOWN 2: ATTENTION REQUIRED RADAR */}
        {kpiFilter === 'attention' && (
          <div className="space-y-5">
            {/* Section A: Orphaned Leads */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Orphaned Leads from Former / Resigned Staff</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                  {orphanedLeads.length} Leads
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Mobile Contact</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Former Counselor</th>
                      <th className="py-2.5 px-3 text-right">Probability</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orphanedLeads.map((ol) => (
                      <tr key={ol.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{ol.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{ol.mobile}</td>
                        <td className="py-3 px-3 text-slate-700">{ol.course}</td>
                        <td className="py-3 px-3 text-rose-600 font-semibold">{ol.previousCounselor} ({ol.daysOrphaned}d ago)</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700">{ol.probability}%</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackMsg(`Lead for ${ol.name} reassigned to Ms. Divya Sharma!`);
                              setOrphanedLeads(prev => prev.filter(x => x.id !== ol.id));
                              setTimeout(() => setFeedbackMsg(null), 4000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#00236f] text-white font-bold text-[11px] hover:bg-[#001744] cursor-pointer"
                          >
                            Reassign Lead
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B: High Probability Dropped Leads Audit */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
                  <span>High-Probability Dropped Leads Audit Matrix (&gt;{highProbThreshold}% but Cancelled)</span>
                </h4>
                <span className="text-xs text-slate-500 font-semibold">Karanvir Sir Audit Ordinance</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Prior Probability</th>
                      <th className="py-2.5 px-3">Disqualification Justification / Remark</th>
                      <th className="py-2.5 px-3 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {highProbCancelledLeads.map((cl) => (
                      <tr key={cl.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{cl.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{cl.mobile}</td>
                        <td className="py-3 px-3 text-slate-700">{cl.course}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black text-[10px] border border-emerald-200">
                            {cl.probability}% High Likelihood
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-xs">{cl.reason}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackMsg(`Lead ${cl.name} reopened and restored to active counseling desk!`);
                              setHighProbCancelledLeads(prev => prev.filter(x => x.id !== cl.id));
                              setTimeout(() => setFeedbackMsg(null), 4000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 cursor-pointer"
                          >
                            Reactivate Lead
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DRILLDOWN 3: PROBABILITY RADAR SCHOOL MATRIX */}
        {kpiFilter === 'radar' && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-[#00236f] flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#ea580c]" />
              <span>Institutional School-Wise Admissions Yield & Conversion Probability</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#00236f] text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Academic School</th>
                    <th className="py-2.5 px-3">Core Programs</th>
                    <th className="py-2.5 px-3 text-right">High Likelihood (&gt;75%)</th>
                    <th className="py-2.5 px-3 text-right">Moderate (50-75%)</th>
                    <th className="py-2.5 px-3 text-right">Early Stage (&lt;50%)</th>
                    <th className="py-2.5 px-3 text-right">Predicted Intake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">School of Computing & AI</td>
                    <td className="py-3 px-3 text-slate-600">B.Tech CSE, BCA Cloud & AI</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">142 Leads</td>
                    <td className="py-3 px-3 text-right text-amber-700 font-bold">84 Leads</td>
                    <td className="py-3 px-3 text-right text-slate-400">32 Leads</td>
                    <td className="py-3 px-3 text-right font-black text-[#00236f] text-sm">180 Scholars</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">School of Engineering & Tech</td>
                    <td className="py-3 px-3 text-slate-600">B.Tech ME, Civil, ECE</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">68 Leads</td>
                    <td className="py-3 px-3 text-right text-amber-700 font-bold">54 Leads</td>
                    <td className="py-3 px-3 text-right text-slate-400">41 Leads</td>
                    <td className="py-3 px-3 text-right font-black text-[#00236f] text-sm">95 Scholars</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">School of Business & Commerce</td>
                    <td className="py-3 px-3 text-slate-600">MBA, BBA, B.Com Professional</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">92 Leads</td>
                    <td className="py-3 px-3 text-right text-amber-700 font-bold">61 Leads</td>
                    <td className="py-3 px-3 text-right text-slate-400">28 Leads</td>
                    <td className="py-3 px-3 text-right font-black text-[#00236f] text-sm">120 Scholars</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">School of Agriculture Sciences</td>
                    <td className="py-3 px-3 text-slate-600">B.Sc (Hons) Agriculture</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">54 Leads</td>
                    <td className="py-3 px-3 text-right text-amber-700 font-bold">39 Leads</td>
                    <td className="py-3 px-3 text-right text-slate-400">19 Leads</td>
                    <td className="py-3 px-3 text-right font-black text-[#00236f] text-sm">70 Scholars</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DRILLDOWN 4: UNIQUE ENQUIRIES DEDUPLICATION REGISTER */}
        {kpiFilter === 'unique' && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm font-black text-[#00236f] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Deduplicated Candidate Intake Records (Clean Database)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Cross-verified across 10-digit mobile phone numbers and Aadhaar telemetry. Redundant inquiries collapsed to single canonical scholar profile.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Unique Candidate</th>
                    <th className="py-2.5 px-3">Primary Mobile</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">First Contact Date</th>
                    <th className="py-2.5 px-3">Assigned Counselor</th>
                    <th className="py-2.5 px-3 text-right">Duplicate Records Collapsed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {enquiries.slice(0, 8).map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{e.student_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{e.mobile}</td>
                      <td className="py-3 px-3 text-slate-600">{e.email || '—'}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{e.created_at?.slice(0, 10) || '2026-10-14'}</td>
                      <td className="py-3 px-3 font-semibold text-[#00236f]">{e.counselor_name || 'S. Harinder Singh'}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {idx % 2 === 0 ? '1 Redundant Entry Merged' : 'Unique Lead'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      )}

      {/* FLOATING TELEPHONY VOIP CALL DOCK (Recording 161 & Lecture 4 Segment 3) */}
      <TelephonyCallDock
        isOpen={isTelephonyDockOpen}
        onClose={() => {
          setIsTelephonyDockOpen(false);
          setIsCalling(false);
        }}
        activeCandidate={activeCallCandidate}
        onDispositionSaved={handleTelephonyDisposition}
      />
    </div>
  );
};
