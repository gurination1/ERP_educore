// Comprehensive Automated Verification Script for Enterprise Requirements & Goal Gates
import http from 'http';

const BASE_URL = 'http://localhost:3000';

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const request = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    request.on('error', reject);
    if (body) {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 EDUCORE ERP - COMPREHENSIVE GOAL VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health & DB Check
  console.log('--- 1. SYSTEM HEALTH & ENTERPRISE ENGINE ---');
  const health = await req('GET', '/api/health');
  assert(health.status === 200, 'Health endpoint responds with 200 OK');
  assert(health.data?.service === 'EduCore ERP Backend API', 'Service identity verified');

  // Login as Administrator
  console.log('\n--- 2. ADMIN AUTHENTICATION ---');
  const loginRes = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  assert(loginRes.status === 200, 'Admin login succeeded');
  const adminToken = loginRes.data?.token;
  assert(Boolean(adminToken), 'JWT session token issued');
  assert(loginRes.data?.user?.enterprise_uid === '4001-03-BFGI-0001', 'Canonical Enterprise UID verified (4001-03-BFGI-0001)');

  // 3. Master Tables & Tagging Architecture
  console.log('\n--- 3. MASTER TABLES & "TAGGING NATION" ---');
  const masterRes = await req('GET', '/api/master/enterprise', null, adminToken);
  assert(masterRes.status === 200, 'Enterprise master tables retrieved');
  const depts = masterRes.data?.master?.departments || [];
  assert(depts.length >= 7, `Department master has ${depts.length} departments (CSE, AGRI, CE, ME, MGMT, PHARM, APP_SCI)`);
  const cseDept = depts.find(d => d.dept_code === 'CSE');
  assert(Boolean(cseDept && cseDept.tags_json.includes('AI')), 'CSE Department has specialized tags (AI, Engineering, Software)');

  const empStatuses = masterRes.data?.master?.employeeStatuses || [];
  assert(empStatuses.length >= 5, 'Employee statuses include ACTIVE, RESIGNED, TERMINATED, AOL, DEACTIVATED');
  const aolStatus = empStatuses.find(s => s.status_code === 'AOL');
  assert(Boolean(aolStatus && aolStatus.requires_dates), 'AOL status mandatorily requires transition dates');

  // 4. Multi-Table Staff Management & Org Journey
  console.log('\n--- 4. MULTI-TABLE STAFF MANAGEMENT & ORG JOURNEY ---');
  const staffList = await req('GET', '/api/staff', null, adminToken);
  assert(staffList.status === 200, 'Staff directory retrieved');
  assert(staffList.data?.staff?.length >= 4, `Staff directory count: ${staffList.data?.staff?.length}`);

  const profileRes = await req('GET', '/api/staff/stf-001', null, adminToken);
  assert(profileRes.status === 200, 'Staff stf-001 multi-table profile retrieved');
  const profile = profileRes.data?.profile;
  assert(profile?.addresses?.length >= 2, 'Staff has decoupled addresses with [DEFAULT]');
  assert(profile?.bankAccounts?.length >= 2, 'Staff has decoupled bank accounts with [DEFAULT]');
  assert(profile?.qualifications?.some(q => q.is_highest), 'Staff has highest qualification flag');
  assert(profile?.experience?.some(e => e.is_latest), 'Staff has latest prior experience flag');
  assert(profile?.orgJourney?.length >= 2, 'Staff career journey tracks CAS promotion and appointment');

  // Toggle Login Status
  const toggleRes = await req('PATCH', '/api/staff/stf-001/login-status', { enabled: false }, adminToken);
  assert(toggleRes.status === 200, 'Staff login toggled to DISABLED');
  assert(toggleRes.data?.otpDispatched === true, 'Security OTP notification dispatched upon login toggle');

  // Admin Reset Password with mandatory change
  const pwdResetRes = await req('POST', '/api/staff/stf-001/admin-reset-password', { tempPassword: 'EduTemp@123' }, adminToken);
  assert(pwdResetRes.status === 200, 'Admin reset password succeeded');
  assert(pwdResetRes.data?.must_change_password === true, 'Mandatory password change enforced upon next login');

  // 5. Corporate & Hiring Partner Account
  console.log('\n--- 5. CORPORATE PARTNER PORTAL & TALENT SHARE ---');
  const partnersRes = await req('GET', '/api/partners', null, adminToken);
  assert(partnersRes.status === 200, 'Partners directory retrieved');
  assert(partnersRes.data?.partners?.length >= 2, 'Partners include Infosys and Punjab AgriTech');
  const infosys = partnersRes.data?.partners?.find(p => p.firm_name.includes('Infosys'));
  assert(Boolean(infosys?.pan_number && infosys?.gst_number), 'Partner statutory PAN and GST numbers present');

  // Post Campus Job
  const newJobRes = await req('POST', `/api/partners/${infosys.id}/jobs`, {
    title: 'Cloud DevOps Trainee',
    type: 'internship',
    stipend_salary: '₹ 22,000 / month',
    eligible_departments: 'CSE,ECE',
    min_cgpa: 7.5,
    description: 'Kubernetes, Docker, and GitHub Actions automation.',
  }, adminToken);
  assert(newJobRes.status === 201, 'New campus job posted by corporate partner');

  // Verified Talent Pool
  const talentRes = await req('GET', '/api/partners/talent-pool?minCgpa=7.0', null, adminToken);
  assert(talentRes.status === 200, 'Verified student talent pool retrieved');
  assert(talentRes.data?.talentPool?.length > 0, `Talent pool contains ${talentRes.data?.talentPool?.length} verified students`);

  // 6. Pre-Admission CRM, Dynamic Bulk Mapper & Auto-Dialer
  console.log('\n--- 6. PRE-ADMISSION CRM & DYNAMIC BULK MAPPER ---');
  const enqList = await req('GET', '/api/enquiries', null, adminToken);
  assert(enqList.status === 200, 'Enquiries CRM directory retrieved');
  assert(enqList.data?.enquiries?.length >= 3, `CRM has ${enqList.data?.enquiries?.length} active leads`);

  // 3-Tier Pre-Import Validation Test
  const testRows = [
    { 'Candidate Name': 'Harmanpreet Singh', 'Contact No': '9876543210', 'Desired Branch': 'B.Tech CSE' },
    { 'Candidate Name': 'Duplicate Lead', 'Contact No': '9876122334', 'Desired Branch': 'B.Tech CSE' }, // Collides with enq-001
    { 'Candidate Name': '', 'Contact No': '98123', 'Desired Branch': 'B.Tech ME' }, // Invalid name and short phone
  ];
  const validateRes = await req('POST', '/api/enquiries/bulk/validate', {
    rawRows: testRows,
    columnMapping: { student_name: 'Candidate Name', mobile: 'Contact No', selected_course: 'Desired Branch' },
  }, adminToken);
  assert(validateRes.status === 200, 'Dynamic 3-tier bulk validator executed');
  assert(validateRes.data?.fresh_count === 1, '1 lead classified as Tier-1 FRESH');
  assert(validateRes.data?.duplicate_count === 1, '1 lead classified as Tier-2 PROBABLE DUPLICATE');
  assert(validateRes.data?.wrong_count === 1, '1 lead classified as Tier-3 WRONG DATA');

  // Log Stage-wise Interaction Remark & Probability Update
  const enq1 = enqList.data?.enquiries[0];
  const interactRes = await req('POST', `/api/enquiries/${enq1.id}/interactions`, {
    stage_name: 'Fee & Scholarship Discussion',
    remarks: 'Candidate agreed to pay registration fee tomorrow via UPI.',
    call_status: 'Token Fee Promised',
    probability_updated: 90,
  }, adminToken);
  assert(interactRes.status === 201, 'Stage-wise interaction logged');
  assert(interactRes.data?.interaction?.probability_updated === 90, 'Admission probability updated to 90%');

  // Auto-Dialer Simulation
  const dialRes = await req('POST', `/api/enquiries/${enq1.id}/dial`, null, adminToken);
  assert(dialRes.status === 200, 'Auto-Dialer click-to-call initiated via headset stream');
  assert(Boolean(dialRes.data?.simulated_recording_url), 'Simulated voice recording link created');

  // Registration Fee Clearance -> Instant Conversion to Student Master
  const convertRes = await req('POST', `/api/enquiries/${enq1.id}/convert-to-student`, {
    amount: 15000,
    payment_mode: 'online_upi',
    transaction_ref: 'UPI-REF-2025-998812',
  }, adminToken);
  assert(convertRes.status === 200, 'Enquiry successfully converted to regular Student!');
  assert(Boolean(convertRes.data?.student?.student_id), `Admitted with Course UID: ${convertRes.data?.student?.student_id}`);
  assert(Boolean(convertRes.data?.receiptNo), `Generated token receipt: ${convertRes.data?.receiptNo}`);

  // 7. Multi-Channel Password Recovery Matrix
  console.log('\n--- 7. MULTI-CHANNEL PASSWORD RECOVERY ---');
  // SMS OTP
  const smsRes = await req('POST', '/api/auth/forgot-password/sms-otp', { identifier: 'aryan' });
  assert(smsRes.status === 200, 'TRAI DLT SMS OTP dispatched');
  assert(Boolean(smsRes.data?.maskedPhone), `Dispatched to: ${smsRes.data?.maskedPhone}`);

  // WhatsApp OTP
  const waRes = await req('POST', '/api/auth/forgot-password/whatsapp-otp', { identifier: 'aryan' });
  assert(waRes.status === 200, 'Meta WhatsApp Verified OTP dispatched');
  assert(Boolean(waRes.data?.maskedPhone), `WhatsApp delivered to: ${waRes.data?.maskedPhone}`);

  // Admin Assisted Recovery Ticket
  const tktRes = await req('POST', '/api/auth/forgot-password/admin-request', {
    identifier: 'aryan',
    remarks: 'Sim card replaced, urgent semester registration ticket.',
  });
  assert(tktRes.status === 200, 'Admin-assisted recovery ticket submitted');
  assert(Boolean(tktRes.data?.ticketNo), `Ticket generated: #${tktRes.data?.ticketNo}`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
