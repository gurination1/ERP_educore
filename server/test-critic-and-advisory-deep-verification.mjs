// Use native Node 22 fetch

const PORT = process.env.TEST_PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

console.log('======================================================================');
console.log('  EDUCORE DEEP CRITIQUE & FACULTY ADVISORY VERIFICATION SUITE');
console.log(`  Target: ${BASE_URL}`);
console.log('======================================================================\n');

async function runVerification() {
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

  // 1. Authenticate Roles
  console.log('--- 1. ROLE AUTHENTICATION ---');
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
    assert(data.success && data.token, `Authenticated as ${account.username} (${data.user?.role})`);
    tokens[account.username] = data.token;
    users[account.username] = data.user;
  }

  // 2. Staff Attendance Roster Isolation (No cross-department bleeds)
  console.log('\n--- 2. ATTENDANCE ROSTER ISOLATION (COURSE & SEMESTER FILTERS) ---');
  const filteredRosterRes = await fetch(`${BASE_URL}/api/students?course=B.Tech+CS&semester=4&limit=100`, {
    headers: { Authorization: `Bearer ${tokens.staff}` },
  });
  const filteredRoster = await filteredRosterRes.json();
  assert(filteredRoster.success, 'Fetched scoped B.Tech CS Semester 4 roster');
  assert(filteredRoster.students.length > 0, `Found ${filteredRoster.students.length} students in B.Tech CS Sem 4`);

  const crossBleeds = filteredRoster.students.filter(
    s => (s.course?.code && s.course.code !== 'B.Tech CS' && s.course.name !== 'Bachelor of Technology in Computer Science & Engineering') || s.current_semester !== 4
  );
  assert(crossBleeds.length === 0, `Zero cross-department or cross-semester bleeding in roster (found ${crossBleeds.length})`);

  // 3. Admissions Committee Scrutiny & RBAC Governance
  console.log('\n--- 3. ADMISSIONS COMMITTEE SCRUTINY & RBAC GOVERNANCE ---');
  const admissionsRes = await fetch(`${BASE_URL}/api/admissions`, {
    headers: { Authorization: `Bearer ${tokens.staff}` },
  });
  const admissionsData = await admissionsRes.json();
  assert(admissionsData.success && admissionsData.admissions.length > 0, `Fetched ${admissionsData.admissions.length} admission applications`);

  // Verify real candidate data
  const hasSpam = admissionsData.admissions.some(a => a.first_name === 'Benchmark' || a.first_name === 'Dup');
  assert(!hasSpam, 'All legacy benchmark test applicants sanitized to realistic candidates');

  // Pick a submitted/pending candidate for verification
  const candidate = admissionsData.admissions.find(a => a.admission_status === 'submitted' || a.admission_status === 'pending') || admissionsData.admissions[0];

  // A. Staff verifies documents
  const verifyRes = await fetch(`${BASE_URL}/api/admissions/${candidate.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      status: 'verified',
      remarks: 'Faculty Scrutiny Committee: Class 10 & 12 marksheets verified against official PSEB roll number. Punjab domicile quota validated.',
    }),
  });
  const verifyData = await verifyRes.json();
  assert(verifyData.success, `Staff successfully verified applicant ${candidate.student_id}`);
  assert(verifyData.student?.admission_status === 'verified', `Candidate status updated to 'verified'`);
  assert(
    verifyData.student?.admission_remarks?.includes('Faculty Scrutiny Committee'),
    'Official Scrutiny Committee remarks persisted in database audit log'
  );

  // B. Staff cannot unilaterally admit candidate without fee deposit (HTTP 403)
  const staffAdmitRes = await fetch(`${BASE_URL}/api/admissions/${candidate.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.staff}`,
    },
    body: JSON.stringify({
      status: 'approved',
      remarks: 'Staff attempt to admit without fees',
    }),
  });
  assert(staffAdmitRes.status === 403, `Staff unilateral admission without fee deposit blocked with HTTP ${staffAdmitRes.status}`);

  // C. Admin Provost can sanction admission
  const adminAdmitRes = await fetch(`${BASE_URL}/api/admissions/${candidate.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.admin}`,
    },
    body: JSON.stringify({
      status: 'approved',
      remarks: 'Academic Provost Sanction: Enrolled with portal access credentials.',
    }),
  });
  const adminAdmitData = await adminAdmitRes.json();
  assert(adminAdmitData.success, `Admin Provost successfully sanctioned enrollment for ${candidate.student_id}`);
  assert(adminAdmitData.credentialsSlip?.username, `Generated portal credentials: ${adminAdmitData.credentialsSlip?.username}`);

  // 4. Duplicate Scholarship Submission Prevention (HTTP 409)
  console.log('\n--- 4. SCHOLARSHIP DEDUPLICATION GUARD ---');
  const schemesRes = await fetch(`${BASE_URL}/api/scholarships/schemes`, {
    headers: { Authorization: `Bearer ${tokens.aryan}` },
  });
  const schemesData = await schemesRes.json();
  const scheme = schemesData.schemes?.[0];

  if (scheme) {
    // First submission
    const applyRes1 = await fetch(`${BASE_URL}/api/scholarships/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.aryan}`,
      },
      body: JSON.stringify({
        schemeId: scheme.id,
        annualFamilyIncome: 180000,
        previousGpa: 8.9,
        reasonForApplication: 'Merit-cum-means assistance for academic term books & supplies.',
      }),
    });
    const applyData1 = await applyRes1.json();
    // It might succeed (201) or be 409 if already applied earlier
    if (applyRes1.status === 201) {
      assert(applyData1.success, `First scholarship application submitted successfully for ${scheme.title}`);

      // Second duplicate submission must return HTTP 409 Conflict
      const applyRes2 = await fetch(`${BASE_URL}/api/scholarships/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.aryan}`,
        },
        body: JSON.stringify({
          schemeId: scheme.id,
          annualFamilyIncome: 180000,
          previousGpa: 8.9,
          reasonForApplication: 'Duplicate spam test submission.',
        }),
      });
      assert(applyRes2.status === 409, `Duplicate scholarship application rejected with HTTP ${applyRes2.status} Conflict`);
    } else {
      assert(applyRes1.status === 409, `Active scholarship duplicate guard triggered with HTTP ${applyRes1.status}`);
    }
  }

  // 5. Duplicate Grievance Submission Prevention (HTTP 409)
  console.log('\n--- 5. GRIEVANCE DEDUPLICATION GUARD ---');
  const uniqueSubject = `HVAC Repair Room 302 - Run ${Date.now()}`;

  // First grievance submission
  const grvRes1 = await fetch(`${BASE_URL}/api/grievances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.aryan}`,
    },
    body: JSON.stringify({
      category: 'infrastructure',
      subject: uniqueSubject,
      description: 'Air conditioning thermostat malfunctioning in seminar hall.',
      priority: 'medium',
    }),
  });
  const grvData1 = await grvRes1.json();
  assert(grvData1.success, `Lodged initial grievance ticket (${grvData1.grievance?.tracking_code})`);

  // Immediate duplicate submission for identical subject
  const grvRes2 = await fetch(`${BASE_URL}/api/grievances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.aryan}`,
    },
    body: JSON.stringify({
      category: 'infrastructure',
      subject: uniqueSubject,
      description: 'Duplicate submission check.',
      priority: 'high',
    }),
  });
  assert(grvRes2.status === 409, `Duplicate grievance ticket submission blocked with HTTP ${grvRes2.status} Conflict`);

  console.log('\n======================================================================');
  console.log(`  VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
