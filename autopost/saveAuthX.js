/**
 * saveAuthX.js - STABILITY VERSION
 * Launches your REAL Chrome browser for you to log in to X.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = path.join(os.tmpdir(), 'titan_x_setup');

(async () => {
    console.log('\n==================================================');
    console.log('🚀  TitanOS - X (Twitter) Session Setup');
    console.log('==================================================\n');

    if (!fs.existsSync(CHROME_PATH)) {
        console.error('❌ Chrome not found at default path.');
        return;
    }

    if (fs.existsSync(TEMP_USER_DATA)) {
        try { fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true }); } catch (e) { }
    }
    fs.mkdirSync(TEMP_USER_DATA, { recursive: true });

    console.log('🌐 Launching Chrome window (Stealth Mode)...');

    let browserContext;
    try {
        browserContext = await chromium.launchPersistentContext(TEMP_USER_DATA, {
            executablePath: CHROME_PATH,
            headless: false,
            viewport: null,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-first-run',
                '--no-default-browser-check',
                '--start-maximized'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        const page = browserContext.pages()[0] || await browserContext.newPage();

        console.log("\n--------------------------------------------------");
        console.log("👉 ACTION REQUIRED: LOGIN MANUALLY");
        console.log("--------------------------------------------------");
        console.log("1. Enter your X credentials in the opened Chrome.");
        console.log("2. If asked for verification, use: titanleapstudio@gmail.com");
        console.log("3. Once you reach your Home Feed, DO NOT CLOSE CHROME.");
        console.log("4. The script will save and close automatically.");
        console.log("--------------------------------------------------\n");

        await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded' });

        let authenticated = false;
        for (let i = 0; i < 300; i++) {
            const cookies = await browserContext.cookies();
            const hasAuthToken = cookies.some(c => c.name === 'auth_token');
            const isHome = await page.isVisible('[data-testid="SideNav_NewTweet_Button"]').catch(() => false) ||
                page.url().includes('/home');

            if (hasAuthToken && (isHome || i > 60)) {
                authenticated = true;
                console.log("\n✅ SUCCESS: X session detected!");
                break;
            }
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 3000));
        }

        if (authenticated) {
            const authDir = path.join(__dirname, 'auth');
            if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);
            await browserContext.storageState({ path: path.join(authDir, 'x.json') });
            console.log(`\n🎉 X Session saved successfully!`);
        } else {
            console.error('\n❌ Timeout: No login detected.');
        }

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        if (browserContext) await browserContext.close().catch(() => { });
        process.exit(0);
    }
})();
