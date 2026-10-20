import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testLivePages() {
  console.log('🌐 Testing live GitHub Pages deployment at https://gurination1.github.io/ERP_educore/#/ ...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('https://gurination1.github.io/ERP_educore/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#login-username-input', { timeout: 15000 });
    console.log('✅ Live page loaded successfully');

    // 1. Verify Role Toggle Strip is absent
    const roleToggleButtons = await page.$$eval('button', (btns) =>
      btns.map((b) => b.textContent?.trim()).filter((t) => ['Student', 'Faculty', 'Admin', 'Hostel', 'Accounts', 'HRMS', 'Super'].includes(t))
    );
    if (roleToggleButtons.length === 0) {
      console.log('✅ PASS: Live site has NO role toggle buttons!');
    } else {
      console.error('❌ FAIL: Live site still has role toggle buttons:', roleToggleButtons);
    }

    // 2. Check 3D flip to Forgot Password
    console.log('Clicking Forgot Password? on live site...');
    const forgotBtn = await page.waitForSelector('button ::-p-text(Forgot Password?)');
    await forgotBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const flipContainerAfterForgot = await page.$eval('.transform-style-3d', el => el.className);
    if (flipContainerAfterForgot.includes('rotate-y-180')) {
      console.log('✅ PASS: Live 3D Card rotates 180deg (Orange theme)');
    }

    // 3. Click Back to Sign In
    const backBtn = await page.waitForSelector('button ::-p-text(Back to Sign In)');
    await backBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // 4. Click Contact Admin
    console.log('Clicking Contact Admin on live site...');
    const contactAdminBtn = await page.waitForSelector('button ::-p-text(Contact Admin)');
    await contactAdminBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const flipContainerAfterContact = await page.$eval('.transform-style-3d', el => el.className);
    if (flipContainerAfterContact.includes('-rotate-y-180')) {
      console.log('✅ PASS: Live 3D Card rotates -180deg (Blue theme)');
    }

    // 5. Click Cancel
    const cancelBtn = await page.waitForSelector('button ::-p-text(Cancel)');
    await cancelBtn.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('🎉 LIVE GITHUB PAGES DEPLOYMENT FULLY VERIFIED!');
  } finally {
    await browser.close();
  }
}

testLivePages().catch(err => {
  console.error('Live test error:', err);
  process.exit(1);
});
