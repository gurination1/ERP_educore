import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:3012';

const SCREENS = [
  'admin-dashboard',
  'super-admin-dashboard',
  'staff-dashboard',
  'student-dashboard',
  'fee-ledger',
  'enquiries',
  'admissions',
  'manage-students',
  'academics',
  'examination',
  'staff-management',
  'user-management',
  'reports',
  'hostel-management',
  'transport-management',
  'partner-portal',
  'student-documents',
  'grievances',
  'scholarships',
  'form-builder',
  'bulk-import',
  'student-quiz-lms',
  'payment-gateways'
];

async function run() {
  console.log(`[PROBE] Probing all screens across multiple roles against ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const rolesToTest = ['admin', 'super_admin', 'student', 'staff', 'accounts', 'hostel'];

    for (const role of rolesToTest) {
      console.log(`\n================ Testing Role: ${role} ================`);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Login as role
      await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(`button[data-demo-role="${role}"]`, { timeout: 8000 });
      await page.click(`button[data-demo-role="${role}"]`);
      await page.waitForSelector('#header-campus-switcher, header', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 600));

      // Check current dashboard text
      let bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('RUNTIME SAFEGUARD') || bodyText.includes('Application View Recovered')) {
        console.error(`💥 CRASH ON DEFAULT VIEW FOR ROLE [${role}]:`, bodyText.slice(0, 300));
        throw new Error(`Crash on default view for role [${role}]`);
      }

      // If admin, test navigating to screens
      if (role === 'admin' || role === 'super_admin') {
        for (const screen of SCREENS) {
          try {
            await page.evaluate((s) => {
              window.location.hash = `#/${s}`;
            }, screen);
            await new Promise(r => setTimeout(r, 600));

            bodyText = await page.evaluate(() => document.body.innerText);
            if (bodyText.includes('RUNTIME SAFEGUARD') || bodyText.includes('Application View Recovered') || bodyText.includes('toLocaleString')) {
              console.error(`💥 CRASH ON SCREEN [${screen}] FOR ROLE [${role}]! Details:`);
              const details = await page.evaluate(() => {
                const el = document.querySelector('.bg-red-50');
                return el ? el.innerText : document.body.innerText.slice(0, 400);
              });
              console.error(details);
              throw new Error(`CRASH on screen [${screen}]: ${details}`);
            } else {
              console.log(`  ✓ Screen [${screen}] OK`);
            }
          } catch (e) {
            console.error(`  ❌ Error visiting [${screen}]:`, e.message);
            throw e;
          }
        }
      }

      // If student, test all tabs and modals
      if (role === 'student') {
        const studentRoutes = [
          'student-dashboard',
          'examination?tab=regular',
          'examination?tab=reappear',
          'examination?tab=admit-card',
          'examination?tab=datesheet',
          'academics?tab=syllabus',
          'academics?tab=timetable',
          'student-quiz-lms',
          'fee-ledger'
        ];
        for (const route of studentRoutes) {
          await page.evaluate((r) => {
            window.location.hash = `#/${r}`;
          }, route);
          await new Promise(r => setTimeout(r, 600));

          bodyText = await page.evaluate(() => document.body.innerText);
          if (bodyText.includes('RUNTIME SAFEGUARD') || bodyText.includes('Application View Recovered')) {
            console.error(`💥 CRASH ON ROUTE [${route}] FOR STUDENT! Details:`);
            const details = await page.evaluate(() => {
              const el = document.querySelector('.bg-red-50');
              return el ? el.innerText : document.body.innerText.slice(0, 400);
            });
            console.error(details);
            throw new Error(`CRASH on student route [${route}]: ${details}`);
          } else {
            console.log(`  ✓ Student Route [${route}] OK`);
          }
        }

        // Try clicking Pay Now button or Admit card button if present
        const payBtn = await page.$('#student-pay-now-btn');
        if (payBtn) {
          await payBtn.click();
          await new Promise(r => setTimeout(r, 500));
          bodyText = await page.evaluate(() => document.body.innerText);
          if (bodyText.includes('RUNTIME SAFEGUARD')) {
            throw new Error('Crash on opening Pay Now modal!');
          }
          console.log('  ✓ Pay Now Modal OK');
        }
      }

      // If hostel, test tabs
      if (role === 'hostel') {
        const hostelTabs = ['all', 'b1', 'g1', 'mess', 'maintenance'];
        for (const tab of hostelTabs) {
          await page.evaluate((t) => {
            window.location.hash = `#/hostel-management?tab=${t}`;
          }, tab);
          await new Promise(r => setTimeout(r, 500));
          bodyText = await page.evaluate(() => document.body.innerText);
          if (bodyText.includes('RUNTIME SAFEGUARD')) {
            throw new Error(`Crash on hostel tab [${tab}]!`);
          }
          console.log(`  ✓ Hostel tab [${tab}] OK`);
        }
      }

      // If accounts, test fee ledger tabs
      if (role === 'accounts') {
        const feeTabs = ['ledger', 'defaulters', 'heads', 'discounts', 'gateways'];
        for (const tab of feeTabs) {
          await page.evaluate((t) => {
            window.location.hash = `#/fee-ledger?view=${t}`;
          }, tab);
          await new Promise(r => setTimeout(r, 500));
          bodyText = await page.evaluate(() => document.body.innerText);
          if (bodyText.includes('RUNTIME SAFEGUARD')) {
            throw new Error(`Crash on fee ledger tab [${tab}]!`);
          }
          console.log(`  ✓ Fee Ledger tab [${tab}] OK`);
        }
      }

      await context.close();
    }

    console.log('\n🎉 ALL SCREENS, ROLES, TABS, AND MODALS PROBED WITH ZERO RUNTIME CRASHES!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Probe failed:', err);
  process.exit(1);
});
