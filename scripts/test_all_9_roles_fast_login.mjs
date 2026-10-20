import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:3012';

const ROLES = [
  'admin',
  'super_admin',
  'staff',
  'hod',
  'student',
  'accounts',
  'counselor',
  'hostel',
  'partner'
];

async function run() {
  console.log(`[TEST] Testing 1-Click Fast Login for all 9 roles against ${BASE_URL}`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const role of ROLES) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      // Navigate to login
      await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(`button[data-demo-role="${role}"]`, { timeout: 8000 });

      // Click demo button
      await page.click(`button[data-demo-role="${role}"]`);

      // Wait for navigation / header render
      await page.waitForSelector('#header-campus-switcher, header', { timeout: 8000 });
      const currentUrl = page.url();
      console.log(`✅ Role [${role}] logged in successfully! Route: ${currentUrl}`);

      await context.close();
    }

    console.log('\n🎉 ALL 9 ROLES AUTHENTICATED AND NAVIGATED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
