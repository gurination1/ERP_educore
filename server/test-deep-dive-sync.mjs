// EduCore Full-Spectrum Bidirectional Sync & Real-Time Deep Dive Audit
import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);

    const headers = { 'Content-Type': 'application/json' };
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runDeepSyncAudit() {
  console.log('======================================================================');
  console.log('      EduCore ERP — Deep-Dive Student <-> Admin Real-Time Sync       ');
  console.log('======================================================================\n');

  let checks = 0;
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    checks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  // --------------------------------------------------------------------------
  // Step 1: Authentication & Dual-Portal Handshake
  // --------------------------------------------------------------------------
  console.log('--- STEP 1: AUTHENTICATION & SESSION TOKENS ---');
  const adminLogin = await request('POST', '/api/auth/login', {
    username: 'admin@educore.edu',
    password: '123456',
  });
  assert(adminLogin.status === 200, 'Admin authenticates with portal credentials');
  assert(adminLogin.data.user?.role === 'admin', 'Admin token has role "admin"');
  const adminToken = adminLogin.data.token;

  const bursarLogin = await request('POST', '/api/auth/login', {
    username: 'bursar@educore.edu',
    password: '123456',
  });
  assert(bursarLogin.status === 200, 'Bursar (CFO) authenticates with portal credentials');
  assert(bursarLogin.data.user?.role === 'admin', 'Bursar token has role "admin"');
  const bursarToken = bursarLogin.data.token;

  const studentLogin = await request('POST', '/api/auth/login', {
    username: 'stu001@educore.edu',
    password: '123456',
  });
  assert(studentLogin.status === 200, 'Student 001 authenticates with portal credentials');
  assert(studentLogin.data.user?.role === 'student', 'Student token has role "student"');
  const studentToken = studentLogin.data.token;
  const studentDbId = studentLogin.data.student?.id || 'stu-rec-001';

  // --------------------------------------------------------------------------
  // Step 2: Live Admission -> Admin Approval -> Fee Auto-Creation Sync
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 2: ADMISSION APPLICATION & ENROLLMENT SYNC ---');
  const candidateEmail = `deepdive.candidate.${timestamp}@test.edu`;
  const candidateApp = {
    firstName: 'Raghav',
    lastName: 'Singhania',
    dob: '2005-08-20',
    gender: 'male',
    email: candidateEmail,
    phone: '+91 987' + String(timestamp).slice(-7),
    guardianName: 'Vikram Singhania',
    relationship: 'parent',
    guardianPhone: '+91 98765 11200',
    courseId: 'crs-btech-ai',
    admissionYear: 2025,
  };

  const applyRes = await request('POST', '/api/admissions/submit', candidateApp);
  assert(applyRes.status === 201, 'Student submits online admission form', `status ${applyRes.status}`);
  const newStudent = applyRes.data.student;
  assert(Boolean(newStudent?.id), `Student record created with ID ${newStudent?.student_id}`);
  assert(newStudent?.admission_status === 'submitted', 'Initial admission status is "submitted"');

  // Admin verifies queue
  const adminAdmRes = await request('GET', '/api/admissions?status=submitted', null, adminToken);
  const candidateInQueue = adminAdmRes.data.admissions?.find(a => a.id === newStudent.id);
  assert(Boolean(candidateInQueue), 'Admin sees candidate in submitted queue');

  // Admin approves candidate
  const approveRes = await request('PATCH', `/api/admissions/${newStudent.id}/status`, { status: 'approved' }, adminToken);
  assert(approveRes.status === 200, 'Admin approves admission application');
  assert(approveRes.data.student?.admission_status === 'approved', 'Student admission status updated to "approved"');

  // Fee ledger auto-seeded check
  const studentLedgerRes = await request('GET', `/api/fees/ledger/${newStudent.id}`, null, adminToken);
  assert(studentLedgerRes.status === 200, 'Student fee ledger automatically seeded upon approval');
  const tuitionDue = studentLedgerRes.data.summary?.totalDue || 0;
  assert(tuitionDue > 0, `Tuition fee generated for Semester 1 (Due: ₹${tuitionDue})`);

  // --------------------------------------------------------------------------
  // Step 3: Defaulter Tracking -> Fee Payment -> Receipt -> Real-Time Clearance
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3: DEFAULTER TRACKING & REAL-TIME CLEARANCE SYNC ---');

  // 1. Candidate must appear in Defaulters list before paying
  const defaultersBefore = await request('GET', '/api/fees/defaulters', null, bursarToken);
  const foundInDefaulters = defaultersBefore.data.defaulters?.find(d => d.id === newStudent.id);
  assert(Boolean(foundInDefaulters), `Candidate ${newStudent.student_id} tracked on live Defaulters List`);

  // 2. Initial KPI collections
  const kpiBefore = await request('GET', '/api/fees/kpi', null, bursarToken);
  const initialCollection = kpiBefore.data.kpi?.totalCollectedRaw || 0;

  // 3. Payment collection (Student pays full fee)
  const payRes = await request('POST', '/api/fees/collect', {
    studentId: newStudent.id,
    amount: tuitionDue,
    paymentMode: 'online_upi',
    notes: 'Semester 1 Admission Tuition Payment',
  }, adminToken);
  assert(payRes.status === 201, 'Student completes online fee payment transaction');
  const receiptNo = payRes.data.receiptNo;
  assert(Boolean(receiptNo), `Verifiable Receipt generated: ${receiptNo}`);

  // 4. Receipt details verification
  const receiptRes = await request('GET', `/api/fees/receipt/${receiptNo}`, null, adminToken);
  assert(receiptRes.status === 200, 'Receipt details endpoint returns 200 OK');
  assert(receiptRes.data.receipt?.receiptNo === receiptNo, 'Receipt metadata matches payment receipt number');
  assert(receiptRes.data.receipt?.amount === tuitionDue, `Receipt amount matches paid tuition: ₹${tuitionDue}`);

  // 5. Student ledger immediately reflects ₹0 due
  const ledgerAfter = await request('GET', `/api/fees/ledger/${newStudent.id}`, null, adminToken);
  assert(ledgerAfter.data.summary?.totalDue === 0, 'Student ledger due balance zeroed (₹0 Due)');
  assert(ledgerAfter.data.summary?.totalPaid === tuitionDue, `Student ledger paid balance updated to ₹${tuitionDue}`);

  // 6. Admin KPI collections incremented
  const kpiAfter = await request('GET', '/api/fees/kpi', null, bursarToken);
  const updatedCollection = kpiAfter.data.kpi?.totalCollectedRaw || 0;
  assert(updatedCollection === initialCollection + tuitionDue, `Admin KPI collection increased by exact paid amount (₹${initialCollection} -> ₹${updatedCollection})`);

  // 7. Defaulters screen immediately clears the student
  const defaultersAfter = await request('GET', '/api/fees/defaulters', null, bursarToken);
  const stillInDefaulters = defaultersAfter.data.defaulters?.find(d => d.id === newStudent.id && d.dueAmount > 0);
  assert(!stillInDefaulters, `Candidate ${newStudent.student_id} auto-removed from active Defaulters List`);

  // --------------------------------------------------------------------------
  // Step 4: Scholarships Application -> Admin Approval -> Student Sync
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4: SCHOLARSHIPS PIPELINE & ADJUDICATION SYNC ---');
  const schemesRes = await request('GET', '/api/scholarships/schemes', null, studentToken);
  assert(schemesRes.status === 200 && schemesRes.data.schemes?.length > 0, 'Student retrieves active scholarship schemes');
  const activeScheme = schemesRes.data.schemes[0];

  const schApplyRes = await request('POST', '/api/scholarships/apply', {
    schemeId: activeScheme.id,
    studentId: studentDbId,
    annualFamilyIncome: 250000,
    previousGpa: 9.4,
    reasonForApplication: 'Merit-based excellence in computer architecture research.',
  }, studentToken);
  assert(schApplyRes.status === 201, 'Student submits scholarship application (HTTP 201)');
  const scholarshipAppId = schApplyRes.data.application?.id;

  // Admin reviews scholarship queue
  const adminSchRes = await request('GET', '/api/scholarships/applications', null, bursarToken);
  const appInQueue = adminSchRes.data.applications?.find(a => a.id === scholarshipAppId);
  assert(Boolean(appInQueue), `Admin receives scholarship submission in queue (ID: ${scholarshipAppId})`);

  // Admin approves scholarship
  const reviewRes = await request('PATCH', `/api/scholarships/applications/${scholarshipAppId}/review`, {
    status: 'approved',
    remarks: 'Approved by Institutional Financial Aid Committee.',
  }, bursarToken);
  assert(reviewRes.status === 200, 'Admin approves scholarship application');

  // Student checks own application
  const studentCheckSch = await request('GET', `/api/scholarships/applications?studentId=${studentDbId}`, null, studentToken);
  const approvedSch = studentCheckSch.data.applications?.find(a => a.id === scholarshipAppId);
  assert(approvedSch?.status === 'approved', 'Student portal immediately reflects "approved" scholarship status');

  // --------------------------------------------------------------------------
  // Step 5: Dynamic Forms Builder -> Response Submission -> Real-Time Sync
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5: DYNAMIC FORM BUILDER & SUBMISSION SYNC ---');
  const newFormRes = await request('POST', '/api/forms', {
    title: `Elective Course & Lab Preference Form - ${timestamp}`,
    description: 'Semester 4 Elective selection and cloud virtualization lab batch scheduling.',
    schema_json: [
      { name: 'elective_1', label: 'Primary Elective', type: 'select', required: true, options: ['Quantum Computing', 'Distributed Databases', 'Applied Cryptography'] },
      { name: 'lab_timing', label: 'Preferred Lab Slot', type: 'radio', required: true, options: ['Morning 9-11 AM', 'Afternoon 2-4 PM', 'Evening 5-7 PM'] },
    ],
  }, adminToken);
  assert(newFormRes.status === 201, 'Admin designs and publishes dynamic form schema');
  const formId = newFormRes.data.form?.id;

  // Student portal discovers form
  const studentForms = await request('GET', '/api/forms', null, studentToken);
  const discoveredForm = studentForms.data.forms?.find(f => f.id === formId);
  assert(Boolean(discoveredForm), `Student immediately discovers published form: "${discoveredForm?.title}"`);

  // Student submits response
  const subRes = await request('POST', `/api/forms/${formId}/submit`, {
    responses: {
      elective_1: 'Quantum Computing',
      lab_timing: 'Morning 9-11 AM',
    },
  }, studentToken);
  assert(subRes.status === 201, 'Student submits dynamic form response (HTTP 201)');

  // Admin retrieves submissions
  const adminSubsRes = await request('GET', `/api/forms/${formId}/submissions`, null, adminToken);
  assert(adminSubsRes.status === 200, 'Admin retrieves form response records');
  const foundSubmission = adminSubsRes.data.submissions?.find(s => s.form_id === formId);
  assert(Boolean(foundSubmission), 'Admin portal displays student submission in real-time');

  // --------------------------------------------------------------------------
  // Step 6: Institutional Notices Broadcast Sync
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 6: INSTITUTIONAL NOTICES BROADCAST SYNC ---');
  const noticeTitle = `Urgent Circular: Semester End Assessment & Convocation ${timestamp}`;
  const noticePostRes = await request('POST', '/api/notices', {
    title: noticeTitle,
    summary: 'Detailed seating plans and registration deadlines released.',
    content: 'All candidates must complete final course reviews and fee settlement prior to admit card download.',
    category: 'Examination',
    is_pinned: 1,
  }, adminToken);
  assert(noticePostRes.status === 201, 'Admin broadcasts campus-wide urgent notice');

  const studentNoticesRes = await request('GET', '/api/notices', null, studentToken);
  assert(studentNoticesRes.status === 200, 'Student portal fetches notices feed');
  const noticeFound = studentNoticesRes.data.notices?.find(n => n.title === noticeTitle);
  assert(Boolean(noticeFound), 'Student portal receives newly published notice in real-time');

  // --------------------------------------------------------------------------
  // Step 7: RBAC Isolation & Zero Data Leakage Defense
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 7: RBAC ISOLATION & ZERO DATA LEAKAGE ---');
  const rbacDefaulters = await request('GET', '/api/fees/defaulters', null, studentToken);
  assert(rbacDefaulters.status === 403, 'RBAC Fence: Student blocked from Admin Defaulters registry (HTTP 403)');

  const rbacAdmissionStatus = await request('PATCH', `/api/admissions/${newStudent.id}/status`, { status: 'rejected' }, studentToken);
  assert(rbacAdmissionStatus.status === 403, 'RBAC Fence: Student blocked from modifying admission statuses (HTTP 403)');

  const rbacPeerLedger = await request('GET', '/api/fees/ledger/stu-rec-002', null, studentToken);
  assert(rbacPeerLedger.status === 403, 'Data Privacy: Student blocked from viewing peer student fee ledger (HTTP 403)');

  // --------------------------------------------------------------------------
  // Step 8: Gemini AI Copilot Role-Aware Segregation
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 8: GEMINI AI COPILOT ROLE SEGREGATION ---');
  // Student query: personal status
  const studentCopilot = await request('POST', '/api/ai/copilot', {
    query: 'What is my current semester fee and attendance status?',
  }, studentToken);
  assert(studentCopilot.status === 200, 'AI Student Advisor answers personal student query');
  assert(studentCopilot.data.result?.answer?.length > 30, 'Student Copilot returns personalized advisory');

  // Admin query: executive campus summary
  const adminCopilot = await request('POST', '/api/ai/copilot', {
    query: 'Give me a brief breakdown of overall revenue collections and active admissions.',
  }, adminToken);
  assert(adminCopilot.status === 200, 'AI Campus Copilot answers executive administrative query');
  assert(adminCopilot.data.result?.insights?.length > 0, 'Admin Copilot provides strategic actionable insights');

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`DEEP SYNC AUDIT: ${passed} PASSED, ${failed} FAILED (Total: ${checks} Checks)`);
  console.log('======================================================================');

  if (failed === 0) {
    console.log('🎯 VERDICT: ALL FUNCTIONS 100% SYNCHRONIZED ACROSS STUDENT & ADMIN PORTALS.\n');
  } else {
    console.error(`⚠️ Found ${failed} discrepancies during deep sync audit.\n`);
    process.exit(1);
  }
}

runDeepSyncAudit().catch(err => {
  console.error('Fatal Deep Sync Audit Error:', err);
  process.exit(1);
});
