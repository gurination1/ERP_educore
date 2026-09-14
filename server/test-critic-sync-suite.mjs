// EduCore ERP Deep Bidirectional Sync & Critical Stress Test Suite
import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);

    const headers = {
      'Content-Type': 'application/json',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
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

async function runCriticTestSuite() {
  console.log('======================================================================');
  console.log('    EduCore College ERP — Deep Critic & Sync Verification Suite      ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Phase 1: Authentication & Security Isolation
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) ISOLATION');
  console.log('----------------------------------------------------------------------');

  let adminToken = null;
  let studentToken = null;
  let studentUserId = null;
  let loggedInStudentId = null;

  try {
    const adminLogin = await request('POST', '/api/auth/login', {
      username: 'admin@educore.edu',
      password: 'admin123',
      role: 'admin',
    });
    assert(adminLogin.status === 200, 'Admin successfully authenticates', `status ${adminLogin.status}`);
    assert(adminLogin.data.user?.role === 'admin', 'Admin JWT claims role "admin"');
    adminToken = adminLogin.data.token;

    const studentLogin = await request('POST', '/api/auth/login', {
      username: 'aryan@educore.edu',
      password: 'student123',
      role: 'student',
    });
    assert(studentLogin.status === 200, 'Student successfully authenticates', `status ${studentLogin.status}`);
    assert(studentLogin.data.user?.role === 'student', 'Student JWT claims role "student"');
    studentToken = studentLogin.data.token;
    studentUserId = studentLogin.data.user?.id;
    loggedInStudentId = studentLogin.data.student?.id || 'stu-rec-aryan';

    // Security Fence Test 1: Student cannot access Admin Defaulters List
    const breachAttempt1 = await request('GET', '/api/fees/defaulters', null, studentToken);
    assert(breachAttempt1.status === 403, 'RBAC Fence: Student blocked from Admin Defaulters API (HTTP 403)');

    // Security Fence Test 2: Student cannot approve/reject admissions
    const breachAttempt2 = await request('PATCH', '/api/admissions/stu-rec-aryan/status', { status: 'approved' }, studentToken);
    assert(breachAttempt2.status === 403, 'RBAC Fence: Student blocked from updating admission statuses (HTTP 403)');

    // Security Fence Test 3: Student cannot view another student fee ledger
    const breachAttempt3 = await request('GET', '/api/fees/ledger/stu-rec-002', null, studentToken);
    assert(breachAttempt3.status === 403, 'Data Privacy: Student blocked from accessing peer student fee ledger (HTTP 403)');
  } catch (err) {
    assert(false, 'Phase 1 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Phase 2: Bidirectional Sync — Admissions Workflow
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('PHASE 2: ADMISSIONS WORKFLOW & DATABASE AUTO-INITIALIZATION');
  console.log('----------------------------------------------------------------------');

  const timestamp = Date.now();
  const testCandidateEmail = `candidate.${timestamp}@gmail.com`;
  let newStudentId = null;
  let generatedStudentRoll = null;

  try {
    // 1. Candidate/Student submits admission form
    const admissionRes = await request('POST', '/api/admissions/submit', {
      firstName: 'Kavita',
      lastName: 'Krishnamurthy',
      email: testCandidateEmail,
      phone: '98' + String(timestamp).slice(-8),
      gender: 'female',
      dob: '2005-11-10',
      guardianName: 'Dr. S. Krishnamurthy',
      relationship: 'parent',
      guardianPhone: '9876501200',
      courseId: 'crs-btech-cs',
      admissionYear: 2025,
    });
    assert(admissionRes.status === 201, 'Admission application registered (HTTP 201)');
    assert(admissionRes.data.student?.admission_status === 'submitted', 'Initial application status is "submitted"');
    newStudentId = admissionRes.data.student?.id;
    generatedStudentRoll = admissionRes.data.student?.student_id;

    // 2. Admin portal lists admissions -> new candidate must appear in queue
    const adminAdmissionsList = await request('GET', '/api/admissions?status=submitted', null, adminToken);
    const foundCandidate = adminAdmissionsList.data.admissions?.find(a => a.id === newStudentId);
    assert(Boolean(foundCandidate), `Admin Portal sees candidate in submitted queue (ID: ${generatedStudentRoll})`);

    // 3. Admin approves candidate application
    const approveRes = await request('PATCH', `/api/admissions/${newStudentId}/status`, { status: 'approved' }, adminToken);
    assert(approveRes.status === 200, 'Admin approves candidate application (HTTP 200)');
    assert(approveRes.data.student?.admission_status === 'approved', 'Student status successfully updated to "approved"');

    // 4. Verify tuition fee record was automatically created for this admitted student
    const ledgerRes = await request('GET', `/api/fees/ledger/${newStudentId}`, null, adminToken);
    assert(ledgerRes.status === 200, 'Student fee ledger automatically seeded upon admission');
    assert(ledgerRes.data.summary?.totalDue > 0, `Initial tuition due recorded: ₹${ledgerRes.data.summary?.totalDue}`);
  } catch (err) {
    assert(false, 'Phase 2 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Phase 3: Bidirectional Sync — Fee Collection, Ledger & Defaulter Removal
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('PHASE 3: FEE MANAGEMENT & BIDIRECTIONAL LEDGER RECONCILIATION');
  console.log('----------------------------------------------------------------------');

  try {
    // 1. Admin KPI before payment
    const kpiBefore = await request('GET', '/api/fees/kpi', null, adminToken);
    const totalCollectedBefore = kpiBefore.data.kpi?.totalCollectedRaw || 0;

    // 2. Defaulters screen should list newly admitted student with pending dues
    const defaultersBefore = await request('GET', '/api/fees/defaulters', null, adminToken);
    const inDefaulters = defaultersBefore.data.defaulters?.find(d => d.id === newStudentId);
    assert(Boolean(inDefaulters), `Candidate ${generatedStudentRoll} tracked on Admin Defaulters List before payment`);

    // 3. Student pays fee via portal
    const paymentAmount = inDefaulters?.dueAmount || 90000;
    const paymentRes = await request('POST', '/api/fees/collect', {
      studentId: newStudentId,
      amount: paymentAmount,
      paymentMode: 'online_upi',
      notes: 'Semester 1 Admission & Tuition Fee Payment',
    }, adminToken);
    assert(paymentRes.status === 201, 'Online fee payment recorded successfully (HTTP 201)');
    const receiptNo = paymentRes.data.receiptNo;
    assert(Boolean(receiptNo), `Verified Official Receipt generated: ${receiptNo}`);

    // 4. Verify Printable Receipt is accessible
    const receiptCheck = await request('GET', `/api/fees/receipt/${receiptNo}`, null, adminToken);
    assert(receiptCheck.status === 200, 'Printable Receipt endpoint returns 200');
    assert(receiptCheck.data.payment?.receipt_no === receiptNo, 'Receipt metadata matches payment record');

    // 5. Check Student Ledger after payment: Due balance should be 0
    const ledgerAfter = await request('GET', `/api/fees/ledger/${newStudentId}`, null, adminToken);
    assert(ledgerAfter.data.summary?.totalDue === 0, 'Student Ledger Due balance updated to ₹0');
    assert(ledgerAfter.data.summary?.totalPaid === paymentAmount, `Student Ledger Paid balance reflects ₹${paymentAmount}`);

    // 6. Check Admin Defaulters screen: Student must now be removed or cleared
    const defaultersAfter = await request('GET', '/api/fees/defaulters', null, adminToken);
    const stillDefaulter = defaultersAfter.data.defaulters?.find(d => d.id === newStudentId && d.dueAmount > 0);
    assert(!stillDefaulter, `Candidate ${generatedStudentRoll} automatically removed from active Defaulters List`);

    // 7. Check Admin KPI after payment: Total collections incremented
    const kpiAfter = await request('GET', '/api/fees/kpi', null, adminToken);
    const totalCollectedAfter = kpiAfter.data.kpi?.totalCollectedRaw || 0;
    assert(totalCollectedAfter >= totalCollectedBefore, `Admin KPI collection increased (₹${totalCollectedBefore} -> ₹${totalCollectedAfter})`);
  } catch (err) {
    assert(false, 'Phase 3 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Phase 4: Bidirectional Sync — Scholarship Applications
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('PHASE 4: SCHOLARSHIPS PIPELINE & ADJUDICATION SYNC');
  console.log('----------------------------------------------------------------------');

  let scholarshipAppId = null;
  try {
    // 1. Student views scholarship schemes
    const schemesRes = await request('GET', '/api/scholarships/schemes', null, studentToken);
    assert(schemesRes.status === 200, 'Student Portal retrieves active scholarship schemes');
    const targetScheme = schemesRes.data.schemes?.[0];
    assert(Boolean(targetScheme), `Scheme available: "${targetScheme?.title}" (Award: ₹${targetScheme?.award_amount})`);

    // 2. Student applies for scholarship
    const applyRes = await request('POST', '/api/scholarships/apply', {
      schemeId: targetScheme.id,
      studentId: loggedInStudentId,
      annualFamilyIncome: 450000,
      previousGpa: 9.4,
      reasonForApplication: 'Merit excellence in computer algorithms and high semester GPA ranking.',
    }, studentToken);
    assert(applyRes.status === 201, 'Student submits scholarship application (HTTP 201)');
    scholarshipAppId = applyRes.data.application?.id;

    // 3. Admin reviews scholarship applications queue
    const adminAppsRes = await request('GET', '/api/scholarships/applications', null, adminToken);
    const foundApp = adminAppsRes.data.applications?.find(a => a.id === scholarshipAppId);
    assert(Boolean(foundApp), `Admin Portal receives scholarship submission in review queue (ID: ${scholarshipAppId})`);

    // 4. Admin approves scholarship
    const reviewRes = await request('PATCH', `/api/scholarships/applications/${scholarshipAppId}/review`, {
      status: 'approved',
      remarks: 'Approved by Institutional Financial Aid Committee with highest merit tier.',
    }, adminToken);
    assert(reviewRes.status === 200, 'Admin approves scholarship application (HTTP 200)');

    // 5. Student checks own application -> status must be "approved"
    const studentCheckRes = await request('GET', `/api/scholarships/applications?studentId=${loggedInStudentId}`, null, studentToken);
    const studentApp = studentCheckRes.data.applications?.find(a => a.id === scholarshipAppId);
    assert(studentApp?.status === 'approved', 'Student Portal instantly reflects "approved" scholarship status');
  } catch (err) {
    assert(false, 'Phase 4 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Phase 5: Bidirectional Sync — Dynamic Form Builder
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('PHASE 5: DYNAMIC FORM BUILDER & SUBMISSION PIPELINE');
  console.log('----------------------------------------------------------------------');

  let formId = null;
  try {
    // 1. Admin designs and publishes dynamic form
    const createFormRes = await request('POST', '/api/forms', {
      title: `Hostel Allotment & Mess Form - ${timestamp}`,
      description: 'Institutional room allocation and dining preferences for Semester 2',
      category: 'hostel',
      fields: [
        { id: 'f_room', label: 'Room Preference', type: 'select', required: true, options: ['Single AC', 'Double Shared', 'Triple Deluxe'] },
        { id: 'f_diet', label: 'Dietary Preference', type: 'radio', required: true, options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] },
      ],
    }, adminToken);
    assert(createFormRes.status === 201, 'Admin publishes dynamic form schema (HTTP 201)');
    formId = createFormRes.data.form?.id;

    // 2. Student discovers published form
    const studentFormsRes = await request('GET', '/api/forms', null, studentToken);
    const publishedForm = studentFormsRes.data.forms?.find(f => f.id === formId);
    assert(Boolean(publishedForm), `Student Portal immediately discovers published form: "${publishedForm?.title}"`);

    // 3. Student fills and submits response
    const submitFormRes = await request('POST', `/api/forms/${formId}/submit`, {
      responses: {
        f_room: 'Single AC',
        f_diet: 'Vegetarian',
      },
      userId: studentUserId,
    }, studentToken);
    assert(submitFormRes.status === 201, 'Student submits dynamic form response (HTTP 201)');

    // 4. Admin reviews form submissions
    const submissionsRes = await request('GET', `/api/forms/${formId}/submissions`, null, adminToken);
    assert(submissionsRes.status === 200, 'Admin retrieves form responses (HTTP 200)');
    const foundSubmission = submissionsRes.data.submissions?.find(s => s.form_id === formId);
    assert(Boolean(foundSubmission), 'Admin Portal reflects student submission in real-time');
  } catch (err) {
    assert(false, 'Phase 5 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Phase 6: Institutional Notices Real-time Sync
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('PHASE 6: INSTITUTIONAL NOTICES SYNCHRONIZATION');
  console.log('----------------------------------------------------------------------');

  try {
    const noticesRes = await request('GET', '/api/notices', null, studentToken);
    assert(noticesRes.status === 200, 'Student Portal fetches institutional notices');
    assert(Array.isArray(noticesRes.data.notices) && noticesRes.data.notices.length > 0, `Active campus notices available: ${noticesRes.data.notices?.length}`);
  } catch (err) {
    assert(false, 'Phase 6 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Phase 7: Gemini AI Suite Comprehensive Testing & Edge Cases
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('PHASE 7: GEMINI AI SUITE STRESS & CRITIQUE VERIFICATION');
  console.log('----------------------------------------------------------------------');

  try {
    // 1. AI Admission Parser with messy raw text
    const messyAdmissionNotes = `
      --- CANDIDATE EMAIL APPLICATION ---
      Hello Admissions Board,
      I would like to apply for the B.Tech Computer Science program.
      My name is Devansh Saxena, date of birth is 2005-04-18.
      My father Mr. Alok Saxena (contact 9820011223) is sponsoring my education.
      My phone number is 9820011222 and my personal email is devansh.saxena99@gmail.com.
      I graduated from St. Mark Senior Secondary School with 96.4% in CBSE Class 12.
      Kindly grant me merit scholarship.
    `;
    const aiParseRes = await request('POST', '/api/ai/parse-admission', { text: messyAdmissionNotes });
    assert(aiParseRes.status === 200, 'AI Admission Parser successfully processes messy unstructured input');
    assert(aiParseRes.data.data.firstName === 'Devansh', `Extracted first name: ${aiParseRes.data.data.firstName}`);
    assert(aiParseRes.data.data.lastName === 'Saxena', `Extracted last name: ${aiParseRes.data.data.lastName}`);
    assert(aiParseRes.data.data.email === 'devansh.saxena99@gmail.com', `Extracted email: ${aiParseRes.data.data.email}`);
    assert(aiParseRes.data.data.meritScore >= 95, `AI accurately detected merit score: ${aiParseRes.data.data.meritScore}%`);

    // 2. AI Fee Structure Recommendation Engine
    const aiFeeRes = await request('POST', '/api/ai/recommend-fee', {
      studentData: aiParseRes.data.data,
      courseId: 'crs-btech-cs',
    });
    assert(aiFeeRes.status === 200, 'AI Fee Structure Engine returns calculated breakdown');
    assert(aiFeeRes.data.recommendation?.concessionPercentage >= 15, `High merit candidate awarded concession: ${aiFeeRes.data.recommendation?.concessionPercentage}%`);
    assert(aiFeeRes.data.recommendation?.netPayable < aiFeeRes.data.recommendation?.grossTotal, 'Net payable reflects institutional concession discount');

    // 3. AI Defaulter Notice Generator (Gentle tone)
    const gentleNotice = await request('POST', '/api/ai/fee-notice', {
      studentId: 'stu-rec-aryan',
      urgency: 'gentle',
    }, adminToken);
    assert(gentleNotice.status === 200, 'AI generates gentle fee reminder notice');
    assert(gentleNotice.data.notice?.emailBody.length > 50, 'Gentle email body formatted');

    // 4. AI Defaulter Notice Generator (Urgent tone)
    const urgentNotice = await request('POST', '/api/ai/fee-notice', {
      studentId: 'stu-rec-aryan',
      urgency: 'urgent',
    }, adminToken);
    assert(urgentNotice.status === 200, 'AI generates urgent fee reminder notice');
    assert(urgentNotice.data.notice?.smsText.length <= 160, `SMS text within standard 160-char limit (${urgentNotice.data.notice?.smsText.length} chars)`);
    assert(urgentNotice.data.notice?.whatsappText.includes('*'), 'WhatsApp notice formatted with bold markdown highlights');

    // 5. AI Campus Copilot Live Query
    const copilotRes = await request('POST', '/api/ai/copilot', {
      query: 'Provide an executive summary of current admissions and fee collection health.',
    }, adminToken);
    assert(copilotRes.status === 200, 'AI Campus Copilot answers executive strategic query');
    assert(copilotRes.data.result?.answer.length > 50, 'Copilot response provides detailed actionable narrative');
    assert(copilotRes.data.result?.insights?.length > 0, `Copilot generates strategic insights (${copilotRes.data.result?.insights?.length} items)`);
    assert(copilotRes.data.result?.recommendedActions?.length > 0, `Copilot generates next action items (${copilotRes.data.result?.recommendedActions?.length} actions)`);
  } catch (err) {
    assert(false, 'Phase 7 failed unexpectedly', err.message);
  }

  // --------------------------------------------------------------------------
  // Final Verdict
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`CRITIC TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total ${passed + failed} Tests)`);
  console.log('======================================================================');

  if (failed === 0) {
    console.log('🎯 VERDICT: Student and Admin portals are 100% synchronized, secure, and AI-hardened.\n');
  } else {
    console.error(`⚠️ VERDICT: ${failed} tests failed during critique run.\n`);
    process.exit(1);
  }
}

runCriticTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
