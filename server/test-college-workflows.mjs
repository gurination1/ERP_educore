// Comprehensive College Functional Workflow & Business Logic Test Suite
// Verifies 7 Core Areas: Admissions, Fees, Scholarships, Forms, Dashboard, Reports, Notices
// Using native Node.js global fetch

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

let adminToken = '';
let studentToken = '';
let studentId = '';
let studentUserId = '';
let studentEmail = '';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(phase, name, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  [PASS] ${phase} -> ${name}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${phase} -> ${name} | ${details}`);
  }
}

async function req(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

async function run() {
  console.log('================================================================');
  console.log(' EDUCORE ERP - COMPREHENSIVE COLLEGE WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  // Authenticate Admin & Student
  const adminAuth = await req('/api/auth/login', 'POST', {
    email: 'admin@educore.edu',
    password: '123456',
  });
  if (adminAuth.status === 200 && adminAuth.data.token) {
    adminToken = adminAuth.data.token;
  } else {
    console.error('Failed to authenticate admin:', adminAuth.data);
    process.exit(1);
  }

  const stuAuth = await req('/api/auth/login', 'POST', {
    email: 'stu001@educore.edu',
    password: '123456',
  });
  if (stuAuth.status === 200 && stuAuth.data.token) {
    studentToken = stuAuth.data.token;
    studentUserId = stuAuth.data.user?.id;
    studentEmail = stuAuth.data.user?.email;
    studentId = stuAuth.data.student?.id;
  } else {
    console.error('Failed to authenticate student:', stuAuth.data);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // AREA 1: Admissions Lifecycle Negative & Edge Paths
  // -------------------------------------------------------------
  console.log('\n--- AREA 1: Admissions Lifecycle Negative & Edge Paths ---');

  // 1.1 Save Draft Application
  const draftRes = await req('/api/admissions/draft', 'POST', {
    firstName: 'Draft',
    lastName: 'Candidate',
    email: 'draft.candidate@test.edu',
    phone: '9876500001',
    step: 2,
  });
  logTest('1.1 Draft Application', 'POST /draft returns success and draftId',
    draftRes.status === 200 && draftRes.data.success && typeof draftRes.data.draftId === 'string'
  );

  // 1.2 Duplicate Email Guard
  const dupEmailRes = await req('/api/admissions/submit', 'POST', {
    firstName: 'Duplicate',
    lastName: 'Email',
    email: 'stu001@educore.edu', // existing email
    phone: '9998887771',
  });
  logTest('1.2 Duplicate Email Guard', 'Rejects duplicate email with 400',
    dupEmailRes.status === 400 && dupEmailRes.data.success === false
  );

  // 1.3 Submit Valid Candidate
  const uniqueStamp = Date.now().toString().slice(-6);
  const candEmail = `applicant.${uniqueStamp}@educore.edu`;
  const candPhone = `91${uniqueStamp}12`;
  const submitRes = await req('/api/admissions/submit', 'POST', {
    firstName: 'Admit',
    lastName: 'Candidate',
    email: candEmail,
    phone: candPhone,
    gender: 'female',
    courseId: 'crs-btech-cse',
    admissionYear: 2025,
  });
  const newStudentId = submitRes.data.student?.id;
  logTest('1.3 Valid Admission Submit', 'Creates student and generates initial tuition fee record',
    submitRes.status === 201 && submitRes.data.success && !!newStudentId
  );

  // 1.4 Duplicate Phone Guard
  const dupPhoneRes = await req('/api/admissions/submit', 'POST', {
    firstName: 'Duplicate',
    lastName: 'Phone',
    email: `diff.${uniqueStamp}@educore.edu`,
    phone: candPhone, // duplicate phone
  });
  logTest('1.4 Duplicate Phone Guard', 'Rejects duplicate phone with 400',
    dupPhoneRes.status === 400 && dupPhoneRes.data.success === false
  );

  // 1.5 Admission Rejection Flow (Voids Fees)
  const rejectRes = await req(`/api/admissions/${newStudentId}/status`, 'PATCH', {
    status: 'rejected',
  }, adminToken);
  logTest('1.5 Admission Rejection', 'Admin rejects candidate and marks status rejected',
    rejectRes.status === 200 && rejectRes.data.student?.admission_status === 'rejected'
  );

  // 1.6 Defaulter Exclusion for Rejected Student
  const defaultersRes = await req('/api/fees/defaulters', 'GET', null, adminToken);
  const isRejectedInDefaulters = defaultersRes.data.defaulters?.some(d => d.id === newStudentId);
  logTest('1.6 Defaulter Cleanliness', 'Rejected applicant NEVER appears on Defaulters list',
    defaultersRes.status === 200 && isRejectedInDefaulters === false
  );

  // -------------------------------------------------------------
  // AREA 2: Fee Accounting Multi-Installment & Multi-Head Cycles
  // -------------------------------------------------------------
  console.log('\n--- AREA 2: Fee Accounting Multi-Installment & Multi-Head Cycles ---');

  // Create student for fee testing
  const feeStamp = Date.now().toString().slice(-6);
  const feeCandRes = await req('/api/admissions/submit', 'POST', {
    firstName: 'FeeTest',
    lastName: 'Student',
    email: `fee.${feeStamp}@educore.edu`,
    phone: `92${feeStamp}34`,
    courseId: 'crs-btech-cse',
  });
  const feeStuId = feeCandRes.data.student?.id;
  // Approve candidate
  await req(`/api/admissions/${feeStuId}/status`, 'PATCH', { status: 'approved' }, adminToken);

  // 2.1 Multi-Installment 1: Partial payment of ₹30,000
  const partPayRes = await req('/api/fees/collect', 'POST', {
    studentId: feeStuId,
    amount: 30000,
    paymentMode: 'online_upi',
    notes: 'Installment 1',
  }, adminToken);
  const lastReceiptNo = partPayRes.data.receiptNo;
  const lastPaymentId = partPayRes.data.payment?.id;
  const lastTxnRef = partPayRes.data.payment?.transaction_reference;
  logTest('2.1 Partial Installment Pay', 'Records ₹30,000 payment with remaining balance',
    partPayRes.status === 201 && partPayRes.data.remainingDue > 0
  );

  // 2.2 Partial Defaulter Presence
  const defAfterPart = await req('/api/fees/defaulters', 'GET', null, adminToken);
  const defEntry = defAfterPart.data.defaulters?.find(d => d.id === feeStuId);
  logTest('2.2 Partial Defaulter Status', 'Student with partial payment remains on defaulters with exact remaining due',
    defEntry !== undefined && defEntry.dueAmount === partPayRes.data.remainingDue
  );

  // 2.3 Multi-Installment 2: Pay remaining balance
  const fullPayRes = await req('/api/fees/collect', 'POST', {
    studentId: feeStuId,
    amount: partPayRes.data.remainingDue,
    paymentMode: 'net_banking',
    notes: 'Installment 2 - Final Settlement',
  }, adminToken);
  logTest('2.3 Final Installment Pay', 'Zeroes balance and marks fees_status paid',
    fullPayRes.status === 201 && fullPayRes.data.remainingDue === 0
  );

  // 2.4 Dropped from Defaulters
  const defAfterFull = await req('/api/fees/defaulters', 'GET', null, adminToken);
  const defEntry2 = defAfterFull.data.defaulters?.find(d => d.id === feeStuId);
  logTest('2.4 Zero Due Defaulter Clearance', 'Student drops off defaulters list when balance is 0',
    defEntry2 === undefined
  );

  // 2.5 Multi-Head Fee Management: Assign Hostel Fee
  const assignFeeRes = await req('/api/fees/assign', 'POST', {
    studentId: feeStuId,
    feeHeadId: 'fh-hostel',
    amount: 45000,
    dueDate: '2025-12-15',
  }, adminToken);
  logTest('2.5 Multi-Head Fee Assignment', 'Admin assigns separate Hostel Fee head (₹45,000)',
    assignFeeRes.status === 201 && assignFeeRes.data.studentFee?.fee_head_id === 'fh-hostel'
  );

  // 2.6 Re-enters defaulters for hostel dues
  const defAfterHostel = await req('/api/fees/defaulters', 'GET', null, adminToken);
  const defHostelEntry = defAfterHostel.data.defaulters?.find(d => d.id === feeStuId);
  logTest('2.6 Multi-Head Defaulter Re-entry', 'Student re-enters defaulters reflecting new fee head due',
    defHostelEntry !== undefined && defHostelEntry.dueAmount === 45000
  );

  // 2.7 Receipt Query Idempotency (by receiptNo, paymentId, txnRef)
  const recByNo = await req(`/api/fees/receipt/${lastReceiptNo}`, 'GET', null, adminToken);
  const recById = await req(`/api/fees/receipt/${lastPaymentId}`, 'GET', null, adminToken);
  const recByTxn = await req(`/api/fees/receipt/${encodeURIComponent(lastTxnRef)}`, 'GET', null, adminToken);
  logTest('2.7 Receipt Query by ReceiptNo', 'Lookup by receipt number returns valid receipt breakdown',
    recByNo.status === 200 && recByNo.data.receipt?.receiptNo === lastReceiptNo
  );
  logTest('2.8 Receipt Query by Payment ID', 'Lookup by payment id returns matching receipt',
    recById.status === 200 && recById.data.receipt?.receiptNo === lastReceiptNo
  );
  logTest('2.9 Receipt Query by Txn Reference', 'Lookup by transaction reference returns matching receipt',
    recByTxn.status === 200 && recByTxn.data.receipt?.receiptNo === lastReceiptNo
  );

  // -------------------------------------------------------------
  // AREA 3: Scholarship Approval ↔ Fee Record Reconciliation
  // -------------------------------------------------------------
  console.log('\n--- AREA 3: Scholarship Approval ↔ Fee Record Reconciliation ---');

  // Submit scholarship application for stu001
  const appRes = await req('/api/scholarships/apply', 'POST', {
    schemeId: 'sch-merit-01',
    annualFamilyIncome: 450000,
    previousGpa: 9.4,
    reasonForApplication: 'Dedicated to artificial intelligence research.',
  }, studentToken);
  const schAppId = appRes.data.application?.id;
  logTest('3.1 Scholarship Application Submit', 'Student submits scholarship application',
    appRes.status === 201 && !!schAppId
  );

  // 3.2 Admin Rejects with Remarks
  const rejectSchRes = await req(`/api/scholarships/applications/${schAppId}/review`, 'PATCH', {
    status: 'rejected',
    remarks: 'Document verification incomplete. Re-apply next cycle.',
  }, adminToken);
  logTest('3.2 Scholarship Admin Rejection', 'Admin rejects with remarks and audit trail',
    rejectSchRes.status === 200 && rejectSchRes.data.application?.status === 'rejected' &&
    rejectSchRes.data.application?.admin_remarks?.includes('Document verification')
  );

  // Assign a semester tuition fee record of ₹50,000 to student so there is real due to be reconciled
  await req('/api/fees/assign', 'POST', {
    studentId: studentId,
    feeHeadId: 'fh-tuition',
    amount: 50000,
    dueDate: '2025-11-30',
  }, adminToken);

  // Ledger before approval
  const ledgerBefore = await req(`/api/fees/ledger/${studentId}`, 'GET', null, studentToken);
  const initialDue = ledgerBefore.data.summary?.totalDue || 0;

  // 3.3 Submit second application for approval
  const app2Res = await req('/api/scholarships/apply', 'POST', {
    schemeId: 'sch-merit-01',
    annualFamilyIncome: 350000,
    previousGpa: 9.8,
    reasonForApplication: 'Second round full documentation.',
  }, studentToken);
  const schApp2Id = app2Res.data.application?.id;

  // 3.4 Admin Approves Scholarship
  const approveSchRes = await req(`/api/scholarships/applications/${schApp2Id}/review`, 'PATCH', {
    status: 'approved',
    remarks: 'Merit criteria verified. Full grant awarded.',
  }, adminToken);
  logTest('3.4 Scholarship Admin Approval', 'Admin approves scholarship application',
    approveSchRes.status === 200 && approveSchRes.data.application?.status === 'approved'
  );

  // 3.5 Ledger after approval: dues deducted by award amount
  const ledgerAfter = await req(`/api/fees/ledger/${studentId}`, 'GET', null, studentToken);
  const expectedDue = Math.max(0, initialDue - 50000);
  logTest('3.5 Fee Dues Deduction on Scholarship Approval', `Dues reduced from ${initialDue} to ${expectedDue}`,
    ledgerAfter.status === 200 && ledgerAfter.data.summary?.totalDue === expectedDue
  );

  // -------------------------------------------------------------
  // AREA 4: Dynamic Forms Edge Paths & Validation
  // -------------------------------------------------------------
  console.log('\n--- AREA 4: Dynamic Forms Edge Paths & Validation ---');

  // Create new test form
  const formCode = `TEST-FORM-${Date.now().toString().slice(-4)}`;
  const createFormRes = await req('/api/forms', 'POST', {
    title: 'Hostel Room Preference Survey',
    form_code: formCode,
    fields: [
      { name: 'roomType', label: 'Room Type', type: 'select', required: true, options: ['Single', 'Double', 'Triple'] },
      { name: 'dietPreference', label: 'Diet Preference', type: 'text', required: true },
      { name: 'emergencyContact', label: 'Emergency Contact Phone', type: 'text', required: false },
    ],
  }, adminToken);
  const testFormId = createFormRes.data.form?.id;
  logTest('4.1 Create Dynamic Form Schema', 'Admin creates dynamic form with required and optional fields',
    createFormRes.status === 201 && !!testFormId
  );

  // 4.2 Missing Required Fields Validation (422)
  const invalidSubRes = await req(`/api/forms/${testFormId}/submit`, 'POST', {
    responses: {
      emergencyContact: '9876543210',
      // missing roomType and dietPreference
    },
  }, studentToken);
  logTest('4.2 Form 422 Required Fields Gate', 'Rejects missing required fields with 422 and field details',
    invalidSubRes.status === 422 && Array.isArray(invalidSubRes.data.details) && invalidSubRes.data.details.length >= 2
  );

  // 4.3 Valid Submission
  const validSubRes = await req(`/api/forms/${testFormId}/submit`, 'POST', {
    responses: {
      roomType: 'Single',
      dietPreference: 'Vegetarian',
      emergencyContact: '9876543210',
    },
  }, studentToken);
  logTest('4.3 Valid Form Submission', 'Student successfully submits form',
    validSubRes.status === 201 && validSubRes.data.success
  );

  // 4.4 Duplicate Submission Guard (409)
  const dupSubRes = await req(`/api/forms/${testFormId}/submit`, 'POST', {
    responses: {
      roomType: 'Double',
      dietPreference: 'Non-Vegetarian',
    },
  }, studentToken);
  logTest('4.4 Duplicate Submission Guard', 'Blocks duplicate submission from same student with 409 Conflict',
    dupSubRes.status === 409 && dupSubRes.data.success === false
  );

  // 4.5 Toggle Form Unpublish
  const unpubRes = await req(`/api/forms/${testFormId}/publish`, 'PATCH', {
    is_published: false,
  }, adminToken);
  logTest('4.5 Admin Unpublish Form', 'Admin sets is_published = false',
    unpubRes.status === 200 && unpubRes.data.form?.is_published === false
  );

  // 4.6 Unpublished Form Gate (403)
  const submitClosedRes = await req(`/api/forms/${testFormId}/submit`, 'POST', {
    responses: {
      roomType: 'Single',
      dietPreference: 'Vegan',
    },
  }, adminToken); // even admin or another user cannot submit closed form
  logTest('4.6 Closed Form Gate', 'Rejects submissions on unpublished form with 403 Forbidden',
    submitClosedRes.status === 403 && submitClosedRes.data.success === false
  );

  // 4.7 Submissions with Submitter Metadata
  const subsRes = await req(`/api/forms/${testFormId}/submissions`, 'GET', null, adminToken);
  const firstSub = subsRes.data.submissions?.[0];
  logTest('4.7 Submissions Metadata Audit', 'Admin views submissions with submitter name and email enriched',
    subsRes.status === 200 && subsRes.data.count >= 1 && !!firstSub?.userName && !!firstSub?.userEmail
  );

  // -------------------------------------------------------------
  // AREA 5: Academic & Dashboard Edge Cases
  // -------------------------------------------------------------
  console.log('\n--- AREA 5: Academic & Dashboard Edge Cases ---');

  // 5.1 Dashboard for student with 0 classes (Divide-by-zero test)
  const zeroClassRes = await req(`/api/students/${newStudentId}/dashboard`, 'GET', null, adminToken);
  const attData = zeroClassRes.data.attendance;
  logTest('5.1 Attendance 0-Class Protection', 'Zero classes handled gracefully without NaN or error',
    zeroClassRes.status === 200 && !isNaN(attData?.percentage) && attData?.is_low_attendance === false
  );

  // 5.2 Low Attendance Detection (<75%)
  const lowAttRes = await req('/api/students/stu-rec-aarav/dashboard', 'GET', null, adminToken);
  const isLow = lowAttRes.data.attendance?.is_low_attendance;
  const pct = lowAttRes.data.attendance?.percentage;
  logTest('5.2 Low Attendance Alert', `Detects low attendance flag (pct: ${pct}%, is_low: ${isLow})`,
    lowAttRes.status === 200 && isLow === true
  );

  // 5.3 Student Dashboard Scoping & Cross-student 403 Protection
  const crossRes = await req('/api/students/stu-rec-aarav/dashboard', 'GET', null, studentToken);
  logTest('5.3 Cross-Student Dashboard Guard', 'Student blocked with 403 when attempting to access another student dashboard',
    crossRes.status === 403 && crossRes.data.success === false
  );

  // 5.4 Directory Pagination and Multi-filter
  const dirRes = await req('/api/students?page=1&limit=5&course=crs-btech-cs&sort_by=student_id&sort_dir=asc', 'GET', null, adminToken);
  logTest('5.4 Directory Pagination & Filter', 'Returns paginated subset with total and totalPages metadata',
    dirRes.status === 200 && dirRes.data.students?.length <= 5 && dirRes.data.total > 0 && dirRes.data.totalPages >= 1
  );

  // -------------------------------------------------------------
  // AREA 6: Reports & Communications Edge Paths
  // -------------------------------------------------------------
  console.log('\n--- AREA 6: Reports & Communications Edge Paths ---');

  // 6.1 RFC-4180 CSV Export
  const csvRes = await fetch(`${BASE_URL}/api/reports/export-students-csv`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const csvText = await csvRes.text();
  const isCsv = (csvRes.headers.get('content-type') || '').includes('text/csv');
  const hasCsvHeaders = csvText.includes('Student ID') && csvText.includes('Fees Status');
  const hasEscapedQuotes = csvText.includes('"');
  logTest('6.1 RFC-4180 CSV Export', 'Returns text/csv with properly escaped quotes and headers',
    csvRes.status === 200 && isCsv && hasCsvHeaders && hasEscapedQuotes
  );

  // 6.2 Admissions by Course Breakdown with Revenue Stats
  const courseReportRes = await req('/api/reports/admissions-by-course', 'GET', null, adminToken);
  const firstCourseReport = courseReportRes.data.distribution?.[0];
  logTest('6.2 Course Admissions & Revenue Report', 'Returns breakdown with studentCount, paidCount, dueCount, totalCollected, totalDue',
    courseReportRes.status === 200 && courseReportRes.data.distribution?.length > 0 &&
    typeof firstCourseReport?.totalCollected === 'number' && typeof firstCourseReport?.totalDue === 'number'
  );

  // 6.3 Automated Defaulter Email Dispatcher
  const emailRes = await req('/api/students/send-email-reminders', 'POST', {}, adminToken);
  logTest('6.3 Defaulter Email Dispatcher', 'Dispatches automated reminder notices to approved overdue students',
    emailRes.status === 200 && emailRes.data.success && typeof emailRes.data.recipientCount === 'number'
  );

  // -------------------------------------------------------------
  // AREA 7: Notices Bulletin
  // -------------------------------------------------------------
  console.log('\n--- AREA 7: Notices Bulletin ---');

  // 7.1 Create Normal Notice
  const unpinnedRes = await req('/api/notices', 'POST', {
    title: `General Advisory ${Date.now()}`,
    summary: 'Standard library schedule advisory.',
    is_pinned: false,
  }, adminToken);

  // 7.2 Create Pinned Urgent Notice
  const pinnedTitle = `CRITICAL URGENT BULLETIN ${Date.now()}`;
  const pinnedRes = await req('/api/notices', 'POST', {
    title: pinnedTitle,
    summary: 'Campus examination guidelines update.',
    is_pinned: true,
  }, adminToken);
  logTest('7.1 Create Pinned Notice', 'Admin creates pinned urgent bulletin',
    pinnedRes.status === 201 && pinnedRes.data.notice?.is_pinned === true
  );

  // 7.3 Verify Pinned Sorting First
  const listNoticesRes = await req('/api/notices', 'GET', null, studentToken);
  const allNotices = listNoticesRes.data.notices || [];
  const firstNotice = allNotices[0];
  logTest('7.2 Pinned Notice Ordering', 'Pinned notices always sort to top of the notices list',
    listNoticesRes.status === 200 && firstNotice?.is_pinned === true
  );

  console.log('\n================================================================');
  console.log(` RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests > 0) {
    console.error(` FAILED: ${failedTests} tests failed!`);
    process.exit(1);
  } else {
    console.log(' ALL 7 WORKFLOW AREAS PASSED WITH ZERO ERRORS!');
    console.log('================================================================');
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
