/**
 * TitanOS Autopost — X (Twitter) Platform Script
 * Handles text, image, and VIDEO posts via browser automation.
 *
 * SESSION AUTO-RECOVERY:
 * When the X session is expired/stale, this script automatically launches a
 * VISIBLE browser window so the user can log in once. The daemon waits, then
 * saves the fresh session and proceeds with the post. Zero terminal interaction needed.
 */
const { chromium } = require('playwright');
const path = require('path');
const { execFile } = require('child_process');
const { downloadMedia, postWaitMs } = require('../utils/media');

// Path to real Chrome — used for login to bypass X's automation detection
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ─── Session Recovery: Auto-launch REAL Chrome for one-click re-login ────────
async function recoverXSession(authPath) {
    console.log('🔐 X session expired. Launching Chrome for re-login...');
    console.log('   (A Chrome window will open — please log in to X/Twitter)');

    return new Promise((resolve) => {
        const fs = require('fs');
        const chromePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined;

        chromium.launch({
            headless: false,
            executablePath: chromePath, // Use real Chrome to bypass bot detection
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-first-run',
            ]
        }).then(async (browser) => {
            const ctx = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 720 }
            });
            const page = await ctx.newPage();

            // Remove automation flag from navigator
            await ctx.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                window.chrome = { runtime: {} };
            });

            await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded' });

            // Poll for up to 4 minutes for the user to log in
            let authenticated = false;
            for (let i = 0; i < 80; i++) {
                const cookies = await ctx.cookies();
                const hasAuth = cookies.some(c => c.name === 'auth_token');
                const homeVisible = await page.isVisible('[data-testid="SideNav_NewTweet_Button"]').catch(() => false);
                if (hasAuth && homeVisible) {
                    await ctx.storageState({ path: authPath });
                    console.log('✅ X session saved! Proceeding with post...');
                    authenticated = true;
                    break;
                }
                await page.waitForTimeout(3000);
            }
            await browser.close();
            resolve(authenticated);
        }).catch((e) => { console.error('Chrome launch error:', e.message); resolve(false); });
    });
}

exports.post = async (postData) => {
    console.log(`🐦 TitanOS: Starting X (Twitter) post sequence...`);

    const fs = require('fs');
    const xPath = path.join(__dirname, '../auth', 'x.json');
    const tPath = path.join(__dirname, '../auth', 'twitter.json');
    const authPath = fs.existsSync(xPath) ? xPath : fs.existsSync(tPath) ? tPath : xPath; // default to xPath

    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });

    const tryPost = async () => {
        const context = await browser.newContext({
            storageState: fs.existsSync(authPath) ? authPath : undefined,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 900 }
        });

        const page = await context.newPage();
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(__dirname, '../debug_x_1_home.png') });

        const isLoggedIn = await page.isVisible('[data-testid="SideNav_NewTweet_Button"]').catch(() => false)
            || await page.isVisible('[data-testid="primaryColumn"]').catch(() => false)
            || await page.isVisible('[data-testid="AppTabBar_Home_Link"]').catch(() => false);

        // Check for common error screens
        const isErrorScreen = await page.isVisible('text=Sorry, we could not find your account').catch(() => false);
        if (isErrorScreen) {
            console.error('❌ X Error: "Sorry, we could not find your account" detected.');
            await context.close();
            return false;
        }

        await context.close();
        return isLoggedIn;
    };

    try {
        // Check session validity first
        let sessionValid = await tryPost().catch(() => false);

        if (!sessionValid) {
            await browser.close();

            // Check if we are running in an interactive CLI or automated worker
            // We'll attempt auto-recovery but also throw a clear error for the queue
            console.log('⚠️ X session expired. attempting recovery...');

            const recovered = await recoverXSession(authPath);
            if (!recovered) {
                const errorMsg = 'X session expired. FIX REQUIRED: Please run easy-setup.bat and select [2] X (Twitter) on your local machine to refresh the session.';
                console.error(`❌ ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg,
                    actionRequired: 'Run easy-setup.bat locally'
                };
            }

            // Re-launch headless browser with fresh session
            const freshBrowser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
            try {
                return await postWithBrowser(freshBrowser, authPath, postData);
            } finally {
                await freshBrowser.close().catch(() => null);
            }
        }

        // Session is valid — post directly
        return await postWithBrowser(browser, authPath, postData);

    } catch (err) {
        console.error('❌ X Post Failed:', err.message);
        try { await browser.close(); } catch (e) { /* ignore */ }
        return { success: false, error: err.message };
    }
};

async function postWithBrowser(browser, authPath, postData) {
    const fs = require('fs');
    const context = await browser.newContext({
        storageState: fs.existsSync(authPath) ? authPath : undefined,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 }
    });

    const page = await context.newPage();
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Open composer
    const clickedBtn = await page.click('[data-testid="SideNav_NewTweet_Button"]', { timeout: 8000 })
        .then(() => true).catch(() => false);
    if (!clickedBtn) {
        await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
    }
    await page.waitForTimeout(3000);

    // Wait for either the modal OR the inline composer to be ready
    const draftSelectors = [
        'div[data-testid="tweetTextarea_0"]',
        'div[data-testid="tweetTextarea_0RichEditor"]',
        'div[role="textbox"]',
        '.public-DraftEditor-content',
        '[aria-label="Post text"]',
        '[aria-label="Tweet text"]',
        '[aria-label="What is happening?!"]',
    ];

    let draftBoxFound = false;
    console.log('⏳ Looking for draft box...');
    for (let i = 0; i < 15; i++) { // Retry for 15s total
        for (const sel of draftSelectors) {
            const found = await page.isVisible(sel).catch(() => false);
            if (found) {
                await page.click(sel, { timeout: 5000 }).catch(() => null);
                draftBoxFound = true;
                break;
            }
        }
        if (draftBoxFound) break;
        await page.waitForTimeout(1000);
    }

    if (!draftBoxFound) {
        await page.screenshot({ path: path.join(__dirname, '../debug_x_compose_fail.png') });
        const errorMsg = 'X compose textarea not found. The page might still be loading or X significantly changed its UI.';
        throw new Error(errorMsg);
    }

    await page.keyboard.type(postData.caption, { delay: 10 });
    console.log('✅ Caption typed');

    // Media attachment
    let hasMedia = false, isVideo = false;
    if (postData.mediaUrl) {
        const media = await downloadMedia(page, postData.mediaUrl, 'x');
        isVideo = media.isVideo;
        hasMedia = true;

        console.log(`📎 Attaching ${isVideo ? 'video' : 'image'}...`);
        // Make hidden file input accessible and set files directly
        await page.evaluate(() => {
            const inp = document.querySelector('input[data-testid="fileInput"]');
            if (inp) { inp.style.display = 'block'; inp.style.opacity = '1'; }
        });
        await page.setInputFiles('input[data-testid="fileInput"]', media.tempPath, { timeout: 20000 });

        const uploadWait = isVideo ? 30000 : 8000;
        console.log(`⏳ Waiting ${uploadWait / 1000}s for media to process...`);
        await page.waitForTimeout(uploadWait);
    }

    // Post
    console.log('🖱️ Clicking Post button...');
    await page.waitForSelector('button[data-testid="tweetButtonInline"]', { timeout: 15000 });
    await page.click('button[data-testid="tweetButtonInline"]', { force: true });

    const wait = postWaitMs(hasMedia, isVideo);
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(__dirname, '../debug_x_after_post.png') });
    console.log('🚀 X Post Submitted!');
    await context.close();
    return { success: true };
}
