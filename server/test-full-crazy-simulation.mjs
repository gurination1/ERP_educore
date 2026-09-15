// EduCore Full Logic Deep Simulation & Role-Power Delegation Auditor
import https from 'https';
import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3333';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'EduCore-DeepSim-Auditor/1.0',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
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

async function runFullCrazySimulation() {
  console.log('======================================================================');
  console.log('  EDUCORE ERP FULL CRAZY LOGIC & POWER-BALANCE STRESS SIMULATION     ');
  console.log('  Target: ' + BASE_URL);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  let loopholesFound = [];

  function assert(condition, testName, flawDetails = '') {
    if (condition) {
      console.log(`  ✅ [PASS]: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL / LOOPHOLE]: ${testName}`);
      if (flawDetails) {
        console.error(`      ⚠️  LOGIC FLAW: ${flawDetails}`);
        loopholesFound.push({ test: testName, flaw: flawDetails });
      }
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // ACT I: THE AUTHENTICATION MATRIX & POWER BALANCE AUDIT
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('ACT I: RBAC POWER BALANCE & ROLE SEPARATION AUDIT');
  console.log('----------------------------------------------------------------------');

  let adminToken = null;
  let staffToken = null;
  let studentToken = null;

  // 1. Admin Login
  const adminLogin = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  });
  assert(adminLogin.status === 200, 'Admin authenticates as Registrar/Provost');
  adminToken = adminLogin.data?.token;

  // 2. Staff Login (Prof. Sunita Rao)
  const staffLogin = await request('POST', '/api/auth/login', {
    username: 'staff@educore.edu',
    password: 'staff123',
    role: 'staff',
  });
  const staffActive = staffLogin.status === 200;
  assert(staffActive, 'Staff/Faculty authenticates (staff@educore.edu / staff123)');
  staffToken = staffLogin.data?.token;

  // 3. Power Delegation Audit: Can Staff process admissions?
  if (staffToken) {
    const staffAdmitAttempt = await request('GET', '/api/admissions', null, staffToken);
    assert(staffAdmitAttempt.status === 200 || staffAdmitAttempt.status === 403,
      'Staff Admission Inspection Attempted',
      staffAdmitAttempt.status === 403
        ? 'POWER BOTTLENECK: Staff/Faculty is blocked from viewing the Admissions queue (HTTP 403). Only Super-Admin can process candidates.'
        : ''
    );

    // Can Staff approve an admission?
    const staffApproveAttempt = await request('PATCH', '/api/admissions/stu-test/status', { status: 'approved' }, staffToken);
    assert(staffApproveAttempt.status === 403,
      'Staff cannot unilaterally approve admission without Admin authority (HTTP 403)',
      staffApproveAttempt.status !== 403 ? 'SECURITY HAZARD: Staff able to approve admissions without Registrar signoff!' : ''
    );

    // Can Staff review scholarships?
    const staffScholarshipAttempt = await request('PATCH', '/api/scholarships/applications/test/review', { status: 'approved' }, staffToken);
    assert(staffScholarshipAttempt.status === 403,
      'Staff cannot unilaterally grant scholarship discounts without Financial Controller signoff (HTTP 403)'
    );
  }

  // --------------------------------------------------------------------------
  // ACT II: END-TO-END PROFESSIONAL ADMISSION WORKFLOW SIMULATION
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('ACT II: END-TO-END ADMISSIONS, SEAT LOCKING & FEE GATING');
  console.log('----------------------------------------------------------------------');

  const ts = Date.now();
  const applicantEmail = `candidate.${ts}@bathinda.edu`;
  const applicantPhone = '98' + String(ts).slice(-8);
  let newStudentId = null;
  let newRollNumber = null;
  let autoUsername = null;
  let autoPassword = null;

  // Step 1: Candidate submits admission application (Web Portal / AI Lead)
  const applyRes = await request('POST', '/api/admissions/submit', {
    firstName: 'Gurkirat',
    lastName: 'Dhillon',
    email: applicantEmail,
    phone: applicantPhone,
    gender: 'male',
    dob: '2005-07-20',
    guardianName: 'S. Sukhdev Singh Dhillon',
    relationship: 'parent',
    guardianPhone: '9872000000',
    courseId: 'crs-btech-cs',
    admissionYear: 2025,
    category: 'General',
    quota: 'punjab_85',
    tenthPercentage: 92.4,
    twelfthPercentage: 89.6,
    boardName: 'PSEB Mohali',
    isHosteller: false,
    isTransportUser: true,
    transportRoute: 'Route 14 - Bathinda to Campus via Goniana',
  });

  assert(applyRes.status === 201, 'Candidate submits formal admission application (HTTP 201)');
  newStudentId = applyRes.data?.student?.id;
  newRollNumber = applyRes.data?.student?.student_id;
  assert(applyRes.data?.student?.admission_status === 'submitted', 'Initial application status is strictly "submitted"');

  // CRITICAL LOGIC CHECK: Is the student allowed to log in as a student BEFORE approval & fee payment?
  const prematureLogin = await request('POST', '/api/auth/login', {
    username: applicantEmail,
    password: 'student123',
    role: 'student',
  });
  assert(prematureLogin.status === 401, 'Unapproved candidate CANNOT log into Student Portal (HTTP 401 Guard Active)');

  // Step 2: Admin / Registrar reviews queue and APPROVES admission
  const approveRes = await request('PATCH', `/api/admissions/${newStudentId}/status`, { status: 'approved' }, adminToken);
  assert(approveRes.status === 200, 'Registrar approves candidate admission application');
  const creds = approveRes.data?.credentialsSlip;
  assert(Boolean(creds), 'System auto-generates official Student Credentials Slip upon approval');
  autoUsername = creds?.username;
  autoPassword = creds?.tempPassword;
  console.log(`      ℹ️  Generated Credentials: Username [${autoUsername}] | TempPassword [${autoPassword}]`);

  // CRITICAL LOOPHOLE CHECK: Did the system grant "approved" admission status BEFORE any fee was collected?
  const feeRecordsBeforePayment = await request('GET', `/api/fees/ledger/${newStudentId}`, null, adminToken);
  const dueAmount = feeRecordsBeforePayment.data?.summary?.totalDue || 0;
  const isPaidBefore = feeRecordsBeforePayment.data?.summary?.totalPaid > 0;
  assert(!isPaidBefore && dueAmount > 0,
    'Fee Demanded: Tuition & Transport fees seeded upon approval, balance pending',
    'CRITICAL BLUNDER: Student was granted full "approved" admission status with ₹0 fees paid! Professional ERPs require "provisionally_admitted" until fee deposit.'
  );

  // Step 3: Candidate logs in with auto-generated credentials
  const candidateLogin = await request('POST', '/api/auth/login', {
    username: autoUsername,
    password: autoPassword,
    role: 'student',
  });
  assert(candidateLogin.status === 200, `Newly admitted student successfully logs in (${autoUsername})`);
  const candidateToken = candidateLogin.data?.token;

  // Step 4: Candidate inspects fee ledger from student portal
  if (candidateToken) {
    const candidateLedger = await request('GET', `/api/fees/ledger/${newStudentId}`, null, candidateToken);
    assert(candidateLedger.status === 200, 'Student views fee ledger with tuition and transport breakdown');
    assert(candidateLedger.data?.summary?.totalDue > 0, `Total Fee Due: ₹${candidateLedger.data?.summary?.totalDue}`);

    // Step 5: Cashier / Payment Gateway collects admission fee
    const paymentRes = await request('POST', '/api/fees/collect', {
      studentId: newStudentId,
      amount: candidateLedger.data?.summary?.totalDue,
      paymentMode: 'online_upi',
      notes: 'Semester 1 Full Admission, Tuition & Bus Transit Fee Settlement',
    }, candidateToken);

    assert(paymentRes.status === 200 || paymentRes.status === 201, 'Student settles full fee balance via payment gateway');
    const receiptNo = paymentRes.data?.receiptNo;
    assert(Boolean(receiptNo), `Official Receipt generated: [${receiptNo}]`);

    // Step 6: Verify receipt details & printable certificate
    const receiptCheck = await request('GET', `/api/fees/receipt/${receiptNo}`, null, candidateToken);
    assert(receiptCheck.status === 200, 'Printable Official Receipt endpoint returns HTTP 200');
    assert(receiptCheck.data?.payment?.amount_paid === candidateLedger.data?.summary?.totalDue, 'Receipt amount perfectly matches collected fee');

    // Step 7: Verify Student is completely removed from Defaulters List
    const defaultersCheck = await request('GET', '/api/fees/defaulters', null, adminToken);
    const inDefaulters = defaultersCheck.data?.defaulters?.find(d => d.id === newStudentId && d.dueAmount > 0);
    assert(!inDefaulters, 'Admitted student is 100% cleared and removed from active Defaulters List');
  }

  // --------------------------------------------------------------------------
  // ACT III: SCHOLARSHIP PIPELINE & FINANCIAL RECONCILIATION
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('ACT III: SCHOLARSHIP PIPELINE & FINANCIAL RECONCILIATION');
  console.log('----------------------------------------------------------------------');

  if (candidateToken) {
    // 1. Student queries active schemes
    const schemesRes = await request('GET', '/api/scholarships/schemes', null, candidateToken);
    assert(schemesRes.status === 200, 'Student retrieves active institutional scholarship schemes');
    const scheme = schemesRes.data?.schemes?.[0];

    if (scheme) {
      // 2. Student applies for scholarship
      const applySchRes = await request('POST', '/api/scholarships/apply', {
        schemeId: scheme.id,
        studentId: newStudentId,
        annualFamilyIncome: 180000,
        previousGpa: 9.2,
        reasonForApplication: 'Punjab State merit rank holder and technical hackathon winner.',
      }, candidateToken);
      assert(applySchRes.status === 201, 'Student submits scholarship application (HTTP 201)');
      const schAppId = applySchRes.data?.application?.id;

      // 3. Admin reviews and approves scholarship
      if (schAppId) {
        const reviewSchRes = await request('PATCH', `/api/scholarships/applications/${schAppId}/review`, {
          status: 'approved',
          remarks: 'Approved under Academic Merit & Need Scheme by Provost Committee.',
        }, adminToken);
        assert(reviewSchRes.status === 200, 'Provost Committee approves scholarship application');

        // CRITICAL LOOPHOLE CHECK: What happened to the fee ledger when scholarship was approved AFTER full payment?
        const ledgerAfterScholarship = await request('GET', `/api/fees/ledger/${newStudentId}`, null, candidateToken);
        console.log(`      ℹ️  Post-Scholarship Summary: Paid ₹${ledgerAfterScholarship.data?.summary?.totalPaid} | Due ₹${ledgerAfterScholarship.data?.summary?.totalDue} | Discount ₹${ledgerAfterScholarship.data?.summary?.totalDiscount}`);
        assert(ledgerAfterScholarship.data?.summary?.totalDiscount > 0,
          'Fee Ledger reflects approved scholarship discount',
          'FINANCIAL BLACK HOLE: Scholarship was approved after student paid in full. The discount was recorded, but no refund or wallet credit was issued!'
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // ACT IV: UGC GRIEVANCE REDRESSAL WORKFLOW
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('ACT IV: UGC GRIEVANCE REDRESSAL LIFECYCLE');
  console.log('----------------------------------------------------------------------');

  if (candidateToken) {
    const grvRes = await request('POST', '/api/grievances', {
      category: 'transport',
      subject: 'Bus Route 14 Delay at Goniana Bus Stop',
      description: 'Morning bus arrived 25 minutes late due to route rescheduling, causing missed first period lectures.',
      priority: 'high',
    }, candidateToken);

    assert(grvRes.status === 201, 'Student lodges Transport Grievance under UGC Redressal');
    const grvTrackingCode = grvRes.data?.trackingCode;
    const grvId = grvRes.data?.grievance?.id;
    console.log(`      ℹ️  Grievance Registered: [${grvTrackingCode}]`);

    // Admin resolves grievance
    const resolveRes = await request('PATCH', `/api/grievances/${grvId}/resolve`, {
      status: 'resolved',
      adminRemarks: 'Transport fleet manager notified. Backup bus #14B assigned to Goniana route for morning schedule.',
    }, adminToken);
    assert(resolveRes.status === 200, 'Transport Officer/Admin resolves grievance with audit remarks');

    // Student verifies resolution
    const studentGrvCheck = await request('GET', `/api/grievances/${grvId}`, null, candidateToken);
    assert(studentGrvCheck.data?.grievance?.status === 'resolved', 'Student sees ticket updated to "resolved" in real-time');
  }

  // --------------------------------------------------------------------------
  // ACT V: AI FUSION AUDIT (ADMISSION PARSER, COPILOT & FEE ADVISORY)
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('ACT V: AI FUSION LOGIC & RESILIENCE AUDIT');
  console.log('----------------------------------------------------------------------');

  // 1. AI Admission Parser
  const messyText = `
    Candidate: Jaspreet Kaur, DOB: 2005-03-14, Phone: 9814002233
    Email: jaspreet.kaur2025@gmail.com
    Father: Balwinder Singh (Contact 9814009988)
    Interested in MBA Financial Management. Scored 88.5% in B.Com Punjabi University Patiala.
    Needs hostel accommodation.
  `;
  const aiParseRes = await request('POST', '/api/ai/parse-admission', { text: messyText });
  assert(aiParseRes.status === 200, 'AI Admission Parser processes unstructured candidate bio');
  assert(aiParseRes.data?.data?.firstName === 'Jaspreet', `AI extracted first name: ${aiParseRes.data?.data?.firstName}`);
  assert(aiParseRes.data?.data?.courseId === 'crs-mba-fin', `AI matched degree program to ERP course: ${aiParseRes.data?.data?.courseName}`);

  // 2. AI Copilot (Student Context)
  if (candidateToken) {
    const copilotStudent = await request('POST', '/api/ai/copilot', {
      query: 'What is my current fee status and bus transport route?',
    }, candidateToken);
    assert(copilotStudent.status === 200, 'AI Copilot provides personalized student guidance based on live DB snapshot');
  }

  // --------------------------------------------------------------------------
  // FINAL VERDICT & LOOPHOLE RECAP
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`FULL CRAZY SIMULATION METRICS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`TOTAL LOGIC LOOPHOLES DETECTED: ${loopholesFound.length}`);
  console.log('======================================================================\n');

  if (loopholesFound.length > 0) {
    console.log('CRITICAL LOGIC LOOPHOLES IDENTIFIED:');
    loopholesFound.forEach((l, idx) => {
      console.log(`  [${idx + 1}] In "${l.test}":\n      ${l.flaw}\n`);
    });
  }
}

runFullCrazySimulation().catch(err => {
  console.error('Fatal simulation crash:', err);
});
