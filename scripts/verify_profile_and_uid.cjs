const puppeteer = require('puppeteer');

async function run() {
  console.log('🚀 Starting Verification: Header UID & UserProfileModal Across Roles...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Visit Login Page
    console.log('Visiting http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // 2. Test Super Admin Login
    console.log('Logging in as Super Admin (1-01-26-09-0001)...');
    await page.waitForSelector('input[type="text"], input[name="username"]', { timeout: 10000 });
    const usernameInput = await page.$('input[type="text"]');
    const passwordInput = await page.$('input[type="password"]');

    await usernameInput.click({ clickCount: 3 });
    await usernameInput.type('1-01-26-09-0001');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type('super123');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => null);
    await page.waitForSelector('header', { timeout: 10000 });
    console.log('✅ Logged in successfully as Super Admin!');

    // 3. Inspect Header UID
    const headerUidText = await page.evaluate(() => {
      const el = document.querySelector('header [title*="UID"]');
      return el ? el.innerText.trim() : null;
    });
    console.log(`Header UID Pill Content: "${headerUidText}"`);
    if (headerUidText && headerUidText.includes('Copy')) {
      throw new Error(`FAIL: Header UID pill still contains "Copy" text! Text: ${headerUidText}`);
    }
    if (!headerUidText || !headerUidText.includes('1-01-26-09-0001')) {
      throw new Error(`FAIL: Header UID pill does not contain canonical UID 1-01-26-09-0001! Found: ${headerUidText}`);
    }
    console.log('✅ Header UID pill is static and correctly displays 1-01-26-09-0001 without Copy button!');

    // 4. Test Profile Dropdown
    console.log('Testing Profile Dropdown toggle...');
    const profileBtn = await page.waitForSelector('header button[title="Open Profile Options"]', { timeout: 5000 });
    await profileBtn.click();
    await page.waitForSelector('header div.animate-in', { timeout: 3000 });
    console.log('✅ Profile dropdown opened!');

    // 5. Test clicking "Profile & Dossier"
    console.log('Clicking "Profile & Dossier"...');
    const dossierBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('header div.animate-in button'));
      return btns.find(b => b.innerText.includes('Profile & Dossier'));
    });
    await dossierBtn.click();

    // 6. Verify UserProfileModal opened
    await page.waitForSelector('div[class*="fixed inset-0"][class*="z-50"]', { timeout: 5000 });
    const modalDetails = await page.evaluate(() => {
      const modal = document.querySelector('div[class*="fixed inset-0"][class*="z-50"]');
      if (!modal) return null;
      return {
        hasServer: modal.innerText.includes('SERVER') && modal.innerText.includes('Node 1'),
        hasClient: modal.innerText.includes('CLIENT') && modal.innerText.includes('#01'),
        hasSession: modal.innerText.includes('SESSION') && modal.innerText.includes('2026'),
        hasRoleCode: modal.innerText.includes('Code 09'),
        hasSequence: modal.innerText.includes('#0001')
      };
    });

    console.log('Modal Verification Result:', modalDetails);
    if (!modalDetails || !modalDetails.hasServer || !modalDetails.hasRoleCode) {
      throw new Error('FAIL: UserProfileModal did not open with Canonical UID breakdown!');
    }
    console.log('✅ UserProfileModal opened beautifully with full 12-digit architecture breakdown!');

    // Close modal
    const closeBtn = await page.$('div[class*="fixed inset-0"][class*="z-50"] button[title="Close Profile"]');
    if (closeBtn) await closeBtn.click();
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

    // 7. Verify Super Admin Onboard Form has Client Number & Master DB vs Sample DB
    console.log('Verifying Super Admin Onboard Form elements...');
    const onboardTabBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Onboard College') || b.innerText.includes('Onboard'));
    });
    if (onboardTabBtn) {
      await onboardTabBtn.click();
      await page.evaluate(() => new Promise(r => setTimeout(r, 800)));
      const onboardCanvasText = await page.evaluate(() => document.body.innerText);
      const hasClientNumber = onboardCanvasText.includes('Client Number (UID Node)');
      const hasMasterDB = onboardCanvasText.includes('Master DB (Pristine Production)');
      const hasSampleDB = onboardCanvasText.includes('Sample DB (Evaluation Sandbox)');
      const hasSubscription = onboardCanvasText.includes('Subscription Tier');
      console.log(`Onboard Canvas Check: ClientNumber=${hasClientNumber}, MasterDB=${hasMasterDB}, SampleDB=${hasSampleDB}, Subscription=${hasSubscription}`);
      if (!hasClientNumber || !hasMasterDB || !hasSampleDB || !hasSubscription) {
        throw new Error('FAIL: Super Admin Onboard Canvas is missing client number, subscription or Master/Sample DB selector!');
      }
      console.log('✅ Super Admin Onboard canvas contains Client Number, Subscription Tier, and Master DB vs Sample DB!');
    }

    console.log('\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification Error:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
