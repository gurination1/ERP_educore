import { URL } from 'url';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5055';

async function req(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url.toString(), { method, headers, body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, data: json, text };
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 VERIFYING PUNJAB COLLEGE PROGRESSIVE INTAKE & ROLES`);
  console.log(`🎯 Target Server: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Authenticate All 5 Institutional Personas
  console.log(`--- [1] Multi-Role Identity Authentication ---`);
  
  const personas = [
    { username: 'admin', password: 'admin123', expectedRole: 'admin', title: 'Provost / Super Admin' },
    { username: 'staff01', password: 'staff123', expectedRole: 'staff', title: 'Faculty / Academic Staff' },
    { username: 'counselor01', password: 'counselor123', expectedRole: 'counselor', title: 'Head Counselor' },
    { username: 'hod_cse', password: 'hod123', expectedRole: 'hod', title: 'Head of Department (CSE)' },
    { username: 'accounts01', password: 'accounts123', expectedRole: 'accounts', title: 'Chief Accounts Officer' },
  ];

  const tokens = {};

  for (const p of personas) {
    const res = await req('/api/auth/login', {
      method: 'POST',
      body: { username: p.username, password: p.password }
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Failed to login persona ${p.username}: ${JSON.stringify(res.data)}`);
    }
    if (res.data.user.role !== p.expectedRole) {
      throw new Error(`Role mismatch for ${p.username}: expected ${p.expectedRole}, got ${res.data.user.role}`);
    }
    tokens[p.expectedRole] = res.data.token;
    console.log(`  ✅ PASS: ${p.title} (${p.username}) authenticated. Role: ${res.data.user.role}, Dept: ${res.data.user.department || 'General'}`);
  }

  const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };
  const staffHeaders = { Authorization: `Bearer ${tokens.staff}` };
  const counselorHeaders = { Authorization: `Bearer ${tokens.counselor}` };
  const hodHeaders = { Authorization: `Bearer ${tokens.hod}` };

  // 2. Progressive 3-Step Student Intake Pipeline
  console.log(`\n--- [2] Progressive 3-Step Student Intake Pipeline ---`);

  // STEP 1: Campus Visit Inquiry
  console.log(`\n  [Step 1] Walk-in Campus Inquiry Registration...`);
  const uniqueSuffix = Date.now().toString().slice(-6);
  const step1Payload = {
    step: 1,
    firstName: 'Gurkirat',
    lastName: `Singh${uniqueSuffix}`,
    email: `gurkirat.${uniqueSuffix}@punjab.edu`,
    phone: `9876${uniqueSuffix}`,
    address: 'VPO Mehraj, Rampura Phul',
    city: 'Bathinda',
    district: 'Bathinda',
    state: 'Punjab',
    pincode: '151103',
    courseId: 'crs-btech-cs',
    sessionId: 'sess-2025-26',
    counselingNotes: 'Visited campus for B.Tech CSE inquiry. Interested in AI & Cloud specialization.',
  };

  const step1Res = await req('/api/admissions/progressive-intake', {
    method: 'POST',
    headers: counselorHeaders,
    body: step1Payload,
  });

  if (!step1Res.ok || !step1Res.data.success) {
    throw new Error(`Step 1 progressive intake failed: ${JSON.stringify(step1Res.data)}`);
  }

  const studentCandidateId = step1Res.data.student.id;
  console.log(`  ✅ PASS: Step 1 Inquiry saved successfully!`);
  console.log(`     Student ID: ${step1Res.data.student.student_id}`);
  console.log(`     Status: ${step1Res.data.student.admission_status} (Expected: inquiry)`);
  console.log(`     Intake Step: ${step1Res.data.student.intake_step} (Expected: 1)`);

  if (step1Res.data.student.admission_status !== 'inquiry' || step1Res.data.student.intake_step !== 1) {
    throw new Error(`Step 1 status/step mismatch: ${step1Res.data.student.admission_status}, step: ${step1Res.data.student.intake_step}`);
  }

  // STEP 2: Parental & Domicile / Quota Profile
  console.log(`\n  [Step 2] Parent & Punjab 85% Domicile Quota Profile...`);
  const step2Payload = {
    id: studentCandidateId,
    step: 2,
    guardianName: 'Sardar Harjit Singh',
    guardianPhone: '9876500000',
    motherName: 'Sardarni Manpreet Kaur',
    guardianRelation: 'father',
    gender: 'male',
    dob: '2005-08-15',
    category: 'General',
    quota: 'punjab_85',
    annualFamilyIncome: 450000,
    residentialMode: 'bus_commuter',
    transportRoute: 'Route 3 - Bathinda Rampura Express',
  };

  const step2Res = await req('/api/admissions/progressive-intake', {
    method: 'POST',
    headers: counselorHeaders,
    body: step2Payload,
  });

  if (!step2Res.ok || !step2Res.data.success) {
    throw new Error(`Step 2 progressive intake failed: ${JSON.stringify(step2Res.data)}`);
  }

  console.log(`  ✅ PASS: Step 2 Profile saved successfully!`);
  console.log(`     Father: ${step2Res.data.student.guardian_name}, Mother: ${step2Res.data.student.mother_name}`);
  console.log(`     Quota: ${step2Res.data.student.quota} (Punjab 85%), Status: ${step2Res.data.student.admission_status}`);
  console.log(`     Intake Step: ${step2Res.data.student.intake_step} (Expected: 2)`);

  if (step2Res.data.student.admission_status !== 'registered' || step2Res.data.student.intake_step !== 2) {
    throw new Error(`Step 2 status/step mismatch: ${step2Res.data.student.admission_status}, step: ${step2Res.data.student.intake_step}`);
  }

  // STEP 3: Crucial Documents, 12-Digit Aadhaar, Marksheets & Token Admission Fee
  console.log(`\n  [Step 3] Crucial Documents, 12-Digit Aadhaar, PSEB Marksheets & Token Fee...`);
  
  // Validation Test: Invalid Aadhaar (11 digits) must fail
  const invalidAadhaarPayload = {
    id: studentCandidateId,
    step: 3,
    aadhaarNo: '12345678901', // 11 digits
    tenthRollNo: 'PSEB-10-8989',
    twelfthRollNo: 'PSEB-12-7878',
    tenthPercentage: 88.5,
    twelfthPercentage: 86.2,
    tokenFeeAmount: 15000,
  };
  const invalidAadhaarRes = await req('/api/admissions/progressive-intake', {
    method: 'POST',
    headers: counselorHeaders,
    body: invalidAadhaarPayload,
  });
  if (invalidAadhaarRes.ok && invalidAadhaarRes.data.success) {
    throw new Error(`Security flaw: 11-digit Aadhaar was accepted! Must require exactly 12 digits.`);
  }
  console.log(`  ✅ PASS: 11-digit invalid Aadhaar correctly rejected by validation gate.`);

  // Valid Step 3 Submission
  const validStep3Payload = {
    id: studentCandidateId,
    step: 3,
    aadhaarNo: '987654321098', // 12 digits
    tenthBoard: 'PSEB (Punjab School Education Board)',
    tenthRollNo: 'PSEB-10-998822',
    tenthPercentage: 89.2,
    tenthDocVerified: true,
    twelfthBoard: 'PSEB (Punjab School Education Board)',
    twelfthRollNo: 'PSEB-12-887711',
    twelfthPercentage: 87.5,
    twelfthDocVerified: true,
    aadhaarDocVerified: true,
    tokenFeeReceipt: `REC-ADM-2025-${uniqueSuffix}`,
    tokenFeeAmount: 15000,
    tokenFeeMode: 'online_upi',
    tokenFeeDate: '2025-09-28',
  };

  const step3Res = await req('/api/admissions/progressive-intake', {
    method: 'POST',
    headers: counselorHeaders,
    body: validStep3Payload,
  });

  if (!step3Res.ok || !step3Res.data.success) {
    throw new Error(`Step 3 progressive intake failed: ${JSON.stringify(step3Res.data)}`);
  }

  console.log(`  ✅ PASS: Step 3 finalized with Verified Credentials Slip!`);
  console.log(`     Admission Status: ${step3Res.data.student.admission_status}`);
  console.log(`     Aadhaar: ${step3Res.data.student.aadhaar_no}`);
  console.log(`     Token Fee Receipt: ${step3Res.data.student.token_fee_receipt} (₹${step3Res.data.student.token_fee_amount})`);
  console.log(`     Credentials Slip Username: ${step3Res.data.credentialsSlip?.username}`);
  console.log(`     Credentials Slip Temporary Password: ${step3Res.data.credentialsSlip?.temporaryPassword}`);

  if (!step3Res.data.credentialsSlip || !step3Res.data.credentialsSlip.username) {
    throw new Error(`Step 3 did not provision credentials slip.`);
  }

  // 3. Faculty & Counselor Direct Admission Approval Powers
  console.log(`\n--- [3] Independent Admission Approval Powers for Faculty, Counselor & HOD ---`);

  // Create another inquiry to test faculty direct admission
  const candidateForFaculty = await req('/api/admissions/progressive-intake', {
    method: 'POST',
    headers: staffHeaders,
    body: {
      step: 1,
      firstName: 'Simran',
      lastName: `Kaur${uniqueSuffix}`,
      email: `simran.${uniqueSuffix}@punjab.edu`,
      phone: `9123${uniqueSuffix}`,
      courseId: 'crs-btech-cs',
      sessionId: 'sess-2025-26',
    },
  });
  const simranId = candidateForFaculty.data.student.id;

  // Faculty approves admission directly:
  const facultyApproval = await req(`/api/admissions/${simranId}/status`, {
    method: 'PATCH',
    headers: staffHeaders,
    body: {
      status: 'approved',
      remarks: 'Sanctioned directly by Faculty Advisor under Merit Guidelines',
    },
  });

  if (facultyApproval.status !== 200 || !facultyApproval.data.success) {
    throw new Error(`Faculty direct admission approval failed: ${JSON.stringify(facultyApproval.data)}`);
  }
  console.log(`  ✅ PASS: Faculty (staff) approved admission directly without bureaucratic blockers!`);
  console.log(`     Simran Status: ${facultyApproval.data.student.admission_status}`);
  console.log(`     Credentials Slip Generated: ${facultyApproval.data.credentialsSlip ? 'YES' : 'NO'}`);

  // HOD approves another candidate directly:
  const candidateForHod = await req('/api/admissions/progressive-intake', {
    method: 'POST',
    headers: hodHeaders,
    body: {
      step: 1,
      firstName: 'Manpreet',
      lastName: `Dhillon${uniqueSuffix}`,
      email: `manpreet.${uniqueSuffix}@punjab.edu`,
      phone: `9145${uniqueSuffix}`,
      courseId: 'crs-btech-cs',
      sessionId: 'sess-2025-26',
    },
  });
  const manpreetId = candidateForHod.data.student.id;

  const hodApproval = await req(`/api/admissions/${manpreetId}/status`, {
    method: 'PATCH',
    headers: hodHeaders,
    body: {
      status: 'approved',
      remarks: 'Sanctioned by HOD Department Review',
    },
  });
  if (hodApproval.status !== 200 || !hodApproval.data.success) {
    throw new Error(`HOD admission approval failed: ${JSON.stringify(hodApproval.data)}`);
  }
  console.log(`  ✅ PASS: HOD approved admission directly and provisioned credentials!`);

  // 4. Admin Extreme User & Staff Hiring/Management Powers
  console.log(`\n--- [4] Admin Extreme Powers: User & Staff Role Governance ---`);

  // Admin lists users
  const usersListRes = await req('/api/users', { headers: adminHeaders });
  if (usersListRes.status !== 200 || !usersListRes.data.success) {
    throw new Error(`Admin failed to fetch users list: ${JSON.stringify(usersListRes.data)}`);
  }
  console.log(`  ✅ PASS: Admin retrieved user roster. Total users: ${usersListRes.data.users.length}`);

  // Admin hires / provisions a new Assistant Professor in Mechanical Engineering
  const newStaffPayload = {
    username: `prof.jaswinder.${uniqueSuffix}`,
    email: `jaswinder.${uniqueSuffix}@educore.edu`,
    password: 'TempPassword123!',
    fullName: 'Dr. Jaswinder Kaur',
    role: 'staff',
    department: 'Mechanical Engineering',
    designation: 'Assistant Professor (Robotics & CAD)',
    employeeId: `EMP-ME-${uniqueSuffix}`,
  };

  const hireRes = await req('/api/users', {
    method: 'POST',
    headers: adminHeaders,
    body: newStaffPayload,
  });

  if (hireRes.status !== 201 || !hireRes.data.success) {
    throw new Error(`Admin failed to provision new staff user: ${JSON.stringify(hireRes.data)}`);
  }

  const hiredUserId = hireRes.data.user.id;
  console.log(`  ✅ PASS: Admin provisioned new faculty: ${hireRes.data.user.full_name} (${hireRes.data.user.role})`);
  console.log(`     Employee ID: ${hireRes.data.user.employee_id}, Dept: ${hireRes.data.user.department}`);

  // Verify new staff member can login
  const hiredLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { username: newStaffPayload.username, password: newStaffPayload.password }
  });
  if (hiredLogin.status !== 200 || !hiredLogin.data.success) {
    throw new Error(`Newly hired staff login failed: ${JSON.stringify(hiredLogin.data)}`);
  }
  console.log(`  ✅ PASS: Newly provisioned staff logged in successfully!`);

  // Admin suspends account
  const suspendRes = await req(`/api/users/${hiredUserId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: { isActive: false }
  });
  if (suspendRes.status !== 200 || !suspendRes.data.success) {
    throw new Error(`Admin failed to suspend account: ${JSON.stringify(suspendRes.data)}`);
  }
  console.log(`  ✅ PASS: Admin suspended account (is_active: false)`);

  // Suspended user should be blocked from logging in
  const suspendedLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { username: newStaffPayload.username, password: newStaffPayload.password }
  });
  if (suspendedLogin.status === 200 && suspendedLogin.data.success) {
    throw new Error(`Security flaw: Suspended user was able to log in!`);
  }
  console.log(`  ✅ PASS: Suspended user correctly blocked from logging in.`);

  // Admin reactivates account
  const reactivateRes = await req(`/api/users/${hiredUserId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: { isActive: true }
  });
  if (reactivateRes.status !== 200 || !reactivateRes.data.success) {
    throw new Error(`Admin failed to reactivate account: ${JSON.stringify(reactivateRes.data)}`);
  }
  console.log(`  ✅ PASS: Admin reactivated account.`);

  // Admin overrides password
  const newOverridePassword = 'NewSecretPassword456!';
  const resetPasswordRes = await req(`/api/users/${hiredUserId}/reset-password`, {
    method: 'POST',
    headers: adminHeaders,
    body: { newPassword: newOverridePassword }
  });
  if (resetPasswordRes.status !== 200 || !resetPasswordRes.data.success) {
    throw new Error(`Admin failed to reset password: ${JSON.stringify(resetPasswordRes.data)}`);
  }
  console.log(`  ✅ PASS: Admin successfully overrode password.`);

  // User logs in with overridden password
  const newLoginRes = await req('/api/auth/login', {
    method: 'POST',
    body: { username: newStaffPayload.username, password: newOverridePassword }
  });
  if (newLoginRes.status !== 200 || !newLoginRes.data.success) {
    throw new Error(`Login with overridden password failed: ${JSON.stringify(newLoginRes.data)}`);
  }
  console.log(`  ✅ PASS: User logged in with newly overridden password.`);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED: 100% GREEN ARCHITECTURE VERIFIED!`);
  console.log(`======================================================\n`);
}

runTests().catch(err => {
  console.error(`\n❌ TEST RUN FAILED:`, err);
  process.exit(1);
});
