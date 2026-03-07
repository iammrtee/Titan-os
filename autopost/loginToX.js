/**
 * loginToX.js
 * Automatically logs into X via Google Sign-in.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { chromium } = require('playwright');
const path = require('path');

const AUTH_OUT = path.join(__dirname, 'auth/x.json');
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    console.log('🚀 Launching X Login via Google Flow...');

    let browser;
    let page;
    try {
        browser = await chromium.launch({
            headless: false,
            executablePath: CHROME_EXE,
            args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
            ignoreDefaultArgs: ['--enable-automation'],
        });

        const ctx = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });

        await ctx.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        page = await ctx.newPage();
        const sleep = (ms) => new Promise(r => setTimeout(r, ms + Math.random() * 2000));

        console.log('🌐 Navigating to X login...');
        await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle' });
        await sleep(3000);

        console.log('🖱️ Clicking Sign in with Google...');
        // The Google button is often in an iframe or a complex div
        const googleBtn = await page.waitForSelector('button:has-text("Sign in with Google")', { timeout: 15000 });
        await googleBtn.click();
        await sleep(4000);

        // Google flow usually happens in a popup or same window depending on implementation
        // Check if we are on accounts.google.com
        if (page.url().includes('google.com')) {
            console.log('📧 Entering Google Email...');
            await page.waitForSelector('input[type="email"]', { timeout: 15000 });
            await page.fill('input[type="email"]', 'titanleapstudio@gmail.com');
            await page.keyboard.press('Enter');
            await sleep(3000);

            console.log('🔑 Entering Google Password...');
            await page.waitForSelector('input[type="password"]', { timeout: 15000 });
            await page.fill('input[type="password"]', 'TL_support247$');
            await page.keyboard.press('Enter');
            await sleep(6000);
        }

        console.log('⏳ Waiting for return to X and home page...');
        // Wait for different indicators of home page
        await Promise.race([
            page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 60000 }),
            page.waitForURL('**/home', { timeout: 60000 })
        ]);

        console.log('✅ Logged in successfully via Google! Saving session...');
        await ctx.storageState({ path: AUTH_OUT });
        console.log(`🎉 Saved to ${AUTH_OUT}`);

        await browser.close();
    } catch (e) {
        console.error('❌ Google-X Login failed:', e.message);
        if (page) await page.screenshot({ path: path.join(__dirname, 'google_login_fail.png') });
        if (browser) await browser.close();
        process.exit(1);
    }
})();
