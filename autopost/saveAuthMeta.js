const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log("🟦 TitanOS: Meta (Facebook/Instagram) Authentication Capture");
    console.log("Please log in to your Meta account in the browser that opens.");
    console.log("Ensure you have access to the 'Titan Leap Agency' Business Suite.");

    const browser = await chromium.launch({
        headless: false, // Must be false for user login
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    await page.goto("https://business.facebook.com/latest/home");

    console.log("⏳ Waiting for you to log in and reach the Dashboard...");

    // Wait for the dashbaord to load (indicating successful login)
    try {
        await page.waitForSelector('div[aria-label="Create Post"], a[href*="composer"]', { timeout: 300000 }); // 5 minute timeout

        console.log("✅ Dashboard Detected! Verifying Brand...");
        const content = await page.content();
        if (content.toLowerCase().includes('titanleap') || content.toLowerCase().includes('titan leap')) {
            console.log("🛡️ Brand Guard: Titan Leap Agency confirmed.");
            const authPath = path.join(__dirname, 'auth', 'meta.json');
            await context.storageState({ path: authPath });
            console.log(`🚀 Authentication saved to: ${authPath}`);
        } else {
            console.warn("⚠️ Brand Guard: 'Titan Leap' not found on this page. Saving anyway, but check your access.");
            const authPath = path.join(__dirname, 'auth', 'meta.json');
            await context.storageState({ path: authPath });
        }
    } catch (err) {
        console.error("❌ Timeout or Error during login:", err.message);
    }

    console.log("Closing browser in 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
