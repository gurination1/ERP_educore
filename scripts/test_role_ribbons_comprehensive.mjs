import puppeteer from 'puppeteer-core';

const TARGET_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function runTests() {
  console.log('======================================================================');
  console.log('  MULTI-ROLE RIBBON & NAVIGATION INTEGRATION TEST SUITE');
  console.log(`  Target URL: ${TARGET_URL}`);
  console.log('======================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS]: ${message}`);
      totalPassed++;
    } else {
      console.error(`  ❌ [FAIL]: ${message}`);
      totalFailed++;
    }
  }

  async function loginAs(uid, password) {
    await page.goto(`${TARGET_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    });
    await page.goto(`${TARGET_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button', { timeout: 10000 });

    const clickedQuick = await page.evaluate((u) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const q = btns.find(b => b.innerText.includes(u));
      if (q) {
        q.click();
        return true;
      }
      return false;
    }, uid);

    if (!clickedQuick) {
      await page.waitForSelector('input[type="text"], #login-username-input', { timeout: 5000 });
      await page.type('#login-username-input, input[type="text"]', uid);
      await page.type('#login-password-input, input[type="password"]', password);
    }

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForSelector('header nav', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 600));
  }

  async function clickRibbon(label) {
    const success = await page.evaluate((lbl) => {
      const navButtons = Array.from(document.querySelectorAll('header nav button'));
      const btn = navButtons.find(b => b.innerText.includes(lbl));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, label);
    await new Promise(r => setTimeout(r, 600));
    return success;
  }

  async function openFlyout(label) {
    const success = await page.evaluate((lbl) => {
      const navButtons = Array.from(document.querySelectorAll('header nav button'));
      const btn = navButtons.find(b => b.innerText.includes(lbl));
      if (btn) {
        const arrow = btn.querySelector('span[role="button"]');
        if (arrow) {
          arrow.click();
          return true;
        }
        const parentDiv = btn.closest('div');
        if (parentDiv) {
          parentDiv.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, label);
    await new Promise(r => setTimeout(r, 400));
    return success;
  }

  async function clickFlyoutItem(label) {
    const success = await page.evaluate((lbl) => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn = allButtons.find(b => b.innerText.includes(lbl));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, label);
    await new Promise(r => setTimeout(r, 600));
    return success;
  }

  try {
    // ----------------------------------------------------
    // TEST 1: HR & ESTABLISHMENT (8001-01-03-01)
    // ----------------------------------------------------
    console.log('--- 1. AUDITING HR ROLE (8001-01-03-01) ---');
    await loginAs('8001-01-03-01', 'hr123');

    const hrNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  HR Header Strip Pills:', hrNavLabels);
    assert(hrNavLabels.includes('HRMS Overview'), 'HR has HRMS Overview pill');
    assert(hrNavLabels.includes('Status & Lifecycle'), 'HR has Status & Lifecycle pill');
    assert(hrNavLabels.includes('Payroll & Deductions'), 'HR has Payroll & Deductions pill');
    assert(hrNavLabels.includes('Exit NOC & Clearances'), 'HR has Exit NOC & Clearances pill');
    assert(hrNavLabels.includes('Staff Dossier & Docs'), 'HR has Staff Dossier & Docs pill');

    // Click Status & Lifecycle
    await clickRibbon('Status & Lifecycle');
    assert(page.url().includes('tab=journey'), 'HR Status & Lifecycle sets URL tab=journey');
    const isJourney = await page.evaluate(() => document.body.innerText.includes('Lifecycle') || document.body.innerText.includes('Journey'));
    assert(isJourney, 'HR Status & Lifecycle view rendered');

    // Click Exit NOC
    await clickRibbon('Exit NOC & Clearances');
    assert(page.url().includes('tab=exit-noc'), 'HR Exit NOC sets URL tab=exit-noc');

    // Click Staff Dossier
    await clickRibbon('Staff Dossier & Docs');
    assert(page.url().includes('teacher-documents'), 'HR Staff Dossier navigates to /teacher-documents without redirecting');

    // ----------------------------------------------------
    // TEST 2: STUDENT (1001-88-03-01)
    // ----------------------------------------------------
    console.log('\n--- 2. AUDITING STUDENT ROLE (1001-88-03-01) ---');
    await loginAs('1001-88-03-01', 'student123');

    const studentNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Student Header Strip Pills:', studentNavLabels);
    assert(studentNavLabels.includes('Scholar Home'), 'Student has Scholar Home pill');
    assert(studentNavLabels.includes('Attendance & Classes'), 'Student has Attendance & Classes pill');
    assert(studentNavLabels.includes('Tuition & Dues'), 'Student has Tuition & Dues pill');
    assert(studentNavLabels.includes('Admit Card & Exams'), 'Student has Admit Card & Exams pill');
    assert(studentNavLabels.includes('Syllabus & LMS'), 'Student has Syllabus & LMS pill');
    assert(studentNavLabels.includes('Compliance & Help'), 'Student has Compliance & Help pill');

    // Click Attendance & Classes
    await clickRibbon('Attendance & Classes');
    assert(page.url().includes('view=attendance'), 'Clicking Attendance updates URL with view=attendance');
    const hasAttendanceElem = await page.$('#student-attendance-section');
    assert(Boolean(hasAttendanceElem), 'Attendance section #student-attendance-section exists in DOM');

    // Trigger Admit Card Modal via flyout
    await openFlyout('Admit Card & Exams');
    const clickedAdmit = await clickFlyoutItem('Download Admit Card & Hall Ticket');
    assert(clickedAdmit, 'Clicked Download Admit Card & Hall Ticket in flyout');
    const isAdmitModalOpen = await page.evaluate(() => document.body.innerText.includes('MRSPTU') || document.body.innerText.includes('ADMIT CARD'));
    assert(isAdmitModalOpen, 'MRSPTU Admit Card modal rendered');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('✕') || b.innerText.includes('Back'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Click Tuition & Dues
    await clickRibbon('Tuition & Dues');
    assert(page.url().includes('/fees'), 'Student Tuition & Dues navigates to /fees');

    // Click Compliance & Help
    await clickRibbon('Compliance & Help');
    assert(page.url().includes('student-documents'), 'Student Compliance & Help navigates to /student-documents');

    // ----------------------------------------------------
    // TEST 3: CORPORATE PARTNER (7001-01-03-01)
    // ----------------------------------------------------
    console.log('\n--- 3. AUDITING CORPORATE PARTNER ROLE (7001-01-03-01) ---');
    await loginAs('7001-01-03-01', 'partner123');

    const partnerNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Partner Header Strip Pills:', partnerNavLabels);
    assert(partnerNavLabels.includes('Placements Home'), 'Partner has Placements Home pill');
    assert(partnerNavLabels.includes('Campus Talent Pool'), 'Partner has Campus Talent Pool pill');
    assert(partnerNavLabels.includes('Placement Drives'), 'Partner has Placement Drives pill');

    await clickRibbon('Campus Talent Pool');
    assert(page.url().includes('tab=talent'), 'Clicking Campus Talent Pool sets tab=talent');

    await clickRibbon('Placement Drives');
    assert(page.url().includes('tab=jobs'), 'Clicking Placement Drives sets tab=jobs');

    // ----------------------------------------------------
    // TEST 4: ACCOUNTS & BURSAR (5001-05-03-01)
    // ----------------------------------------------------
    console.log('\n--- 4. AUDITING ACCOUNTS ROLE (5001-05-03-01) ---');
    await loginAs('5001-05-03-01', 'accounts123');

    const accNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Accounts Header Strip Pills:', accNavLabels);
    assert(accNavLabels.includes('Collections Home'), 'Accounts has Collections Home pill');
    assert(accNavLabels.includes('Exam Clearance'), 'Accounts has Exam Clearance pill');
    assert(accNavLabels.includes('Financial Reports'), 'Accounts has Financial Reports pill');

    await clickRibbon('Exam Clearance');
    assert(page.url().includes('examination?tab=admit-card'), 'Accounts clicking Exam Clearance sets examination?tab=admit-card');

    await clickRibbon('Financial Reports');
    assert(page.url().includes('reports'), 'Accounts clicking Financial Reports navigates to /reports');

    // ----------------------------------------------------
    // TEST 5: HOD ROLE (3001-01-03-01)
    // ----------------------------------------------------
    console.log('\n--- 5. AUDITING HOD ROLE (3001-01-03-01) ---');
    await loginAs('3001-01-03-01', 'hod123');

    const hodNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  HOD Header Strip Pills:', hodNavLabels);
    assert(hodNavLabels.includes('HOD Desk'), 'HOD has HOD Desk pill');
    assert(hodNavLabels.includes('Department Faculty'), 'HOD has Department Faculty pill');
    assert(hodNavLabels.includes('Academics'), 'HOD has Academics pill');

    await clickRibbon('Department Faculty');
    assert(page.url().includes('staff-management'), 'HOD clicking Department Faculty navigates to /staff-management');

    await clickRibbon('Academics');
    assert(page.url().includes('academics'), 'HOD clicking Academics navigates to /academics');

    // ----------------------------------------------------
    // TEST 6: FACULTY / STAFF ROLE (2001-14-03-01)
    // ----------------------------------------------------
    console.log('\n--- 6. AUDITING STAFF ROLE (2001-14-03-01) ---');
    await loginAs('2001-14-03-01', 'staff123');

    const staffNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Staff Header Strip Pills:', staffNavLabels);
    assert(staffNavLabels.includes('Faculty Desk'), 'Staff has Faculty Desk pill');
    assert(staffNavLabels.includes('Faculty Dossier'), 'Staff has Faculty Dossier pill');
    assert(staffNavLabels.includes('Academics'), 'Staff has Academics pill');

    await clickRibbon('Faculty Dossier');
    assert(page.url().includes('teacher-documents'), 'Staff clicking Faculty Dossier navigates to /teacher-documents');

    // ----------------------------------------------------
    // TEST 7: COUNSELOR ROLE (6001-02-03-01)
    // ----------------------------------------------------
    console.log('\n--- 7. AUDITING COUNSELOR ROLE (6001-02-03-01) ---');
    await loginAs('6001-02-03-01', 'counselor123');

    const counselorNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Counselor Header Strip Pills:', counselorNavLabels);
    assert(counselorNavLabels.includes('Counselor Desk'), 'Counselor has Counselor Desk pill');
    assert(counselorNavLabels.includes('Admissions CRM'), 'Counselor has Admissions CRM pill');

    await clickRibbon('Admissions CRM');
    assert(page.url().includes('enquiries'), 'Counselor clicking Admissions CRM navigates to /enquiries');

    // ----------------------------------------------------
    // TEST 8: INSTITUTIONAL ADMIN (4001-01-03-01)
    // ----------------------------------------------------
    console.log('\n--- 8. AUDITING INSTITUTIONAL ADMIN ROLE (4001-01-03-01) ---');
    await loginAs('4001-01-03-01', 'admin123');

    const adminNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Admin Header Strip Pills:', adminNavLabels);
    assert(adminNavLabels.includes('Operations Console'), 'Admin has Operations Console pill');
    assert(adminNavLabels.includes('Tuition & Ledgers'), 'Admin has Tuition & Ledgers pill');
    assert(adminNavLabels.includes('Faculty & HRMS'), 'Admin has Faculty & HRMS pill');

    await clickRibbon('Tuition & Ledgers');
    assert(page.url().includes('fees'), 'Admin clicking Tuition & Ledgers navigates to /fees');

    await clickRibbon('Faculty & HRMS');
    assert(page.url().includes('staff-management'), 'Admin clicking Faculty & HRMS navigates to /staff-management');

    // ----------------------------------------------------
    // TEST 9: SUPER ADMIN APEX (9001-01-03-01)
    // ----------------------------------------------------
    console.log('\n--- 9. AUDITING SUPER ADMIN ROLE (9001-01-03-01) ---');
    await loginAs('9001-01-03-01', 'super123');

    const superNavLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace('▾', '').trim());
    });
    console.log('  Super Admin Header Strip Pills:', superNavLabels);
    assert(superNavLabels.includes('Platform Overview'), 'Super Admin has Platform Overview pill');
    assert(superNavLabels.includes('Tenants & Campuses'), 'Super Admin has Tenants & Campuses pill');
    assert(superNavLabels.includes('Database & Telemetry'), 'Super Admin has Database & Telemetry pill');
    assert(superNavLabels.includes('Cryptographic Forensics'), 'Super Admin has Cryptographic Forensics pill');

    await clickRibbon('Tenants & Campuses');
    assert(page.url().includes('tenants'), 'Super Admin clicking Tenants & Campuses navigates to /tenants');

    await clickRibbon('Database & Telemetry');
    assert(page.url().includes('telemetry'), 'Super Admin clicking Database & Telemetry navigates to /telemetry');

    await clickRibbon('Cryptographic Forensics');
    assert(page.url().includes('audit-logs'), 'Super Admin clicking Cryptographic Forensics navigates to /audit-logs');

  } catch (err) {
    console.error('Test execution error:', err);
    totalFailed++;
  } finally {
    await browser.close();

    console.log('\n======================================================================');
    console.log(`  RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
    console.log(`  SUCCESS RATE: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log('======================================================================\n');

    process.exit(totalFailed > 0 ? 1 : 0);
  }
}

runTests();
