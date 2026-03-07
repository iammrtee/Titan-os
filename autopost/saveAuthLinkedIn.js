const { chromium } = require('playwright');
const path = require('path');

(async () => {
    try {
        console.log('🚀 Launching LinkedIn Auth Capture...');
        // Using a more human-like launch profile
        const browser = await chromium.launch({
            headless: false,
            args: ['--disable-blink-features=AutomationControlled']
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        await page.goto("https://www.linkedin.com/login");

        // Wait for LinkedIn's core authentication cookies
        console.log("--------------------------------------------------");
        console.log("WAITING FOR MANUAL LOGIN...");
        console.log("1. Login to LinkedIn");
        console.log("2. Pass any verification");
        console.log("3. ONCE YOU SEE YOUR FEED, WAIT 5 SECONDS...");

        try {
            // Poll for critical cookies
            let authenticated = false;
            for (let i = 0; i < 40; i++) { // 2 minutes total
                const cookies = await context.cookies();
                const hasLiAt = cookies.some(c => c.name === 'li_at');

                if (hasLiAt) {
                    authenticated = true;
                    console.log("\n✅ Core Auth Cookie Detected (li_at)!");
                    break;
                }
                await page.waitForTimeout(3000);
            }

            if (authenticated) {
                console.log("Giving it 5 seconds to fully sync...");
                await page.waitForTimeout(5000);
            } else {
                console.warn("\n⚠️ WARNING: li_at not found. Feed may be required later.");
                await page.waitForSelector('.global-nav__me, a[href*="/feed/"]', { timeout: 30000 });
            }
        } catch (e) {
            console.warn("\n⚠️ WAIT ERROR:", e.message);
        }

        const authDir = path.join(__dirname, 'auth');
        const authPath = path.join(authDir, 'linkedin.json');
        await context.storageState({ path: authPath });

        console.log(`✅ LinkedIn Session saved successfully to: ${authPath}`);
        await browser.close();
    } catch (err) {
        console.error("❌ FAILED:", err.message);
    }
})();
