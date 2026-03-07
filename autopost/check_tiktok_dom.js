const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkTiktokDom() {
    const authPath = path.join(__dirname, 'auth/tiktok.json');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    console.log("Navigating...");
    await page.goto('https://www.tiktok.com/tiktokstudio/upload?is_photo=1', { timeout: 60000 });

    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(__dirname, 'tiktok_studio_landing.png') });

    const inputs = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('input[type="file"]'));
        return els.map(e => ({ accept: e.getAttribute('accept'), id: e.id, class: e.className }));
    });
    console.log("File inputs found:", inputs);

    const buttons = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, div[role="button"]'));
        return els.map(e => e.innerText || e.textContent).filter(t => t && t.toLowerCase().includes('photo'));
    });
    console.log("Photo related buttons:", buttons);

    await browser.close();
}

checkTiktokDom();
