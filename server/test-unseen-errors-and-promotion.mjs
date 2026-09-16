// Test Suite: Unseen Errors, Semester Promotion, CSV Auth, and Attendance Delta Verification
const BASE_URL = process.env.BASE_URL || 'https://educore-erp-production.up.railway.app';

console.log(`======================================================================`);
console.log(`  EDUCORE UNSEEN ERRORS & SEMESTER PROMOTION VERIFICATION SUITE`);
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
  const users = {};

  // 1. Authenticate All 3 Roles
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
    users[account.username] = data.user;
  }

  // 2. CSV Export Authentication
  console.log('\n--- 2. CSV EXPORT AUTHENTICATION & ACCESS CONTROL ---');
  // Unauthenticated export must fail (401)
  const unauthCsvRes = await fetch(`${BASE_URL}/api/reports/export-students-csv`);
  assert(unauthCsvRes.status === 401, `Unauthenticated CSV export correctly rejected with HTTP ${unauthCsvRes.status}`);

  // Bearer Token authenticated export must succeed (200)
  const authCsvRes = await fetch(`${BASE_URL}/api/reports/export-students-csv`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
  });
  assert(authCsvRes.status === 200, `Bearer authenticated CSV export succeeded with HTTP ${authCsvRes.status}`);
  const csvContent = await authCsvRes.text();
  assert(csvContent.includes('Student ID') || csvContent.includes('Roll No'), `CSV content contains valid headers`);

  // Query param token fallback must succeed (200)
  const queryParamCsvRes = await fetch(`${BASE_URL}/api/reports/export-students-csv?token=${encodeURIComponent(tokens.staff)}`);
  assert(queryParamCsvRes.status === 200, `Query-param authenticated CSV export succeeded with HTTP ${queryParamCsvRes.status}`);

  // 3. Power Equilibrium: Direct College Admission
  console.log('\n--- 3. DIRECT ADMISSION ROLE BOUNDARIES ---');
  const staffDirectAdmitRes = await fetch(`${BASE_URL}/api/admissions/admin-admit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Intake',
      email: `staff_illegal_${Date.now()}@college.edu`,
      courseId: 'crs-btech-cs',
    }),
  });
  assert(staffDirectAdmitRes.status === 403, `Staff forbidden from Direct Admission Intake (HTTP ${staffDirectAdmitRes.status})`);

  // 4. Receipt Access Control & 'latest' Resolver
  console.log('\n--- 4. RECEIPT ACCESS CONTROL & LATEST FALLBACK ---');
  const studentLatestReceiptRes = await fetch(`${BASE_URL}/api/fees/receipt/latest`, {
    headers: { Authorization: `Bearer ${tokens.aryan}` },
  });
  const latestReceiptData = await studentLatestReceiptRes.json();
  assert(
    studentLatestReceiptRes.status === 200 || studentLatestReceiptRes.status === 404,
    `Student requesting /api/fees/receipt/latest handled cleanly (HTTP ${studentLatestReceiptRes.status})`
  );

  // 5. Semester Promotion Lifecycle (Admin Only)
  console.log('\n--- 5. SEMESTER PROMOTION & ATTENDANCE RESET ---');
  // First, find a test student or use Aryan
  const studentsRes = await fetch(`${BASE_URL}/api/students?limit=10`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
  });
  const studentsData = await studentsRes.json();
  const testStudent = studentsData.students?.find((s) => s.current_semester < 8) || studentsData.students?.[0];
  assert(testStudent, `Target student selected for promotion audit: ${testStudent?.first_name} (Sem ${testStudent?.current_semester})`);

  if (testStudent) {
    const origSem = testStudent.current_semester;

    // Staff cannot promote
    const staffPromoteRes = await fetch(`${BASE_URL}/api/students/${testStudent.id}/promote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.staff}` },
    });
    assert(staffPromoteRes.status === 403, `Staff forbidden from promoting student to next semester (HTTP ${staffPromoteRes.status})`);

    // Student cannot promote self
    const studentPromoteRes = await fetch(`${BASE_URL}/api/students/${testStudent.id}/promote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.aryan}` },
    });
    assert(studentPromoteRes.status === 403, `Student forbidden from promoting self (HTTP ${studentPromoteRes.status})`);

    // Admin promotes student (only if not at sem 8)
    if (origSem < 8) {
      const adminPromoteRes = await fetch(`${BASE_URL}/api/students/${testStudent.id}/promote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.admin}` },
      });
      const promoteData = await adminPromoteRes.json();
      assert(adminPromoteRes.status === 200 && promoteData.success, `Admin promoted student successfully: ${promoteData.message}`);
      assert(promoteData.student?.current_semester === origSem + 1, `Student advanced from Semester ${origSem} to ${origSem + 1}`);
      assert(promoteData.student?.attendance_percentage === 100, `Attendance reset to 100% baseline for new semester`);
      assert(promoteData.student?.total_classes === 0, `Total classes reset to 0 for new semester`);
    }
  }

  // 6. Bulk Attendance Updates
  console.log('\n--- 6. BULK ATTENDANCE RECORDING ---');
  if (testStudent) {
    const bulkAttRes = await fetch(`${BASE_URL}/api/students/attendance/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.staff}`,
      },
      body: JSON.stringify({
        courseCode: 'CS-401',
        lectureDate: new Date().toISOString().slice(0, 10),
        lectureSlot: 'Period 2 • 10:00 AM - 11:00 AM (LT-204)',
        topic: 'Verification Audit Lecture',
        updates: [
          {
            studentId: testStudent.id,
            status: 'P',
            attendedClasses: 1,
            totalClasses: 1,
            attendancePercentage: 100,
          },
        ],
      }),
    });
    const bulkData = await bulkAttRes.json();
    assert(bulkAttRes.status === 200 && bulkData.success, `Staff submitted bulk attendance successfully: ${bulkData.message}`);
  }

  console.log(`\n======================================================================`);
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`======================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
