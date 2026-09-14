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

  useEffect(() => {
    if (!activeStudentId) return;
    setIsLoading(true);
    api.getFeeLedger(activeStudentId).then(res => {
      if (res.success) {
        setLedgerData(res);
      }
      setIsLoading(false);
    });
  }, [activeStudentId]);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Total Academic Fees
            </span>
            <h3 className="text-2xl font-extrabold text-[#191c1d] mt-1">
              ₹ {ledgerData.summary.totalPayable.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-[#757682] mt-0.5">Assessed across all semesters</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Total Paid to Date
            </span>
            <h3 className="text-2xl font-extrabold text-[#006a61] mt-1">
              ₹ {ledgerData.summary.totalPaid.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-[#006a61] font-semibold mt-0.5">Verified receipts issued</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Outstanding Due Balance
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
              Itemized semester billing schedule
            </p>
          </div>
          <span className="px-2.5 py-1 bg-[#dce1ff] text-[#00236f] rounded text-xs font-bold">
            Semester 4 (Active)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                <th className="py-3 px-4">Fee Head</th>
                <th className="py-3 px-4">Session / Sem</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Due Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f5]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[#757682]">
                    Loading fee ledger entries...
                  </td>
                </tr>
              ) : ledgerData?.ledger?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[#757682]">
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
    </div>
  );
};
