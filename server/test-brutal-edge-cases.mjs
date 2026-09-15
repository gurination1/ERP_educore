// Brutal Adversarial Edge Case & Security Fence Tester for EduCore ERP
import https from 'https';
import http from 'http';

const BASE_URL = process.env.TEST_URL || 'https://educore-erp-production.up.railway.app';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'EduCore-Brutal-Auditor/1.0',
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

async function runBrutalEdgeCases() {
  console.log('======================================================================');
  console.log('  EDUCORE BRUTAL ADVERSARIAL EDGE-CASE & SECURITY AUDIT               ');
  console.log('  Target: ' + BASE_URL);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail = '') {
    if (condition) {
      console.log(`  ✅ [PASS]: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL]: ${name}`);
      if (detail) console.error(`      ⚠️ Detail: ${detail}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 1: AUTHENTICATION ADVERSARIAL CASES
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: AUTHENTICATION & TOKEN FENCES ---');

  // 1. Wrong password
  const badLogin = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'wrongpassword123',
    role: 'admin'
  });
  assert(badLogin.status === 401, 'Wrong password correctly rejected with HTTP 401');

  // 2. Non-existent user
  const ghostLogin = await request('POST', '/api/auth/login', {
    username: 'ghost_non_existent@educore.edu',
    password: 'password123',
  });
  assert(ghostLogin.status === 401, 'Ghost user rejected with HTTP 401');

  // 3. Forged reset token
  const forgedReset = await request('POST', '/api/auth/reset-password', {
    email: 'aryan@educore.edu',
    newPassword: 'hackedPassword123',
    resetToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bogus_signature_here'
  });
  assert(forgedReset.status === 403, 'Forged JWT reset token rejected with HTTP 403');

  // 4. Mismatched email in reset token
  // First get a valid token for aryan
  const forgotRes = await request('POST', '/api/auth/forgot-password', { email: 'aryan@educore.edu' });
  const aryanResetToken = forgotRes.data?.resetToken;
  if (aryanResetToken) {
    const hijackedReset = await request('POST', '/api/auth/reset-password', {
      email: 'admin@educore.edu', // trying to reset admin using aryan's token
      newPassword: 'hackedPassword123',
      resetToken: aryanResetToken
    });
    assert(hijackedReset.status === 403, 'Mismatched email vs reset token rejected with HTTP 403');
  }

  // Get tokens for remaining tests
  const adminRes = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123', role: 'admin' });
  const staffRes = await request('POST', '/api/auth/login', { username: 'staff@educore.edu', password: 'staff123', role: 'staff' });
  const aryanRes = await request('POST', '/api/auth/login', { username: 'aryan', password: 'student123', role: 'student' });
  const rohanRes = await request('POST', '/api/auth/login', { username: 'rohan', password: 'student123', role: 'student' });

  const adminToken = adminRes.data?.token;
  const staffToken = staffRes.data?.token;
  const aryanToken = aryanRes.data?.token;
  const rohanToken = rohanRes.data?.token;

  assert(Boolean(adminToken && staffToken && aryanToken && rohanToken), 'Acquired test tokens for admin, staff, aryan, and rohan');

  // --------------------------------------------------------------------------
  // TEST SECTION 2: ADMISSIONS MUTUAL EXCLUSIVITY & FEE-GATED STAFF ADMIT
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: ADMISSION GUARDS & FEE GATING ---');

  const ts = Date.now();

  // 1. Hostel + Transport simultaneously selected -> Violation
  const illegalApply = await request('POST', '/api/admissions/submit', {
    firstName: 'Cheater',
    lastName: 'Candidate',
    email: `cheater.${ts}@educore.edu`,
    phone: '99' + String(ts).slice(-8),
    gender: 'male',
    isHosteller: true,
    isTransportUser: true, // MUTUAL EXCLUSIVITY VIOLATION
  });
  assert(illegalApply.status === 400, 'Mutual Exclusivity Guard blocks candidate selecting Hostel + Transport (HTTP 400)');

  // 2. Legitimate application
  const validApply = await request('POST', '/api/admissions/submit', {
    firstName: 'Amritpal',
    lastName: 'Sidhu',
    email: `amritpal.${ts}@bathinda.edu`,
    phone: '97' + String(ts).slice(-8),
    gender: 'male',
    courseId: 'crs-btech-cs',
    isHosteller: false,
    isTransportUser: true,
    transportRoute: 'Route 7 - Mansa to Bathinda Campus',
  });
  assert(validApply.status === 201, 'Valid admission application submitted (HTTP 201)');
  const amritpalId = validApply.data?.student?.id;

  // 3. Duplicate email submission -> Blocked
  const dupEmail = await request('POST', '/api/admissions/submit', {
    firstName: 'Duplicate',
    lastName: 'Candidate',
    email: `amritpal.${ts}@bathinda.edu`,
    phone: '96' + String(ts).slice(-8),
  });
  assert(dupEmail.status === 400, 'Duplicate email candidate registration rejected (HTTP 400)');

  // 4. Staff tries to finalize admission BEFORE any fee is paid -> Blocked with 403!
  if (amritpalId) {
    const prematureStaffAdmit = await request('PATCH', `/api/admissions/${amritpalId}/status`, {
      status: 'approved'
    }, staffToken);
    assert(prematureStaffAdmit.status === 403,
      'Staff cannot finalize admission before fee payment (HTTP 403 Guard Active)',
      `Actual status: ${prematureStaffAdmit.status}`
    );

    // 5. Staff CAN verify applicant documents
    const staffVerify = await request('PATCH', `/api/admissions/${amritpalId}/status`, {
      status: 'verified'
    }, staffToken);
    assert(staffVerify.status === 200, 'Staff verifies candidate documentation (status -> verified)');

    // 6. Admin locks seat and approves fee demand
    const adminDemand = await request('PATCH', `/api/admissions/${amritpalId}/status`, {
      status: 'approved'
    }, adminToken);
    assert(adminDemand.status === 200, 'Registrar signs candidate fee demand');

    // 7. Student/Cashier deposits fee
    const ledgerCheck = await request('GET', `/api/fees/ledger/${amritpalId}`, null, adminToken);
    const dueAmt = ledgerCheck.data?.summary?.totalDue;
    const feeDeposit = await request('POST', '/api/fees/collect', {
      studentId: amritpalId,
      amount: dueAmt,
      paymentMode: 'net_banking',
      notes: 'Full fee deposit verified by Bank Branch'
    }, staffToken); // staff can collect fee
    assert(feeDeposit.status === 200, 'Staff fee collection & cashier deposit succeeded');

    // 8. NOW Staff member CAN finalize enrollment because fee deposit is paid!
    const staffFinalEnroll = await request('PATCH', `/api/admissions/${amritpalId}/status`, {
      status: 'approved'
    }, staffToken);
    assert(staffFinalEnroll.status === 200, 'Staff member successfully finalizes candidate admission after fee submission (HTTP 200)');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 3: FEE LEDGER RBAC SCOPING & SECURITY
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: FEE LEDGER RBAC SCOPING ---');

  // 1. Negative amount fee collection attempt
  const negFee = await request('POST', '/api/fees/collect', {
    studentId: amritpalId,
    amount: -5000,
    paymentMode: 'cash'
  }, adminToken);
  assert(negFee.status === 400, 'Negative fee collection rejected by Zod schema (HTTP 400)');

  // 2. Zero amount fee collection attempt
  const zeroFee = await request('POST', '/api/fees/collect', {
    studentId: amritpalId,
    amount: 0,
    paymentMode: 'cash'
  }, adminToken);
  assert(zeroFee.status === 400, 'Zero amount fee collection rejected (HTTP 400)');

  // 3. Cross-student fee payment attempt: Aryan tries to submit payment for Rohan
  const crossPay = await request('POST', '/api/fees/collect', {
    studentId: 'STU-008', // Rohan's ID
    amount: 1000,
    paymentMode: 'online_upi'
  }, aryanToken);
  assert(crossPay.status === 403, 'Cross-account fee submission blocked by RBAC fence (HTTP 403)');

  // 4. Cross-student ledger view attempt: Aryan tries to view Rohan's ledger
  const crossLedger = await request('GET', '/api/fees/ledger/STU-008', null, aryanToken);
  assert(crossLedger.status === 403, 'Cross-student fee ledger inspection blocked by RBAC fence (HTTP 403)');

  // 5. Non-existent receipt lookup
  const ghostReceipt = await request('GET', '/api/fees/receipt/REC-9999-FAKE-NO', null, adminToken);
  assert(ghostReceipt.status === 404, 'Non-existent receipt query returns HTTP 404');

  // --------------------------------------------------------------------------
  // TEST SECTION 4: DYNAMIC FORMS DUPLICATE DEFENSE
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 4: DYNAMIC FORM SUBMISSION & DUPLICATE DEFENSE ---');

  const formsRes = await request('GET', '/api/forms', null, aryanToken);
  const form = formsRes.data?.forms?.[0];
  if (form) {
    // 1. Incomplete submission (missing mandatory fields)
    const badForm = await request('POST', `/api/forms/${form.id}/submit`, {
      responses: {} // completely empty
    }, aryanToken);
    assert(badForm.status === 422 || badForm.status === 409, 'Incomplete form submission rejected with validation error (HTTP 422) or already submitted');
  }

  // --------------------------------------------------------------------------
  // RECAP & FINAL VERDICT
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`BRUTAL EDGE-CASE AUDIT METRICS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');
}

runBrutalEdgeCases().catch(err => {
  console.error('Fatal Edge-Case Audit Crash:', err);
});
