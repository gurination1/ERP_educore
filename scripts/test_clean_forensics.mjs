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

  console.log('Testing ONLY Cryptographic Forensics on clean page...');

  const auditBtnInfo = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Cryptographic Forensics'));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return {
      text: btn.innerText.replace(/\n/g, ' ').trim(),
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  });
  console.log('Audit button info:', auditBtnInfo);

  if (auditBtnInfo) {
    console.log('Hovering on Cryptographic Forensics...');
    await page.mouse.move(auditBtnInfo.x, auditBtnInfo.y);
    await new Promise(r => setTimeout(r, 500));

    const flyout = await page.evaluate(() => {
      const f = document.querySelector('.animate-flyout');
      return f ? f.innerText.slice(0, 100).replace(/\n/g, ' ') : 'NO_FLYOUT';
    });
    console.log('Flyout state:', flyout);

    console.log('Real mouse click on Cryptographic Forensics...');
    await page.mouse.click(auditBtnInfo.x, auditBtnInfo.y);
    await new Promise(r => setTimeout(r, 1000));

    const modals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.fixed')).map(m => ({
        classes: m.className,
        text: m.innerText.slice(0, 100).replace(/\n/g, ' ')
      }));
    });
    console.log('Modals after click:', JSON.stringify(modals, null, 2));
  }

  await browser.close();
})();
