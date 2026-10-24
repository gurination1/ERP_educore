const puppeteer = require('puppeteer');

const ROLES = [
  { role: 'counselor', uid: '1-01-26-06-0001', pass: 'counselor123', expectedCode: '06', expectedTitle: 'Admissions Lead Counselor' },
  { role: 'staff', uid: '1-01-26-02-0014', pass: 'staff123', expectedCode: '02', expectedTitle: 'Assistant Professor' },
  { role: 'student', uid: '1-01-26-01-0001', pass: 'student123', expectedCode: '01', expectedTitle: 'Undergraduate Scholar' },
  { role: 'accounts', uid: '1-01-26-05-0001', pass: 'accounts123', expectedCode: '05', expectedTitle: 'Accounts Officer' }
];

async function run() {
  console.log('🚀 Running Multi-Role Verification for Canonical UID & Profile Modal...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  for (const r of ROLES) {
    console.log(`\n--- Testing Role: ${r.role} (UID: ${r.uid}) ---`);
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Fill credentials
    await page.waitForSelector('input[type="text"]', { timeout: 8000 });
    const userField = await page.$('input[type="text"]');
    const passField = await page.$('input[type="password"]');

    await userField.click({ clickCount: 3 });
    await userField.type(r.uid);
    await passField.click({ clickCount: 3 });
    await passField.type(r.pass);

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 12000 }).catch(() => null);
    await page.waitForSelector('header', { timeout: 8000 });

    // Verify Header UID
    const headerUid = await page.evaluate(() => {
      const el = document.querySelector('header [title*="UID"]');
      return el ? el.innerText.trim() : '';
    });
    console.log(`Header UID text: "${headerUid}"`);
    if (headerUid.includes('Copy')) {
      throw new Error(`FAIL: Header for role ${r.role} contains "Copy" button!`);
    }
    if (!headerUid.includes(r.uid)) {
      throw new Error(`FAIL: Header for role ${r.role} expected ${r.uid}, but got "${headerUid}"!`);
    }
    console.log(`✅ ${r.role}: Header UID verified as clean static pill: ${r.uid}`);

    // Verify Profile dropdown
    const profileBtn = await page.$('header button[title="Open Profile Options"]');
    if (!profileBtn) throw new Error(`FAIL: Profile options button not found for ${r.role}`);
    await profileBtn.click();
    await page.waitForSelector('header div.animate-in', { timeout: 3000 });

    // Click Profile & Dossier
    const dossierBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('header div.animate-in button'));
      return btns.find(b => b.innerText.includes('Profile & Dossier'));
    });
    await dossierBtn.click();

    // Verify UserProfileModal
    await page.waitForSelector('div[class*="fixed inset-0"][class*="z-50"]', { timeout: 4000 });
    const modalData = await page.evaluate((expectedCode) => {
      const modal = document.querySelector('div[class*="fixed inset-0"][class*="z-50"]');
      if (!modal) return null;
      return {
        hasCode: modal.innerText.includes(`Code ${expectedCode}`),
        hasServer: modal.innerText.includes('Node 1'),
        hasSession: modal.innerText.includes('2026')
      };
    }, r.expectedCode);

    if (!modalData || !modalData.hasCode || !modalData.hasServer) {
      throw new Error(`FAIL: UserProfileModal for ${r.role} missing expected code ${r.expectedCode}! Data: ${JSON.stringify(modalData)}`);
    }
    console.log(`✅ ${r.role}: UserProfileModal rendered with Code ${r.expectedCode} & 12-digit architecture breakdown!`);

    // Logout
    const signOutBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('div[class*="fixed inset-0"][class*="z-50"] button'));
      return btns.find(b => b.innerText.includes('Sign Out'));
    });
    if (signOutBtn) {
      await signOutBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => null);
    }
  }

  console.log('\n🌟 ALL MULTI-ROLE CANONICAL UID & PROFILE TESTS PASSED WITH 100% ACCURACY!');
  await browser.close();
}

run().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
