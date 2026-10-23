import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');
import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

const ROLES = [
  'admin',
  'super_admin',
  'staff',
  'hod',
  'student',
  'accounts',
  'counselor',
  'hostel',
  'hr',
  'partner'
];

async function run() {
  console.log(`[ZERO-POPUP AUDIT] Testing all 10 roles against ${BASE_URL}...`);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    for (const role of ROLES) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      page.on('pageerror', err => {
        console.error(`  [PAGE_ERROR] [${role}]:`, err.message);
      });

      // 1. Visit Login
      await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(`button[data-demo-role="${role}"]`, { timeout: 10000 });

      // 2. Click 1-Click Fast Login
      await page.click(`button[data-demo-role="${role}"]`);
      await page.waitForSelector('header, #header-campus-switcher', { timeout: 12000 });
      await new Promise(r => setTimeout(r, 600));

      // 3. Check for any illegal floating modal backdrops or popups
      const floatingBackdrops = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        return els.filter(el => {
          const style = window.getComputedStyle(el);
          const className = String((typeof el.className === 'string' ? el.className : el.className?.baseVal) || '');
          const hasFixedInset = (style.position === 'fixed' && (className.includes('inset-0') || className.includes('inset-y-0')));
          const hasModalBackdrop = className.includes('bg-black/60') || className.includes('bg-black/50');
          return hasFixedInset || hasModalBackdrop;
        }).map(el => ({
          tag: el.tagName,
          className: String((typeof el.className === 'string' ? el.className : el.className?.baseVal) || ''),
          text: (el.textContent || '').slice(0, 40)
        }));
      });

      assert.strictEqual(floatingBackdrops.length, 0, `Role ${role} has floating popup overlays: ${JSON.stringify(floatingBackdrops)}`);

      console.log(`✓ Role [${role.padEnd(11)}] Verified: Clean Canvas Navigation, Zero Floating Popups`);

      await context.close();
    }

    console.log('\n================================================================');
    console.log('>>> ALL 10 ROLES VERIFIED: 100% ZERO-POPUP CANVAS ARCHITECTURE <<<');
    console.log('================================================================\n');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
