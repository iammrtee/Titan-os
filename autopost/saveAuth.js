const { chromium } = require('playwright');
const path = require('path');

(async () => {
    try {
        console.log('🚀 Launching TitanOS Auth Capture...');
        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Navigate to Meta Business Suite
        await page.goto("https://business.facebook.com");

        // Wait for Meta's core authentication cookies
        console.log("--------------------------------------------------");
        console.log("WAITING FOR MANUAL LOGIN...");
        console.log("1. Login to Facebook/Instagram");
        console.log("2. Pass any verification");
        console.log("3. ONCE YOU SEE THE DASHBOARD, WAIT 10 SECONDS...");

        try {
            // Poll for critical cookies
            let authenticated = false;
            for (let i = 0; i < 40; i++) { // 2 minutes total
                const cookies = await context.cookies();
                const hasCuser = cookies.some(c => c.name === 'c_user');
                const hasXs = cookies.some(c => c.name === 'xs');

                if (hasCuser && hasXs) {
                    authenticated = true;
                    console.log("\n✅ Core Auth Cookies Detected (c_user/xs)!");
                    break;
                }
                await page.waitForTimeout(3000);
            }

            if (authenticated) {
                console.log("Giving it 10 seconds to fully sync...");
                await page.waitForTimeout(10000);
            } else {
                console.warn("\n⚠️ WARNING: Core cookies not found. Dashboard may be required later.");
                await page.waitForSelector('aside[role="navigation"], div[aria-label="Meta Business Suite"]', { timeout: 30000 });
            }
        } catch (e) {
            console.warn("\n⚠️ WAIT ERROR:", e.message);
        }

        const authPath = path.join(__dirname, 'auth', 'meta.json');
        await context.storageState({ path: authPath });

        console.log(`✅ Session saved successfully to: ${authPath}`);
        console.log("You can now close the browser.");

        await browser.close();
    } catch (err) {
        console.error("❌ FAILED TO OPEN WINDOW:");
        console.error(err.message);
        console.log("\nIf you see 'browserType.launch: Executable doesn't exist', please tell me.");
    }
})();
