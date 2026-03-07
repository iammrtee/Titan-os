/**
 * extractXSession.js
 * Extracts your existing X/Twitter login from Chrome's Default profile
 * and saves it as auth/x.json so the daemon can post without any login popup.
 *
 * Run: node autopost/extractXSession.js
 * Requires: Chrome to be CLOSED or the script copies the DB while it's not locked.
 */
require('dotenv').config({ path: require('path').join(__dirname, 'autopost/.env') });
const { chromium } = require(require('path').join(__dirname, 'autopost/node_modules/playwright'));
const path = require('path');
const fs = require('fs');
const os = require('os');

const CHROME_PROFILE = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default');
const AUTH_OUT = path.join(__dirname, 'autopost/auth/x.json');

(async () => {
    console.log('🔍 Reading Chrome profile for X session...');

    // Launch Playwright using real Chrome with the user's Default profile
    const browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-infobars'
        ],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
        ignoreDefaultArgs: ['--enable-automation'],
    });

    const page = await browser.newPage();

    console.log('🌐 Navigating to x.com (using your existing Chrome session)...');
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Check if already logged in
    const isLoggedIn = await page.isVisible('[data-testid="SideNav_NewTweet_Button"]').catch(() => false);

    if (isLoggedIn) {
        console.log('✅ Already logged in to X! Saving session...');
        await browser.storageState({ path: AUTH_OUT });
        console.log(`✅ X session saved to: ${AUTH_OUT}`);
        console.log('🚀 The daemon will now use this session for X posts.');
    } else {
        console.log('⚠️  Not logged in to X in Chrome Default profile.');
        console.log('   Please log in to x.com in your Chrome browser, then run this script again.');
        await page.screenshot({ path: path.join(__dirname, 'autopost/debug_x_extract.png') });
    }

    await browser.close();
})().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
