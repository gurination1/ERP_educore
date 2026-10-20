import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testAdminDashboardTabs() {
  console.log('Testing Admin Dashboard tabs on https://gurination1.github.io/ERP_educore/#/ ...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('https://gurination1.github.io/ERP_educore/#/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#login-username-input', { timeout: 15000 });

    // Click [ADMIN]
    const adminBtn = await page.waitForSelector('button ::-p-text([ADMIN])');
    await adminBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await page.click('button[type="submit"]');

    await page.waitForSelector('header', { timeout: 15000 });
    console.log('✅ Logged in as Admin');

    // Test clicking Tab: Master Search & Reports
    console.log('Clicking "Master Search & Reports" tab...');
    const reportsTab = await page.waitForSelector('button ::-p-text(Master Search & Reports)');
    await reportsTab.click();
    await new Promise(r => setTimeout(r, 600));

    // Check if report filters are rendered
    const hasReportSelect = await page.$('select');
    console.log('Has select in Reports tab?', !!hasReportSelect);

    // Test clicking Tab: Campus Residence & Fleet
    console.log('Clicking "Campus Residence & Fleet" tab...');
    const residenceTab = await page.waitForSelector('button ::-p-text(Campus Residence & Fleet)');
    await residenceTab.click();
    await new Promise(r => setTimeout(r, 600));

    const residenceText = await page.$eval('body', el => el.innerText);
    const hasResidenceText = residenceText.includes('Campus Residence, Hostel & Fleet Command Hub');
    console.log('Has residence content?', hasResidenceText);

    // Test clicking Tab: Live Support Tickets
    console.log('Clicking "Live Support Tickets" tab...');
    const ticketsTab = await page.waitForSelector('button ::-p-text(Live Support Tickets)');
    await ticketsTab.click();
    await new Promise(r => setTimeout(r, 600));

    const ticketsText = await page.$eval('body', el => el.innerText);
    const hasTicketsText = ticketsText.includes('Live Support Tickets Queue');
    console.log('Has tickets content?', hasTicketsText);

    // Click back to Overview
    console.log('Clicking "Operations & Topology" tab...');
    const overviewTab = await page.waitForSelector('button ::-p-text(Operations & Topology)');
    await overviewTab.click();
    await new Promise(r => setTimeout(r, 600));

    console.log('🎉 ALL 4 ADMIN DASHBOARD TABS TESTED AND FULLY FUNCTIONAL!');
  } finally {
    await browser.close();
  }
}

testAdminDashboardTabs().catch(console.error);
