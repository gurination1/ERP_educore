import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testClickableElements() {
  console.log('🔍 Testing clickable elements on live site https://gurination1.github.io/ERP_educore/#/ ...');
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

    await page.goto('https://gurination1.github.io/ERP_educore/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#login-username-input', { timeout: 15000 });

    // Test clicking Instant Demo Accounts button: [ADMIN] 4001-01-03-01
    console.log('Clicking [ADMIN] demo account button on login...');
    const adminDemoBtn = await page.waitForSelector('button ::-p-text([ADMIN])');
    await adminDemoBtn.click();
    await new Promise(r => setTimeout(r, 400));

    const usernameVal = await page.$eval('#login-username-input', el => el.value);
    console.log('Username field after clicking demo button:', usernameVal);

    // Click submit
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    await page.waitForSelector('header', { timeout: 15000 });
    console.log('✅ Logged in successfully, header visible!');

    // 1. Check all navigation ribbon buttons in header
    const navButtons = await page.$$('header nav button');
    console.log(`Found ${navButtons.length} navigation ribbon buttons in header.`);

    for (let i = 0; i < navButtons.length; i++) {
      const btn = navButtons[i];
      const text = await page.evaluate(el => el.innerText.trim(), btn);
      const isClickable = await page.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return el.contains(topEl) || topEl?.contains(el);
      }, btn);
      console.log(`  Tab [${text}]: clickable=${isClickable}`);
    }

    // Try clicking "Admissions Desk"
    console.log('Attempting to click "Admissions Desk"...');
    const admBtn = await page.waitForSelector('header nav button ::-p-text(Admissions Desk)');
    await admBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('URL after clicking Admissions Desk:', page.url());

    // Try clicking "Tuition & Ledgers"
    console.log('Attempting to click "Tuition & Ledgers"...');
    const feeBtn = await page.waitForSelector('header nav button ::-p-text(Tuition & Ledgers)');
    await feeBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('URL after clicking Tuition & Ledgers:', page.url());

    // Try clicking "Student Directory"
    console.log('Attempting to click "Student Directory"...');
    const stuBtn = await page.waitForSelector('header nav button ::-p-text(Student Directory)');
    await stuBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('URL after clicking Student Directory:', page.url());

    // Try clicking "Operations Console" (Dashboard)
    console.log('Attempting to click "Operations Console"...');
    const opBtn = await page.waitForSelector('header nav button ::-p-text(Operations Console)');
    await opBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('URL after clicking Operations Console:', page.url());

    // In Dashboard, test the 4 dashboard tabs: Overview, Reports, Residence, Tickets
    const dashTabs = await page.$$eval('#educore-app-root button', btns =>
      btns.filter(b => ['Executive Overview', 'Accreditation Reports', 'Residence Governance', 'Support Tickets Queue'].some(t => b.innerText.includes(t))).map(b => b.innerText)
    );
    console.log('Dashboard tabs found:', dashTabs);

  } finally {
    await browser.close();
  }
}

testClickableElements().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
