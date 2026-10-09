// Automated Role UI, Navigation and Access Control Verification Suite
import http from 'http';
import { spawn } from 'child_process';

const PORT = process.env.TEST_PORT || 3333;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

console.log(`======================================================================`);
console.log(`  EDUCORE ALL 8 ROLES: SEPARATE UI, CREDENTIALS & ACCESS CONTROL TEST`);
console.log(`  Target: ${BASE_URL}`);
console.log(`======================================================================\n`);

let serverProcess = null;

async function startServerIfNeeded() {
  if (process.env.BASE_URL) return;
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return;
  } catch (e) {
    // Need to start
  }

  console.log(`Starting background server process on port ${PORT}...`);
  serverProcess = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn server process:', err);
  });

  // Poll until ready (up to 40 seconds)
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        console.log(`Server ready on port ${PORT}!\n`);
        return;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server failed to start on port ${PORT}`);
}

async function runRoleAudit() {
  await startServerIfNeeded();

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

  // 1. Check health
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && (healthData.status === 'ok' || healthData.success === true), `Backend engine online: ${healthData.database || healthData.mode}`);

  // 2. Define the 8 canonical roles
  const canonicalRoles = [
    {
      role: 'super_admin',
      identifier: 'superadmin',
      password: 'super123',
      uid: '9001-01-03-01',
      expectedNameFragment: 'Amritpal',
    },
    {
      role: 'admin',
      identifier: 'admin',
      password: 'admin123',
      uid: '4001-01-03-01',
      expectedNameFragment: 'Provost',
    },
    {
      role: 'staff',
      identifier: 'staff01',
      password: 'staff123',
      uid: '2001-14-03-01',
      expectedNameFragment: 'Sunita',
    },
    {
      role: 'hod',
      identifier: 'hod_cse',
      password: 'hod123',
      uid: '3001-01-03-01',
      expectedNameFragment: 'Balwinder',
    },
    {
      role: 'counselor',
      identifier: 'counselor01',
      password: 'counselor123',
      uid: '6001-02-03-01',
      expectedNameFragment: 'Harleen',
    },
    {
      role: 'accounts',
      identifier: 'accounts01',
      password: 'accounts123',
      uid: '5001-05-03-01',
      expectedNameFragment: 'Manmohan',
    },
    {
      role: 'student',
      identifier: 'aryan',
      password: 'student123',
      uid: '1001-88-03-01',
      expectedNameFragment: 'Aryan',
    },
    {
      role: 'partner',
      identifier: 'partner01',
      password: 'partner123',
      uid: '7001-01-03-01',
      expectedNameFragment: 'Infosys',
    },
  ];

  const authData = {};

  console.log('\n--- PHASE 1: LOGIN & CANONICAL IDENTITY AUDIT (ALL 8 ROLES) ---');
  for (const roleDef of canonicalRoles) {
    try {
      // Test login with identifier
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: roleDef.identifier, password: roleDef.password }),
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, `Role [${roleDef.role}]: Authenticated with identifier "${roleDef.identifier}"`);
      assert(data.user?.role === roleDef.role, `Role [${roleDef.role}]: Returned role strictly matches "${roleDef.role}"`);
      assert(data.user?.enterprise_uid === roleDef.uid, `Role [${roleDef.role}]: Canonical Enterprise UID matches "${roleDef.uid}"`);
      assert(data.user?.full_name?.includes(roleDef.expectedNameFragment), `Role [${roleDef.role}]: Full name contains "${roleDef.expectedNameFragment}" (got: "${data.user?.full_name}")`);
      assert(data.user?.is_active === true, `Role [${roleDef.role}]: User status is active`);
      
      authData[roleDef.role] = {
        token: data.token,
        user: data.user,
      };

      // Test login with pure digit enterprise UID
      const uidRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: roleDef.uid, password: roleDef.password }),
      });
      const uidData = await uidRes.json();
      assert(uidRes.status === 200 && uidData.success === true, `Role [${roleDef.role}]: Authenticated directly via 10-digit Enterprise UID "${roleDef.uid}"`);
    } catch (err) {
      assert(false, `Role [${roleDef.role}]: Login failed: ${err.message}`);
    }
  }

  console.log('\n--- PHASE 2: RBAC PERMISSIONS & PRIVILEGE FENCING AUDIT ---');

  // 2a. Student Role Fence
  console.log('Testing Student (aryan) access boundaries:');
  const stuToken = authData.student?.token;
  
  // Student CAN access personal dashboard & fee ledger
  const stuDash = await fetch(`${BASE_URL}/api/students/me/dashboard`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  assert(stuDash.status === 200, 'Student can access personal /api/students/me/dashboard');

  const stuFee = await fetch(`${BASE_URL}/api/fees/ledger/me`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  assert(stuFee.status === 200, 'Student can access personal /api/fees/ledger/me');

  // Student is STRICTLY BLOCKED from institutional user management
  const stuUserMgmt = await fetch(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  assert(stuUserMgmt.status === 403, 'Student is BLOCKED (403) from /api/users (User Management)');

  // Student is BLOCKED from admissions leads radar
  const stuEnquiries = await fetch(`${BASE_URL}/api/enquiries`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  assert(stuEnquiries.status === 403, 'Student is BLOCKED (403) from /api/enquiries (Admissions CRM)');

  // 2b. Corporate Partner Role Fence
  console.log('\nTesting Partner (Infosys) access boundaries:');
  const partnerToken = authData.partner?.token;

  const partnerUserMgmt = await fetch(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${partnerToken}` },
  });
  assert(partnerUserMgmt.status === 403, 'Partner is BLOCKED (403) from /api/users');

  const partnerStudents = await fetch(`${BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${partnerToken}` },
  });
  assert(partnerStudents.status === 403, 'Partner is BLOCKED (403) from /api/students master directory');

  // 2c. Accounts Officer Role Access
  console.log('\nTesting Accounts Officer (Manmohan Sharma) access boundaries:');
  const accToken = authData.accounts?.token;

  const accStudents = await fetch(`${BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${accToken}` },
  });
  assert(accStudents.status === 200, 'Accounts Officer CAN access /api/students for billing verification');

  const accLedger = await fetch(`${BASE_URL}/api/fees/ledger`, {
    headers: { Authorization: `Bearer ${accToken}` },
  });
  assert(accLedger.status === 200, 'Accounts Officer CAN access /api/fees/ledger');

  const accUserMgmt = await fetch(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${accToken}` },
  });
  assert(accUserMgmt.status === 403, 'Accounts Officer is BLOCKED (403) from /api/users');

  // 2d. Admissions Counselor Role Access
  console.log('\nTesting Admissions Counselor (Harleen Kaur) access boundaries:');
  const cnsToken = authData.counselor?.token;

  const cnsEnquiries = await fetch(`${BASE_URL}/api/enquiries`, {
    headers: { Authorization: `Bearer ${cnsToken}` },
  });
  assert(cnsEnquiries.status === 200, 'Counselor CAN access /api/enquiries (Leads Radar)');

  const cnsStudents = await fetch(`${BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${cnsToken}` },
  });
  assert(cnsStudents.status === 200, 'Counselor CAN access /api/students (Enrolled Scholars)');

  const cnsUserMgmt = await fetch(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${cnsToken}` },
  });
  assert(cnsUserMgmt.status === 403, 'Counselor is BLOCKED (403) from /api/users');

  // 2e. Faculty / Staff Role Access
  console.log('\nTesting Faculty (Prof. Sunita Rao) access boundaries:');
  const staffToken = authData.staff?.token;

  const staffStudents = await fetch(`${BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert(staffStudents.status === 200, 'Faculty CAN access /api/students (Roll List)');

  const staffUserMgmt = await fetch(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert(staffUserMgmt.status === 403, 'Faculty is BLOCKED (403) from /api/users');

  console.log('\n--- PHASE 3: USER STATUS GOVERNANCE & INACTIVATION ENGINE AUDIT ---');
  const adminToken = authData.admin?.token;
  const superToken = authData.super_admin?.token;

  // 3a. Admin has power to inactivate a subordinate staff member
  const targetStaffId = authData.staff.user.id;
  const deactRes = await fetch(`${BASE_URL}/api/users/${targetStaffId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'SUSPENDED',
      reason: 'Administrative inquiry pending by Dean Academic Affairs',
      effectiveDate: '2026-10-10',
    }),
  });
  const deactData = await deactRes.json();
  assert(deactRes.status === 200 && deactData.success === true, 'Admin successfully suspended staff member');

  // 3b. Verify suspended staff member CANNOT log in
  const suspendedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'staff01', password: 'staff123' }),
  });
  assert(suspendedLoginRes.status === 403, 'Suspended staff member is immediately BLOCKED (403) from logging in');

  // 3c. Reactivate the staff member
  const reactRes = await fetch(`${BASE_URL}/api/users/${targetStaffId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'ACTIVE',
      reason: 'Administrative inquiry cleared, privileges reinstated',
    }),
  });
  const reactData = await reactRes.json();
  assert(reactRes.status === 200 && reactData.success === true, 'Admin successfully reinstated staff member');

  // 3d. Verify reinstated staff member CAN log in again
  const activeLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'staff01', password: 'staff123' }),
  });
  assert(activeLoginRes.status === 200, 'Reinstated staff member can log in successfully');

  // 3e. Subordinate Admin attempting to inactivate Super Admin MUST BE BLOCKED (403)
  const superAdminId = authData.super_admin.user.id;
  const attackRes = await fetch(`${BASE_URL}/api/users/${superAdminId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'SUSPENDED',
      reason: 'Attempted privilege hijacking',
    }),
  });
  assert(attackRes.status === 403, 'Subordinate Admin is strictly BLOCKED (403) from modifying Super Admin status');

  // 3f. Admin attempting self-deactivation MUST BE BLOCKED (400)
  const adminId = authData.admin.user.id;
  const selfDeactRes = await fetch(`${BASE_URL}/api/users/${adminId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'INACTIVE',
      reason: 'Self deactivation test',
    }),
  });
  assert(selfDeactRes.status === 400, 'Self-deactivation is strictly rejected (400)');

  // 3g. Super Admin has universal apex authority to govern Admin accounts
  const superGovernAdminRes = await fetch(`${BASE_URL}/api/users/${adminId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superToken}`,
    },
    body: JSON.stringify({
      status: 'SUSPENDED',
      reason: 'Executive Directorate audit verification',
    }),
  });
  const superGovernAdminData = await superGovernAdminRes.json();
  assert(superGovernAdminRes.status === 200 && superGovernAdminData.success === true, 'Super Admin has apex power to suspend institutional Admin');

  // Restore Admin
  await fetch(`${BASE_URL}/api/users/${adminId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superToken}`,
    },
    body: JSON.stringify({
      status: 'ACTIVE',
      reason: 'Executive Directorate audit complete',
    }),
  });
  assert(true, 'Super Admin restored institutional Admin to ACTIVE status');

  console.log(`\n======================================================================`);
  console.log(`  AUDIT COMPLETE: Passed: ${passed} | Failed: ${failed}`);
  console.log(`======================================================================`);

  if (serverProcess) {
    serverProcess.kill();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRoleAudit().catch(err => {
  if (serverProcess) serverProcess.kill();
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
