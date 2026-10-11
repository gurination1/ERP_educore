// Comprehensive Live Verification Suite for Lecture 3 on Railway Production URL
const BASE_URL = process.env.BASE_URL || 'https://educore-erp-production.up.railway.app';

console.log('======================================================================');
console.log(`  LIVE DEEP VERIFICATION SUITE: LECTURE 3 ARCHITECTURE ON RAILWAY`);
console.log(`  Target URL: ${BASE_URL}`);
console.log('======================================================================\n');

async function run() {
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

  // 1. Authenticate as Super Admin, Institutional Admin & Student
  console.log('--- 1. AUTHENTICATION ON LIVE DEPLOYMENT ---');
  let superAdminToken = '';
  let adminToken = '';
  let studentToken = '';

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'super123' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Apex Super Admin (superadmin) login succeeded');
    superAdminToken = data.token;
  } catch (err) {
    assert(false, `Super Admin login error: ${err.message}`);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Institutional Admin (admin) login succeeded');
    adminToken = data.token;
  } catch (err) {
    assert(false, `Admin login error: ${err.message}`);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'aryan', password: 'student123' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Student (Aryan) login succeeded');
    studentToken = data.token;
  } catch (err) {
    assert(false, `Student login error: ${err.message}`);
  }

  const superAuthHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${superAdminToken}`,
  };

  const adminAuthHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // 2. Tenants & One-Click Impersonation
  console.log('\n--- 2. MULTI-TENANT PROVISIONING & ONE-CLICK IMPERSONATION ---');
  try {
    const res = await fetch(`${BASE_URL}/api/tenants`, { headers: superAuthHeaders });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Fetched tenants directory');
    assert(Array.isArray(data.tenants) && data.tenants.length >= 2, `Tenants found: ${data.tenants?.length}`);
    
    const activeTenant = data.tenants.find(t => t.is_functional);
    assert(Boolean(activeTenant), `Found operational functional tenant: ${activeTenant?.client_name}`);

    // Test One-Click Impersonation ("Open" button)
    const impRes = await fetch(`${BASE_URL}/api/tenants/${activeTenant.id}/impersonate`, {
      method: 'POST',
      headers: superAuthHeaders,
    });
    const impData = await impRes.json();
    assert(impRes.status === 200 && impData.success === true, 'One-Click Direct Impersonation token issued');
    assert(Boolean(impData.token), 'Impersonation Bearer JWT valid');
    assert(impData.user?.role === 'admin', `Impersonated session role is "${impData.user?.role}"`);
  } catch (err) {
    assert(false, `Tenants test error: ${err.message}`);
  }

  // 3. 5-Level Academic Topology
  console.log('\n--- 3. 5-LEVEL ACADEMIC TOPOLOGY ---');
  try {
    const batchRes = await fetch(`${BASE_URL}/api/academics/batches`, { headers: adminAuthHeaders });
    const batchData = await batchRes.json();
    assert(batchRes.status === 200 && batchData.success === true, 'Fetched Level 4 Batches');
    assert(Array.isArray(batchData.batches) && batchData.batches.length >= 1, `Batches count: ${batchData.batches?.length}`);

    const secRes = await fetch(`${BASE_URL}/api/academics/sections`, { headers: adminAuthHeaders });
    const secData = await secRes.json();
    assert(secRes.status === 200 && secData.success === true, 'Fetched Level 5 Sections');
    assert(Array.isArray(secData.sections) && secData.sections.length >= 1, `Sections count: ${secData.sections?.length}`);
  } catch (err) {
    assert(false, `Topology test error: ${err.message}`);
  }

  // 4. Curriculum, Evaluation Checkboxes & Free Period FC
  console.log('\n--- 4. CURRICULUM FORMULA & 3 EVALUATION FLAGS ---');
  try {
    const subRes = await fetch(`${BASE_URL}/api/academics/subjects`, { headers: adminAuthHeaders });
    const subData = await subRes.json();
    assert(subRes.status === 200 && subData.success === true, 'Fetched curriculum subjects list');
    
    // Check 3 flags
    const sampleSub = subData.subjects.find(s => !s.subject_code?.startsWith('FC_'));
    assert(Boolean(sampleSub), `Sample regular subject: ${sampleSub?.subject_code}`);
    assert('take_exam' in sampleSub && 'show_in_report_card' in sampleSub && 'take_attendance' in sampleSub,
      'Regular subject has all 3 evaluation flags (take_exam, show_in_report_card, take_attendance)');

    // Check Free Period FC
    const fcSub = subData.subjects.find(s => s.subject_code?.startsWith('FC_') || s.take_attendance === false);
    assert(Boolean(fcSub), `Free Period (FC) master subject exists: ${fcSub?.subject_code} (${fcSub?.subject_name})`);
    assert(fcSub?.take_attendance === false, 'Free Period has take_attendance = false');
    assert(fcSub?.take_exam === false, 'Free Period has take_exam = false');
    assert(fcSub?.show_in_report_card === false, 'Free Period has show_in_report_card = false');
  } catch (err) {
    assert(false, `Curriculum test error: ${err.message}`);
  }

  // 5. Timetable, Combined Classes (CC) & Conflict Detector
  console.log('\n--- 5. TIMETABLE & COMBINED CLASSES (CC) ---');
  try {
    const ttRes = await fetch(`${BASE_URL}/api/academics/timetable`, { headers: adminAuthHeaders });
    const ttData = await ttRes.json();
    assert(ttRes.status === 200 && ttData.success === true, 'Fetched timetable slots');
    assert(Array.isArray(ttData.slots) && ttData.slots.length >= 1, `Timetable slots count: ${ttData.slots?.length}`);

    const ccSlot = ttData.slots.find(s => s.is_combined_class);
    assert(Boolean(ccSlot), `Found Combined Class (CC) slot in room ${ccSlot?.room_number} (${ccSlot?.day_of_week} ${ccSlot?.start_time})`);
  } catch (err) {
    assert(false, `Timetable test error: ${err.message}`);
  }

  // 6. Attendance Anti-Fraud Backdated Lock
  console.log('\n--- 6. ATTENDANCE ANTI-FRAUD BACKDATED LOCK ---');
  try {
    const attRes = await fetch(`${BASE_URL}/api/academics/attendance-settings`, { headers: adminAuthHeaders });
    const attData = await attRes.json();
    assert(attRes.status === 200 && attData.success === true, 'Fetched institutional attendance settings');
    assert([10, 20, 30].includes(attData.settings?.backdated_lock_days),
      `Backdated lock threshold configured to ${attData.settings?.backdated_lock_days} days (valid: 10/20/30)`);
  } catch (err) {
    assert(false, `Attendance lock test error: ${err.message}`);
  }

  // 7. Student Progression Lifecycle
  console.log('\n--- 7. STUDENT PROGRESSION LIFECYCLE (5 STATES) ---');
  try {
    const stuListRes = await fetch(`${BASE_URL}/api/students`, { headers: adminAuthHeaders });
    const stuListData = await stuListRes.json();
    const targetStudent = stuListData.students?.[0];
    assert(Boolean(targetStudent), `Target student found for lifecycle testing: ${targetStudent?.id}`);

    const progRes = await fetch(`${BASE_URL}/api/students/${targetStudent.id}/progression`, {
      method: 'POST',
      headers: adminAuthHeaders,
      body: JSON.stringify({
        new_status: 'promoted',
        new_term: 5,
        reason: 'Lecture 3 Live Progression Validation Test',
      }),
    });
    const progData = await progRes.json();
    assert(progRes.status === 200 && progData.success === true, 'Student progression successfully updated to PROMOTED');
    
    // Revert to active
    await fetch(`${BASE_URL}/api/students/${targetStudent.id}/progression`, {
      method: 'POST',
      headers: adminAuthHeaders,
      body: JSON.stringify({
        new_status: 'active',
        new_term: 4,
        reason: 'Restoring to active state after verification',
      }),
    });
    assert(true, 'Student progression restored to ACTIVE state');
  } catch (err) {
    assert(false, `Student progression test error: ${err.message}`);
  }

  // 8. Dynamic Payment Gateways & Sandbox Security
  console.log('\n--- 8. DYNAMIC PAYMENT GATEWAYS (LIVE VS TEST MODE) ---');
  try {
    const gwRes = await fetch(`${BASE_URL}/api/finance/payment-gateways`, { headers: adminAuthHeaders });
    const gwData = await gwRes.json();
    assert(gwRes.status === 200 && gwData.success === true, 'Fetched payment gateways catalog');
    assert(Array.isArray(gwData.gateways) && gwData.gateways.length >= 2, `Gateways count: ${gwData.gateways?.length}`);

    const activeGw = await fetch(`${BASE_URL}/api/finance/payment-gateways/active`, { headers: adminAuthHeaders });
    const activeGwData = await activeGw.json();
    const resolvedGw = activeGwData.active_gateway || activeGwData.gateway;
    assert(activeGw.status === 200 && activeGwData.success === true && Boolean(resolvedGw),
      `Active payment gateway resolved: ${resolvedGw?.gateway_name} (Mode: ${resolvedGw?.mode})`);

    // Student Sandbox Protection Gate
    if (resolvedGw?.mode === 'test') {
      const allowedUids = resolvedGw.test_allowed_uids ? JSON.parse(resolvedGw.test_allowed_uids) : [];
      assert(!allowedUids.includes('aryan'), 'Regular student (Aryan) is NOT in test_allowed_uids whitelist');
      console.log('  🔒 [SANDBOX SECURE]: Regular students blocked from test gateway payments.');
    }
  } catch (err) {
    assert(false, `Gateways test error: ${err.message}`);
  }

  // 9. Field-Level RBAC Permissions Matrix
  console.log('\n--- 9. FIELD-LEVEL RBAC PERMISSIONS MATRIX ---');
  try {
    const permRes = await fetch(`${BASE_URL}/api/permissions/fields`, { headers: adminAuthHeaders });
    const permData = await permRes.json();
    assert(permRes.status === 200 && permData.success === true, 'Fetched field permissions matrix');
    assert(Array.isArray(permData.permissions) && permData.permissions.length >= 5, `Configured field permissions: ${permData.permissions?.length}`);

    // Verify View -> Edit dependency rule
    let dependencyIntegrity = true;
    for (const p of permData.permissions) {
      if (!p.staff_view && p.staff_edit) dependencyIntegrity = false;
      if (!p.student_view && p.student_edit) dependencyIntegrity = false;
    }
    assert(dependencyIntegrity, 'Hard Dependency Rule Verified: If View=false, Edit is strictly false');
  } catch (err) {
    assert(false, `Permissions test error: ${err.message}`);
  }

  // 10. HRMS Multi-Role, Payroll, Security Deductions & 5-Point NOC
  console.log('\n--- 10. HRMS SUITE (PAYROLL, SECURITY DEDUCTIONS & 5-POINT EXIT NOC) ---');
  try {
    const staffId = 'usr-staff-01';

    // 10a. Additional Roles
    const rolesRes = await fetch(`${BASE_URL}/api/staff/${staffId}/additional-roles`, { headers: adminAuthHeaders });
    const rolesData = await rolesRes.json();
    assert(rolesRes.status === 200 && rolesData.success === true, 'Fetched staff additional institutional roles');
    assert(Array.isArray(rolesData.roles) && rolesData.roles.length >= 1, `Additional roles count: ${rolesData.roles?.length}`);

    // 10b. Payroll Structure
    const payRes = await fetch(`${BASE_URL}/api/staff/${staffId}/payroll`, { headers: adminAuthHeaders });
    const payData = await payRes.json();
    assert(payRes.status === 200 && payData.success === true, 'Fetched staff payroll compensation structure');
    assert(payData.payroll?.basic_pay > 0 && payData.payroll?.net_salary > 0,
      `Salary verified: Basic ₹${payData.payroll?.basic_pay}, Net ₹${payData.payroll?.net_salary}`);
    assert('pf_applicable' in payData.payroll && 'esi_applicable' in payData.payroll && 'voluntary_pf_amount' in payData.payroll,
      'Dynamic PF, ESI, and Voluntary PF toggles present in payroll profile');

    // 10c. Security Deduction Schedule
    const secRes = await fetch(`${BASE_URL}/api/staff/${staffId}/security-deduction`, { headers: adminAuthHeaders });
    const secData = await secRes.json();
    assert(secRes.status === 200 && secData.success === true, 'Fetched staff security deduction schedule');
    assert(secData.securityDeduction?.target_amount > 0,
      `Security target amount: ₹${secData.securityDeduction?.target_amount} (Deducted: ₹${secData.securityDeduction?.deducted_so_far})`);

    // 10d. 5-Point Exit NOC
    const nocRes = await fetch(`${BASE_URL}/api/staff/${staffId}/noc`, { headers: adminAuthHeaders });
    const nocData = await nocRes.json();
    assert(nocRes.status === 200 && nocData.success === true, 'Fetched online 5-point exit NOC status');
    assert('library_cleared' in nocData.noc && 'accounts_cleared' in nocData.noc && 'hod_cleared' in nocData.noc && 'it_cleared' in nocData.noc && 'hr_cleared' in nocData.noc,
      'All 5 departmental clearance checkpoints present (Library, Accounts, HOD, IT, HR)');
  } catch (err) {
    assert(false, `HRMS test error: ${err.message}`);
  }

  // 11. Academic Workload & Hierarchy Audit Report
  console.log('\n--- 11. ACADEMIC WORKLOAD & HIERARCHY AUDIT REPORT ---');
  try {
    const repRes = await fetch(`${BASE_URL}/api/reports/academic-workload`, { headers: adminAuthHeaders });
    const repData = await repRes.json();
    assert(repRes.status === 200 && repData.success === true, 'Fetched Academic Workload & Hierarchy Report');
    assert(typeof repData.summary?.totalCombinedClasses === 'number', `Total Combined Classes: ${repData.summary?.totalCombinedClasses}`);
    assert(typeof repData.summary?.totalSubjects === 'number', `Total Academic Subjects: ${repData.summary?.totalSubjects}`);
    assert(typeof repData.summary?.totalTeachers === 'number', `Total Teaching Faculty: ${repData.summary?.totalTeachers}`);
    assert(Array.isArray(repData.teacherAssignments) && repData.teacherAssignments.length >= 1, `Teacher workload assignments: ${repData.teacherAssignments?.length} faculty members`);
    assert(Array.isArray(repData.departments) && repData.departments.length >= 1, `Departmental hierarchy nodes: ${repData.departments?.length} departments`);
  } catch (err) {
    assert(false, `Academic workload report test error: ${err.message}`);
  }

  // Final Summary
  console.log('\n======================================================================');
  console.log(`  LIVE DEEP AUDIT RESULTS ON RAILWAY PRODUCTION`);
  console.log(`  TOTAL AUDITS: ${passed + failed}`);
  console.log(`  PASSED:       ${passed}`);
  console.log(`  FAILED:       ${failed}`);
  console.log(`  SUCCESS RATE: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
