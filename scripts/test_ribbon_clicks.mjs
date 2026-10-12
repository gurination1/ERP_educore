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

  await page.goto('http://127.0.0.1:3015/', { waitUntil: 'networkidle2' });

  // Clean storage
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

  console.log('Logged in URL:', page.url());

  const navButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.replace(/\n/g, ' ').trim());
  });
  console.log('Nav buttons found:', navButtons);

  // 1. Click Master Architecture
  console.log('\n--- 1. Clicking Master Architecture ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Master Architecture'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  let openModals = await page.evaluate(() => {
    const fixedEls = Array.from(document.querySelectorAll('.fixed'));
    return fixedEls.map(el => ({
      visible: el.offsetHeight > 0 && el.offsetWidth > 0,
      classes: el.className,
      text: el.innerText.slice(0, 100).replace(/\n/g, ' ')
    }));
  });
  console.log('Modals after Master Architecture click:', JSON.stringify(openModals, null, 2));

  // 2. Click Cryptographic Forensics
  console.log('\n--- 2. Clicking Cryptographic Forensics ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Cryptographic Forensics'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  openModals = await page.evaluate(() => {
    const fixedEls = Array.from(document.querySelectorAll('.fixed'));
    return fixedEls.map(el => ({
      visible: el.offsetHeight > 0 && el.offsetWidth > 0,
      classes: el.className,
      text: el.innerText.slice(0, 100).replace(/\n/g, ' ')
    }));
  });
  console.log('Modals after Cryptographic Forensics click:', JSON.stringify(openModals, null, 2));

  await browser.close();
})();
