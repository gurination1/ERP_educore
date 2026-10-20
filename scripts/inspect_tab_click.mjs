import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function inspectTab() {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://gurination1.github.io/ERP_educore/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button ::-p-text([ADMIN])');
  await (await page.$('button ::-p-text([ADMIN])')).click();
  await (await page.$('button[type="submit"]')).click();
  await page.waitForSelector('header');

  const tab = await page.waitForSelector('button ::-p-text(Campus Residence & Fleet)');
  console.log('Tab outerHTML:', await page.evaluate(el => el.outerHTML, tab));
  await tab.click();
  await new Promise(r => setTimeout(r, 1000));
  console.log('Tab class after click:', await page.evaluate(el => el.className, tab));
  console.log('All H3s on page:', await page.$$eval('h3', els => els.map(e => e.innerText)));
  await browser.close();
}

inspectTab().catch(console.error);
