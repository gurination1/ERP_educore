import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StudentProfile } from '../types';

interface FeeLedgerViewProps {
  currentStudent: StudentProfile | null;
  onOpenPayModal: (feeId?: string) => void;
  onOpenReceiptModal: (receiptNo?: string) => void;
}

export const FeeLedgerView: React.FC<FeeLedgerViewProps> = ({
  currentStudent,
  onOpenPayModal,
  onOpenReceiptModal,
}) => {
  const isAdmin = !currentStudent;
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(currentStudent?.id || 'stu-rec-001');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      api.getStudents({ limit: 50 }).then(res => {
        if (res.success && res.students && res.students.length > 0) {
          setStudentList(res.students);
          if (!currentStudent) {
            setSelectedStudentId(res.students[0].id);
          }
        }
      });
    }
  }, [isAdmin]);

  const activeStudentId = currentStudent?.id || selectedStudentId;

  // Fee Head Assignment Modal State (Admin only)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [selectedFeeHeadId, setSelectedFeeHeadId] = useState('');
  const [assignAmount, setAssignAmount] = useState('');
  const [assignDueDate, setAssignDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [assignSemester, setAssignSemester] = useState(1);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchLedger = () => {
    if (!activeStudentId) return;
    setIsLoading(true);
    api.getFeeLedger(activeStudentId).then(res => {
      if (res.success) {
        setLedgerData(res);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchLedger();
  }, [activeStudentId]);

  useEffect(() => {
    if (isAdmin) {
      api.getFeeHeads().then(res => {
        if (res.success && res.feeHeads) {
          setFeeHeads(res.feeHeads);
          if (res.feeHeads.length > 0) {
            setSelectedFeeHeadId(res.feeHeads[0].id);
          }
        }
      });
    }
  }, [isAdmin]);

  const handleAssignHead = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    if (!selectedFeeHeadId || !assignAmount) {
      setAssignError('Please select a fee head and enter an amount.');
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await api.assignFeeHead({
        studentId: activeStudentId,
        feeHeadId: selectedFeeHeadId,
        amount: parseFloat(assignAmount),
        dueDate: assignDueDate,
        semester: assignSemester,
      });
      if (res.success) {
        setIsAssignModalOpen(false);
        setAssignAmount('');
        fetchLedger();
      } else {
        setAssignError(res.error || 'Failed to assign fee head.');
      }
    } catch (err: any) {
      setAssignError(err.message || 'Error occurred while assigning fee head.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  return (
    <div id="fee-ledger-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
            {isAdmin ? 'Institutional Fee Ledger & Audit' : 'Student Academic Fee Ledger'}
          </h2>
          <p className="text-sm text-[#444651] mt-1">
            {isAdmin
              ? 'Inspect student payment statements, tuition installments, and verified transaction receipts.'
              : 'Complete statement of semester tuition heads, scholarships, discounts, and payment history.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#757682] uppercase">Audit Account:</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#e1e3e4] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                >
                  {studentList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.student_id} — {s.first_name} {s.last_name} ({s.course?.code || 'Enrolled'})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setIsAssignModalOpen(true); setAssignError(null); }}
                className="px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-bold hover:bg-[#1e3a8a] flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Assign Fee Head</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-[#e1e3e4] text-[#191c1d] rounded-lg text-xs font-bold hover:bg-[#f8f9fa] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Ledger</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenPayModal()}
              className="px-5 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              <span>Make Fee Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Banner */}
      {ledgerData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Gross Assessed Fees
            </span>
            <h3 className="text-2xl font-extrabold text-[#191c1d] mt-1">
              ₹ {(ledgerData.summary.totalGross || ledgerData.summary.totalPayable).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-[#757682] mt-0.5">Assessed statutory heads</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#006a61]">
              Scholarships & Aid
            </span>
            <h3 className="text-2xl font-extrabold text-[#006a61] mt-1">
              ₹ {((ledgerData.ledger || []).reduce((acc: number, f: any) => acc + (f.discount_amount || 0), 0)).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-[#006a61] font-semibold mt-0.5">Approved fee concessions</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Total Paid to Date
            </span>
            <h3 className="text-2xl font-extrabold text-[#00236f] mt-1">
              ₹ {ledgerData.summary.totalPaid.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-[#757682] font-semibold mt-0.5">Verified receipts issued</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ba1a1a]">
              Net Outstanding Due
            </span>
            <h3 className="text-2xl font-extrabold text-[#ba1a1a] mt-1">
              ₹ {ledgerData.summary.totalDue.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-[#ba1a1a] font-semibold mt-0.5">Next Due: 15 Oct 2025</p>
          </div>
        </div>
      )}

      {/* Fee Breakdown Table */}
      <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e1e3e4] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#191c1d]">Fee Heads & Assessment Breakdown</h3>
            <p className="text-xs text-[#757682] mt-0.5">
              Itemized semester billing schedule with applied scholarships & mutual exclusivity audit
            </p>
          </div>
          <span className="px-2.5 py-1 bg-[#dce1ff] text-[#00236f] rounded text-xs font-bold">
            Semester {ledgerData?.student?.semester || 1} (Active)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                <th className="py-3 px-4">Fee Head</th>
                <th className="py-3 px-4">Session / Sem</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">Scholarship / Aid</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Net Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f5]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#757682]">
                    Loading fee ledger entries...
                  </td>
                </tr>
              ) : ledgerData?.ledger?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#757682]">
                    No fee records currently logged.
                  </td>
                </tr>
              ) : (
                ledgerData?.ledger?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#f8f9fa]">
                    <td className="py-3.5 px-4 font-bold text-[#191c1d]">
                      {item.fee_head?.title || 'Tuition Fee'}
                    </td>
                    <td className="py-3.5 px-4 text-[#444651]">
                      {item.session?.name || '2025-26'} • Sem {item.semester}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#191c1d]">
                      ₹ {item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.discount_amount > 0 ? (
                        <span className="px-2 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded text-[11px] font-bold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                          <span>-₹ {item.discount_amount.toLocaleString('en-IN')}</span>
                        </span>
                      ) : (
                        <span className="text-[#757682] font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#006a61] font-semibold">
                      ₹ {item.paid_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[#ba1a1a] font-bold">
                      ₹ {item.due_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[#757682]">{item.due_date}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'paid'
                            ? 'bg-[#86f2e4]/40 text-[#006a61]'
                            : item.status === 'due'
                            ? 'bg-[#fef3c7] text-[#b45309]'
                            : 'bg-[#ffdad6] text-[#ba1a1a]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status !== 'paid' ? (
                        <button
                          onClick={() => onOpenPayModal(item.id)}
                          className="px-3 py-1 bg-[#00236f] text-white rounded text-xs font-bold hover:bg-[#1e3a8a] transition-colors cursor-pointer"
                        >
                          Pay
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenReceiptModal()}
                          className="text-[#006a61] font-bold text-xs hover:underline inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">receipt</span>
                          <span>Receipt</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transactions History */}
      <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e1e3e4]">
          <h3 className="text-base font-bold text-[#191c1d]">Receipts & Payment History</h3>
          <p className="text-xs text-[#757682] mt-0.5">
            Cryptographically logged transaction receipts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f5]">
              {ledgerData?.payments?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#757682]">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                ledgerData?.payments?.map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-[#f8f9fa]">
                    <td className="py-3.5 px-4 font-bold text-[#00236f]">{pay.receipt_no}</td>
                    <td className="py-3.5 px-4 text-[#757682]">{pay.payment_date}</td>
                    <td className="py-3.5 px-4 font-mono text-[#444651]">
                      {pay.transaction_reference}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[#444651] font-semibold">
                      {pay.payment_mode.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#006a61]">
                      ₹ {pay.amount_paid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded text-[10px] font-bold">
                        Success
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenReceiptModal(pay.receipt_no)}
                        className="px-3 py-1 bg-[#f3f4f5] hover:bg-[#dce1ff] text-[#00236f] rounded text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Fee Head Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#e1e3e4] overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-[#00236f] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Assign Statutory Fee Head</h3>
                <p className="text-xs text-blue-200">
                  Target: {ledgerData?.student?.name || 'Selected Student'} ({ledgerData?.student?.studentId})
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAssignHead} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{assignError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#444651] uppercase mb-1">Fee Head</label>
                <select
                  value={selectedFeeHeadId}
                  onChange={e => setSelectedFeeHeadId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e1e3e4] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                  required
                >
                  {feeHeads.map(fh => (
                    <option key={fh.id} value={fh.id}>
                      {fh.title} ({fh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444651] uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={assignAmount}
                    onChange={e => setAssignAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e1e3e4] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444651] uppercase mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={assignSemester}
                    onChange={e => setAssignSemester(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-[#e1e3e4] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444651] uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={e => setAssignDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e1e3e4] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">Affiliation Rule:</span> Campus accommodation (Hostel) and College Fleet (Transport) are strictly mutually exclusive. Violations will be rejected automatically.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e1e3e4]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#444651] hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#00236f] hover:bg-[#1e3a8a] rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {assignSubmitting ? (
                    <span>Assigning...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Confirm Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
