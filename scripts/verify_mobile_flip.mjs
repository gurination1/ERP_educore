import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testMobileFlip() {
  console.log('--- TESTING MOBILE FLIP FOR DOUBLE BAR ---');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Android viewport 1080x2400 (scale 2.5 or standard mobile 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Click Forgot Password
    const forgotBtn = await page.waitForSelector('#login-forgot-password-trigger');
    await forgotBtn.click();
    await new Promise(r => setTimeout(r, 800)); // wait for flip

    // Capture screenshot
    await page.screenshot({ path: '/root/test_mobile_forgot_password.png' });
    console.log('Screenshot saved to /root/test_mobile_forgot_password.png');

    // Verify DOM contains only Send Details and NOT Submit Concern
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    const hasSendDetails = bodyHtml.includes('Send Details');
    const hasSubmitConcern = bodyHtml.includes('Submit Concern');

    console.log('Contains "Send Details":', hasSendDetails ? 'PASS' : 'FAIL');
    console.log('Contains "Submit Concern" while on Forgot Password (double bar bug):', hasSubmitConcern ? 'FAIL (BUG STILL PRESENT)' : 'PASS (COMPLETELY REMOVED)');

    // Flip to Helpdesk / Contact Admin
    const helpdeskBtn = await page.waitForSelector('button:has-text("Helpdesk"), button::-p-text("Helpdesk")').catch(async () => {
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await b.evaluate(el => el.textContent);
        if (text && text.includes('Helpdesk')) return b;
      }
      return null;
    });

    if (helpdeskBtn) {
      await helpdeskBtn.click();
      await new Promise(r => setTimeout(r, 800));

      const bodyHtmlAdmin = await page.evaluate(() => document.body.innerHTML);
      const hasSendDetailsInAdmin = bodyHtmlAdmin.includes('Send Details');
      const hasSubmitConcernInAdmin = bodyHtmlAdmin.includes('Submit Concern');

      console.log('Contact Admin view - Contains "Submit Concern":', hasSubmitConcernInAdmin ? 'PASS' : 'FAIL');
      console.log('Contact Admin view - Contains "Send Details":', hasSendDetailsInAdmin ? 'FAIL (leak)' : 'PASS (clean)');
    }

    console.log('--- MOBILE FLIP TEST COMPLETED ---');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

testMobileFlip();
