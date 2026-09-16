import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface FeeHeadItem {
  id: string;
  fee_head_id: string;
  title: string;
  category: string;
  amount: number;
  discount_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  isSelected: boolean;
  enteredAmount: number;
}

interface PayNowModalProps {
  student: any | null;
  feeId?: string;
  onClose: () => void;
  onPaymentSuccess: (receiptNo: string) => void;
}

export const PayNowModal: React.FC<PayNowModalProps> = ({
  student,
  feeId,
  onClose,
  onPaymentSuccess,
}) => {
  const [feeItems, setFeeItems] = useState<FeeHeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState<'online_upi' | 'net_banking' | 'credit_card' | 'cash'>('online_upi');
  const [upiId, setUpiId] = useState('student@okhdfcbank');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  const activeStudentId = student?.id || student?.student_id || student?.user_id;

  // Load ledger details & itemized fee records
  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);

    const targetId = activeStudentId || 'me';
    api.getFeeLedger(targetId).then(res => {
      if (res.success && res.ledger) {
        setStudentDetails(res.student);
        const mapped: FeeHeadItem[] = (res.ledger || [])
          .filter((f: any) => f.status !== 'cancelled' && f.due_amount > 0)
          .map((f: any) => {
            const isTarget = feeId ? f.id === feeId || f.fee_head_id === feeId : true;
            return {
              id: f.id,
              fee_head_id: f.fee_head_id,
              title: f.fee_head?.title || f.title || (f.fee_head_id.includes('hostel') ? 'Hostel Fee' : f.fee_head_id.includes('transport') ? 'Bus Transport Fee' : 'Tuition Fee'),
              category: f.fee_head_id.includes('hostel') ? 'hostel' : f.fee_head_id.includes('transport') ? 'transport' : f.fee_head_id.includes('univ') ? 'exam' : 'tuition',
              amount: f.amount,
              discount_amount: f.discount_amount || 0,
              paid_amount: f.paid_amount || 0,
              due_amount: f.due_amount,
              status: f.status,
              isSelected: isTarget,
              enteredAmount: f.due_amount,
            };
          });

        // If a specific feeId was requested, ensure ONLY that head is selected initially
        if (feeId) {
          const hasMatch = mapped.some(m => m.id === feeId || m.fee_head_id === feeId);
          if (hasMatch) {
            mapped.forEach(m => {
              m.isSelected = m.id === feeId || m.fee_head_id === feeId;
            });
          }
        }

        setFeeItems(mapped);
      } else {
        setErrorMsg(res.error || 'Could not load student fee records.');
      }
      setIsLoading(false);
    }).catch(err => {
      setErrorMsg(err.message || 'Failed to retrieve fee records.');
      setIsLoading(false);
    });
  }, [activeStudentId, feeId]);

  // Toggle individual fee head
  const toggleFeeHead = (id: string) => {
    setFeeItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  // Update payment amount for a specific fee head (partial payment support)
  const updateItemAmount = (id: string, val: number) => {
    setFeeItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enteredAmount: Math.max(0, Math.min(item.due_amount, val)) } : item
      )
    );
  };

  // Quick preset selectors
  const selectAll = () => {
    setFeeItems(prev => prev.map(item => ({ ...item, isSelected: true, enteredAmount: item.due_amount })));
  };

  const selectCategoryOnly = (cat: string) => {
    setFeeItems(prev =>
      prev.map(item => ({
        ...item,
        isSelected: item.category === cat,
        enteredAmount: item.due_amount,
      }))
    );
  };

  // Calculate total selected amount dynamically
  const totalAmount = feeItems
    .filter(item => item.isSelected)
    .reduce((sum, item) => sum + (Number(item.enteredAmount) || 0), 0);

  const selectedCount = feeItems.filter(item => item.isSelected).length;

  const hasHostelFees = feeItems.some(f => f.category === 'hostel');
  const hasTransportFees = feeItems.some(f => f.category === 'transport');
  const hasTuitionFees = feeItems.some(f => f.category === 'tuition');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      setErrorMsg('Please select at least one fee head with an amount greater than ₹0.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const selectedAllocations = feeItems
      .filter(item => item.isSelected && item.enteredAmount > 0)
      .map(item => ({
        studentFeeId: item.id,
        amount: item.enteredAmount,
      }));

    const selectedTitles = feeItems
      .filter(item => item.isSelected && item.enteredAmount > 0)
      .map(item => item.title);

    try {
      const res = await api.payFee({
        studentId: studentDetails?.id || activeStudentId || student?.id,
        amount: totalAmount,
        paymentMode,
        feeAllocations: selectedAllocations,
        notes: `Targeted settlement for: ${selectedTitles.join(', ')}`,
      });

      if (res.success && res.receiptNo) {
        onPaymentSuccess(res.receiptNo);
      } else {
        setErrorMsg(res.error || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getHeadIcon = (cat: string) => {
    switch (cat) {
      case 'hostel': return 'bed';
      case 'transport': return 'directions_bus';
      case 'exam': return 'assignment';
      default: return 'school';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-5 animate-scaleUp my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00236f] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Targeted Fee Settlement</h3>
              <p className="text-xs text-[#757682]">
                Student: <strong className="text-[#191c1d]">{studentDetails?.name || student?.first_name ? `${student?.first_name} ${student?.last_name || ''}` : 'Aryan Sharma'}</strong>
                {studentDetails?.studentId ? ` • UID: ${studentDetails.studentId}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#757682] hover:text-[#191c1d] p-1 rounded-lg hover:bg-[#f3f4f5]">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Filter Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-[#757682] uppercase tracking-wider">
              Quick Filter by Fee Head:
            </label>
            <span className="text-xs font-bold text-[#00236f]">
              {selectedCount} of {feeItems.length} heads selected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 bg-[#f3f4f5] hover:bg-[#dce1ff] text-[#00236f] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              All Outstanding Dues
            </button>
            {hasHostelFees && (
              <button
                type="button"
                onClick={() => selectCategoryOnly('hostel')}
                className="px-2.5 py-1 bg-[#fef3c7] hover:bg-[#fde68a] text-[#b45309] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">bed</span>
                <span>Hostel Fee Only</span>
              </button>
            )}
            {hasTransportFees && (
              <button
                type="button"
                onClick={() => selectCategoryOnly('transport')}
                className="px-2.5 py-1 bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e40af] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">directions_bus</span>
                <span>Transport Fee Only</span>
              </button>
            )}
            {hasTuitionFees && (
              <button
                type="button"
                onClick={() => selectCategoryOnly('tuition')}
                className="px-2.5 py-1 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#5b21b6] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">school</span>
                <span>Tuition Only</span>
              </button>
            )}
          </div>
        </div>

        {/* Itemized Fee Checklist */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-[#757682]">Loading student fee breakdown...</div>
          ) : feeItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#006a61] bg-[#86f2e4]/20 rounded-xl border border-[#86f2e4]">
              🎉 No pending fee dues! All fee heads for this student are fully settled.
            </div>
          ) : (
            feeItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleFeeHead(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  item.isSelected
                    ? 'border-[#00236f] bg-[#f0f4ff]'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={item.isSelected}
                    onChange={() => {}} // Handled by container onClick
                    className="w-4 h-4 text-[#00236f] rounded border-[#e1e3e4] focus:ring-[#00236f]"
                  />
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#e1e3e4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-[#00236f]">
                      {getHeadIcon(item.category)}
                    </span>
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-[#191c1d] truncate">{item.title}</h4>
                    <p className="text-[10px] text-[#757682]">
                      Assessed: ₹{item.amount.toLocaleString('en-IN')}
                      {item.discount_amount > 0 ? ` • Concession: -₹${item.discount_amount.toLocaleString('en-IN')}` : ''}
                      {item.paid_amount > 0 ? ` • Already Paid: ₹${item.paid_amount.toLocaleString('en-IN')}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0" onClick={e => e.stopPropagation()}>
                  <span className="text-[10px] font-bold text-[#ba1a1a] uppercase block">
                    Due: ₹{item.due_amount.toLocaleString('en-IN')}
                  </span>
                  {item.isSelected ? (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[11px] font-bold text-[#444651]">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={item.due_amount}
                        value={item.enteredAmount}
                        onChange={e => updateItemAmount(item.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white border border-[#00236f] rounded text-xs font-bold text-right text-[#00236f] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#757682] italic">Excluded</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Options Form */}
        <form onSubmit={handlePay} className="space-y-4 text-xs pt-1 border-t border-[#f3f4f5]">
          <div>
            <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-2">
              Payment Gateway Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('online_upi')}
                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  paymentMode === 'online_upi'
                    ? 'border-[#00236f] bg-[#dce1ff]/50 text-[#00236f] font-bold shadow-xs'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span className="text-[11px]">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('net_banking')}
                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  paymentMode === 'net_banking'
                    ? 'border-[#00236f] bg-[#dce1ff]/50 text-[#00236f] font-bold shadow-xs'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span className="text-[11px]">Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('credit_card')}
                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  paymentMode === 'credit_card'
                    ? 'border-[#00236f] bg-[#dce1ff]/50 text-[#00236f] font-bold shadow-xs'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                <span className="text-[11px]">Debit/Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  paymentMode === 'cash'
                    ? 'border-[#00236f] bg-[#dce1ff]/50 text-[#00236f] font-bold shadow-xs'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="text-[11px]">Cash Counter</span>
              </button>
            </div>
          </div>

          {paymentMode === 'online_upi' && (
            <div>
              <label className="block font-bold text-[#191c1d] mb-1">UPI Virtual Payment Address (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="e.g. aryan@okhdfcbank"
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
              />
            </div>
          )}

          {paymentMode === 'net_banking' && (
            <div>
              <label className="block font-bold text-[#191c1d] mb-1">Select Bank</label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-semibold"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
              </select>
            </div>
          )}

          {/* Targeted Summary Bar */}
          <div className="p-3.5 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#166534] font-bold block">
                Total Payment Amount:
              </span>
              <span className="text-lg font-black text-[#15803d]">
                ₹ {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#166534] bg-white px-2.5 py-1 rounded-lg border border-[#bbf7d0]">
              Depositing strictly to {selectedCount} head(s)
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || totalAmount <= 0}
              className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{isProcessing ? 'Processing Transaction...' : `Confirm & Pay ₹ ${totalAmount.toLocaleString('en-IN')}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
