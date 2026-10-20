import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://127.0.0.1:3012/#/login', { waitUntil: 'networkidle0' });
  console.log('Page URL:', page.url());
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== PAGE TEXT START ===');
  console.log(text);
  console.log('=== PAGE TEXT END ===');

  await page.screenshot({ path: '/root/college-erp-educore/screenshots_audit/login_test.png' });
  await browser.close();
})();
