import { createRequire } from 'module';
const req = createRequire('/usr/lib/node_modules/');
const puppeteer = req('puppeteer');

const TARGET_URL = process.env.BASE_URL || 'https://gurination1.github.io/ERP_educore';

console.log(`[TEST AUDIT] Running deep role audit against: ${TARGET_URL}`);

const ROLES = [
  { role: 'super_admin', uid: '9001-01-03-01', pass: 'super123', tabs: ['Platform Overview', 'Tenants & Campuses', 'Universal Access & RBAC', 'Master Architecture', 'Cryptographic Forensics', 'Database & Telemetry'] },
  { role: 'admin', uid: '4001-01-03-01', pass: 'admin123', tabs: ['Operations Console', 'Admissions Desk', 'Tuition & Ledgers', 'Student Directory', 'Academics & Exams', 'Faculty & HRMS', 'Institutional Governance'] },
  { role: 'staff', uid: '2001-14-03-01', pass: 'staff123', tabs: ['Faculty Desk', 'Academics', 'Students', 'Examination', 'Faculty Dossier', 'Grievances'] },
  { role: 'hod', uid: '3001-01-03-01', pass: 'hod123', tabs: ['HOD Desk', 'Academics', 'Department Students', 'Examination', 'Department Faculty', 'Academic Reports', 'Grievances'] },
  { role: 'counselor', uid: '6001-02-03-01', pass: 'counselor123', tabs: ['Counselor Desk', 'Admissions CRM', 'Enrolled Scholars', 'Fees & Scholarships', 'Grievances'] },
  { role: 'accounts', uid: '5001-05-03-01', pass: 'accounts123', tabs: ['Collections Home', 'Fee Ledger & Registers', 'Student Directory', 'Exam Clearance', 'Financial Reports'] },
  { role: 'student', uid: '1001-88-03-01', pass: 'student123', tabs: ['Scholar Home', 'Attendance & Classes', 'Tuition & Dues', 'Admit Card & Exams', 'Syllabus & LMS', 'Compliance & Help'] },
  { role: 'partner', uid: '7001-01-03-01', pass: 'partner123', tabs: ['Placements Home', 'Campus Talent Pool', 'Placement Drives'] },
  { role: 'hr', uid: '8001-01-03-01', pass: 'hr123', tabs: ['HRMS Overview', 'Faculty & Staff Roster', 'Status & Lifecycle', 'Payroll & Deductions', 'Exit NOC & Clearances', 'Staff Dossier & Docs', 'Grievances'] },
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', err => {
    errors.push(`[PAGE ERROR] ${err.message}`);
    console.error(`  ❌ [BROWSER EXCEPTION] ${err.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon 404
      if (!text.includes('favicon.ico')) {
        errors.push(`[CONSOLE ERROR] ${text}`);
        console.error(`  ⚠️ [CONSOLE ERROR] ${text}`);
      }
    }
  });

  for (const r of ROLES) {
    console.log(`\n======================================================`);
    console.log(`  AUDITING ROLE: ${r.role.toUpperCase()} (${r.uid})`);
    console.log(`======================================================`);

    try {
      // 1. Fresh load
      await page.goto(`${TARGET_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.goto(`${TARGET_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

      // 2. Login
      await page.waitForSelector('#login-username-input', { timeout: 10000 });
      await page.evaluate(() => {
        document.querySelector('#login-username-input').value = '';
        document.querySelector('#login-password-input').value = '';
      });
      await page.type('#login-username-input', r.uid);
      await page.type('#login-password-input', r.pass);
      await page.click('button[type="submit"]');

      // 3. Wait for header & main content
      await page.waitForSelector('header', { timeout: 15000 });
      await new Promise(res => setTimeout(res, 1000));

      const headerText = await page.evaluate(() => document.querySelector('header')?.innerText || '');
      console.log(`  Header loaded. Text snippet: ${headerText.substring(0, 80).replace(/\n/g, ' ')}...`);

      // 4. Test clicking each ribbon tab
      for (const tab of r.tabs) {
        console.log(`  Testing tab: "${tab}"...`);
        const clicked = await page.evaluate(tabName => {
          const btns = Array.from(document.querySelectorAll('header nav button, header nav a'));
          const target = btns.find(b => b.innerText.includes(tabName));
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, tab);

        if (!clicked) {
          console.warn(`  ⚠️ Tab button not found directly: "${tab}"`);
        } else {
          await new Promise(res => setTimeout(res, 800));
          const bodyText = await page.evaluate(() => document.querySelector('main')?.innerText?.substring(0, 100).replace(/\n/g, ' ') || '');
          console.log(`    Content after clicking [${tab}]: "${bodyText}"`);
        }
      }

      console.log(`  ✅ Role [${r.role}] navigation passed without fatal crash.`);
    } catch (err) {
      console.error(`  ❌ Failed testing role [${r.role}]:`, err.message);
      errors.push(`Role ${r.role} failed: ${err.message}`);
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`  AUDIT COMPLETE: Total errors caught: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`  Errors summary:`);
    errors.slice(0, 15).forEach(e => console.log(`    - ${e}`));
  }
  console.log(`======================================================`);
}

run().catch(console.error);
