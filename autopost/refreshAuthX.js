/**
 * Attempts to refresh X session using existing cookies in HEADED mode
 * Headed = real browser window = bypasses Cloudflare bot detection.
 * If existing auth_token is still valid, this saves a fresh session silently.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const authPath = path.join(__dirname, 'auth/x.json');

    // Check if existing session has auth_token cookie
    let hasExistingCookies = false;
    try {
        const data = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        const cookies = data.cookies || [];
        const authToken = cookies.find(c => c.name === 'auth_token');
        if (authToken) {
            console.log('📦 Existing auth_token found, attempting headed refresh...');
            hasExistingCookies = true;
        }
    } catch (e) {
        console.log('⚠️ No existing session found');
    }

    const browser = await chromium.launch({
        headless: false,  // HEADED — bypasses Cloudflare
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });

    try {
        const ctx = hasExistingCookies
            ? await browser.newContext({
                storageState: authPath,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 900 }
            })
            : await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 900 }
            });

        const page = await ctx.newPage();

        // Navigate to home (cookies should auto-authenticate)
        console.log('🌐 Navigating to x.com/home...');
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait up to 20s for the home feed or Cloudflare to resolve
        let authenticated = false;
        for (let i = 0; i < 10; i++) {
            const cookies = await ctx.cookies();
            const hasAuth = cookies.some(c => c.name === 'auth_token');
            const homeVisible = await page.isVisible('[data-testid="SideNav_NewTweet_Button"]').catch(() => false);

            if (hasAuth && homeVisible) {
                console.log('✅ Authenticated! Saving fresh session...');
                await ctx.storageState({ path: authPath });
                authenticated = true;
                break;
            }
            console.log(`⏳ Waiting for auth... (${i + 1}/10)`);
            await page.waitForTimeout(2000);
        }

        if (!authenticated) {
            console.log('❌ Session not refreshed — cookies may be fully expired.');
            console.log('📸 Saving screenshot for diagnosis...');
            await page.screenshot({ path: path.join(__dirname, 'debug_x_session_state.png') });
        }

        await browser.close();
        process.exit(authenticated ? 0 : 1);
    } catch (e) {
        console.error('Error:', e.message);
        await browser.close();
        process.exit(1);
    }
})();
