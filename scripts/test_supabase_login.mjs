import { handleSupabaseRequest } from '../src/api/supabaseAdapter.ts';

async function testLogins() {
  console.log('Testing Supabase Adapter Logins for canonical UIDs...');
  const testCases = [
    { uid: '10126060001', pass: 'counselor123', expectedRole: 'counselor' },
    { uid: '10126010001', pass: 'student123', expectedRole: 'student' },
    { uid: '10126040001', pass: 'admin123', expectedRole: 'admin' },
    { uid: '10126090001', pass: 'admin123', expectedRole: 'super_admin' },
    { uid: '10126020014', pass: 'faculty123', expectedRole: 'staff' },
    { uid: '10126030001', pass: 'hod123', expectedRole: 'hod' },
    { uid: '10126050001', pass: 'accounts123', expectedRole: 'accounts' },
    { uid: '10126070001', pass: 'partner123', expectedRole: 'partner' },
    { uid: '10126080001', pass: 'hr123', expectedRole: 'hr' },
    { uid: '10126100001', pass: 'hostel123', expectedRole: 'hostel' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await handleSupabaseRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: tc.uid, password: tc.pass })
    });
    if (res && res.success && res.user && res.user.role === tc.expectedRole) {
      console.log(`[PASS] Login ${tc.uid} -> Role: ${res.user.role}, Name: ${res.user.full_name}, UID: ${res.user.enterprise_uid}`);
      passed++;
    } else {
      console.error(`[FAIL] Login ${tc.uid} -> Error:`, res ? res.error : 'No response');
    }
  }

  console.log(`Result: ${passed}/${testCases.length} logins passed.`);
  if (passed === testCases.length) {
    console.log('ALL 10 CANONICAL ROLES AUTHENTICATE 100% IN SUPABASE ADAPTER!');
  } else {
    process.exit(1);
  }
}

testLogins();
