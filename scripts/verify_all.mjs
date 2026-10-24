import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function verify() {
  console.log('--- STARTING VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Check Login page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

    // Verify initial theme (midnight slate)
    const initialBgClass = await page.$eval('#root > div', el => el.className);
    console.log('Initial Login page classes:', initialBgClass);

    // Click "Forgot Password?"
    console.log('Clicking "Forgot Password?" button...');
    const forgotBtn = await page.waitForSelector('button:has-text("Forgot Password?"), button::-p-text("Forgot Password?")', { timeout: 5000 }).catch(async () => {
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await b.evaluate(el => el.textContent);
        if (text && text.includes('Forgot Password?')) return b;
      }
      return null;
    });

    if (forgotBtn) {
      await forgotBtn.click();
      await new Promise(r => setTimeout(r, 800)); // wait for 3d flip animation
      const forgotBgClass = await page.$eval('#root > div', el => el.className);
      console.log('Forgot Password flipped classes:', forgotBgClass);
      const isOrangeTheme = forgotBgClass.includes('from-[#1c0800]') || forgotBgClass.includes('to-[#0e0400]');
      console.log('Theme changed to Amber/Orange:', isOrangeTheme ? 'PASS' : 'FAIL');

      // Click "Return to Login"
      const backBtn = await page.waitForSelector('button:has-text("Back to Secure Login"), button::-p-text("Back to Secure Login")', { timeout: 3000 }).catch(async () => {
        const btns = await page.$$('button');
        for (const b of btns) {
          const text = await b.evaluate(el => el.textContent);
          if (text && text.includes('Back to Secure Login')) return b;
        }
        return null;
      });
      if (backBtn) {
        await backBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }
    }

    // Click "Contact Campus Admin"
    console.log('Clicking "Contact Campus Admin" button...');
    const contactBtn = await page.waitForSelector('button:has-text("Contact Campus Admin"), button::-p-text("Contact Campus Admin")', { timeout: 5000 }).catch(async () => {
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await b.evaluate(el => el.textContent);
        if (text && text.includes('Contact Campus Admin')) return b;
      }
      return null;
    });

    if (contactBtn) {
      await contactBtn.click();
      await new Promise(r => setTimeout(r, 800)); // wait for 3d flip animation
      const contactBgClass = await page.$eval('#root > div', el => el.className);
      console.log('Contact Admin flipped classes:', contactBgClass);
      const isBlueTheme = contactBgClass.includes('from-[#020b24]') || contactBgClass.includes('to-[#010512]');
      console.log('Theme changed to Sapphire/Blue:', isBlueTheme ? 'PASS' : 'FAIL');

      // Click "Back to Login"
      const backBtn2 = await page.waitForSelector('button:has-text("Back to Secure Sign-In"), button::-p-text("Back to Secure Sign-In")', { timeout: 3000 }).catch(async () => {
        const btns = await page.$$('button');
        for (const b of btns) {
          const text = await b.evaluate(el => el.textContent);
          if (text && text.includes('Back to Secure Sign-In')) return b;
        }
        return null;
      });
      if (backBtn2) {
        await backBtn2.click();
        await new Promise(r => setTimeout(r, 800));
      }
    }

    // 2. Login as Super Admin (10126090001 / admin123)
    console.log('Logging in as Super Admin (10126090001)...');
    await page.type('input[type="text"], input[name="identifier"], input[placeholder*="UID"]', '10126090001');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // Check Header in Super Admin
    const headerHtml = await page.$eval('header', el => el.innerHTML).catch(() => '');
    const hasCopilot = headerHtml.includes('AI Copilot') || headerHtml.includes('Copilot');
    console.log('Header has AI Copilot:', hasCopilot ? 'FAIL (still present)' : 'PASS (removed)');

    const headerText = await page.$eval('header', el => el.innerText).catch(() => '');
    console.log('Header UID text check:', headerText.includes('10126090001') ? 'PASS (10126090001 present)' : 'FAIL');
    console.log('Header has hyphenated UID (1-01-26):', headerText.includes('1-01-26') ? 'FAIL' : 'PASS');
    console.log('Header has "Copy":', headerText.includes('Copy') ? 'FAIL' : 'PASS (no copy button)');

    // 3. Logout and login as Student (10126010001 / student123)
    console.log('Logging out and testing Student Portal...');
    // Click user dropdown or navigate to login
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    // Clear localStorage to reset session
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    console.log('Logging in as Student (10126010001)...');
    await page.type('input[type="text"], input[name="identifier"], input[placeholder*="UID"]', '10126010001');
    await page.type('input[type="password"]', 'student123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // Check Student view
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasLegacyStu = bodyText.includes('STU-2023-088') || bodyText.includes('STU-');
    const hasCanonicalStuUid = bodyText.includes('10126010001');
    const hasHyphenatedStuUid = bodyText.includes('1-01-26-01-0001');

    console.log('Student Portal - contains STU- ID:', hasLegacyStu ? 'FAIL (legacy STU- found)' : 'PASS (no legacy STU-)');
    console.log('Student Portal - contains pure digit canonical UID 10126010001:', hasCanonicalStuUid ? 'PASS' : 'FAIL');
    console.log('Student Portal - contains hyphenated UID:', hasHyphenatedStuUid ? 'FAIL' : 'PASS');

    console.log('--- VERIFICATION COMPLETED ---');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

verify();
