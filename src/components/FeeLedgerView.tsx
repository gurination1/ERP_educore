import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { api } from '../api/client';
import { StudentProfile, User, FeePolicy, ContraLedgerEntry } from '../types';
import {
  Search,
  Filter,
  DollarSign,
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  X,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
  Percent,
  Download,
  Lock,
} from 'lucide-react';

interface FeeLedgerViewProps {
  currentUser?: User | null;
  currentStudent?: StudentProfile | null;
  onOpenPayModal: (feeId?: string, studentObj?: any) => void;
  onOpenReceiptModal: (receiptNo?: string) => void;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
  onCampusChange?: (campus: 'campus_01' | 'campus_02' | 'all') => void;
  onOpenMasterTables?: (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents' | 'hostel' | 'fees' | 'employee') => void;
}

const DEFAULT_FEE_POLICIES: FeePolicy[] = [
  {
    id: 'pol-01',
    policy_code: 'POL-MERIT-80',
    name: 'Merit Academic Excellence 80% Waiver',
    discount_amount: 28000,
    discount_percentage: 80,
    applicable_heads: ['tuition_fee'],
    applicable_scope: 'entire_course',
    is_active: true,
    created_at: '2025-08-01',
  },
  {
    id: 'pol-02',
    policy_code: 'POL-SIBLING-15',
    name: 'Real Sibling Institutional Concession 15%',
    discount_amount: 5250,
    discount_percentage: 15,
    applicable_heads: ['tuition_fee', 'other_fee'],
    applicable_scope: 'entire_course',
    is_active: true,
    created_at: '2025-08-10',
  },
  {
    id: 'pol-03',
    policy_code: 'POL-DEFENCE-WAR-10K',
    name: 'Armed Forces & Martyrs Ward Relief',
    discount_amount: 10000,
    applicable_heads: ['all'],
    applicable_scope: 'current_semester_only',
    is_active: true,
    created_at: '2025-09-05',
  },
  {
    id: 'pol-04',
    policy_code: 'POL-SPORTS-STATE-50',
    name: 'State Sports Championship Medalist 50%',
    discount_amount: 17500,
    discount_percentage: 50,
    applicable_heads: ['tuition_fee'],
    applicable_scope: 'entire_course',
    is_active: true,
    created_at: '2025-08-12',
  },
];

const DEFAULT_CONTRA_ENTRIES: ContraLedgerEntry[] = [
  {
    id: 'contra-01',
    student_id: '1001-01-01-03-01',
    semester: 4,
    entry_type: 'contra_negation',
    amount: 10000,
    reference_policy_id: 'POL-MERIT-80',
    description: 'Opposite Entry for Policy #POL-MERIT-80 (Reversed upon demotion audit)',
    is_contra: true,
    timestamp: '2026-10-18 11:24 IST',
    authorized_by: 'Master Admin / Accounts Bursar',
  },
  {
    id: 'contra-02',
    student_id: '1001-01-02-03-01',
    semester: 3,
    entry_type: 'demotion_void',
    amount: 22500,
    description: 'Null & Void Pending Fee - Sem 3 dues annulled due to demotion to Sem 1',
    is_contra: true,
    timestamp: '2026-10-17 15:40 IST',
    authorized_by: 'Dean Academics & Finance Officer',
  },
  {
    id: 'contra-03',
    student_id: '1001-01-04-03-01',
    semester: 5,
    entry_type: 'demotion_adjustment',
    amount: 18000,
    description: 'Adjusted Sem 5 Advance Payment toward Demoted Semester 3 Tuition Ledger',
    is_contra: true,
    timestamp: '2026-10-15 09:12 IST',
    authorized_by: 'Institutional Registrar',
  },
];

export const FeeLedgerView: React.FC<FeeLedgerViewProps> = ({
  currentUser,
  currentStudent,
  onOpenPayModal,
  onOpenReceiptModal,
  selectedCampus,
  onCampusChange,
  onOpenMasterTables,
}) => {
  const [searchParams] = useSearchParams();
  const isActualAdmin = currentUser ? ['admin', 'super_admin', 'accounts'].includes(currentUser.role) : !currentStudent;
  const isDirectorOrAdmin = currentUser ? ['admin', 'super_admin'].includes(currentUser.role) : false;
  const isStaff = currentUser ? ['staff', 'hod', 'counselor', 'hr'].includes(currentUser.role) : false;
  const isStudent = currentUser?.role === 'student' || (!isActualAdmin && !isStaff && Boolean(currentStudent));
  const canSearchStudents = isActualAdmin || isStaff;

  useEffect(() => {
    if (searchParams.get('pay') === 'true') {
      onOpenPayModal();
    }
  }, [searchParams]);

  const [studentList, setStudentList] = useState<any[]>([]);
  const initialStudentId = searchParams.get('studentId') || (isStudent ? 'me' : (currentStudent?.id || ''));
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 4 Top-level View Modes for Accounts/Admin (Karanvir Sir Lecture 4)
  const [viewMode, setViewMode] = useState<'desk' | 'ledger' | 'policies' | 'defaulters'>(
    isActualAdmin ? 'desk' : 'ledger'
  );

  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId && !isStudent) {
      setSelectedStudentId(urlStudentId);
    }
  }, [searchParams, isStudent]);

  useEffect(() => {
    if (canSearchStudents) {
      const queryParams: any = { limit: 100 };
      if (selectedCampus && selectedCampus !== 'all') {
        queryParams.campus = selectedCampus;
      }
      api.getStudents(queryParams).then(res => {
        if (res.success && res.students && res.students.length > 0) {
          setStudentList(res.students);
          // If current selection is not in filtered list, select first available student
          const exists = res.students.some((s: any) => s.id === selectedStudentId);
          if (!currentStudent && !searchParams.get('studentId') && (!exists || !selectedStudentId || selectedStudentId === 'stu-rec-aryan')) {
            setSelectedStudentId(res.students[0].id);
          }
        } else if (res.success && res.students && res.students.length === 0) {
          setStudentList([]);
        }
      });
    }
  }, [canSearchStudents, selectedCampus]);

  const activeStudentId = isStudent
    ? 'me'
    : (selectedStudentId || searchParams.get('studentId') || currentStudent?.id || (studentList[0]?.id || ''));

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

  // Defaulters State
  const [defaultersList, setDefaultersList] = useState<any[]>([]);
  const [isDefaultersLoading, setIsDefaultersLoading] = useState(false);
  const [defaulterSearch, setDefaulterSearch] = useState('');
  const [defaulterFilter, setDefaulterFilter] = useState<'all' | 'OVERDUE' | 'PARTIAL' | 'DUE'>('all');
  const [noticeFeedback, setNoticeFeedback] = useState<string | null>(null);

  // Quick Fee Collection Desk State (Karanvir Sir Lecture 4 Segment 7)
  const [deskSearch, setDeskSearch] = useState('');
  const [deskCourseFilter, setDeskCourseFilter] = useState('ALL');
  const [deskSelectedStudent, setDeskSelectedStudent] = useState<any | null>(null);
  const [deskAmount, setDeskAmount] = useState('');
  const [deskPaymentMode, setDeskPaymentMode] = useState<'UPI' | 'CASH' | 'DEMAND_DRAFT' | 'NEFT_RTGS' | 'CARD'>('UPI');
  const [deskRefNo, setDeskRefNo] = useState('');
  const [deskRemarks, setDeskRemarks] = useState('Counter Tuition Fee Installment - Verified');
  const [deskIsSubmitting, setDeskIsSubmitting] = useState(false);
  const [deskTxnDate, setDeskTxnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deskAdminOverrideDate, setDeskAdminOverrideDate] = useState(false);
  const [deskDateOverrideReason, setDeskDateOverrideReason] = useState('');

  // Dynamic Fee Policies State (Karanvir Sir Lecture 4 Segment 5)
  const [feePolicies, setFeePolicies] = useState<FeePolicy[]>(() => {
    try {
      const stored = localStorage.getItem('educore_fee_policies');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_FEE_POLICIES;
  });

  const [contraEntries, setContraEntries] = useState<ContraLedgerEntry[]>(() => {
    try {
      const stored = localStorage.getItem('educore_contra_ledger');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_CONTRA_ENTRIES;
  });

  const [isCreatePolicyOpen, setIsCreatePolicyOpen] = useState(false);
  const [newPolicyCode, setNewPolicyCode] = useState('');
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyAmount, setNewPolicyAmount] = useState('');
  const [newPolicyType, setNewPolicyType] = useState<'flat' | 'percentage'>('percentage');
  const [newPolicyHeads, setNewPolicyHeads] = useState<string[]>(['tuition_fee']);
  const [newPolicyScope, setNewPolicyScope] = useState<'entire_course' | 'current_semester_only'>('entire_course');

  const [assignPolicyModal, setAssignPolicyModal] = useState<{
    isOpen: boolean;
    policy: FeePolicy | null;
    targetStudentId: string;
    scope: 'entire_course' | 'current_semester_only';
  }>({
    isOpen: false,
    policy: null,
    targetStudentId: '',
    scope: 'entire_course',
  });

  const fetchDefaulters = () => {
    setIsDefaultersLoading(true);
    api.getDefaulters(selectedCampus && selectedCampus !== 'all' ? selectedCampus : undefined)
      .then(res => {
        if (res.success && Array.isArray(res.defaulters)) {
          setDefaultersList(res.defaulters);
        }
      })
      .catch(() => {})
      .finally(() => setIsDefaultersLoading(false));
  };

  useEffect(() => {
    if (isActualAdmin) {
      fetchDefaulters();
      api.getFeeHeads().then(res => {
        if (res.success && res.feeHeads) {
          setFeeHeads(res.feeHeads);
          if (res.feeHeads.length > 0) {
            setSelectedFeeHeadId(res.feeHeads[0].id);
          }
        }
      });
    }
  }, [isActualAdmin, selectedCampus]);

  // Set default student for Desk when student list loads
  useEffect(() => {
    if (studentList.length > 0 && !deskSelectedStudent) {
      setDeskSelectedStudent(studentList[0]);
      setDeskAmount('17750');
      setDeskRefNo(`UPI-AXIS-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [studentList]);

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

  // Quick Fee Collection Execution (Desk)
  const handleExecuteQuickCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskSelectedStudent || !deskAmount) {
      alert('Please select student and enter payment amount.');
      return;
    }
    setDeskIsSubmitting(true);
    const amt = parseFloat(deskAmount);
    const receiptNo = `RCPT-2026-${Date.now().toString().slice(-6)}`;

    // Store in recent receipts
    try {
      const existing = JSON.parse(localStorage.getItem('educore_recent_receipts') || '[]');
      const finalRemarks = deskAdminOverrideDate
        ? `${deskRemarks} [ADMIN DATE OVERRIDE: ${deskTxnDate} - Reason: ${deskDateOverrideReason || 'Administrative Regularization'}]`
        : deskRemarks;
      const finalTimestamp = deskAdminOverrideDate
        ? `${deskTxnDate}T12:00:00.000Z`
        : new Date().toISOString();

      existing.unshift({
        receiptNo,
        studentId: deskSelectedStudent.student_id || deskSelectedStudent.id,
        studentName: `${deskSelectedStudent.first_name || ''} ${deskSelectedStudent.last_name || ''}`.trim(),
        amount: amt,
        paymentMode: deskPaymentMode,
        referenceNo: deskRefNo || 'CASH-COUNTER-01',
        remarks: finalRemarks,
        timestamp: finalTimestamp,
        is_backdated_admin_override: deskAdminOverrideDate,
        override_reason: deskDateOverrideReason || undefined,
      });
      localStorage.setItem('educore_recent_receipts', JSON.stringify(existing.slice(0, 50)));
    } catch (err) {}

    setTimeout(() => {
      setDeskIsSubmitting(false);
      setNoticeFeedback(
        `✓ [PAYMENT COLLECTED]: ₹${(amt || 0).toLocaleString('en-IN')} successfully credited for ${deskSelectedStudent.first_name} ${deskSelectedStudent.last_name}! Official Receipt #${receiptNo} issued.`
      );
      if (onOpenReceiptModal) {
        onOpenReceiptModal(receiptNo);
      }
      fetchLedger();
    }, 600);
  };

  // Create New Fee Policy
  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyCode || !newPolicyName || !newPolicyAmount) {
      alert('Policy Code, Name, and Concession Value are mandatory.');
      return;
    }
    const val = parseFloat(newPolicyAmount);
    const newPolicy: FeePolicy = {
      id: `pol-${Date.now()}`,
      policy_code: newPolicyCode.toUpperCase().trim(),
      name: newPolicyName.trim(),
      discount_amount: newPolicyType === 'flat' ? val : Math.round(35000 * (val / 100)),
      discount_percentage: newPolicyType === 'percentage' ? val : undefined,
      applicable_heads: newPolicyHeads,
      applicable_scope: newPolicyScope,
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    };
    const updated = [newPolicy, ...feePolicies];
    setFeePolicies(updated);
    localStorage.setItem('educore_fee_policies', JSON.stringify(updated));
    setIsCreatePolicyOpen(false);
    setNewPolicyCode('');
    setNewPolicyName('');
    setNewPolicyAmount('');
    setNoticeFeedback(`Fee Policy ${newPolicy.policy_code} (${newPolicy.name}) created and activated successfully!`);
    setTimeout(() => setNoticeFeedback(null), 5000);
  };

  // Execute Policy Assignment with Contra Ledger Reversal Entry
  const handleConfirmAssignPolicy = () => {
    if (!assignPolicyModal.policy || !assignPolicyModal.targetStudentId) return;
    const targetStudent = studentList.find(s => s.id === assignPolicyModal.targetStudentId) || studentList[0];
    const pol = assignPolicyModal.policy;

    // Add contra entry (opposite entry to demonstrate collegiate non-deletion rule)
    const newContra: ContraLedgerEntry = {
      id: `contra-${Date.now()}`,
      student_id: targetStudent.student_id || targetStudent.id,
      semester: 4,
      entry_type: 'contra_negation',
      amount: pol.discount_amount,
      reference_policy_id: pol.policy_code,
      description: `Opposite entry for Prior Policy (Replaced by #${pol.policy_code} - ${pol.name.slice(0, 16)})`,
      is_contra: true,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      authorized_by: `${currentUser?.full_name || 'Bursar / Master Admin'} (Dean Finance)`,
    };

    const updatedContra = [newContra, ...contraEntries];
    setContraEntries(updatedContra);
    localStorage.setItem('educore_contra_ledger', JSON.stringify(updatedContra));

    setAssignPolicyModal({ isOpen: false, policy: null, targetStudentId: '', scope: 'entire_course' });
    setNoticeFeedback(
      `Policy ${pol.policy_code} assigned to ${targetStudent.first_name}! Contra ledger entry #${newContra.id} posted to maintain zero-variance collegiate accounting audit.`
    );
    setTimeout(() => setNoticeFeedback(null), 6000);
  };

  const activeStudentObj = studentList.find(s => s.id === activeStudentId) || ledgerData?.student || currentStudent;

  const filteredStudents = studentList.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (`${s.first_name} ${s.last_name}`).toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.course?.code && s.course.code.toLowerCase().includes(q))
    );
  });

  return (
    <div id="fee-ledger-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-base transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
              {isActualAdmin
                ? 'Institutional Tuition Ledger, Policies & Cash Counter'
                : isStaff
                ? 'Faculty Advisor Student Fee Audit (Read-Only)'
                : 'Student Academic Fee Ledger'}
            </h2>
            <p className="text-sm text-[#444651] mt-1">
              {isActualAdmin
                ? 'Karanvir Sir Lecture 4 Financial Suite: Quick Fee Desk, Itemized Dues, Dynamic Policies & Contra Ledger Reversals.'
                : isStaff
                ? 'Review mentee semester dues, tuition clearance status, and receipt verification for academic advisory.'
                : 'Complete statement of semester tuition heads, scholarships, discounts, and payment history.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isActualAdmin ? (
            <>
              {onOpenMasterTables && (
                <button
                  type="button"
                  onClick={() => onOpenMasterTables('fees')}
                  className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Fee Heads & Rules</span>
                </button>
              )}
              <button
                onClick={() => { setIsAssignModalOpen(true); setAssignError(null); }}
                className="px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-bold hover:bg-[#1e3a8a] flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Fee Head</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-[#e1e3e4] text-[#191c1d] rounded-lg text-xs font-bold hover:bg-[#f8f9fa] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Ledger</span>
              </button>
            </>
          ) : isStaff ? (
            <>
              <span className="px-3 py-1.5 bg-[#f3f4f5] text-[#535f70] text-xs font-semibold rounded-lg border border-[#e1e3e4] flex items-center gap-1.5">
                <span>Faculty Advisory Mode</span>
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-[#e1e3e4] text-[#191c1d] rounded-lg text-xs font-bold hover:bg-[#f8f9fa] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenPayModal(undefined, currentStudent)}
              className="px-5 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Make Fee Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Campus Scoping Strip */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00236f] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Building2 className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Fee Ledger & Accounts Scope:</span>
              <span className="text-xs font-black text-[#00236f] bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                {selectedCampus === 'campus_02' ? 'Faridkot Campus 02 (Regional)' : selectedCampus === 'all' ? 'All Campuses (Universal Scope)' : 'Bathinda Campus 01 (Main Campus)'}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
                ({studentList.length} fee accounts scoped)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedCampus === 'campus_02'
                ? 'Displaying fee ledgers, contra adjustments, and payment receipts for Faridkot Regional Campus.'
                : selectedCampus === 'all'
                ? 'Displaying consolidated accounts and dues across all collegiate campuses.'
                : 'Displaying primary academic tuition heads, concessions, and bursar collections for Bathinda Main Campus.'}
            </p>
          </div>
        </div>

        {onCampusChange && (
          <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => onCampusChange('campus_01')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                (!selectedCampus || selectedCampus === 'campus_01')
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Bathinda Main
            </button>
            <button
              type="button"
              onClick={() => onCampusChange('campus_02')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCampus === 'campus_02'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Faridkot Regional
            </button>
            <button
              type="button"
              onClick={() => onCampusChange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCampus === 'all'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Campuses
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher for Accounts Bursars & Campus Admins (Karanvir Sir Lecture 4) */}
      {isActualAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('desk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'desk'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-300" />
              <span>Quick Fee Collection Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'ledger'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Single Scholar Fee Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('policies')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'policies'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dynamic Fee Policies & Contra Reversals</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('defaulters');
                fetchDefaulters();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'defaulters'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Institutional Defaulters Radar</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                viewMode === 'defaulters' ? 'bg-white text-[#ea580c]' : 'bg-[#ea580c]/10 text-[#ea580c]'
              }`}>
                {defaultersList.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-500 hidden sm:block">
            {viewMode === 'desk' && <span>Counter Desk • Instant Search by 13-Digit UID or Mobile & Print Receipt</span>}
            {viewMode === 'ledger' && <span>Single Scholar Statement • Itemized Tuition & Payment Register</span>}
            {viewMode === 'policies' && <span>Statutory Policies • Multi-Head Scope & Contra Entry Audit Trail</span>}
            {viewMode === 'defaulters' && <span>Arrears Radar • Automated Notices & Overdue Auditing</span>}
          </div>
        </div>
      )}

      {noticeFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>✓ {noticeFeedback}</span>
          <button onClick={() => setNoticeFeedback(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* VIEW 1: QUICK FEE COLLECTION DESK (Karanvir Sir Lecture 4 Segment 7 lines 00:42-01:11) */}
      {viewMode === 'desk' && isActualAdmin && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quick Search & Course Filtering Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate by 13-digit UID (1001-01-01-03-01), mobile (+91 98141), or candidate name..."
                  value={deskSearch}
                  onChange={e => setDeskSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={deskCourseFilter}
                  onChange={e => setDeskCourseFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Academic Courses</option>
                  <option value="BCA">BCA (Cloud & AI)</option>
                  <option value="B.Tech CSE">B.Tech Computer Science</option>
                  <option value="B.Tech ME">B.Tech Mechanical Engg</option>
                  <option value="B.Sc Agri">B.Sc Agriculture</option>
                  <option value="MBA">MBA Finance & Systems</option>
                </select>
              </div>
            </div>

            {/* Quick Candidate Picker Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Matching Scholars:</span>
              {studentList
                .filter(s => {
                  if (deskCourseFilter !== 'ALL' && !s.course?.name?.toLowerCase().includes(deskCourseFilter.toLowerCase())) return false;
                  if (!deskSearch.trim()) return true;
                  const q = deskSearch.toLowerCase();
                  return (
                    (s.student_id && s.student_id.toLowerCase().includes(q)) ||
                    (`${s.first_name || ''} ${s.last_name || ''}`).toLowerCase().includes(q) ||
                    (s.phone && s.phone.includes(q)) ||
                    (s.mobile && s.mobile.includes(q))
                  );
                })
                .slice(0, 6)
                .map(s => {
                  const isSel = deskSelectedStudent?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setDeskSelectedStudent(s);
                        setDeskAmount('17750');
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        isSel
                          ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{s.first_name} {s.last_name}</span>
                      <span className="text-[10px] opacity-75 font-mono ml-1.5">({s.student_id || s.id})</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Active Candidate Inspection & In-Place Collection Deck */}
          {deskSelectedStudent ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Candidate Academic & Fee Heads Breakdown */}
              <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#00236f]/10 text-[#00236f] flex items-center justify-center font-black text-lg">
                      {deskSelectedStudent.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#00236f]">
                        {deskSelectedStudent.first_name} {deskSelectedStudent.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>UID: {deskSelectedStudent.student_id || '1001-01-01-03-01'}</span>
                        <span>•</span>
                        <span>{deskSelectedStudent.course?.name || 'B.Tech Computer Science'}</span>
                        <span>•</span>
                        <span>Semester {deskSelectedStudent.current_semester || 4}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                      Category: Regular (General)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#00236f] border border-blue-200 text-xs font-black">
                      Scholarship: POL-MERIT-80 (Active)
                    </span>
                  </div>
                </div>

                {/* Itemized Fee Assessment Table */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Current Semester Statutory Fee Heads Assessment:
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Statutory Fee Head</th>
                          <th className="py-2 px-3 text-right">Gross Assessment</th>
                          <th className="py-2 px-3 text-right">Policy Concession</th>
                          <th className="py-2 px-3 text-right">Paid</th>
                          <th className="py-2 px-3 text-right">Pending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Tuition Fee (Core Academic)</td>
                          <td className="py-2.5 px-3 text-right">₹ 35,000</td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">- ₹ 28,000</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">₹ 7,000</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">₹ 0</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">University Affiliation & Examination</td>
                          <td className="py-2.5 px-3 text-right">₹ 6,500</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">₹ 0</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">₹ 2,000</td>
                          <td className="py-2.5 px-3 text-right font-black text-amber-700">₹ 4,500</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Campus Infrastructure & Computing Lab</td>
                          <td className="py-2.5 px-3 text-right">₹ 5,000</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">₹ 0</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">₹ 1,750</td>
                          <td className="py-2.5 px-3 text-right font-black text-amber-700">₹ 3,250</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Residence & Hostel Block Fee (SBS-A #101)</td>
                          <td className="py-2.5 px-3 text-right">₹ 15,000</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">₹ 0</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">₹ 5,000</td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700">₹ 10,000</td>
                        </tr>
                        <tr className="bg-slate-50/80 font-black text-slate-900 border-t border-slate-200">
                          <td className="py-3 px-3">Net Semester Total</td>
                          <td className="py-3 px-3 text-right">₹ 61,500</td>
                          <td className="py-3 px-3 text-right text-emerald-700">- ₹ 28,000</td>
                          <td className="py-3 px-3 text-right">₹ 15,750</td>
                          <td className="py-3 px-3 text-right text-sm text-rose-700">₹ 17,750</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00236f]" />
                    <span className="font-semibold text-slate-700">MRSPTU Ord. 2024 Clear: Student eligible for Hall Ticket upon paying ₹17,750 dues.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(deskSelectedStudent.id);
                      setViewMode('ledger');
                    }}
                    className="text-[#00236f] font-bold underline cursor-pointer text-xs"
                  >
                    View Historical Ledger →
                  </button>
                </div>
              </div>

              {/* Right Column: In-Place Fee Collection Form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#ea580c]" />
                    <span>In-Place Cashier Payment Counter</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[11px] border border-rose-200">
                    Due: ₹ 17,750
                  </span>
                </div>

                <form onSubmit={handleExecuteQuickCollection} className="space-y-4">
                  {/* Amount To Collect */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Amount To Collect (₹):</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDeskAmount('17750')}
                          className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 cursor-pointer"
                        >
                          Full Due (₹17,750)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeskAmount('8875')}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold cursor-pointer"
                        >
                          50% (₹8,875)
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        value={deskAmount}
                        onChange={e => setDeskAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">Collection Channel / Mode:</label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['UPI', 'CASH', 'DEMAND_DRAFT', 'NEFT_RTGS', 'CARD'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDeskPaymentMode(mode)}
                          className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
                            deskPaymentMode === mode
                              ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mode.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ref No & Remarks */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                        {deskPaymentMode === 'UPI' ? 'UPI VPA / Txn Reference:' : deskPaymentMode === 'DEMAND_DRAFT' ? 'DD Number & Issuing Bank:' : 'Receipt Voucher No:'}
                      </label>
                      <input
                        type="text"
                        value={deskRefNo}
                        onChange={e => setDeskRefNo(e.target.value)}
                        placeholder="e.g. UPI-98124801 or DD-77821"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Bursar Remarks / Allocation Head:</label>
                      <input
                        type="text"
                        value={deskRemarks}
                        onChange={e => setDeskRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Transaction Date Lock (Karanvir Sir Lecture 4 Segment 5 Mandate: Anti-Backdating) */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Transaction Date Lock (Statutory Mandate):</span>
                      </div>
                      {isDirectorOrAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeskAdminOverrideDate(!deskAdminOverrideDate)}
                          className="text-[10px] font-bold text-[#ea580c] hover:underline cursor-pointer"
                        >
                          {deskAdminOverrideDate ? 'Re-lock to Today' : 'Admin Date Override ⚙️'}
                        </button>
                      )}
                    </div>

                    {!deskAdminOverrideDate ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{deskTxnDate}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                            TODAY • LOCKED
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Staff cannot backdate entries
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={deskTxnDate}
                            onChange={e => setDeskTxnDate(e.target.value)}
                            className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-amber-800">
                            Admin Backdating Override
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Mandatory Audit Justification for Date Override..."
                          value={deskDateOverrideReason}
                          onChange={e => setDeskDateOverrideReason(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] text-slate-800 focus:outline-none"
                          required={deskAdminOverrideDate}
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={deskIsSubmitting}
                    className="w-full py-3 rounded-2xl bg-[#00236f] hover:bg-[#001744] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deskIsSubmitting ? (
                      <span>Recording Fee & Posting Ledger...</span>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 text-amber-300" />
                        <span>Record Collection & Issue Official Receipt</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
              Select or search a scholar from the top bar to initialize cash/UPI fee collection.
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DYNAMIC FEE POLICIES & CONTRA LEDGER REVERSALS (Karanvir Sir Lecture 4 Segment 5) */}
      {viewMode === 'policies' && isActualAdmin && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action Strip */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                <span>Dynamic Fee Policies & Institutional Concessions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Karanvir Sir Lecture 4 Principle: Dynamic policy creation, multi-head applicability, scope selection, and immutable contra reversals.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatePolicyOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00236f] hover:bg-[#001744] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Fee Policy</span>
            </button>
          </div>

          {/* Active Policies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {feePolicies.map(pol => (
              <div
                key={pol.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono font-black text-xs text-[#00236f] px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                      {pol.policy_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mb-1 leading-snug">{pol.name}</h4>

                  <div className="text-xs text-slate-500 space-y-1 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Concession Value:</span>
                      <strong className="text-emerald-700 font-black">
                        {pol.discount_percentage ? `${pol.discount_percentage}% Waiver` : `₹ ${(pol.discount_amount || 0).toLocaleString('en-IN')}`}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Heads Scope:</span>
                      <span className="font-bold text-slate-700 capitalize">
                        {pol.applicable_heads.join(', ').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Duration Scope:</span>
                      <span className="font-bold text-slate-700">
                        {pol.applicable_scope === 'entire_course' ? 'Entire Academic Course' : 'Current Semester Only'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Created: {pol.created_at}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignPolicyModal({
                        isOpen: true,
                        policy: pol,
                        targetStudentId: activeStudentId || studentList[0]?.id || '',
                        scope: pol.applicable_scope,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#00236f] text-xs font-bold transition-all cursor-pointer"
                  >
                    Assign to Scholar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CONTRA REVERSAL LEDGER REGISTER (Zero Hard-Deletion Policy) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Collegiate Contra Ledger Audit Register (Zero Hard-Deletion Policy)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Financial records are never erased. Policy modifications and demotions stand as counteracting debit/credit contra entries to balance variance to zero.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">
                  Audit State: Zero Net Variance Certified
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#00236f] text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Contra ID & Date</th>
                    <th className="py-2.5 px-3">Scholar UID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Statutory Description / Justification</th>
                    <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Authorized Sign-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {contraEntries.map(ce => (
                    <tr key={ce.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800">{ce.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ce.timestamp}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{ce.student_id}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ce.entry_type === 'contra_negation'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ce.entry_type === 'demotion_void'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {ce.entry_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">{ce.description}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-700">
                        {ce.entry_type === 'contra_negation' ? `₹ ${(ce.amount || 0).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700">
                        {ce.entry_type !== 'contra_negation' ? `₹ ${(ce.amount || 0).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-semibold">{ce.authorized_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: INSTITUTIONAL DEFAULTERS RADAR TABLE VIEW */}
      {viewMode === 'defaulters' && isActualAdmin && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Defaulters</span>
              <strong className="text-2xl font-black text-rose-700 block mt-0.5">{defaultersList.length} Scholars</strong>
              <span className="text-[10px] text-slate-400">Scholars with pending fee clearance</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Arrears Due</span>
              <strong className="text-2xl font-black text-[#00236f] block mt-0.5">
                ₹ {defaultersList.reduce((acc, d) => acc + (d.dueAmount || 0), 0).toLocaleString('en-IN')}
              </strong>
              <span className="text-[10px] text-slate-400">Total uncollected statutory dues</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Direct Actions</span>
                <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">Automated Reminders</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNoticeFeedback(`Automated SMS & Portal Dues Notices dispatched to all ${defaultersList.length} fee defaulters!`);
                  setTimeout(() => setNoticeFeedback(null), 5000);
                }}
                className="mt-2 py-1.5 px-3 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                Broadcast Dues Notices to All
              </button>
            </div>
          </div>

          {/* Defaulters Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Search defaulter by student name, roll no, or UID..."
                value={defaulterSearch}
                onChange={e => setDefaulterSearch(e.target.value)}
                className="w-full pl-3 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'OVERDUE', 'PARTIAL', 'DUE'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDefaulterFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    defaulterFilter === mode
                      ? 'bg-[#00236f] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#00236f] text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Scholar Name</th>
                    <th className="p-3">Course & Semester</th>
                    <th className="p-3">Outstanding Due</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isDefaultersLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <div className="w-6 h-6 rounded-full border-2 border-[#00236f] border-t-transparent animate-spin mx-auto mb-2" />
                        Loading institutional fee defaulters registry...
                      </td>
                    </tr>
                  ) : defaultersList
                      .filter(d => {
                        if (defaulterFilter !== 'all' && d.status !== defaulterFilter) return false;
                        if (!defaulterSearch.trim()) return true;
                        const q = defaulterSearch.toLowerCase();
                        return (
                          (d.studentName || '').toLowerCase().includes(q) ||
                          (d.courseInfo || '').toLowerCase().includes(q) ||
                          String(d.id || '').toLowerCase().includes(q)
                        );
                      })
                      .map(d => {
                        const matchedStudent = studentList.find(s => s.id === d.id);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-900">
                              <div>{d.studentName}</div>
                              <span className="text-[10px] font-mono text-slate-400">{d.id}</span>
                            </td>
                            <td className="p-3 text-slate-700">{d.courseInfo}</td>
                            <td className="p-3 font-black text-rose-700 text-sm">
                              {d.dueAmountFormatted || `₹ ${d.dueAmount?.toLocaleString('en-IN')}`}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                d.status === 'OVERDUE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : d.status === 'PARTIAL'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-blue-50 text-[#00236f] border border-blue-200'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(d.id);
                                  setViewMode('ledger');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#00236f] font-bold text-[11px] rounded transition cursor-pointer"
                              >
                                Inspect Ledger
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenPayModal(undefined, matchedStudent || { id: d.id, first_name: d.studentName })}
                                className="px-2.5 py-1 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold text-[11px] rounded transition cursor-pointer shadow-2xs"
                              >
                                Collect Fee
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNoticeFeedback(`Urgent SMS reminder sent to ${d.studentName} for overdue ₹${d.dueAmount?.toLocaleString('en-IN')}!`);
                                  setTimeout(() => setNoticeFeedback(null), 4000);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded transition cursor-pointer"
                              >
                                Send SMS Notice
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SINGLE SCHOLAR FEE LEDGER VIEW */}
      {viewMode === 'ledger' && (
        <>
          {/* Quick Search & Audit Bar (Admin & Faculty Mentors) */}
          {canSearchStudents && (
            <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search student by Canonical UID (1001-01-01-03-01), Name (Aryan), Department, or Email..."
                    value={studentSearch}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    className="w-full pl-3 pr-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                  />
                  {isSearchDropdownOpen && filteredStudents.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e1e3e4] rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto">
                      {filteredStudents.map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentId(s.id);
                            setIsSearchDropdownOpen(false);
                            setStudentSearch(`${s.first_name} ${s.last_name} (${s.student_id})`);
                          }}
                          className="p-3 hover:bg-[#f8f9fa] cursor-pointer border-b border-[#f0f1f2] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#191c1d]">{s.first_name} {s.last_name}</span>
                            <span className="text-[10px] text-[#757682] ml-2 font-mono">[{s.student_id}]</span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#00236f]">{s.course?.code || 'CSE'} Sem {s.current_semester || 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#757682] font-semibold">Active Roster:</span>
                  <select
                    value={activeStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-bold text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                  >
                    {studentList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.student_id || s.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Student Profile Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#00236f]/10 text-[#00236f] flex items-center justify-center font-bold text-xl">
                  {ledgerData?.student?.name ? ledgerData.student.name.charAt(0) : 'S'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#191c1d]">
                    {ledgerData?.student?.name || activeStudentObj?.first_name || 'Aryan Sharma'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f3f4f5] text-[#444651] font-mono">
                      UID: {ledgerData?.student?.studentId || activeStudentObj?.student_id || '1001-01-01-03-01'}
                    </span>
                    <span className="text-xs text-[#757682]">
                      {ledgerData?.student?.program || activeStudentObj?.course?.name || 'B.Tech CSE'} • Sem {ledgerData?.student?.currentSemester || 4}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Assessed</span>
                  <strong className="text-lg font-black text-[#191c1d] block mt-0.5">
                    ₹ {ledgerData?.summary?.totalAssessed?.toLocaleString('en-IN') || '42,000'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Paid</span>
                  <strong className="text-lg font-black text-emerald-700 block mt-0.5">
                    ₹ {ledgerData?.summary?.totalPaid?.toLocaleString('en-IN') || '25,000'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Balance</span>
                  <strong className="text-lg font-black text-rose-700 block mt-0.5">
                    ₹ {ledgerData?.summary?.outstandingBalance?.toLocaleString('en-IN') || '17,000'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-[#e1e3e4] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#e1e3e4] flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#191c1d]">Semester-Wise Account Journal & Verified Receipts</h4>
              <button
                type="button"
                onClick={fetchLedger}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-[#00236f] hover:bg-slate-100 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8f9fa] text-[#444651] uppercase text-[10px] font-bold tracking-wider border-b border-[#e1e3e4]">
                  <tr>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Fee Head / Description</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Debit (₹)</th>
                    <th className="p-3 text-right">Credit (₹)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">Loading student ledger...</td>
                    </tr>
                  ) : ledgerData?.items?.length > 0 ? (
                    ledgerData.items.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold">Sem {item.semester || 1}</td>
                        <td className="p-3 font-bold text-slate-900">{item.feeHeadTitle || item.description || 'Statutory Fee Head'}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{item.dueDate || '2026-11-15'}</td>
                        <td className="p-3 text-right font-black text-rose-700">₹ {(item.amountDue || item.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-black text-emerald-700">₹ {(item.amountPaid || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {item.status || 'DUE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {item.receiptNo ? (
                            <button
                              type="button"
                              onClick={() => onOpenReceiptModal(item.receiptNo)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#00236f] font-bold rounded text-[10px]"
                            >
                              {item.receiptNo}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">No ledger transactions on file.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* INLINE: CREATE FEE POLICY WORKSPACE (Zero Popups) */}
      {isCreatePolicyOpen && (
        <div className="bg-white rounded-2xl w-full shadow-sm border-2 border-[#00236f] overflow-hidden animate-fadeIn space-y-4 p-6 my-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-[#00236f] flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              <span>Create Institutional Dynamic Fee Policy</span>
            </h3>
            <button onClick={() => setIsCreatePolicyOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
          </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Policy Identifier Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-MERIT-2026"
                    value={newPolicyCode}
                    onChange={e => setNewPolicyCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Policy Commercial Title:</label>
                  <input
                    type="text"
                    placeholder="e.g. Sibling Concession 15%"
                    value={newPolicyName}
                    onChange={e => setNewPolicyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Concession Type:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewPolicyType('percentage')}
                      className={`py-1.5 px-2 rounded-xl font-bold ${
                        newPolicyType === 'percentage' ? 'bg-[#00236f] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPolicyType('flat')}
                      className={`py-1.5 px-2 rounded-xl font-bold ${
                        newPolicyType === 'flat' ? 'bg-[#00236f] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Flat Amount (₹)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {newPolicyType === 'percentage' ? 'Discount Percentage (%):' : 'Discount Amount (₹):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={newPolicyType === 'percentage' ? 'e.g. 25' : 'e.g. 10000'}
                    value={newPolicyAmount}
                    onChange={e => setNewPolicyAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Scope Selection: Entire Course vs Current Semester Only (Karanvir Sir exact words) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                <label className="font-bold text-amber-900 block">Statutory Policy Scope (Lecture 4 Rule):</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="policyScope"
                      checked={newPolicyScope === 'entire_course'}
                      onChange={() => setNewPolicyScope('entire_course')}
                    />
                    <span>Entire Academic Course (All Semesters)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="policyScope"
                      checked={newPolicyScope === 'current_semester_only'}
                      onChange={() => setNewPolicyScope('current_semester_only')}
                    />
                    <span>Current Semester Only</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatePolicyOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#00236f] text-white hover:bg-[#001744] shadow-sm"
                >
                  Save & Publish Policy
                </button>
              </div>
            </form>
          </div>
      )}

      {/* INLINE: ASSIGN POLICY WITH CONTRA REVERSAL PROMPT (Zero Popups) */}
      {assignPolicyModal.isOpen && assignPolicyModal.policy && (
        <div className="bg-white rounded-2xl w-full shadow-sm border-2 border-emerald-600 p-6 space-y-4 text-xs animate-fadeIn my-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-[#00236f] flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              <span>Assign Policy: {assignPolicyModal.policy.policy_code}</span>
            </h3>
              <button
                onClick={() => setAssignPolicyModal({ isOpen: false, policy: null, targetStudentId: '', scope: 'entire_course' })}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-1">
              <span className="font-black block flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Collegiate Accounting Integrity Rule:
              </span>
              <p className="text-[11px] leading-relaxed">
                If the scholar already possesses an existing fee policy or concession, the previous credit will NOT be deleted. An opposite <strong>CONTRA LEDGER ENTRY</strong> of matching value will stand in the student account to balance out debit/credit to zero before applying #{assignPolicyModal.policy.policy_code}.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Scholar:</label>
              <select
                value={assignPolicyModal.targetStudentId}
                onChange={e => setAssignPolicyModal(prev => ({ ...prev, targetStudentId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                {studentList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.student_id || s.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Applicable Policy Scope:</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="modalScope"
                    checked={assignPolicyModal.scope === 'entire_course'}
                    onChange={() => setAssignPolicyModal(prev => ({ ...prev, scope: 'entire_course' }))}
                  />
                  <span>Entire Course</span>
                </label>
                <label className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="modalScope"
                    checked={assignPolicyModal.scope === 'current_semester_only'}
                    onChange={() => setAssignPolicyModal(prev => ({ ...prev, scope: 'current_semester_only' }))}
                  />
                  <span>Current Semester</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignPolicyModal({ isOpen: false, policy: null, targetStudentId: '', scope: 'entire_course' })}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignPolicy}
                className="px-5 py-2 rounded-xl font-bold bg-[#00236f] text-white hover:bg-[#001744] shadow-sm"
              >
                Apply & Post Contra Entry
              </button>
            </div>
          </div>
      )}

      {/* INLINE: Assign Statutory Fee Head (Zero Popups) */}
      {isActualAdmin && isAssignModalOpen && (
        <div className="bg-white rounded-2xl w-full shadow-sm border-2 border-[#00236f] overflow-hidden animate-fadeIn my-4">
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
                <span className="font-bold text-[10px]">✕</span>
              </button>
            </div>

            <form onSubmit={handleAssignHead} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex items-center gap-2">
                  <span className="font-bold text-[10px]">[!]</span>
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
                <span className="font-bold">Affiliation Rule:</span> Campus accommodation (Hostel) and College Fleet (Transport) require cross-check confirmation if both are opted for an off-campus scholar.
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
                      <span className="font-bold text-[10px]">✓</span>
                      <span>Confirm Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
      )}
    </div>
  );
};
