import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING FULL MRSPTU / PUNJAB LIFECYCLE AUDIT SUITE`);
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let totalTests = 0;
  let passedTests = 0;

  function assert(desc, condition, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${desc}`);
    } else {
      console.error(`  ❌ FAIL: ${desc} ${details ? '--> ' + details : ''}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // 1. Admin Login
  console.log(`--- [1] Admin Authentication ---`);
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'admin123' },
  });
  assert('Admin login succeeds', adminLogin.status === 200 && adminLogin.data.success);
  const adminToken = adminLogin.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 2. Staff Login
  console.log(`\n--- [2] Staff Authentication ---`);
  const staffLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'staff', password: 'staff123' },
  });
  assert('Staff alias login succeeds', staffLogin.status === 200 && staffLogin.data.success);

  // 3. Verify Canonical Fee Heads
  console.log(`\n--- [3] Canonical Fee Heads Verification ---`);
  const headsRes = await request('/api/fees/heads', { headers: adminHeaders });
  assert('Fee heads list retrieved', headsRes.status === 200 && headsRes.data.success);
  const feeHeads = headsRes.data.feeHeads || [];
  assert('fh-tuition exists', feeHeads.some(h => h.id === 'fh-tuition'));
  assert('fh-reappear (MRSPTU Exam Backlog) exists', feeHeads.some(h => h.id === 'fh-reappear'));
  assert('fh-hostel-room exists', feeHeads.some(h => h.id === 'fh-hostel-room'));
  assert('fh-transport exists', feeHeads.some(h => h.id === 'fh-transport'));
  assert('fh-lib-fine exists', feeHeads.some(h => h.id === 'fh-lib-fine'));

  // 4. Verify Canonical Punjab Scholarships
  console.log(`\n--- [4] Punjab Scholarship Schemes Verification ---`);
  const schemesRes = await request('/api/scholarships/schemes', { headers: adminHeaders });
  assert('Scholarships schemes retrieved', schemesRes.status === 200 && schemesRes.data.success);
  const schemes = schemesRes.data.schemes || [];
  assert('PMS-PUNJAB (Dr. Ambedkar Portal) exists', schemes.some(s => s.code === 'PMS-PUNJAB'));
  assert('CMSS-PUNJAB (Chief Minister Scholarship) exists', schemes.some(s => s.code === 'CMSS-PUNJAB'));

  // 5. Admit New Punjab Student with Mutual Exclusivity Check
  console.log(`\n--- [5] Student Admission & Mutual Exclusivity Gate ---`);
  const coursesRes = await request('/api/admissions', { headers: adminHeaders });
  const testStudentEmail = `manpreet.${Date.now()}@punjabtech.ac.in`;
  const testStudentPhone = `98765${Date.now().toString().slice(-5)}`;

  // 5a. Attempt Mutual Exclusivity Violation (Hostel + Transport simultaneously)
  const illegalAdmission = await request('/api/admissions/admin-admit', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      firstName: 'Manpreet',
      lastName: 'Singh',
      email: testStudentEmail,
      phone: testStudentPhone,
      courseId: 'crs-btech-cse',
      admissionYear: 2025,
      currentSemester: 4,
      guardianName: 'S. Harbhajan Singh',
      quota: 'punjab_85',
      category: 'General',
      isHosteller: true,
      isTransportUser: true, // ILLEGAL: Mutual exclusivity violation
    },
  });
  assert('Dual Hostel+Transport admission rejected with 400', illegalAdmission.status === 400 && !illegalAdmission.data.success);

  // 5b. Legal Admission as Day Scholar Bus Commuter
  const validAdmission = await request('/api/admissions/admin-admit', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      firstName: 'Manpreet',
      lastName: 'Singh',
      email: testStudentEmail,
      phone: testStudentPhone,
      courseId: 'crs-btech-cse',
      admissionYear: 2025,
      currentSemester: 4,
      guardianName: 'S. Harbhajan Singh',
      quota: 'punjab_85',
      category: 'General',
      isHosteller: false,
      isTransportUser: true,
      transportRoute: 'Route 12 (Goniana Mandi to BFGI Campus)',
    },
  });
  assert('Valid Punjab 85% quota admission succeeds', validAdmission.status === 201 && validAdmission.data.success);
  const admittedStudent = validAdmission.data.student;
  const studentUsername = validAdmission.data.credentialsSlip.username;
  const studentPassword = validAdmission.data.credentialsSlip.tempPassword;

  // 6. Student Login & Profile Check
  console.log(`\n--- [6] Student Portal Authentication ---`);
  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: studentUsername, password: studentPassword },
  });
  assert('Admitted student can log into student portal', studentLogin.status === 200 && studentLogin.data.success);
  const studentToken = studentLogin.data.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // 7. Verify Initial Fee Ledger & Admit Card Block (Dues pending)
  console.log(`\n--- [7] Initial Fee Ledger & Examination No-Dues Gate ---`);
  const ledgerRes = await request(`/api/fees/ledger/${admittedStudent.id}`, { headers: studentHeaders });
  assert('Student fee ledger fetched', ledgerRes.status === 200 && ledgerRes.data.success);
  const initialDue = ledgerRes.data.summary.totalDue;
  assert('Student has outstanding initial fees', initialDue > 0);

  const admitCardDueBlock = await request(`/api/students/${admittedStudent.id}/admit-card`, { headers: studentHeaders });
  assert('Admit Card withheld due to pending fee balance', admitCardDueBlock.status === 200 && admitCardDueBlock.data.status === 'WITHHELD');
  assert('Hold reason cites Accounts Branch Hold', admitCardDueBlock.data.holdReasons.some(r => r.includes('Accounts Branch Hold')));

  // 8. Switching Residential Status to Campus Hostel
  console.log(`\n--- [8] Switching Residential Status (Transport -> Hostel) ---`);
  const switchRes = await request(`/api/students/${admittedStudent.id}/change-residential-status`, {
    method: 'POST',
    headers: adminHeaders,
    body: {
      isHosteller: true,
      isTransportUser: false,
      hostelRoomNo: 'Bhagat Singh Hostel Room 302',
    },
  });
  assert('Residential switch succeeds', switchRes.status === 200 && switchRes.data.success);
  assert('Student profile updated to hosteller', switchRes.data.student.is_hosteller === true && switchRes.data.student.is_transport_user === false);

  const updatedLedger = await request(`/api/fees/ledger/${admittedStudent.id}`, { headers: studentHeaders });
  const activeHeads = updatedLedger.data.ledger.filter(l => l.status !== 'cancelled').map(l => l.fee_head_id);
  assert('Hostel fee heads assigned', activeHeads.includes('fh-hostel-room'));
  assert('Unpaid transport fee heads cancelled', !activeHeads.includes('fh-transport'));

  // 9. Assigning MRSPTU Re-appear / Backlog Fee
  console.log(`\n--- [9] Assigning MRSPTU Reappear & Library Fine ---`);
  const assignReappear = await request('/api/fees/assign', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      studentId: admittedStudent.id,
      feeHeadId: 'fh-reappear',
      amount: 1000,
      semester: 4,
    },
  });
  assert('Reappear backlog fee assigned', assignReappear.status === 201 && assignReappear.data.success);

  const assignLibFine = await request('/api/fees/assign', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      studentId: admittedStudent.id,
      feeHeadId: 'fh-lib-fine',
      amount: 250,
      semester: 4,
    },
  });
  assert('Library overdue fine assigned', assignLibFine.status === 201 && assignLibFine.data.success);

  // 10. Financial Stress Testing with Stupid Numbers
  console.log(`\n--- [10] Financial Adversarial Attacks ("Stupid Numbers") ---`);
  
  // 10a. Negative payment
  const negPay = await request('/api/fees/collect', {
    method: 'POST',
    headers: studentHeaders,
    body: { studentId: admittedStudent.id, amount: -500 },
  });
  assert('Negative payment rejected', negPay.status === 400 && !negPay.data.success);

  // 10b. Zero payment
  const zeroPay = await request('/api/fees/collect', {
    method: 'POST',
    headers: studentHeaders,
    body: { studentId: admittedStudent.id, amount: 0 },
  });
  assert('Zero payment rejected', zeroPay.status === 400 && !zeroPay.data.success);

  // 10c. Gigantic overpayment
  const giganticPay = await request('/api/fees/collect', {
    method: 'POST',
    headers: studentHeaders,
    body: { studentId: admittedStudent.id, amount: 99999999 },
  });
  assert('Overpayment beyond total due rejected', giganticPay.status === 400 && !giganticPay.data.success);

  // 10d. Itemized allocation sum mismatch
  const mismatchPay = await request('/api/fees/collect', {
    method: 'POST',
    headers: studentHeaders,
    body: {
      studentId: admittedStudent.id,
      amount: 1250,
      feeAllocations: [
        { studentFeeId: assignReappear.data.studentFee.id, amount: 1000 },
        { studentFeeId: assignLibFine.data.studentFee.id, amount: 500 }, // sum = 1500 !== 1250
      ],
    },
  });
  assert('Allocation sum mismatch rejected', mismatchPay.status === 400 && !mismatchPay.data.success);

  // 10e. Head overpayment (allocating 2000 to a 1000 due fee head)
  const headOverpay = await request('/api/fees/collect', {
    method: 'POST',
    headers: studentHeaders,
    body: {
      studentId: admittedStudent.id,
      amount: 2000,
      feeAllocations: [
        { studentFeeId: assignReappear.data.studentFee.id, amount: 2000 },
      ],
    },
  });
  assert('Head overpayment rejected', headOverpay.status === 400 && !headOverpay.data.success);

  // 11. Clear All Fees to Test Attendance Detention Gate
  console.log(`\n--- [11] Full Fee Clearance & No-Dues Verification ---`);
  const prePayLedger = await request(`/api/fees/ledger/${admittedStudent.id}`, { headers: studentHeaders });
  const remainingDueToClear = prePayLedger.data.summary.totalDue;
  
  const fullClearance = await request('/api/fees/collect', {
    method: 'POST',
    headers: studentHeaders,
    body: {
      studentId: admittedStudent.id,
      amount: remainingDueToClear,
      paymentMode: 'online_upi',
    },
  });
  assert('Full fee clearance payment succeeds', fullClearance.status === 200 && fullClearance.data.success);
  assert('Remaining due is now zero', fullClearance.data.remainingDue === 0);

  // Receipt verification
  const receiptCheck = await request(`/api/fees/receipt/${fullClearance.data.receiptNo}`, { headers: studentHeaders });
  assert('Receipt retrieved successfully', receiptCheck.status === 200 && receiptCheck.data.success);
  assert('Receipt displays BFGI Bathinda', receiptCheck.data.receipt.institutionName.includes('Baba Farid'));

  // 12. MRSPTU Ordinance 7.4 Attendance Detention Testing
  console.log(`\n--- [12] MRSPTU Ordinance 7.4 Attendance Detention & Condonation ---`);

  // 12a. Set Attendance to 60% (Strict Detention: <65%)
  await request(`/api/students/${admittedStudent.id}/attendance`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: { attendedClasses: 60, totalClasses: 100 },
  });
  
  const admitCardStrictDetain = await request(`/api/students/${admittedStudent.id}/admit-card`, { headers: studentHeaders });
  assert('Admit Card withheld with strict detention for 60% attendance', admitCardStrictDetain.data.status === 'WITHHELD');
  assert('Hold reason cites Strict Detention (<65%)', admitCardStrictDetain.data.holdReasons.some(r => r.includes('Strict Detention')));

  // Condonation attempt on 60% attendance must FAIL under MRSPTU Ordinance 7.4
  const illegalCondonation = await request(`/api/students/${admittedStudent.id}/condone-attendance`, {
    method: 'POST',
    headers: adminHeaders,
    body: { orderNo: 'ORD-ILLEGAL-01', reason: 'Medical Leave' },
  });
  assert('Condonation for <65% attendance strictly prohibited & rejected with 400', illegalCondonation.status === 400 && !illegalCondonation.data.success);

  // 12b. Set Attendance to 68% (Condonable Range: 65% - 74.9%)
  await request(`/api/students/${admittedStudent.id}/attendance`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: { attendedClasses: 68, totalClasses: 100 },
  });

  const admitCardCondonable = await request(`/api/students/${admittedStudent.id}/admit-card`, { headers: studentHeaders });
  assert('Admit Card withheld prior to condonation for 68% attendance', admitCardCondonable.data.status === 'WITHHELD');

  // Grant official MRSPTU Condonation order
  const validCondonation = await request(`/api/students/${admittedStudent.id}/condone-attendance`, {
    method: 'POST',
    headers: adminHeaders,
    body: {
      orderNo: 'MRSPTU-COND-2025-0881',
      reason: 'Represented MRSPTU in All India Inter-University Badminton Tournament.',
    },
  });
  assert('Condonation granted for 68% attendance', validCondonation.status === 200 && validCondonation.data.success);

  // Verify Admit Card is NOW RELEASED!
  const admitCardReleased = await request(`/api/students/${admittedStudent.id}/admit-card`, { headers: studentHeaders });
  assert('Admit Card officially RELEASED after condonation', admitCardReleased.data.status === 'RELEASED');
  assert('Admit card contains candidate name', admitCardReleased.data.admitCard.candidateName.includes('Manpreet'));
  assert('Admit card contains MRSPTU Roll No', admitCardReleased.data.admitCard.rollNo.startsWith('MRSPTU-'));
  assert('Admit card records condonation order', admitCardReleased.data.admitCard.condonationOrder === 'MRSPTU-COND-2025-0881');

  // 13. High Attendance Standard Release (90%)
  console.log(`\n--- [13] Standard Attendance Release (90%) ---`);
  await request(`/api/students/${admittedStudent.id}/attendance`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: { attendedClasses: 90, totalClasses: 100 },
  });
  const admitCardRegular = await request(`/api/students/${admittedStudent.id}/admit-card`, { headers: studentHeaders });
  assert('Admit Card regular release succeeds', admitCardRegular.data.status === 'RELEASED' && admitCardRegular.data.isEligible === true);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
  console.log(`======================================================\n`);
}

runTests().catch(err => {
  console.error(`\n❌ TEST RUN ABORTED:`, err);
  process.exit(1);
});
