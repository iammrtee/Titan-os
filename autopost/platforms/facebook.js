/**
 * TitanOS Autopost — Facebook Platform Script
 * Posts to the Titan Leap Agency Facebook Page via Meta Business Suite.
 */
const { chromium } = require('playwright');
const path = require('path');
const { downloadMedia, postWaitMs } = require('../utils/media');

exports.post = async (postData) => {
    console.log(`📘 TitanOS: Starting Facebook Page post sequence...`);

    const authPath = path.join(__dirname, '../auth', 'meta.json');
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });

    let page;
    try {
        const context = await browser.newContext({
            storageState: authPath,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 900 }
        });

        page = await context.newPage();
        console.log('🏢 Navigating to Meta Business Suite...');
        await page.goto('https://business.facebook.com/latest/home', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(7000);

        console.log('✅ Meta Business Suite Loaded');
        await page.screenshot({ path: path.join(__dirname, '../debug_fb_1_home.png') });

        // --- Click "Create post" ---
        const createBtnSel = [
            'div[aria-label="Create Post"]',
            '[role="button"]:has-text("Create post")',
            '[role="button"]:has-text("Create Post")',
            'a[href*="composer"]',
            'button:has-text("Create post")'
        ].join(', ');

        console.log('🖱️ Clicking Create post button...');
        await page.waitForSelector(createBtnSel, { timeout: 30000 });
        await page.click(createBtnSel);
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(__dirname, '../debug_fb_2_composer.png') });

        // --- Type caption ---
        const textbox = 'div[role="textbox"], div[contenteditable="true"]';
        await page.waitForSelector(textbox, { timeout: 20000 });
        await page.fill(textbox, postData.caption);

        // --- Upload media ---
        let hasMedia = false;
        let isVideo = false;
        if (postData.mediaUrl) {
            const media = await downloadMedia(page, postData.mediaUrl, 'fb');
            isVideo = media.isVideo;
            hasMedia = true;

            const targetLabel = isVideo ? 'add video' : 'add photo';
            console.log(`📸 Clicking '${targetLabel}' button...`);

            const clickedMediaBtn = await page.evaluate((label) => {
                const btns = Array.from(document.querySelectorAll('[role="button"], button'));
                const btn = btns.find(b => (b.textContent || '').toLowerCase().includes(label));
                if (btn) { btn.click(); return true; }
                return false;
            }, targetLabel);

            if (!clickedMediaBtn) {
                await page.click(`[role="button"]:has-text("${isVideo ? 'Add video' : 'Add photo'}")`, { timeout: 10000 }).catch(() => null);
            }
            await page.waitForTimeout(2000);

            // Handle file chooser from dropdown or direct input
            const uploadFromComputerSel = [
                '[role="menuitem"]:has-text("Upload from computer")',
                'span:has-text("Upload from computer")',
                'div[role="menuitem"]:has-text("Upload")',
                'li:has-text("Upload")',
            ].join(', ');

            const hasDropdown = await page.isVisible(uploadFromComputerSel).catch(() => false);
            if (hasDropdown) {
                console.log('📋 Dropdown found — clicking Upload from computer...');
                const [fileChooser] = await Promise.all([
                    page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null),
                    page.click(uploadFromComputerSel).catch(() => null)
                ]);
                if (fileChooser) {
                    await fileChooser.setFiles(media.tempPath);
                }
            } else {
                console.log('⚠️ No dropdown — using direct file input...');
                const inputVisible = await page.isVisible('input[type="file"]').catch(() => false);
                if (inputVisible) {
                    await page.setInputFiles('input[type="file"]', media.tempPath);
                } else {
                    // Force hidden file input visible and set
                    await page.evaluate(() => {
                        const input = document.querySelector('input[type="file"]');
                        if (input) { input.style.display = 'block'; input.style.opacity = '1'; }
                    });
                    await page.setInputFiles('input[type="file"]', media.tempPath).catch(() => null);
                }
            }

            const uploadWait = isVideo ? 25000 : 10000;
            console.log(`⏳ Waiting ${uploadWait / 1000}s for ${isVideo ? 'video' : 'image'} to upload...`);
            await page.waitForTimeout(uploadWait);
        }

        // --- Dismiss any popovers ---
        await page.click('button:has-text("Got it"), button:has-text("Done")', { timeout: 3000 }).catch(() => null);
        await page.waitForTimeout(3000);

        // --- Click Publish ---
        console.log('🖱️ Waiting for Publish button...');
        const pubSelFB = 'div[aria-label="Publish"], div[aria-label^="Publish"], [role="button"]:has-text("Publish")';
        await page.waitForSelector(pubSelFB, { timeout: 30000 });
        await page.waitForTimeout(2000);

        const fbClicked = await page.evaluate(() => {
            const candidates = Array.from(document.querySelectorAll('button, [role="button"], div[aria-label]'));
            const btn = candidates.find(el => {
                const txt = (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase();
                return txt === 'publish' || txt === 'post' || txt.startsWith('publish');
            });
            if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
            return false;
        });
        if (!fbClicked) {
            await page.click(pubSelFB, { force: true, timeout: 10000 }).catch(() => null);
        }

        const wait = postWaitMs(hasMedia, isVideo);
        console.log(`⏳ Holding browser open for ${wait / 1000}s to ensure upload completes...`);
        await page.waitForTimeout(wait);
        await page.screenshot({ path: path.join(__dirname, '../debug_fb_3_after_post.png') });

        console.log('🚀 Facebook Page Post Submitted!');
        await browser.close();
        return { success: true };

    } catch (err) {
        console.error('❌ Facebook Post Failed:', err.message);
        try {
            if (page) await page.screenshot({ path: path.join(__dirname, '../debug_fb_error.png') }).catch(() => null);
            await browser.close();
        } catch (e) { /* ignore */ }
        return { success: false, error: err.message };
    }
};
