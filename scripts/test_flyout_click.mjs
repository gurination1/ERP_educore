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

  console.log('Testing click on FLYOUT ITEM inside Master Architecture...');

  // 1. Hover on Master Architecture
  const archBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Master Architecture'));
    const rect = btn.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });

  await page.mouse.move(archBtn.x, archBtn.y);
  await new Promise(r => setTimeout(r, 500));

  // Find flyout item 'State GST Codes (GST-01 to 37)'
  const itemCoords = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.animate-flyout button'));
    const item = items.find(b => b.innerText.includes('State GST Codes'));
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { text: item.innerText, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  console.log('Flyout item coords:', itemCoords);

  if (itemCoords) {
    console.log('Clicking flyout item...');
    await page.mouse.click(itemCoords.x, itemCoords.y);
    await new Promise(r => setTimeout(r, 1000));

    const modals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.fixed')).map(m => ({
        classes: m.className,
        text: m.innerText.slice(0, 100).replace(/\n/g, ' ')
      }));
    });
    console.log('Modals after flyout item click:', JSON.stringify(modals, null, 2));
  }

  await browser.close();
})();
