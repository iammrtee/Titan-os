/**
 * manualLoginX.js
 * Launches a visible browser for you to log into X and LinkedIn.
 * Once you reach the home page, the session will be saved.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { chromium } = require('playwright');
const path = require('path');

const X_AUTH = path.join(__dirname, 'auth/x.json');
const TT_AUTH = path.join(__dirname, 'auth/tiktok.json');
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    console.log('🚀 Launching visible Chrome...');
    console.log('Please log into X and TikTok in the opened windows.');

    const browser = await chromium.launch({
        headless: false,
        executablePath: CHROME_EXE,
        args: ['--disable-blink-features=AutomationControlled'],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n1. Log into X.com...');
    await page.goto('https://x.com/i/flow/login');

    // Wait for the user to reach the home page
    await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 0 });
    console.log('✅ X login detected! Saving session...');
    await context.storageState({ path: X_AUTH });

    console.log('\n2. Now log into TikTok.com...');
    await page.goto('https://www.tiktok.com/login');

    // Wait for the user to reaching the home page (upload button visible)
    await page.waitForSelector('[data-tt="header-upload-icon"]', { timeout: 0 });
    console.log('✅ TikTok login detected! Saving session...');
    await context.storageState({ path: TT_AUTH });

    console.log('\n🎉 Both sessions saved!');
    await browser.close();
    process.exit(0);
})();
