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
  console.log(`[TEST] Starting 3D Flip Card and Runtime Safeguard Verification against ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Track console errors
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });

    // 1. Visit Login Page
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-forgot-password-trigger', { timeout: 8000 });
    console.log('✅ Login page loaded successfully');

    // 2. Test Forgot Password 3D Flip
    await page.click('#login-forgot-password-trigger');
    await new Promise(r => setTimeout(r, 800)); // wait for 3D flip animation

    let isFlippedForgot = await page.evaluate(() => {
      const card = document.querySelector('.transform-style-3d');
      return card && card.classList.contains('rotate-y-180');
    });
    if (!isFlippedForgot) throw new Error('Card did not flip to rotate-y-180 on Forgot Password trigger');
    console.log('✅ 3D Coin Flip to Forgot Password verified (rotate-y-180)');

    // Click "Back to Sign In"
    const backBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Back to Sign In'));
    });
    if (!backBtn) throw new Error('Back to Sign In button not found on back face');
    await backBtn.click();
    await new Promise(r => setTimeout(r, 800));

    let isFrontFace = await page.evaluate(() => {
      const card = document.querySelector('.transform-style-3d');
      return card && card.classList.contains('rotate-y-0');
    });
    if (!isFrontFace) throw new Error('Card did not return to rotate-y-0 from Forgot Password');
    console.log('✅ 3D Flip back to Sign In verified (rotate-y-0)');

    // 3. Test Contact Admin 3D Flip (reverse direction)
    await page.click('#login-contact-admin-trigger');
    await new Promise(r => setTimeout(r, 800));

    let isFlippedContact = await page.evaluate(() => {
      const card = document.querySelector('.transform-style-3d');
      return card && card.classList.contains('-rotate-y-180');
    });
    if (!isFlippedContact) throw new Error('Card did not flip to -rotate-y-180 on Contact Admin trigger');
    console.log('✅ 3D Coin Flip to Contact Admin verified (-rotate-y-180 reverse rotation)');

    // Click "Back to Sign In"
    const backBtn2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Back to Sign In'));
    });
    if (!backBtn2) throw new Error('Back to Sign In button not found on Contact Admin face');
    await backBtn2.click();
    await new Promise(r => setTimeout(r, 800));

    isFrontFace = await page.evaluate(() => {
      const card = document.querySelector('.transform-style-3d');
      return card && card.classList.contains('rotate-y-0');
    });
    if (!isFrontFace) throw new Error('Card did not return to rotate-y-0 from Contact Admin');
    console.log('✅ 3D Flip back to Sign In from Contact Admin verified');

    await page.close();

    // 4. Test all 9 roles to ensure NO toLocaleString error or ErrorBoundary crash
    console.log('\n[TEST] Verifying all 9 roles for toLocaleString / ErrorBoundary immunity...');
    for (const role of ROLES) {
      const roleContext = await browser.createBrowserContext();
      const rolePage = await roleContext.newPage();
      await rolePage.setViewport({ width: 1440, height: 900 });

      const roleErrors = [];
      rolePage.on('pageerror', err => roleErrors.push(err.message));

      await rolePage.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
      await rolePage.waitForSelector(`button[data-demo-role="${role}"]`, { timeout: 8000 });
      await rolePage.click(`button[data-demo-role="${role}"]`);

      // Wait for authenticated view
      await rolePage.waitForSelector('#header-campus-switcher, header', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 1000));

      // Check if ErrorBoundary triggered
      const bodyText = await rolePage.evaluate(() => document.body.innerText);
      if (bodyText.includes('RUNTIME SAFEGUARD') || bodyText.includes('Application View Recovered')) {
        throw new Error(`Role [${role}] triggered RUNTIME SAFEGUARD: ${bodyText.slice(0, 300)}`);
      }
      if (bodyText.includes('toLocaleString')) {
        throw new Error(`Role [${role}] crashed with toLocaleString error`);
      }
      if (roleErrors.some(e => e.includes('toLocaleString'))) {
        throw new Error(`Role [${role}] page error: ${roleErrors.join('; ')}`);
      }

      console.log(`✅ Role [${role}] verified: NO ErrorBoundary, NO toLocaleString error`);
      await roleContext.close();
    }

    console.log('\n🎉 ALL 3D FLIP INTERACTIONS AND ROLE RUNTIME SAFEGUARD CHECKS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
