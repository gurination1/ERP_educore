import { spawn } from 'child_process';

const TEST_PORT = 3016;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${TEST_PORT}`;

const ROLE_CREDENTIALS = {
  super_admin: { username: '9001-01-03-01', password: 'super123' },
  admin: { username: '4001-01-03-01', password: 'admin123' },
  staff: { username: '2001-14-03-01', password: 'staff123' },
  hod: { username: '3001-01-03-01', password: 'hod123' },
  counselor: { username: '6001-02-03-01', password: 'counselor123' },
  accounts: { username: '5001-05-03-01', password: 'accounts123' },
  student: { username: '1001-88-03-01', password: 'student123' },
  partner: { username: '7001-01-03-01', password: 'partner123' },
  hr: { username: '8001-01-03-01', password: 'hr123' },
};

const tokenCache = {};

async function rawRequest(path, method = 'GET', headers = {}, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.text();
  const resHeaders = {};
  res.headers.forEach((v, k) => { resHeaders[k] = v; });
  return { status: res.status, data, headers: resHeaders };
}

async function getTokenForRole(role) {
  if (tokenCache[role]) return tokenCache[role];
  const creds = ROLE_CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role ${role}`);

  const res = await rawRequest('/api/auth/login', 'POST', {}, creds);
  if (res.status !== 200) {
    throw new Error(`Failed to login as ${role} (${creds.username}): status ${res.status} - ${res.data}`);
  }
  const json = JSON.parse(res.data);
  tokenCache[role] = json.token;
  return json.token;
}

async function reqRole(path, role, method = 'GET', body = null) {
  const token = await getTokenForRole(role);
  return rawRequest(path, method, { 'Authorization': `Bearer ${token}` }, body);
}

let totalPassed = 0;
let totalFailed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ [PASS]: ${msg}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL]: ${msg}`);
    totalFailed++;
  }
}

async function run() {
  console.log('======================================================================');
  console.log('🚀 EduCore ERP End-to-End Connected Data Lifecycle Probe');
  console.log('Target URL:', BASE_URL);
  console.log('======================================================================\n');

  let server = null;
  if (!process.env.BASE_URL) {
    let ready = false;
    try {
      const h = await fetch(`${BASE_URL}/api/health`);
      if (h.ok) ready = true;
    } catch {}

    if (!ready) {
      console.log('Spawning test server on port', TEST_PORT);
      server = spawn('node', ['dist/server.cjs'], {
        env: { ...process.env, PORT: String(TEST_PORT) },
        stdio: 'inherit',
      });

      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 800));
        try {
          const res = await fetch(`${BASE_URL}/api/health`);
          if (res.ok) {
            ready = true;
            console.log('Local server ready on port', TEST_PORT);
            break;
          }
        } catch {}
      }
      if (!ready) {
        throw new Error('Server failed to start within timeout on port ' + TEST_PORT);
      }
    }
  }

  try {
    const timestamp = Date.now();
    const phoneSuffix = Math.floor(100000 + Math.random() * 900000);
    const candidatePhone = `9888${phoneSuffix}`;
    const candidateEmail = `probe.scholar.${timestamp}@bfgi.edu.in`;

    // -------------------------------------------------------------------------
    // CHAIN 1: CRM Lead -> Telephony -> Admin Intake -> User Provision -> Fee Ledger
    // -------------------------------------------------------------------------
    console.log('\n--- CHAIN 1: CRM Lead -> Telephony Interaction -> Intake -> Student User & Ledger ---');
    
    // 1.1 Counselor creates lead
    const enqRes = await reqRole('/api/enquiries', 'counselor', 'POST', {
      student_name: `Gurdharam Singh Probe ${timestamp}`,
      mobile: `+91 ${candidatePhone}`,
      email: candidateEmail,
      selected_course: 'B.Tech CS',
      father_name: 'Gurmail Singh',
      gender: 'male',
      course_fee: 90000,
      admission_probability: 80,
    });
    assert(enqRes.status === 201, `Counselor creates pre-admission enquiry (Status ${enqRes.status})`);
    const enqJson = JSON.parse(enqRes.data);
    const enquiryId = enqJson.enquiry?.id;
    assert(Boolean(enquiryId), `Enquiry successfully generated with ID ${enquiryId}`);

    // 1.2 Counselor logs telephony call interaction
    const interRes = await reqRole(`/api/enquiries/${enquiryId}/interactions`, 'counselor', 'POST', {
      stage_name: 'Telephony Counseling Session',
      remarks: 'Candidate counseling complete. Ready for admissions intake verification.',
      call_status: 'Call Connected',
      probability_updated: 90,
    });
    assert(interRes.status === 201, `Counselor logs telephony interaction on enquiry (Status ${interRes.status})`);

    // 1.3 Admin executes admission intake
    const intakeRes = await reqRole('/api/admissions/admin-admit', 'admin', 'POST', {
      firstName: 'Gurdharam',
      lastName: `Probe${timestamp.toString().slice(-4)}`,
      email: candidateEmail,
      phone: candidatePhone,
      dob: '2005-04-12',
      gender: 'male',
      guardianName: 'Gurmail Singh',
      guardianRelation: 'Father',
      guardianPhone: '9888112233',
      courseId: 'crs-btech-cs',
      currentSemester: 1,
      admissionYear: 2026,
      category: 'general',
      quota: 'merit',
      tenthPercentage: 89,
      twelfthPercentage: 86,
      boardName: 'PSEB',
      isHosteller: false,
      isTransportUser: true,
      transportRoute: 'Route 1 - Bathinda City',
    });
    if (intakeRes.status !== 200 && intakeRes.status !== 201) {
      console.error('Admin intake error response:', intakeRes.data);
    }
    assert(intakeRes.status === 200 || intakeRes.status === 201, `Admin approves candidate intake (Status ${intakeRes.status})`);
    const intakeJson = JSON.parse(intakeRes.data);
    const createdStudent = intakeJson.student;
    assert(Boolean(createdStudent?.student_id), `Admitted student generated with ID: ${createdStudent?.student_id}`);

    // 1.4 Student User Account direct login verification
    const currentYear = new Date().getFullYear();
    const studentLoginRes = await rawRequest('/api/auth/login', 'POST', {}, {
      username: createdStudent.student_id,
      password: `Punjab@${currentYear}`,
    });
    assert(studentLoginRes.status === 200, `Newly admitted student successfully logs in with generated credentials (Status ${studentLoginRes.status})`);
    const studentAuthJson = JSON.parse(studentLoginRes.data);
    const newStudentToken = studentAuthJson.token;
    assert(studentAuthJson.user?.role === 'student', `Authenticated user has verified 'student' role`);

    // 1.5 Student fee ledger verification
    const studentLedgerRes = await rawRequest(`/api/fees/ledger/me`, 'GET', { 'Authorization': `Bearer ${newStudentToken}` });
    assert(studentLedgerRes.status === 200, `Student fetches personal fee ledger (Status ${studentLedgerRes.status})`);
    const ledgerJson = JSON.parse(studentLedgerRes.data);
    const feeRecords = ledgerJson.ledger || ledgerJson.fees || [];
    const dueAmount = ledgerJson.summary?.totalDue ?? ledgerJson.totalDue ?? 0;
    assert(Array.isArray(feeRecords) && feeRecords.length >= 2, `Student ledger contains generated tuition and statutory fee records (${feeRecords.length} items)`);
    assert(dueAmount > 0, `Student ledger accurately reports outstanding tuition dues: ₹${dueAmount}`);

    // -------------------------------------------------------------------------
    // CHAIN 2: Student Fee Payment -> Accounts Ledger -> Admin Revenue KPI
    // -------------------------------------------------------------------------
    console.log('\n--- CHAIN 2: Student Fee Payment -> Accounts Ledger -> Admin Revenue KPI ---');

    // 2.1 Verify Payment Gateway Sandbox whitelist
    const gwRes = await reqRole('/api/finance/payment-gateways/active', 'student');
    assert(gwRes.status === 200, `Student accesses active payment gateway endpoint (Status ${gwRes.status})`);
    const gwJson = JSON.parse(gwRes.data);
    assert(gwJson.can_pay === true, `Student payment gateway clearance active (can_pay === true)`);

    // 2.2 Check Admin initial Fee KPI
    const initialKpiRes = await reqRole('/api/fees/kpi', 'admin');
    assert(initialKpiRes.status === 200, `Admin fetches baseline fee KPI summary`);
    const initialKpi = JSON.parse(initialKpiRes.data).kpi;
    const initialCollected = Number(initialKpi.totalCollectedRaw) || 0;

    // Ensure student has outstanding dues to pay
    const studentLedgerCheck = await reqRole('/api/fees/ledger/me', 'student');
    const ledgerCheckData = JSON.parse(studentLedgerCheck.data);
    const existingDue = Number(ledgerCheckData.summary?.totalDue) || 0;
    if (existingDue < 1000) {
      const assignRes = await reqRole('/api/fees/assign', 'admin', 'POST', {
        studentId: '1001-88-03-01',
        feeHeadId: 'fh-tuition',
        amount: 1000,
        dueDate: '2026-12-31',
        semester: 4,
      });
      if (assignRes.status !== 200 && assignRes.status !== 201) {
        console.error('Fee assignment failure payload:', assignRes.data);
      }
    }

    // 2.3 Student executes fee payment
    const paymentAmount = 1000;
    const payRes = await reqRole('/api/fees/collect', 'student', 'POST', {
      studentId: 'me',
      amount: paymentAmount,
      paymentMode: 'online_upi',
      notes: `Automated lifecycle probe fee collection ${timestamp}`,
    });
    if (payRes.status !== 200 && payRes.status !== 201) {
      console.error('Fee payment failure payload:', payRes.data);
    }
    assert(payRes.status === 201 || payRes.status === 200, `Student submits fee payment via UPI (Status ${payRes.status})`);
    const payJson = JSON.parse(payRes.data);
    const receiptNo = payJson.receiptNo || payJson.payment?.receipt_no;
    assert(Boolean(receiptNo), `Institutional fee receipt generated: ${receiptNo}`);

    // 2.4 Accounts role verifies receipt in central ledger
    const receiptRes = await reqRole(`/api/fees/receipt/${receiptNo}`, 'accounts');
    assert(receiptRes.status === 200, `Accounts officer accesses fee receipt ${receiptNo} (Status ${receiptRes.status})`);
    const receiptData = JSON.parse(receiptRes.data);
    assert(receiptData.success === true && Number(receiptData.payment?.amount_paid) === paymentAmount, `Receipt matches payment transaction amount ₹${paymentAmount}`);

    // 2.5 Admin KPI reflects updated revenue collection
    const updatedKpiRes = await reqRole('/api/fees/kpi', 'admin');
    const updatedKpi = JSON.parse(updatedKpiRes.data).kpi;
    const updatedCollected = Number(updatedKpi.totalCollectedRaw) || 0;
    assert(updatedCollected >= initialCollected + paymentAmount, `Admin KPI reflects collected revenue (Initial: ₹${initialCollected} -> Updated: ₹${updatedCollected})`);

    // -------------------------------------------------------------------------
    // CHAIN 3: Faculty Attendance -> 75% Gate -> Admit Card Block/Release -> HOD Condonation
    // -------------------------------------------------------------------------
    console.log('\n--- CHAIN 3: Faculty Attendance -> 75% Gate -> Admit Card Block/Release -> HOD Condonation ---');

    // 3.1 Faculty sets student attendance below 75% cutoff (70%) and resets condonation
    const attShortageRes = await reqRole('/api/students/1001-88-03-01/attendance', 'staff', 'PATCH', {
      attendancePercentage: 70,
      attendedClasses: 70,
      totalClasses: 100,
      condonation_granted: false,
    });
    assert(attShortageRes.status === 200, `Faculty records student attendance shortage at 70% (<75%) (Status ${attShortageRes.status})`);

    // Ensure fee dues are cleared for test student so gate tests pure attendance ordinance
    await reqRole('/api/exam/clear-fee-dues', 'accounts', 'POST', { studentId: '1001-88-03-01' });

    // 3.2 Student checks admit card - must be WITHHELD due to attendance shortage
    const admitBlockedRes = await reqRole('/api/exam/admit-card/1001-88-03-01', 'student');
    assert(admitBlockedRes.status === 200, `Student fetches admit card status (Status ${admitBlockedRes.status})`);
    const admitBlockedJson = JSON.parse(admitBlockedRes.data);
    assert(admitBlockedJson.status === 'WITHHELD' && admitBlockedJson.isEligible === false, `Admit Card gate is WITHHELD (isEligible === false) due to 70% attendance shortage`);
    assert(admitBlockedJson.holdReasons?.some(r => r.includes('Attendance Shortage')), `Admit card explicitly reports attendance hold reason: "${admitBlockedJson.holdReasons?.join(', ')}"`);

    // 3.3 HOD grants attendance condonation under MRSPTU Ordinance 7.4
    const condoneRes = await reqRole('/api/students/1001-88-03-01/condone-attendance', 'hod', 'POST', {
      orderNo: `MRSPTU-COND-PROBE-${timestamp}`,
      reason: 'Authorized under University Ordinance 7.4 for National Hackathon Participation',
    });
    assert(condoneRes.status === 200, `HOD executes statutory attendance condonation (Status ${condoneRes.status})`);

    // 3.4 Student checks admit card again - must now be RELEASED
    const admitReleasedRes = await reqRole('/api/exam/admit-card/1001-88-03-01', 'student');
    const admitReleasedJson = JSON.parse(admitReleasedRes.data);
    assert(admitReleasedJson.status === 'RELEASED' && admitReleasedJson.isEligible === true, `Admit Card gate unblocked and RELEASED after HOD condonation (isEligible === true)`);
    assert(admitReleasedJson.admitCard?.schedule?.length > 0, `Admit Card schedule populated with ${admitReleasedJson.admitCard?.schedule?.length} university examinations`);

    // Cleanup: Restore standard student attendance to 88%
    await reqRole('/api/students/1001-88-03-01/attendance', 'staff', 'PATCH', {
      attendancePercentage: 88,
      attendedClasses: 88,
      totalClasses: 100,
    });

    // -------------------------------------------------------------------------
    // CHAIN 4: Student Grievance -> HOD Resolution -> Student Verification
    // -------------------------------------------------------------------------
    console.log('\n--- CHAIN 4: Student Grievance -> HOD Adjudication -> Student Verification ---');

    // 4.1 Student lodges grievance under UGC SGRC rules
    const grvRes = await reqRole('/api/grievances', 'student', 'POST', {
      category: 'academic',
      subject: `Probe UGC Grievance Ticket ${timestamp}`,
      description: 'Formal request for laboratory equipment calibration in Computing Lab 3.',
      priority: 'high',
    });
    assert(grvRes.status === 201, `Student submits grievance ticket (Status ${grvRes.status})`);
    const grvJson = JSON.parse(grvRes.data);
    const grvId = grvJson.grievance?.id;
    const trackingCode = grvJson.trackingCode;
    assert(Boolean(grvId && trackingCode), `Grievance registered with tracking code ${trackingCode} (ID: ${grvId})`);

    // 4.2 HOD reviews and resolves grievance
    const resolveRemarks = `Investigated by Department Grievance Committee. Calibration completed on ${new Date().toLocaleDateString()}.`;
    const grvResolveRes = await reqRole(`/api/grievances/${grvId}/resolve`, 'hod', 'PATCH', {
      status: 'resolved',
      adminRemarks: resolveRemarks,
    });
    assert(grvResolveRes.status === 200, `HOD adjudicates and resolves grievance ticket (Status ${grvResolveRes.status})`);

    // 4.3 Student verifies resolved status and remarks
    const studentGrvRes = await reqRole('/api/grievances', 'student');
    assert(studentGrvRes.status === 200, `Student fetches personal grievance list (Status ${studentGrvRes.status})`);
    const studentGrvList = JSON.parse(studentGrvRes.data).grievances;
    const resolvedTicket = studentGrvList?.find(g => g.id === grvId);
    assert(resolvedTicket?.status === 'resolved', `Student confirms ticket status is 'resolved'`);
    assert(resolvedTicket?.admin_remarks === resolveRemarks, `Student confirms HOD resolution remarks match exactly`);

    // -------------------------------------------------------------------------
    // CHAIN 5: Super Admin Multi-Tenant Impersonation & Master Architecture & Audit Forensics
    // -------------------------------------------------------------------------
    console.log('\n--- CHAIN 5: Super Admin Impersonation & Master Architecture & Audit Forensics ---');

    // 5.1 Super Admin lists multi-tenant campuses
    const tenantRes = await reqRole('/api/tenants', 'super_admin');
    assert(tenantRes.status === 200, `Super Admin fetches registered campus tenants (Status ${tenantRes.status})`);
    const tenantsList = JSON.parse(tenantRes.data).tenants;
    assert(Array.isArray(tenantsList) && tenantsList.length > 0, `Multi-tenant cluster contains ${tenantsList?.length} active college campuses`);
    const targetTenant = tenantsList[0];

    // 5.2 Super Admin one-click direct impersonation into tenant
    const impRes = await reqRole(`/api/tenants/${targetTenant.id}/impersonate`, 'super_admin', 'POST');
    assert(impRes.status === 200, `Super Admin impersonates tenant ${targetTenant.client_name} (Status ${impRes.status})`);
    const impJson = JSON.parse(impRes.data);
    const impToken = impJson.token;
    assert(Boolean(impToken), `Generated delegated administrator JWT for campus`);

    // 5.3 Impersonated admin executes campus management action
    const impStudentsRes = await rawRequest('/api/students', 'GET', { 'Authorization': `Bearer ${impToken}` });
    assert(impStudentsRes.status === 200, `Delegated tenant token authorizes access to student registry (Status ${impStudentsRes.status})`);

    // 5.4 Super Admin checks Master Architecture and Telemetry
    const deptRes = await reqRole('/api/masters/departments', 'super_admin');
    assert(deptRes.status === 200, `Super Admin accesses canonical master departments registry (Status ${deptRes.status})`);

    // 5.5 Super Admin inspects Cryptographic Audit Logs
    const auditRes = await reqRole('/api/audit-logs', 'super_admin');
    assert(auditRes.status === 200, `Super Admin accesses immutable audit log stream (Status ${auditRes.status})`);
    const auditList = JSON.parse(auditRes.data).logs;
    assert(Array.isArray(auditList) && auditList.length > 0, `Audit log contains ${auditList?.length} tamper-evident operational events`);

    console.log('\n======================================================================');
    console.log(`🎯 LIFECYCLE AUDIT SUMMARY: TOTAL PASSED: ${totalPassed} | TOTAL FAILED: ${totalFailed}`);
    console.log('======================================================================');

    if (totalFailed > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      server.kill();
    }
  }
}

run().catch(err => {
  console.error('Fatal probe execution error:', err);
  process.exit(1);
});
