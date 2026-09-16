const BASE_URL = process.env.BASE_URL || 'https://educore-erp-production.up.railway.app';

async function req(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('======================================================================');
  console.log('  BRUTAL PUNJAB COLLEGE ERP LIFECYCLE & STUPID NUMBERS AUDIT          ');
  console.log(`  Target: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL]: ${message}`);
      failed++;
    }
  }

  // PHASE 0: AUTH ACQUISITION
  console.log('--- PHASE 0: AUTHENTICATION ---');
  const adminLogin = await req('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  assert(adminLogin.data.success, 'Admin login succeeded');
  const adminToken = adminLogin.data.token;

  const staffLogin = await req('/api/auth/login', 'POST', { username: 'staff', password: 'staff123' });
  assert(staffLogin.data.success, 'Staff login succeeded');
  const staffToken = staffLogin.data.token;

  // PHASE 1: KPI & TREND AUDIT (CHECK FOR FAKE NUMBERS)
  console.log('\n--- PHASE 1: TRUTHFUL KPI & REAL FINANCIAL AUDIT ---');
  const kpiRes = await req('/api/fees/kpi', 'GET', null, adminToken);
  assert(kpiRes.data.success, 'KPI endpoint responded');
  const kpi = kpiRes.data.kpi;
  console.log(`  KPI Stats: Total Students=${kpi.totalStudents}, Pending Approvals=${kpi.pendingApprovals}, Collected=${kpi.totalCollectedFormatted}, Dues=${kpi.pendingDuesFormatted}`);
  
  // Verify NO fake numbers like 1250 or +11
  assert(kpi.totalStudents < 1000, `Real student count verified (${kpi.totalStudents}), NOT hardcoded 1250`);
  assert(typeof kpi.pendingApprovals === 'number', `Real approvals count verified (${kpi.pendingApprovals})`);
  assert(!kpi.totalCollectedFormatted.includes('NaN'), `Collected formatted is valid: ${kpi.totalCollectedFormatted}`);
  assert(!kpi.pendingDuesFormatted.includes('NaN'), `Dues formatted is valid: ${kpi.pendingDuesFormatted}`);

  const trendRes = await req('/api/fees/trend', 'GET', null, adminToken);
  assert(trendRes.data.success, 'Trend endpoint responded');
  assert(Array.isArray(trendRes.data.trend) && trendRes.data.trend.length > 0, `Real trend data points: ${trendRes.data.trend.length} months`);

  // PHASE 2: NEW STUDENT ADMISSION LIFECYCLE (PUNJAB QUOTA & HOSTEL)
  console.log('\n--- PHASE 2: NEW CANDIDATE ADMISSION LIFECYCLE ---');
  const testCandidateEmail = `punjab.candidate.${Date.now()}@gmail.com`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Test Mutual Exclusivity: candidate selects BOTH hostel and bus transport
  const invalidMutual = await req('/api/admissions/submit', 'POST', {
    firstName: 'Gurinder',
    lastName: 'Singh',
    email: testCandidateEmail,
    phone: testPhone,
    isHosteller: true,
    isTransportUser: true,
  });
  assert(invalidMutual.status === 400 && invalidMutual.data.error.includes('Mutual Exclusivity'), 'Mutual exclusivity blocked: candidate cannot choose both Hostel and Bus Transport');

  // Submit valid candidate: Hosteller under Punjab State Quota 85%
  const validSubmit = await req('/api/admissions/submit', 'POST', {
    firstName: 'Gurinder',
    lastName: 'Dhillon',
    email: testCandidateEmail,
    phone: testPhone,
    gender: 'male',
    dob: '2005-04-14',
    guardianName: 'S. Harpreet Singh Dhillon',
    relationship: 'parent',
    guardianPhone: testPhone,
    courseId: 'crs-btech-cs',
    quota: 'punjab_85',
    category: 'General',
    tenthPercentage: 91.5,
    twelfthPercentage: 89.2,
    boardName: 'PSEB (Punjab School Education Board)',
    isHosteller: true,
    isTransportUser: false,
    hostelRoomNo: 'BH-2 Room 312',
  });
  assert(validSubmit.status === 201 && validSubmit.data.success, `Candidate application submitted: App No ${validSubmit.data.applicationNumber}`);
  const admittedStudentId = validSubmit.data.student.id;

  // Staff marks candidate as verified
  const verifyRes = await req(`/api/admissions/${admittedStudentId}/status`, 'PATCH', { status: 'verified', remarks: '10th, 12th PSEB marksheets and Punjab Domicile verified.' }, staffToken);
  assert(verifyRes.data.success, 'Staff verified candidate Punjab domicile and academic documentation');

  // Admin approves admission & issues credentials
  const approveRes = await req(`/api/admissions/${admittedStudentId}/status`, 'PATCH', { status: 'approved', remarks: 'Final approval granted by Academic Provost' }, adminToken);
  assert(approveRes.data.success, 'Registrar finalized admission approval');

  // PHASE 3: STUPID NUMBERS & FINANCIAL ADVERSARIAL ATTACKS
  console.log('\n--- PHASE 3: STUPID NUMBERS & ADVERSARIAL FEE ATTACKS ---');

  // Fetch student's freshly generated fee ledger
  const ledgerRes = await req(`/api/fees/ledger/${admittedStudentId}`, 'GET', null, adminToken);
  assert(ledgerRes.data.success, 'Ledger generated successfully for admitted student');
  const gross = ledgerRes.data.summary.totalGross;
  const initialDue = ledgerRes.data.summary.totalDue;
  console.log(`  Fresh Student Ledger: Gross=₹${gross}, Dues=₹${initialDue}`);
  console.log(`  Assessed Heads (${ledgerRes.data.ledger.length}):`);
  for (const h of ledgerRes.data.ledger) {
    console.log(`    - [${h.id}] ${h.fee_head?.title || h.fee_head_id}: ₹${h.amount}`);
  }

  // Attack 1: Pay ₹0
  const zeroPay = await req('/api/fees/collect', 'POST', { studentId: admittedStudentId, amount: 0 }, adminToken);
  assert(zeroPay.status === 400, 'Attack 1: Paying ₹0 rejected with HTTP 400');

  // Attack 2: Pay negative amount (-5000)
  const negPay = await req('/api/fees/collect', 'POST', { studentId: admittedStudentId, amount: -5000 }, adminToken);
  assert(negPay.status === 400, 'Attack 2: Paying negative amount (-₹5000) rejected with HTTP 400');

  // Attack 3: Pay absurdly massive number (₹999,999,999) exceeding student dues
  const massivePay = await req('/api/fees/collect', 'POST', { studentId: admittedStudentId, amount: 999999999 }, adminToken);
  assert(massivePay.status === 400 && massivePay.data.error.includes('exceeds'), 'Attack 3: Overpayment (₹999,999,999) blocked with HTTP 400');

  // Attack 4: Mismatched allocation sum (amount 10,000 but allocations sum 1,000)
  const tuitionFee = ledgerRes.data.ledger.find(h => h.fee_head_id === 'fh-tuition');
  const hostelFee = ledgerRes.data.ledger.find(h => h.fee_head_id?.includes('hostel'));
  assert(Boolean(tuitionFee && hostelFee), 'Found Tuition and Hostel fee heads on student');

  const mismatchPay = await req('/api/fees/collect', 'POST', {
    studentId: admittedStudentId,
    amount: 10000,
    feeAllocations: [
      { studentFeeId: hostelFee.id, amount: 1000 }
    ]
  }, adminToken);
  assert(mismatchPay.status === 400 && mismatchPay.data.error.includes('does not match'), 'Attack 4: Allocation mismatch (amount ₹10k != sum ₹1k) rejected with HTTP 400');

  // Attack 5: Allocating more than head's due amount
  const overAllocPay = await req('/api/fees/collect', 'POST', {
    studentId: admittedStudentId,
    amount: hostelFee.due_amount + 5000,
    feeAllocations: [
      { studentFeeId: hostelFee.id, amount: hostelFee.due_amount + 5000 }
    ]
  }, adminToken);
  assert(overAllocPay.status === 400 && overAllocPay.data.error.includes('exceeds outstanding due'), 'Attack 5: Allocating ₹5k more than head due rejected with HTTP 400');

  // Attack 6: Paying ₹1 to clear ₹45,000 fee (exploit attempt)
  const cheatPay = await req('/api/fees/collect', 'POST', {
    studentId: admittedStudentId,
    amount: 1,
    feeAllocations: [
      { studentFeeId: tuitionFee.id, amount: tuitionFee.due_amount }
    ]
  }, adminToken);
  assert(cheatPay.status === 400, 'Attack 6: Paying ₹1 to clear ₹45k fee exploit successfully blocked');

  // PHASE 4: FLOATING POINT & PARTIAL PRECISION SETTLEMENT
  console.log('\n--- PHASE 4: FLOATING POINT & FRACTIONAL SETTLEMENT ---');
  // Pay fractional ₹7,777.77 towards Hostel Fee
  const fractionalPart1 = 7777.77;
  const part1Res = await req('/api/fees/collect', 'POST', {
    studentId: admittedStudentId,
    amount: fractionalPart1,
    feeAllocations: [
      { studentFeeId: hostelFee.id, amount: fractionalPart1 }
    ],
    notes: 'Fractional partial test payment'
  }, adminToken);
  assert(part1Res.data.success, `Paid fractional ₹${fractionalPart1} towards Hostel Fee`);

  // Verify ledger after part 1
  const ledgerPart1 = await req(`/api/fees/ledger/${admittedStudentId}`, 'GET', null, adminToken);
  const hostelAfter1 = ledgerPart1.data.ledger.find(h => h.id === hostelFee.id);
  const expectedDue1 = Math.round((hostelFee.due_amount - fractionalPart1) * 100) / 100;
  assert(hostelAfter1.due_amount === expectedDue1, `Hostel due is exactly ₹${expectedDue1} with ZERO floating point error`);
  assert(hostelAfter1.status === 'partial', 'Hostel fee status accurately marked as "partial"');

  // Pay exact remaining pennies to clear Hostel Fee:
  const fractionalPart2 = hostelAfter1.due_amount;
  const part2Res = await req('/api/fees/collect', 'POST', {
    studentId: admittedStudentId,
    amount: fractionalPart2,
    feeAllocations: [
      { studentFeeId: hostelFee.id, amount: fractionalPart2 }
    ],
    notes: 'Fractional penny clearance payment'
  }, adminToken);
  assert(part2Res.data.success, `Paid remaining ₹${fractionalPart2} towards Hostel Fee`);

  const ledgerPart2 = await req(`/api/fees/ledger/${admittedStudentId}`, 'GET', null, adminToken);
  const hostelAfter2 = ledgerPart2.data.ledger.find(h => h.id === hostelFee.id);
  assert(hostelAfter2.due_amount === 0, 'Hostel fee head is exactly ₹0 due');
  assert(hostelAfter2.status === 'paid', 'Hostel fee status flipped to "paid"');

  // Verify Tuition fee remained 100% UNTOUCHED (Zero waterfall leak)
  const tuitionAfter2 = ledgerPart2.data.ledger.find(h => h.id === tuitionFee.id);
  assert(tuitionAfter2.due_amount === tuitionFee.due_amount, `Tuition fee head completely untouched (₹${tuitionAfter2.due_amount} due)`);

  // PHASE 5: SCHOLARSHIP CAP DEFENSE
  console.log('\n--- PHASE 5: SCHOLARSHIP CONCESSION CAP AUDIT ---');
  // Attempt to award scholarship greater than tuition fee
  const schemesRes = await req('/api/scholarships/schemes', 'GET', null, adminToken);
  const scheme = schemesRes.data.schemes[0];
  assert(Boolean(scheme), 'Found scholarship scheme');

  const awardRes = await req('/api/scholarships/award', 'POST', {
    studentId: admittedStudentId,
    schemeId: scheme.id,
    amount: tuitionFee.amount + 20000, // Exceeds fee by 20k
    remarks: 'Mega merit concession test'
  }, adminToken);
  assert(awardRes.data.success, 'Awarded scholarship');

  const ledgerAfterScholarship = await req(`/api/fees/ledger/${admittedStudentId}`, 'GET', null, adminToken);
  const tuitionAfterScholarship = ledgerAfterScholarship.data.ledger.find(h => h.id === tuitionFee.id);
  assert(tuitionAfterScholarship.discount_amount <= tuitionFee.amount, `Discount (₹${tuitionAfterScholarship.discount_amount}) NEVER exceeds fee amount (₹${tuitionFee.amount})`);

  // PHASE 6: STUDENT PORTAL LOGIN & ATTENDANCE DETENTION CHECK
  console.log('\n--- PHASE 6: STUDENT PORTAL & ATTENDANCE METRICS ---');
  // Student login
  const studentUsername = validSubmit.data.student.student_id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const currentYear = new Date().getFullYear();
  const studentLoginRes = await req('/api/auth/login', 'POST', {
    username: studentUsername,
    password: `Student@${currentYear}`
  });
  assert(studentLoginRes.data.success, `Newly admitted student logged in successfully (Username: ${studentUsername})`);
  const studentToken = studentLoginRes.data.token;

  // Student Dashboard API check
  const dashRes = await req('/api/students/me/dashboard', 'GET', null, studentToken);
  assert(dashRes.data.success, 'Student dashboard fetched successfully via /me scoping');
  assert(dashRes.data.attendance !== undefined, 'Attendance metric reported truthfully');
  console.log(`  Student Dashboard Attendance: ${dashRes.data.attendance.percentage}%, Low Attendance: ${dashRes.data.attendance.is_low_attendance}`);

  // Test Student Scoping Security: Student tries to view someone else's dashboard
  const crossDash = await req('/api/students/stu-rec-aryan/dashboard', 'GET', null, studentToken);
  assert(crossDash.status === 403, 'Cross-student inspection blocked by security fence (HTTP 403)');

  console.log('\n======================================================================');
  console.log(`BRUTAL LIFECYCLE & NUMBERS AUDIT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
