import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { User } from '../types';
import { api } from '../api/client';

interface EnquiriesViewProps {
  currentUser: User | null;
  onNavigateToManageStudents?: () => void;
  onNavigateToBulkImport?: () => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  currentUser,
  onNavigateToManageStudents,
  onNavigateToBulkImport,
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

  // New Interaction Form
  const [stageName, setStageName] = useState('Telephonic Academic Counseling');
  const [interactionRemarks, setInteractionRemarks] = useState('');
  const [probabilityVal, setProbabilityVal] = useState(75);
  const [callStatus, setCallStatus] = useState('Connected / Interested');

  // Convert to Student Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertPayment, setConvertPayment] = useState({
    amount: 10000,
    payment_mode: 'online_upi',
    transaction_ref: `UPI-${Date.now().toString().slice(-6)}`,
  });

  // New Single Enquiry Modal
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
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    const res = await api.getEnquiries({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
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
  }, [statusFilter]);

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
    const res = await api.dialEnquiry(enquiryDetails.id);
    if (res.success) {
      setIsCalling(true);
      setCallSession(res);
      setFeedbackMsg(`Auto-Dialer active: Simulated connection via ${res.provider.toUpperCase()} headset gateway.`);
    } else {
      alert(res.error || 'Failed to start dialer');
    }
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
      call_recording_url: callSession?.simulated_recording_url || undefined,
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
            {dialerSettings.is_enabled ? `[DIALER: ACTIVE (${dialerSettings.provider.toUpperCase()})]` : '[DIALER: DISABLED]'}
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
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold px-3 py-1.5 rounded text-[11px] transition"
          >
            + NEW ENQUIRY
          </button>
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

      {/* Main Two-Column Layout */}
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
                      <span className="font-mono text-gray-800">{e.mobile}</span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 mt-1 pt-1 border-t">
                      <span>ENQ NO: {e.enquiry_no}</span>
                      <span className="uppercase font-semibold text-[#ea580c]">
                        [{e.status.replace(/_/g, ' ')}]
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
                      {enquiryDetails.status.replace(/_/g, ' ')}
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
                      Gateway: {dialerSettings.provider.toUpperCase()} Internet Audio Stream | Recording: ACTIVE
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

      {/* MODAL: Token Fee & Convert to Student */}
      {showConvertModal && enquiryDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-md p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">COLLECT TOKEN FEE & ADMIT STUDENT</span>
              <button onClick={() => setShowConvertModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded text-[10px] text-emerald-900 space-y-1">
                <span className="font-bold block">[AUTOMATIC ADMISSION PROMOTION]:</span>
                <p>
                  Upon registration token clearance, this lead will be converted to an officially enrolled Student in Student Master with a canonical Course UID (e.g. 1001-88-03-01) and token receipt slip.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">CANDIDATE NAME:</label>
                <input
                  type="text"
                  disabled
                  value={enquiryDetails.student_name}
                  className="w-full border p-1.5 rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">COURSE:</label>
                <input
                  type="text"
                  disabled
                  value={enquiryDetails.selected_course}
                  className="w-full border p-1.5 rounded bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">TOKEN AMOUNT (INR) *:</label>
                  <input
                    type="number"
                    value={convertPayment.amount}
                    onChange={e => setConvertPayment({ ...convertPayment, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full border p-1.5 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">PAYMENT MODE:</label>
                  <select
                    value={convertPayment.payment_mode}
                    onChange={e => setConvertPayment({ ...convertPayment, payment_mode: e.target.value as any })}
                    className="w-full border p-1.5 rounded"
                  >
                    <option value="online_upi">ONLINE UPI (GPAY/PHONEPE)</option>
                    <option value="net_banking">NET BANKING / IMPS</option>
                    <option value="credit_card">CREDIT / DEBIT CARD</option>
                    <option value="cash">CASH COUNTER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">TRANSACTION / UTR REFERENCE:</label>
                <input
                  type="text"
                  value={convertPayment.transaction_ref}
                  onChange={e => setConvertPayment({ ...convertPayment, transaction_ref: e.target.value })}
                  className="w-full border p-1.5 rounded font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-3 py-1 border rounded text-gray-600"
              >
                CANCEL
              </button>
              <button
                onClick={handleConvertStudent}
                className="px-3 py-1 bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold rounded"
              >
                CLEAR FEE & GENERATE UID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Single Enquiry */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#00236f] w-full max-w-md p-4 space-y-3 font-sans text-[11px]">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-[#00236f]">REGISTER NEW WALK-IN / TELEPHONIC LEAD</span>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-black">
                [CLOSE]
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">CANDIDATE FULL NAME *:</label>
                <input
                  type="text"
                  placeholder="e.g. Navjot Kaur"
                  value={newEnquiry.student_name}
                  onChange={e => setNewEnquiry({ ...newEnquiry, student_name: e.target.value })}
                  className="w-full border p-1.5 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">MOBILE NUMBER *:</label>
                  <input
                    type="text"
                    placeholder="+91 98765 11223"
                    value={newEnquiry.mobile}
                    onChange={e => setNewEnquiry({ ...newEnquiry, mobile: e.target.value })}
                    className="w-full border p-1.5 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">EMAIL:</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={newEnquiry.email}
                    onChange={e => setNewEnquiry({ ...newEnquiry, email: e.target.value })}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-gray-700">TARGET COURSE / DEGREE:</label>
                <select
                  value={newEnquiry.selected_course}
                  onChange={e => setNewEnquiry({ ...newEnquiry, selected_course: e.target.value })}
                  className="w-full border p-1.5 rounded"
                >
                  <option value="B.Tech Computer Science & Engineering">B.Tech Computer Science & Engineering</option>
                  <option value="B.Sc (Hons) Agriculture Sciences">B.Sc (Hons) Agriculture Sciences</option>
                  <option value="B.Tech Civil Engineering">B.Tech Civil Engineering</option>
                  <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
                  <option value="Bachelor of Pharmacy (B.Pharm)">Bachelor of Pharmacy (B.Pharm)</option>
                  <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">FATHER / GUARDIAN NAME:</label>
                  <input
                    type="text"
                    value={newEnquiry.father_name}
                    onChange={e => setNewEnquiry({ ...newEnquiry, father_name: e.target.value })}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">INITIAL PROBABILITY (%):</label>
                  <input
                    type="number"
                    value={newEnquiry.admission_probability}
                    onChange={e => setNewEnquiry({ ...newEnquiry, admission_probability: parseInt(e.target.value, 10) || 50 })}
                    className="w-full border p-1.5 rounded font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 border rounded text-gray-600"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateEnquiry}
                className="px-3 py-1 bg-[#00236f] text-white font-bold rounded"
              >
                CREATE ENQUIRY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
