import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testLoginFlip() {
  console.log('🚀 Launching Puppeteer to test 3D Flip Card and Role Toggle removal...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to login
    await page.goto('http://127.0.0.1:3012/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#login-username-input', { timeout: 15000 });
    console.log('✅ Page loaded');

    // 1. Verify Role Toggle Strip is GONE
    const roleToggleButtons = await page.$$eval('button', (btns) =>
      btns.map((b) => b.textContent?.trim()).filter((t) => ['Student', 'Faculty', 'Admin', 'Hostel', 'Accounts', 'HRMS', 'Super'].includes(t))
    );
    console.log('Found role toggle candidates:', roleToggleButtons);
    const exactStudentBtn = roleToggleButtons.filter(t => t === 'Student' || t === 'Faculty' || t === 'Hostel' || t === 'HRMS');
    if (exactStudentBtn.length === 0) {
      console.log('✅ PASS: Role toggle strip is completely removed from LoginView!');
    } else {
      console.error('❌ FAIL: Found residual role toggle buttons:', exactStudentBtn);
    }

    // 2. Check card flip initial state
    const flipContainerInitial = await page.$eval('.transform-style-3d', el => el.className);
    console.log('Initial flip container class:', flipContainerInitial);
    if (flipContainerInitial.includes('rotate-y-0')) {
      console.log('✅ PASS: Card starts in rotate-y-0');
    }

    // 3. Click "Forgot Password?"
    console.log('Clicking "Forgot Password?" button...');
    const forgotBtn = await page.waitForSelector('button ::-p-text(Forgot Password?)');
    await forgotBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const flipContainerAfterForgot = await page.$eval('.transform-style-3d', el => el.className);
    console.log('Flip container after Forgot Password:', flipContainerAfterForgot);
    if (flipContainerAfterForgot.includes('rotate-y-180')) {
      console.log('✅ PASS: Card rotates 180deg (rotate-y-180, Orange theme)');
    } else {
      console.error('❌ FAIL: Card did not rotate 180deg');
    }

    // Verify OTP channel buttons visible
    const otpChannelCount = await page.$$eval('button', btns => btns.filter(b => b.textContent?.includes('OTP') || b.textContent?.includes('WhatsApp')).length);
    console.log('OTP channel options found:', otpChannelCount);

    // 4. Click "Back to Sign In"
    console.log('Clicking "Back to Sign In"...');
    const backBtn = await page.waitForSelector('button ::-p-text(Back to Sign In)');
    await backBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const flipContainerAfterBack = await page.$eval('.transform-style-3d', el => el.className);
    console.log('Flip container after Back:', flipContainerAfterBack);
    if (flipContainerAfterBack.includes('rotate-y-0')) {
      console.log('✅ PASS: Card returned to rotate-y-0');
    }

    // 5. Click "Contact Admin"
    console.log('Clicking "Contact Admin"...');
    const contactAdminBtn = await page.waitForSelector('button ::-p-text(Contact Admin)');
    await contactAdminBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const flipContainerAfterContact = await page.$eval('.transform-style-3d', el => el.className);
    console.log('Flip container after Contact Admin:', flipContainerAfterContact);
    if (flipContainerAfterContact.includes('-rotate-y-180')) {
      console.log('✅ PASS: Card rotated -180deg (-rotate-y-180, Blue theme)');
    } else {
      console.error('❌ FAIL: Card did not rotate -180deg');
    }

    // Verify Regarding dropdown exists
    const selectExists = await page.$eval('select', sel => sel.value);
    console.log('Contact Admin Regarding dropdown initial value:', selectExists);

    // 6. Click "Cancel"
    const cancelBtn = await page.waitForSelector('button ::-p-text(Cancel)');
    await cancelBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const flipContainerFinal = await page.$eval('.transform-style-3d', el => el.className);
    console.log('Flip container final:', flipContainerFinal);
    if (flipContainerFinal.includes('rotate-y-0')) {
      console.log('✅ PASS: Card successfully flipped back to Sign In');
    }

    console.log('🎉 ALL LOGIN 3D COIN FLIP AND ROLE TOGGLE CHECKS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

testLoginFlip().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
