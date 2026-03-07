const { chromium } = require('playwright');

(async () => {
    console.log('--- TitanLeap Automation Engine Verification ---');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to verification target...');
    await page.goto('https://example.com');

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    const content = await page.textContent('h1');
    console.log(`Headline Found: ${content}`);

    await browser.close();
    console.log('Verification Complete: Automation Engine is functional.');
})();
