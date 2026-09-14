import http from 'http';
import https from 'https';

function makeRequest(baseUrl, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
      family: 4, // enforce IPv4
      timeout: 15000,
    };

    const req = client.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw), raw });
        } catch {
          resolve({ status: res.statusCode, data: null, raw });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request to ${url.href} timed out`));
    });

    req.on('error', (err) => reject(err));

    if (postData) req.write(postData);
    req.end();
  });
}

async function auditTarget(targetUrl) {
  console.log(`\n======================================================================`);
  console.log(` AUDITING TARGET: ${targetUrl}`);
  console.log(`======================================================================\n`);

  let checks = 0;
  let passed = 0;
  let failed = 0;
  const assertions = [];

  function assert(condition, testId, testDesc, meta = '') {
    checks++;
    const status = condition ? 'PASS' : 'FAIL';
    if (condition) {
      passed++;
      console.log(`  [PASS] [${testId}] ${testDesc} ${meta ? `(${meta})` : ''}`);
    } else {
      failed++;
      console.error(`  [FAIL] [${testId}] ${testDesc} ${meta ? `(${meta})` : ''}`);
    }
    assertions.push({ testId, testDesc, status, meta });
  }

  const req = (method, path, body = null, token = null) =>
    makeRequest(targetUrl, method, path, body, token);

  const timestamp = Date.now();
  const runId = timestamp.toString().slice(-6);

  // -------------------------------------------------------------
  // TASK 1: Authenticate Bursar & Student 001
  // -------------------------------------------------------------
  console.log('--- TASK 1: AUTHENTICATION ---');
  const bursarAuthRes = await req('POST', '/api/auth/login', {
    username: 'bursar@educore.edu',
    password: '123456',
  });
  assert(
    bursarAuthRes.status === 200 && Boolean(bursarAuthRes.data?.token),
    'T1.1',
    'Bursar authentication returns 200 with JWT',
    `status: ${bursarAuthRes.status}`
  );
  assert(
    bursarAuthRes.data?.user?.role === 'admin',
    'T1.2',
    'Bursar account has role "admin"',
    `role: ${bursarAuthRes.data?.user?.role}`
  );
  const bursarToken = bursarAuthRes.data?.token;

  const stuAuthRes = await req('POST', '/api/auth/login', {
    username: 'stu001@educore.edu',
    password: '123456',
  });
  assert(
    stuAuthRes.status === 200 && Boolean(stuAuthRes.data?.token),
    'T1.3',
    'Student 001 authentication returns 200 with JWT',
    `status: ${stuAuthRes.status}`
  );
  assert(
    stuAuthRes.data?.user?.role === 'student' &&
      (stuAuthRes.data?.student?.student_id === 'STU-2025-001' ||
        stuAuthRes.data?.user?.email === 'stu001@educore.edu'),
    'T1.4',
    'Student 001 identity verified',
    `student_id: ${stuAuthRes.data?.student?.student_id}`
  );
  const studentToken = stuAuthRes.data?.token;

  // -------------------------------------------------------------
  // TASK 2: Submit and approve fresh student
  // -------------------------------------------------------------
  console.log('\n--- TASK 2: SUBMIT AND APPROVE FRESH STUDENT ---');
  const freshCandidate = {
    firstName: `Audit_${runId}`,
    lastName: 'TestStudent',
    dob: '2005-04-12',
    gender: 'female',
    email: `audit.stu.${runId}@educore.edu`,
    phone: `+91 971${runId}22`,
    guardianName: 'Guardian Test',
    relationship: 'parent',
    guardianPhone: `+91 971${runId}33`,
    courseId: 'crs-btech-cse',
    admissionYear: 2025,
  };

  const admSubmitRes = await req('POST', '/api/admissions/submit', freshCandidate);
  assert(
    admSubmitRes.status === 201 && Boolean(admSubmitRes.data?.student?.id),
    'T2.1',
    'Fresh student admission submitted (HTTP 201)',
    `studentId: ${admSubmitRes.data?.student?.student_id}`
  );
  const freshStudent = admSubmitRes.data?.student;
  assert(
    freshStudent?.admission_status === 'submitted',
    'T2.2',
    'Initial admission status is "submitted"'
  );

  // Verify candidate not in defaulters before approval
  const defPreApproval = await req('GET', '/api/fees/defaulters', null, bursarToken);
  const foundInDefPre = defPreApproval.data?.defaulters?.find((d) => d.id === freshStudent?.id);
  assert(
    !foundInDefPre,
    'T2.3',
    'Candidate excluded from defaulters list prior to approval'
  );

  // Approve candidate using Bursar token
  const admApproveRes = await req(
    'PATCH',
    `/api/admissions/${freshStudent?.id}/status`,
    { status: 'approved' },
    bursarToken
  );
  assert(
    admApproveRes.status === 200 && admApproveRes.data?.student?.admission_status === 'approved',
    'T2.4',
    'Bursar approves fresh student admission (status: approved)'
  );

  // Verify fee ledger created
  const ledgerRes = await req('GET', `/api/fees/ledger/${freshStudent?.id}`, null, bursarToken);
  const initialDue = ledgerRes.data?.summary?.totalDue || 0;
  assert(
    ledgerRes.status === 200 && initialDue > 0,
    'T2.5',
    'Fresh student ledger initialized with tuition fee due',
    `initialDue: ₹${initialDue}`
  );

  // Verify candidate appears on defaulters with initial tuition due
  const defPostApproval = await req('GET', '/api/fees/defaulters', null, bursarToken);
  const foundInDefPost = defPostApproval.data?.defaulters?.find((d) => d.id === freshStudent?.id);
  assert(
    Boolean(foundInDefPost) && foundInDefPost.dueAmount === initialDue,
    'T2.6',
    'Approved student appears on defaulters list with exact initial due',
    `dueAmount: ₹${foundInDefPost?.dueAmount}`
  );

  // -------------------------------------------------------------
  // TASK 3: Execute partial payment (₹30,000)
  // -------------------------------------------------------------
  console.log('\n--- TASK 3: PARTIAL PAYMENT (₹30,000) ---');
  const partialAmount = 30000;
  const expectedRemaining = initialDue - partialAmount;

  const partPayRes = await req(
    'POST',
    '/api/fees/collect',
    {
      studentId: freshStudent.id,
      amount: partialAmount,
      paymentMode: 'online_upi',
      notes: 'Installment 1 - Partial Payment',
    },
    bursarToken
  );

  assert(
    partPayRes.status === 201 && Boolean(partPayRes.data?.payment?.id),
    'T3.1',
    'Partial payment transaction recorded (HTTP 201)',
    `paymentId: ${partPayRes.data?.payment?.id}`
  );

  // 3a. Verify remainingDue is calculated accurately
  assert(
    partPayRes.data?.remainingDue === expectedRemaining,
    'T3.2',
    'Remaining due accurately calculated in collect response',
    `expected: ₹${expectedRemaining}, got: ₹${partPayRes.data?.remainingDue}`
  );

  const partialPayment = partPayRes.data?.payment;
  const partialReceiptNo = partPayRes.data?.receiptNo || partialPayment?.receipt_no;
  const partialPaymentId = partialPayment?.id;
  const partialTxnRef = partialPayment?.transaction_reference;

  // 3b. Verify student appears on /api/fees/defaulters with exact remaining due balance
  const defAfterPartial = await req('GET', '/api/fees/defaulters', null, bursarToken);
  const partialDefaulterEntry = defAfterPartial.data?.defaulters?.find((d) => d.id === freshStudent.id);
  assert(
    Boolean(partialDefaulterEntry) && partialDefaulterEntry.dueAmount === expectedRemaining,
    'T3.3',
    'Student appears on defaulters with exact remaining due balance',
    `dueAmount: ₹${partialDefaulterEntry?.dueAmount}`
  );
  assert(
    partialDefaulterEntry?.status === 'PARTIAL' || partialDefaulterEntry?.status === 'DUE',
    'T3.4',
    'Defaulter badge/status reflects partial balance',
    `status: ${partialDefaulterEntry?.status}`
  );

  // -------------------------------------------------------------
  // TASK 4: Execute final payment for remaining balance
  // -------------------------------------------------------------
  console.log('\n--- TASK 4: FINAL PAYMENT FOR REMAINING BALANCE ---');
  const finalPayRes = await req(
    'POST',
    '/api/fees/collect',
    {
      studentId: freshStudent.id,
      amount: expectedRemaining,
      paymentMode: 'net_banking',
      notes: 'Installment 2 - Final Settlement',
    },
    bursarToken
  );

  assert(
    finalPayRes.status === 201,
    'T4.1',
    'Final settlement payment recorded (HTTP 201)',
    `paid: ₹${expectedRemaining}`
  );

  // 4a. Verify remainingDue drops to 0
  assert(
    finalPayRes.data?.remainingDue === 0,
    'T4.2',
    'remainingDue in payment response drops to 0',
    `remainingDue: ${finalPayRes.data?.remainingDue}`
  );

  const ledgerAfterFinal = await req('GET', `/api/fees/ledger/${freshStudent.id}`, null, bursarToken);
  assert(
    ledgerAfterFinal.data?.summary?.totalDue === 0 &&
      ledgerAfterFinal.data?.summary?.totalPaid === initialDue,
    'T4.3',
    'Student ledger reflects totalDue = 0 and full tuition paid',
    `totalPaid: ₹${ledgerAfterFinal.data?.summary?.totalPaid}`
  );

  // 4b. Verify student automatically drops off /api/fees/defaulters
  const defAfterFinal = await req('GET', '/api/fees/defaulters', null, bursarToken);
  const clearedDefaulter = defAfterFinal.data?.defaulters?.find(
    (d) => d.id === freshStudent.id && d.dueAmount > 0
  );
  assert(
    !clearedDefaulter,
    'T4.4',
    'Student automatically drops off defaulters list upon zero balance'
  );

  // -------------------------------------------------------------
  // TASK 5: Test multi-head fee billing
  // -------------------------------------------------------------
  console.log('\n--- TASK 5: MULTI-HEAD FEE BILLING ---');
  const hostelFeeAmount = 45000;

  // 5a. Assign Hostel fee (₹45,000) via POST /api/fees/assign
  const assignRes = await req(
    'POST',
    '/api/fees/assign',
    {
      studentId: freshStudent.id,
      feeHeadId: 'fh-hostel',
      amount: hostelFeeAmount,
      dueDate: '2025-12-31',
    },
    bursarToken
  );

  assert(
    assignRes.status === 201 &&
      assignRes.data?.studentFee?.fee_head_id === 'fh-hostel' &&
      assignRes.data?.studentFee?.amount === hostelFeeAmount,
    'T5.1',
    'Hostel fee head (₹45,000) assigned via POST /api/fees/assign',
    `status: ${assignRes.status}, feeHead: ${assignRes.data?.studentFee?.fee_head_id}`
  );

  // 5b. Verify student re-enters /api/fees/defaulters with ₹45,000 due
  const defAfterHostel = await req('GET', '/api/fees/defaulters', null, bursarToken);
  const hostelDefaulterEntry = defAfterHostel.data?.defaulters?.find((d) => d.id === freshStudent.id);
  assert(
    Boolean(hostelDefaulterEntry) && hostelDefaulterEntry.dueAmount === hostelFeeAmount,
    'T5.2',
    'Student re-enters defaulters list with exact ₹45,000 due',
    `found: ${Boolean(hostelDefaulterEntry)}, dueAmount: ₹${hostelDefaulterEntry?.dueAmount}`
  );

  // -------------------------------------------------------------
  // TASK 6: Test receipt query idempotency
  // -------------------------------------------------------------
  console.log('\n--- TASK 6: RECEIPT QUERY IDEMPOTENCY ---');

  // 6a. Lookup by receipt_no (/api/fees/receipt/:receiptNo)
  const recByNo = await req('GET', `/api/fees/receipt/${partialReceiptNo}`, null, bursarToken);
  assert(
    recByNo.status === 200 &&
      recByNo.data?.receipt?.receiptNo === partialReceiptNo &&
      recByNo.data?.receipt?.amount === partialAmount,
    'T6.1',
    'Lookup by receipt_no (/api/fees/receipt/:receiptNo) returns valid receipt',
    `receiptNo: ${recByNo.data?.receipt?.receiptNo}`
  );

  // 6b. Lookup by payment_id (/api/fees/receipt/:paymentId)
  const recById = await req('GET', `/api/fees/receipt/${partialPaymentId}`, null, bursarToken);
  assert(
    recById.status === 200 &&
      recById.data?.receipt?.receiptNo === partialReceiptNo &&
      recById.data?.receipt?.amount === partialAmount,
    'T6.2',
    'Lookup by payment_id (/api/fees/receipt/:paymentId) returns matching receipt',
    `paymentId: ${recById.data?.payment?.id}`
  );

  // 6c. Lookup by txn_ref (/api/fees/receipt/:txnRef) - test encoded and direct
  const recByTxnEncoded = await req(
    'GET',
    `/api/fees/receipt/${encodeURIComponent(partialTxnRef)}`,
    null,
    bursarToken
  );
  assert(
    recByTxnEncoded.status === 200 &&
      recByTxnEncoded.data?.receipt?.receiptNo === partialReceiptNo &&
      recByTxnEncoded.data?.receipt?.transactionRef === partialTxnRef,
    'T6.3',
    'Lookup by encoded txn_ref returns matching receipt',
    `txnRef: ${recByTxnEncoded.data?.receipt?.transactionRef}`
  );

  const recByTxnDirect = await req(
    'GET',
    `/api/fees/receipt/${partialTxnRef}`,
    null,
    bursarToken
  );
  assert(
    recByTxnDirect.status === 200 &&
      recByTxnDirect.data?.receipt?.receiptNo === partialReceiptNo,
    'T6.4',
    'Lookup by direct raw txn_ref with slashes returns matching receipt'
  );

  // 6d. Assert Idempotency across queries
  const isIdempotent =
    recByNo.data?.receipt?.receiptNo === recById.data?.receipt?.receiptNo &&
    recById.data?.receipt?.receiptNo === recByTxnEncoded.data?.receipt?.receiptNo &&
    recByNo.data?.receipt?.amount === recById.data?.receipt?.amount &&
    recById.data?.receipt?.amount === recByTxnEncoded.data?.receipt?.amount &&
    recByNo.data?.receipt?.studentId === recById.data?.receipt?.studentId;

  assert(
    isIdempotent,
    'T6.5',
    'Idempotency confirmed: receipt data identical across receiptNo, paymentId, and txnRef queries',
    `receipt: ${partialReceiptNo}, amount: ₹${partialAmount}`
  );

  console.log(`\n----------------------------------------------------------------------`);
  console.log(` TARGET SUMMARY: ${targetUrl}`);
  console.log(` Total Checks: ${checks} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`----------------------------------------------------------------------\n`);

  return { targetUrl, checks, passed, failed, assertions };
}

async function main() {
  const targets = [
    'http://127.0.0.1:3000',
    'https://addressing-plc-passing-celebration.trycloudflare.com',
  ];

  const results = [];
  for (const t of targets) {
    try {
      const res = await auditTarget(t);
      results.push(res);
    } catch (err) {
      console.error(`Error auditing target ${t}:`, err);
      results.push({ targetUrl: t, checks: 0, passed: 0, failed: 1, error: err.message });
    }
  }

  console.log('\n======================================================================');
  console.log('                 FINAL COMPREHENSIVE AUDIT REPORT                     ');
  console.log('======================================================================');
  for (const r of results) {
    console.log(`Endpoint: ${r.targetUrl} -> Checks: ${r.checks}, Passed: ${r.passed}, Failed: ${r.failed}`);
  }
}

main().catch(console.error);
