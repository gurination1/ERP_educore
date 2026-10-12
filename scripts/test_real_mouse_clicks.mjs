import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://127.0.0.1:3015/admin', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://127.0.0.1:3015/admin', { waitUntil: 'networkidle2' });

  await page.waitForSelector('#login-username-input', { timeout: 10000 });
  await page.type('#login-username-input', '9001-01-03-01');
  await page.type('#login-password-input', 'super123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('header nav button', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Finding button coordinates for Master Architecture and Cryptographic Forensics...');

  // Get bounding box of Master Architecture
  const buttonsInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header nav button'));
    return btns.map((b, idx) => {
      const rect = b.getBoundingClientRect();
      return {
        idx,
        text: b.innerText.replace(/\n/g, ' ').trim(),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
      };
    });
  });
  console.log('Nav buttons layout:', JSON.stringify(buttonsInfo, null, 2));

  // Test 1: Real Mouse hover then Real Mouse Click on Master Architecture
  const archInfo = buttonsInfo.find(b => b.text.includes('Master Architecture'));
  if (archInfo) {
    console.log('\n--- 1. Mouse moving to Master Architecture at', archInfo.x + archInfo.width / 2, archInfo.y + archInfo.height / 2);
    await page.mouse.move(archInfo.x + archInfo.width / 2, archInfo.y + archInfo.height / 2);
    await new Promise(r => setTimeout(r, 500));

    // Check if flyout opened
    const flyoutVisible = await page.evaluate(() => {
      const flyout = document.querySelector('.animate-flyout');
      return flyout ? flyout.innerText.slice(0, 100).replace(/\n/g, ' ') : null;
    });
    console.log('Flyout under Master Architecture:', flyoutVisible);

    console.log('--- Real mouse click on Master Architecture button ---');
    await page.mouse.click(archInfo.x + archInfo.width / 2, archInfo.y + archInfo.height / 2);
    await new Promise(r => setTimeout(r, 1000));

    const modals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.fixed')).map(m => ({
        classes: m.className,
        text: m.innerText.slice(0, 100).replace(/\n/g, ' ')
      }));
    });
    console.log('Modals after real click on Master Architecture:', JSON.stringify(modals, null, 2));
  }

  // Test 2: Real Mouse hover then Real Mouse Click on Cryptographic Forensics
  const auditInfo = buttonsInfo.find(b => b.text.includes('Cryptographic Forensics'));
  if (auditInfo) {
    console.log('\n--- 2. Mouse moving to Cryptographic Forensics at', auditInfo.x + auditInfo.width / 2, auditInfo.y + auditInfo.height / 2);
    await page.mouse.move(auditInfo.x + auditInfo.width / 2, auditInfo.y + auditInfo.height / 2);
    await new Promise(r => setTimeout(r, 500));

    // Check if flyout opened
    const flyoutVisible = await page.evaluate(() => {
      const flyout = document.querySelector('.animate-flyout');
      return flyout ? flyout.innerText.slice(0, 100).replace(/\n/g, ' ') : null;
    });
    console.log('Flyout under Cryptographic Forensics:', flyoutVisible);

    console.log('--- Real mouse click on Cryptographic Forensics button ---');
    await page.mouse.click(auditInfo.x + auditInfo.width / 2, auditInfo.y + auditInfo.height / 2);
    await new Promise(r => setTimeout(r, 1000));

    const modals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.fixed')).map(m => ({
        classes: m.className,
        text: m.innerText.slice(0, 100).replace(/\n/g, ' ')
      }));
    });
    console.log('Modals after real click on Cryptographic Forensics:', JSON.stringify(modals, null, 2));
  }

  await browser.close();
})();
