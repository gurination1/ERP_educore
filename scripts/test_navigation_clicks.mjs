import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const ROLES = ['admin', 'super_admin', 'staff', 'hod', 'student', 'accounts', 'counselor', 'hostel', 'hr', 'partner'];

async function testClicks() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  for (const role of ROLES) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`button[data-demo-role="${role}"]`, { timeout: 10000 });
    await page.click(`button[data-demo-role="${role}"]`);
    await page.waitForSelector('header', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Get all navigation links/buttons in Tier 2 ribbon
    const navItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('nav button, nav a'));
      return items.map((el, i) => ({
        index: i,
        text: (el.textContent || '').trim().replace(/\s+/g, ' '),
        tag: el.tagName
      })).filter(x => x.text.length > 0 && x.text.length < 60);
    });

    console.log(`\n======================================================`);
    console.log(`[ROLE: ${role}] Found ${navItems.length} navigation items:`);
    for (const item of navItems) {
      console.log(`  - [${item.tag}] ${item.text}`);
    }

    // Now test clicking each top-level nav button and inspecting flyout or page transition
    for (let i = 0; i < navItems.length; i++) {
      try {
        const buttons = await page.$$('nav button, nav a');
        if (buttons[i]) {
          await buttons[i].click();
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (err) {
        console.error(`  [CLICK_ERROR] Failed clicking item ${i} (${navItems[i]?.text}):`, err.message);
      }
    }

    if (errors.length > 0) {
      console.log(`  ❌ Errors occurred during clicks in role ${role}:`, errors);
    } else {
      console.log(`  ✓ All ${navItems.length} clicks executed without runtime exceptions`);
    }

    await context.close();
  }

  await browser.close();
}

testClicks().catch(console.error);
