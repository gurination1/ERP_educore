// Test Suite: Bulk Attendance Atomicity & Role Power Separation
const BASE_URL = process.env.BASE_URL || 'https://educore-erp-production.up.railway.app';

console.log(`======================================================================`);
console.log(`  EDUCORE BULK ATTENDANCE & POWER EQUILIBRIUM VERIFICATION SUITE`);
console.log(`  Target: ${BASE_URL}`);
console.log(`======================================================================\n`);

async function runTests() {
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

  const tokens = {};

  // 1. Authenticate roles
  console.log('--- 1. AUTHENTICATING ROLES ---');
  for (const account of [
    { username: 'admin', password: 'password123', alt: 'admin123' },
    { username: 'staff', password: 'password123', alt: 'staff123' },
    { username: 'aryan', password: 'password123', alt: 'student123' },
  ]) {
    let res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.username, password: account.password }),
    });
    let data = await res.json();
    if (!data.success && account.alt) {
      res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: account.username, password: account.alt }),
      });
      data = await res.json();
    }
    assert(data.success && data.token, `Logged in as ${account.username} (${data.user?.role})`);
    tokens[account.username] = data.token;
  }

  // 2. Role Boundary Assertions (Power Equilibrium)
  console.log('\n--- 2. ROLE POWER EQUILIBRIUM AUDIT ---');

  // Staff cannot assign fee heads
  const staffAssignRes = await fetch(`${BASE_URL}/api/fees/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      studentId: 'stu-rec-aryan',
      feeHeadId: 'fh-tuition',
      amount: 50000,
    }),
  });
  assert(
    staffAssignRes.status === 403,
    `Staff forbidden from assigning institutional fee heads (HTTP ${staffAssignRes.status})`
  );

  // Staff cannot directly award and disburse scholarships
  const staffAwardRes = await fetch(`${BASE_URL}/api/scholarships/award`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      studentId: 'stu-rec-aryan',
      schemeId: 'sch-merit-01',
      amount: 10000,
    }),
  });
  assert(
    staffAwardRes.status === 403,
    `Staff forbidden from directly disbursing scholarship funds (HTTP ${staffAwardRes.status})`
  );

  // Student cannot submit bulk attendance
  const studentBulkAttRes = await fetch(`${BASE_URL}/api/students/attendance/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.aryan}`,
    },
    body: JSON.stringify({
      courseCode: 'CS-401',
      updates: [{ studentId: 'stu-rec-aryan', status: 'P', attendedClasses: 40, totalClasses: 40 }],
    }),
  });
  assert(
    studentBulkAttRes.status === 403,
    `Student forbidden from submitting bulk lecture attendance (HTTP ${studentBulkAttRes.status})`
  );

  // Student cannot inspect other student's fee ledger
  const studentCrossLedgerRes = await fetch(`${BASE_URL}/api/fees/ledger/stu-008`, {
    headers: { Authorization: `Bearer ${tokens.aryan}` },
  });
  assert(
    studentCrossLedgerRes.status === 403,
    `Student forbidden from inspecting peer fee ledger (HTTP ${studentCrossLedgerRes.status})`
  );

  // 3. Atomic Bulk Attendance Verification (Staff & Admin)
  console.log('\n--- 3. ATOMIC BULK ATTENDANCE VERIFICATION ---');

  // Negative classes rejection
  const negativeAttRes = await fetch(`${BASE_URL}/api/students/attendance/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      courseCode: 'CS-401',
      updates: [{ studentId: 'stu-rec-aryan', attendedClasses: -5, totalClasses: 20 }],
    }),
  });
  assert(
    negativeAttRes.status === 400,
    `Bulk attendance rejects negative attended classes (HTTP ${negativeAttRes.status})`
  );

  // Attended > Total rejection
  const overflowAttRes = await fetch(`${BASE_URL}/api/students/attendance/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      courseCode: 'CS-401',
      updates: [{ studentId: 'stu-rec-aryan', attendedClasses: 50, totalClasses: 40 }],
    }),
  });
  assert(
    overflowAttRes.status === 400,
    `Bulk attendance rejects attendedClasses > totalClasses (HTTP ${overflowAttRes.status})`
  );

  // Valid Atomic Bulk Submission by Faculty
  const validBulkRes = await fetch(`${BASE_URL}/api/students/attendance/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      courseCode: 'CS-401',
      lectureDate: new Date().toISOString().slice(0, 10),
      lectureSlot: 'Period 2 • 10:00 AM - 11:00 AM (LT-204)',
      topic: 'Distributed Cloud Architecture & MariaDB Replication',
      updates: [
        { studentId: 'stu-rec-aryan', status: 'P', attendedClasses: 36, totalClasses: 40, attendancePercentage: 90 },
        { studentId: 'stu-008', status: 'A', attendedClasses: 28, totalClasses: 40, attendancePercentage: 70 },
        { studentId: 'stu-006', status: 'M', attendedClasses: 32, totalClasses: 40, attendancePercentage: 80 },
      ],
    }),
  });

  const validBulkData = await validBulkRes.json();
  assert(
    validBulkRes.status === 200 && validBulkData.success,
    `Faculty successfully submitted atomic bulk attendance for 3 students (HTTP ${validBulkRes.status})`
  );
  assert(
    validBulkData.summary?.presentCount === 1 &&
    validBulkData.summary?.absentCount === 1 &&
    validBulkData.summary?.medicalCount === 1,
    `Summary tally perfectly recorded: 1 Present, 1 Absent, 1 On-Duty`
  );
  assert(
    validBulkData.registerKey && validBulkData.registerKey.includes('CS-401'),
    `Register key cleanly generated: ${validBulkData.registerKey}`
  );

  // Verify DB reflects updated values
  const studentCheckRes = await fetch(`${BASE_URL}/api/students/stu-rec-aryan/dashboard`, {
    headers: { Authorization: `Bearer ${tokens.aryan}` },
  });
  const studentCheckData = await studentCheckRes.json();
  assert(
    studentCheckData.success && studentCheckData.attendance?.percentage === 90,
    `Student live dashboard reflects updated attendance: ${studentCheckData.attendance?.percentage}%`
  );

  console.log(`\n======================================================================`);
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================================`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
