// Automated Deep Verification Test Suite: Senior Dev Directives
// 1. Enterprise UID Invariant Format: [TYPE]-[GST]-[INST]-[SEQ]
// 2. Multi-channel password recovery matrix (Email, SMS OTP, Admin override, Support)
// 3. Invisible Super Admin rule to lower admins
// 4. Omnipotent Apex Override by Super Admin
// 5. Immutable Audit Logs Engine
// 6. Tenant-agnostic Master Tables (GST States, User Types, Degrees, Docs)
// 7. Staff Academic Journey & Research Metrics (Scopus, SCI, Patents)

import http from 'http';
import { spawn } from 'child_process';

const PORT = 3001; // Run on dedicated test port to avoid conflicting
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'EduCore-Enterprise-Verification/1.0',
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
        port: url.port || 80,
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServerReady(retries = 60) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await request('GET', '/api/health');
      if (res.status === 200) return true;
    } catch (e) {
      // wait
    }
    await sleep(500);
  }
  throw new Error('Server failed to start within timeout');
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('   EDUCORE ERP DEEP ENTERPRISE VERIFICATION TEST SUITE               ');
  console.log('   Auditing: Canonical UID, Invisible SuperAdmin, Master Tables,      ');
  console.log('             Audit Logs, Recovery Matrix, Staff Academic Journey      ');
  console.log('======================================================================\n');

  // Spawn test server on PORT 3001
  const serverProcess = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  serverProcess.stderr.on('data', d => {
    // console.error('[SERVER LOG]', d.toString());
  });

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    await waitForServerReady();
    console.log(`⚡ Server active on ${BASE_URL}\n`);

    // -----------------------------------------------------------------
    // TEST GROUP 1: Canonical Master Data & GST State Code 03 (Punjab)
    // -----------------------------------------------------------------
    console.log('--- TEST GROUP 1: Tenant-Agnostic Master Tables ---');
    const masterRes = await request('GET', '/api/master-data');
    assert('Master data endpoint returns 200', masterRes.status === 200);
    const masterData = masterRes.data;
    assert('Master states table contains GST records', Array.isArray(masterData?.states) && masterData.states.length >= 10);
    const punjabState = masterData?.states?.find(s => s.gst_code === '03');
    assert('Punjab state code is canonically "03"', punjabState && punjabState.state_name === 'Punjab');

    const userTypes = masterData?.userTypes;
    assert('User types table contains canonical 4-digit codes', Array.isArray(userTypes) && userTypes.length >= 7);
    const superAdminType = userTypes?.find(t => t.type_code === '9001');
    const studentType = userTypes?.find(t => t.type_code === '1001');
    const facultyType = userTypes?.find(t => t.type_code === '2001');
    const adminType = userTypes?.find(t => t.type_code === '4001');
    assert('Super Admin role code is 9001', Boolean(superAdminType && superAdminType.role_key === 'super_admin'));
    assert('Admin role code is 4001', Boolean(adminType && adminType.role_key === 'admin'));
    assert('Faculty role code is 2001', Boolean(facultyType && facultyType.role_key === 'staff'));
    assert('Student role code is 1001', Boolean(studentType && studentType.role_key === 'student'));

    assert('Master degrees table populated (AICTE/MRSPTU)', Array.isArray(masterData?.degrees) && masterData.degrees.length >= 5);
    assert('Master document types matrix populated', Array.isArray(masterData?.documentTypes) && masterData.documentTypes.length >= 6);

    // -----------------------------------------------------------------
    // TEST GROUP 2: Multi-Role Authentication with Canonical Enterprise UID
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Canonical Enterprise UID Authentication ---');
    
    // Login Super Admin via Enterprise UID
    const superLogin = await request('POST', '/api/auth/login', {
      username: '9001-01-03-01',
      password: 'super123',
    });
    assert('Super Admin login via UID "9001-01-03-01" succeeds', superLogin.status === 200 && superLogin.data.success);
    const superToken = superLogin.data?.token;
    assert('Super Admin token issued with role super_admin', superLogin.data?.user?.role === 'super_admin');
    assert('Super Admin payload contains canonical enterprise_uid', superLogin.data?.user?.enterprise_uid === '9001-01-03-01');

    // Login Admin via Enterprise UID
    const adminLogin = await request('POST', '/api/auth/login', {
      username: '4001-01-03-01',
      password: 'admin123',
    });
    assert('Admin login via UID "4001-01-03-01" succeeds', adminLogin.status === 200 && adminLogin.data.success);
    const adminToken = adminLogin.data?.token;
    assert('Admin user role is admin', adminLogin.data?.user?.role === 'admin');

    // Login Faculty via Enterprise UID
    const staffLogin = await request('POST', '/api/auth/login', {
      username: '2001-14-03-01',
      password: 'staff123',
    });
    assert('Faculty login via UID "2001-14-03-01" succeeds', staffLogin.status === 200 && staffLogin.data.success, JSON.stringify(staffLogin));
    const staffToken = staffLogin.data?.token;
    assert('Faculty user role is staff', staffLogin.data?.user?.role === 'staff', JSON.stringify(staffLogin.data?.user));

    // Login Student via Enterprise UID
    const studentLogin = await request('POST', '/api/auth/login', {
      username: '1001-88-03-01',
      password: 'student123',
    });
    assert('Student login via UID "1001-88-03-01" succeeds', studentLogin.status === 200 && studentLogin.data.success);
    const studentToken = studentLogin.data?.token;
    assert('Student user role is student', studentLogin.data?.user?.role === 'student');

    // -----------------------------------------------------------------
    // TEST GROUP 3: Invisible Super Admin Rule
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Super Admin Invisibility & Protection Matrix ---');
    
    // Regular Admin requests user list
    const adminUsersRes = await request('GET', '/api/users', null, adminToken);
    assert('Admin can fetch user roster (200 OK)', adminUsersRes.status === 200 && adminUsersRes.data.success);
    const adminVisibleUsers = adminUsersRes.data?.users || [];
    const superAdminInAdminView = adminVisibleUsers.find(u => u.role === 'super_admin');
    assert('INVISIBILITY RULE: Super Admin is strictly hidden from regular Admin', !superAdminInAdminView);

    // Super Admin requests user list
    const superUsersRes = await request('GET', '/api/users', null, superToken);
    assert('Super Admin can fetch complete user roster', superUsersRes.status === 200);
    const allUsers = superUsersRes.data?.users || [];
    const superAdminInSuperView = allUsers.find(u => u.role === 'super_admin');
    assert('OMNIPRESENCE: Super Admin sees all users including super_admin', Boolean(superAdminInSuperView));

    // Admin attempts to delete Super Admin -> must be rejected 403
    const superUserId = superAdminInSuperView?.id || 'usr-super-01';
    const illegalDelete = await request('DELETE', `/api/users/${superUserId}`, null, adminToken);
    assert('SECURITY FENCE: Admin cannot delete Super Admin (403 Forbidden)', illegalDelete.status === 403);

    // Admin attempts to modify Super Admin -> must be rejected 403
    const illegalPatch = await request('PATCH', `/api/users/${superUserId}`, { full_name: 'Hacked Name' }, adminToken);
    assert('SECURITY FENCE: Admin cannot mutate Super Admin (403 Forbidden)', illegalPatch.status === 403);

    // Admin attempts to promote self to super_admin -> must be rejected 403
    const illegalPromote = await request('PATCH', `/api/users/${adminLogin.data?.user?.id}`, { role: 'super_admin' }, adminToken);
    assert('SECURITY FENCE: Admin cannot promote account to super_admin (403 Forbidden)', illegalPromote.status === 403);

    // -----------------------------------------------------------------
    // TEST GROUP 4: Super Admin Apex Universal Override
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Super Admin Omnipotent Apex Override ---');
    
    // Regular admin attempts Apex override -> must be 403
    const targetUserId = adminLogin.data?.user?.id;
    const adminAttemptOverride = await request('PATCH', `/api/users/${targetUserId}/override`, {
      fullName: 'Unauthorized Edit',
      reason: 'Illegal override attempt',
    }, adminToken);
    assert('Subordinate Admin cannot invoke Apex Override (403 Forbidden)', adminAttemptOverride.status === 403);

    // Super admin executes Apex override
    const newName = `Dr. Paramjit Singh (${Date.now()})`;
    const apexOverrideRes = await request('PATCH', `/api/users/${targetUserId}/override`, {
      fullName: newName,
      role: 'admin',
      reason: 'Executive institutional governance designation update by Super Admin',
    }, superToken);
    assert('Super Admin Apex Override succeeds (200 OK)', apexOverrideRes.status === 200 && apexOverrideRes.data.success);
    assert('Target user full_name successfully mutated', apexOverrideRes.data?.user?.full_name === newName);

    // -----------------------------------------------------------------
    // TEST GROUP 5: Immutable Audit Logs Engine
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Immutable Cryptographic Audit Logs Engine ---');
    
    // Super admin queries audit logs
    const auditRes = await request('GET', '/api/audit-logs?limit=50', null, superToken);
    assert('Audit logs retrieved successfully (200 OK)', auditRes.status === 200 && auditRes.data.success);
    const logs = auditRes.data?.logs || [];
    assert('Audit logs table contains entries', logs.length > 0);

    const hasLoginSuccess = logs.some(l => l.action === 'AUTH_LOGIN_SUCCESS');
    assert('Audit log captures AUTH_LOGIN_SUCCESS', hasLoginSuccess);

    const apexLog = logs.find(l => l.action === 'USER_OVERRIDE_APEX');
    assert('Audit log captures USER_OVERRIDE_APEX with actor_role super_admin', Boolean(apexLog && apexLog.actor_role === 'super_admin'));
    assert('Audit log preserves target changes diff', Boolean(apexLog?.changes_diff && apexLog.changes_diff.includes('Paramjit')));

    // Non-admin attempting to view audit logs -> must be 403
    const staffAuditRes = await request('GET', '/api/audit-logs', null, staffToken);
    assert('SECURITY FENCE: Faculty cannot read institutional audit logs (403)', staffAuditRes.status === 403);

    // -----------------------------------------------------------------
    // TEST GROUP 6: Multi-Channel Password Recovery Matrix
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Multi-Channel Password Recovery Matrix ---');
    
    const policyRes = await request('GET', '/api/auth/forgot-password/policy');
    assert('Forgot password policy returns 4 channels', policyRes.status === 200 && policyRes.data?.channels?.length === 4);
    
    // Channel 1: Request SMS OTP
    const smsReq = await request('POST', '/api/auth/forgot-password/sms-otp', {
      identifier: 'aryan@educore.edu',
    });
    assert('SMS OTP request generated with TRAI DLT payload', smsReq.status === 200 && smsReq.data.success);
    assert('SMS response masks student phone number', typeof smsReq.data?.maskedPhone === 'string');

    // Channel 2: Verify SMS OTP
    const smsVerify = await request('POST', '/api/auth/verify-sms-otp', {
      otpSessionToken: smsReq.data?.otpSessionToken,
      otp: smsReq.data?.demoOtpHint || '849201',
      newPassword: 'newStudentPass123!',
    });
    assert('SMS OTP verification updates credentials', smsVerify.status === 200 && smsVerify.data.success);

    // Re-verify login with new password
    const reLogin = await request('POST', '/api/auth/login', {
      username: 'aryan@educore.edu',
      password: 'newStudentPass123!',
    });
    assert('Student successfully authenticates with new credential', reLogin.status === 200 && reLogin.data.success);

    // Reset password back to standard 'student123'
    await request('PATCH', `/api/users/${studentLogin.data?.user?.id}/override`, {
      fullName: studentLogin.data?.user?.full_name,
      password: 'student123',
      reason: 'Test suite tear-down credential reset',
    }, superToken);

    // -----------------------------------------------------------------
    // TEST GROUP 7: Staff Management & Academic Journey
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Staff Management & Academic Journey R&D ---');
    
    const journeyRes = await request('GET', '/api/staff/academic-journey', null, staffToken);
    assert('Staff academic journey list fetched', journeyRes.status === 200 && journeyRes.data.success);
    
    // Add new Ph.D. qualification & Scopus record
    const addJourney = await request('POST', `/api/staff/${staffLogin.data?.user?.id}/academic-journey`, {
      qualification_level: 'PhD',
      degree_name: 'Doctor of Philosophy (Computer Science & AI)',
      awarding_university: 'MRSPTU Campus / Thapar Institute',
      year_of_passing: 2023,
      specialization: 'Distributed Cryptographic Systems',
      scopus_publications: 8,
      sci_publications: 5,
      patents_count: 2,
    }, staffToken);
    assert('Staff academic journey record added successfully', addJourney.status === 201 && addJourney.data.success);
    assert('Research metrics recorded correctly', addJourney.data?.academicJourney?.scopus_publications === 8);

    // -----------------------------------------------------------------
    // TEST GROUP 8: Dynamic UID Generation for Newly Provisioned Users
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Dynamic Enterprise UID Assignment ---');
    
    const newUserRes = await request('POST', '/api/users', {
      username: 'harpreet.research' + Date.now().toString().slice(-4),
      email: `harpreet.${Date.now().toString().slice(-4)}@educore.edu`,
      password: 'SecurePass987!',
      role: 'staff',
      fullName: 'Dr. Harpreet Singh',
      department: 'Electrical Engineering',
      designation: 'Associate Professor',
    }, adminToken);
    assert('Admin provisions new staff member', newUserRes.status === 201 && newUserRes.data.success);
    const assignedUid = newUserRes.data?.user?.enterprise_uid;
    assert('Newly provisioned staff receives canonical Enterprise UID', Boolean(assignedUid));
    const uidRegex = /^2001-[0-9]{2}-03-01$/;
    assert(`Assigned UID matches canonical pattern: ${assignedUid}`, uidRegex.test(assignedUid));

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`  VERIFICATION RESULTS:  ${passed} PASSED  |  ${failed} FAILED`);
    console.log('======================================================================');

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  } finally {
    serverProcess.kill('SIGTERM');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
