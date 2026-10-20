import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function debugHostelLogin() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://127.0.0.1:3012/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#login-username-input', { timeout: 15000 });

    await page.type('#login-username-input', '10001-01-03-01');
    await page.type('#login-password-input', 'warden123');

    // Click submit
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 3000));
    console.log('Current URL after submit:', page.url());

    const hasHeader = await page.$('header');
    console.log('Has header?', !!hasHeader);

    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('Body text sample:', bodyText.slice(0, 300));
  } finally {
    await browser.close();
  }
}

debugHostelLogin().catch(console.error);
