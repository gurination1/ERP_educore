import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface ReceiptModalProps {
  receiptNo?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptNo, onClose }) => {
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const target = receiptNo || 'REC-2024-0088';
    api.getReceipt(target).then(res => {
      if (res.success) {
        setReceiptData(res.receipt);
      }
      setIsLoading(false);
    });
  }, [receiptNo]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#e1e3e4] overflow-hidden my-6 animate-scaleUp">
        {/* Modal Top Actions */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#e1e3e4] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[20px]">
              receipt_long
            </span>
            <span className="text-sm font-bold text-[#191c1d]">
              Institutional Fee Payment Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#00236f] text-white text-xs font-bold rounded-lg hover:bg-[#1e3a8a] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#757682] hover:text-[#191c1d] p-1 rounded-lg hover:bg-[#edeeef]"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-fee-receipt" className="p-8 space-y-6 text-[#191c1d] bg-white">
          {/* Header with College Crest */}
          <div className="text-center border-b-2 border-[#00236f] pb-5">
            <div className="w-12 h-12 rounded-xl bg-[#00236f] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">school</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-[#00236f] uppercase">
              {receiptData?.institutionName || 'Baba Farid College of Engineering & Technology (BFGI)'}
            </h2>
            <p className="text-[11px] text-[#757682] mt-0.5">
              {receiptData?.campusAddress || 'Muktsar Road, Deon, Bathinda, Punjab 151001 • Affiliated to MRSPTU Bathinda • AICTE Approved'}
            </p>
            <span className="inline-block mt-2 px-3 py-0.5 bg-[#dce1ff] text-[#00236f] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              Official Electronic Fee Receipt (MRSPTU Affiliated)
            </span>
          </div>

          {isLoading ? (
            <p className="text-center py-8 text-xs text-[#757682]">Loading receipt records...</p>
          ) : receiptData ? (
            <div className="space-y-5 text-xs">
              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#f8f9fa] rounded-xl border border-[#edeeef]">
                <div>
                  <span className="text-[10px] text-[#757682] uppercase font-bold block">
                    Receipt Number
                  </span>
                  <span className="text-sm font-black text-[#00236f] mt-0.5 block font-mono">
                    {receiptData.receiptNo || 'REC-2024-0088'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#757682] uppercase font-bold block">
                    Payment Date & Time
                  </span>
                  <span className="text-xs font-semibold text-[#191c1d] mt-0.5 block">
                    {receiptData.date || '2024-10-12 14:32:00'}
                  </span>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 py-2 border-b border-[#f3f4f5]">
                <div>
                  <span className="text-[#757682] text-[11px]">Student Full Name:</span>
                  <p className="font-bold text-sm text-[#191c1d]">
                    {receiptData.studentName || 'Aryan Sharma'}
                  </p>
                </div>
                <div>
                  <span className="text-[#757682] text-[11px]">Enrollment Roll No:</span>
                  <p className="font-bold text-sm text-[#00236f]">
                    {receiptData.studentId || 'STU-2023-088'}
                  </p>
                </div>
                <div>
                  <span className="text-[#757682] text-[11px]">Program / Course:</span>
                  <p className="font-semibold text-xs text-[#191c1d]">
                    {receiptData.course || 'Bachelor of Technology (Computer Science)'}
                  </p>
                </div>
                <div>
                  <span className="text-[#757682] text-[11px]">Transaction Reference:</span>
                  <p className="font-mono text-xs text-[#444651]">
                    {receiptData.transactionRef || 'UPI/2024/9028301128'}
                  </p>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase">
                    <th className="py-2">Description / Fee Category</th>
                    <th className="py-2">Mode</th>
                    <th className="py-2 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f5]">
                  <tr>
                    <td className="py-3 font-semibold text-[#191c1d]">
                      {receiptData.feeCategory || 'Semester 3 Tuition & Academic Instruction Fee'}
                    </td>
                    <td className="py-3 uppercase text-[#757682]">
                      {receiptData.paymentMode || 'Online UPI'}
                    </td>
                    <td className="py-3 text-right font-black text-sm text-[#006a61]">
                      ₹ {(receiptData.amount || 45000).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total & Words */}
              <div className="p-4 bg-[#86f2e4]/15 rounded-xl border border-[#86f2e4]/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#006a61] block">
                    Amount in Words
                  </span>
                  <span className="text-xs font-semibold text-[#191c1d] italic">
                    {receiptData.amountInWords || 'Forty Five Thousand Indian Rupees Only'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#006a61] block">
                    Net Total Paid
                  </span>
                  <span className="text-xl font-black text-[#00236f]">
                    ₹ {(receiptData.amount || 45000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Stamp & Signatory */}
              <div className="pt-8 flex items-center justify-between">
                <div className="border border-dashed border-[#006a61] rounded-lg p-2.5 bg-[#86f2e4]/10 text-center">
                  <span className="text-[10px] font-bold text-[#006a61] uppercase block">
                    ✓ Digitally Signed & Verified
                  </span>
                  <span className="text-[9px] text-[#757682]">
                    EduCore Accounts Automated Gateway
                  </span>
                </div>

                <div className="text-right">
                  <div className="w-32 h-[1px] bg-[#191c1d] ml-auto mb-1"></div>
                  <span className="text-xs font-bold text-[#191c1d] block">
                    Authorized Signatory
                  </span>
                  <span className="text-[10px] text-[#757682]">Accounts & Finance Registrar</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
