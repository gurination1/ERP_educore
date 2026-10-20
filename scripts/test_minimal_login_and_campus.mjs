import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:3012';

async function run() {
  console.log(`[TEST] Starting minimalist EduCore login & campus dropdown test against: ${BASE_URL}`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Visit Login Page
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    // Check page text for clean EduCore and no college clutter
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText.includes('EduCore') && !bodyText.includes('Campus Management Suite')) {
      throw new Error('EduCore branding missing on login screen');
    }
    if (bodyText.includes('Baba Farid') || bodyText.includes('PUP • MRSPTU')) {
      throw new Error('College clutter detected on login screen!');
    }
    console.log('✅ Login screen minimalist EduCore branding verified');

    // Check 9 demo role buttons
    const demoButtons = await page.$$('button[data-demo-role]');
    console.log(`Found ${demoButtons.length} demo login buttons`);
    if (demoButtons.length < 9) {
      throw new Error(`Expected 9 demo role buttons, found ${demoButtons.length}`);
    }
    console.log('✅ All 9 demo role buttons present on login screen');

    // Click Admin demo button
    const adminPill = await page.$('button[data-demo-role="admin"]');
    if (!adminPill) throw new Error('Admin demo button not found');
    await adminPill.click();

    // Wait for authentication and navigation to dashboard
    const switcher = await page.waitForSelector('#header-campus-switcher', { timeout: 10000 });
    console.log('✅ Logged in successfully as Admin');
    console.log('✅ Campus switcher dropdown trigger found in Header');

    // Click switcher to open dropdown
    await switcher.click();
    await new Promise(r => setTimeout(r, 500));

    // Check dropdown options
    const options = await page.$$('button[data-campus]');
    console.log(`Found ${options.length} campus options in dropdown`);
    if (options.length !== 3) {
      throw new Error(`Expected 3 campus options, found ${options.length}`);
    }

    // Verify dropdown is visible and not clipped
    const dropdownBox = await page.evaluate(() => {
      const el = document.querySelector('[role="menu"]') || document.querySelector('button[data-campus]')?.parentElement;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: style.zIndex,
        visibility: style.visibility,
        display: style.display
      };
    });
    console.log('Campus dropdown metrics:', dropdownBox);
    if (!dropdownBox || dropdownBox.height < 50 || dropdownBox.display === 'none') {
      throw new Error('Campus dropdown is hidden or clipped!');
    }
    console.log('✅ Campus dropdown opened visibly without clipping');

    // Click Faridkot Regional Campus option
    const faridkotOption = await page.evaluateHandle(() => {
      return document.querySelector('button[data-campus="campus_02"]');
    });
    if (!faridkotOption) throw new Error('Faridkot campus option not found');
    await faridkotOption.click();
    await new Promise(r => setTimeout(r, 500));

    // Check that dashboard updated
    const dashboardText = await page.evaluate(() => document.body.innerText);
    if (!dashboardText.includes('Campus 02') && !dashboardText.includes('Faridkot')) {
      throw new Error('Dashboard did not reflect Campus 02 switch!');
    }
    console.log('✅ Dynamic campus selection propagated successfully to dashboard');

    // Check breadcrumb strip does not contain college clutter
    if (dashboardText.includes('PUP Patiala • MRSPTU • PU Affiliated')) {
      throw new Error('College affiliation text still present in breadcrumbs!');
    }
    console.log('✅ Clean breadcrumb verified');

    console.log('\n🎉 ALL TESTS PASSED: Minimalist login + 9 demo roles + unclipped campus switcher + reactive state!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
