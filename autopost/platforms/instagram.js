/**
 * TitanOS Autopost — Instagram Platform Script
 * Posts to Instagram Business Account via Meta Business Suite.
 */
const { chromium } = require('playwright');
const path = require('path');
const { downloadMedia, postWaitMs } = require('../utils/media');

exports.post = async (postData) => {
    console.log(`📸 TitanOS: Starting Instagram post sequence...`);

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
            viewport: { width: 1920, height: 1080 }
        });

        page = await context.newPage();
        console.log('🏢 Navigating to Meta Business Suite...');
        await page.goto('https://business.facebook.com/latest/home', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(8000);

        // Dismiss any startup popups
        await page.click('button:has-text("Done"), [role="button"]:has-text("Done")').catch(() => null);
        await page.screenshot({ path: path.join(__dirname, '../debug_ig_1_home.png') });
        console.log('✅ Meta Dashboard Loaded');

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
        await page.screenshot({ path: path.join(__dirname, '../debug_ig_2_before_create.png') });
        await page.click(createBtnSel);
        await page.waitForTimeout(7000);
        await page.screenshot({ path: path.join(__dirname, '../debug_ig_3_composer.png') });

        // --- Wait for text box ---
        const textbox = 'div[role="textbox"], div[contenteditable="true"]';
        await page.waitForSelector(textbox, { timeout: 20000 });

        // Turn OFF "Customize post" if it's active so text applies everywhere
        try {
            const customizeToggle = 'input[role="switch"][aria-checked="true"]';
            if (await page.isVisible(customizeToggle)) {
                console.log('⚙️ Turning off Customize post...');
                await page.click(customizeToggle);
                await page.waitForTimeout(2000);
            }
        } catch (e) { /* optional step, skip if missing */ }

        await page.fill(textbox, postData.caption);
        await page.waitForTimeout(1000);

        // --- Handle media ---
        let hasMedia = false;
        let isVideo = false;
        if (postData.mediaUrl) {
            console.log('📂 Handling media upload...');
            const media = await downloadMedia(page, postData.mediaUrl, 'ig');
            isVideo = media.isVideo;
            hasMedia = true;

            await page.screenshot({ path: path.join(__dirname, '../debug_ig_4_before_media.png') });
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

            // Handle file chooser via dropdown or direct input
            const uploadFromComputerSel = [
                '[role="menuitem"]:has-text("Upload from computer")',
                'span:has-text("Upload from computer")',
                'div[role="menuitem"]:has-text("Upload")',
                'li:has-text("Upload")',
            ].join(', ');

            const hasDropdown = await page.isVisible(uploadFromComputerSel).catch(() => false);
            if (hasDropdown) {
                console.log('📋 Dropdown found - clicking Upload from computer...');
                const [fileChooser] = await Promise.all([
                    page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null),
                    page.click(uploadFromComputerSel).catch(() => null)
                ]);
                if (fileChooser) {
                    console.log('✅ File chooser opened — uploading...');
                    await fileChooser.setFiles(media.tempPath);
                }
            } else {
                console.log('⚠️ No dropdown — using direct file input...');
                const inputVisible = await page.isVisible('input[type="file"]').catch(() => false);
                if (inputVisible) {
                    await page.setInputFiles('input[type="file"]', media.tempPath);
                } else {
                    await page.evaluate(() => {
                        const input = document.querySelector('input[type="file"]');
                        if (input) { input.style.display = 'block'; input.style.opacity = '1'; }
                    });
                    await page.setInputFiles('input[type="file"]', media.tempPath).catch(() => null);
                }
            }

            const uploadWait = isVideo ? 25000 : 15000;
            console.log(`⏳ Waiting ${uploadWait / 1000}s for ${isVideo ? 'video' : 'image'} to upload...`);
            await page.waitForTimeout(uploadWait);
            await page.screenshot({ path: path.join(__dirname, '../debug_ig_5_media_uploaded.png') });
        } else {
            console.log('⚠️ No mediaUrl — posting text only.');
        }

        // Dismiss any tutorial/popup
        await page.click('button:has-text("Done"), [role="button"]:has-text("Done"), button:has-text("Got it")').catch(() => null);
        await page.waitForTimeout(3000);

        // --- Click Publish ---
        const publishSelectors = [
            'button:has-text("Publish")',
            'button:has-text("Post")',
            'div[aria-label^="Publish"]',
            '[role="button"]:has-text("Publish")',
            'div[aria-label="Publish"]'
        ].join(', ');

        console.log('🖱️ Waiting for Publish button...');
        await page.waitForSelector(publishSelectors, { timeout: 30000 });
        await page.waitForTimeout(2000);

        const clicked = await page.evaluate(() => {
            const candidates = Array.from(document.querySelectorAll('button, [role="button"], div[aria-label]'));
            const publishBtn = candidates.find(el => {
                const txt = (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase();
                return txt === 'publish' || txt === 'post' || txt.startsWith('publish');
            });
            if (publishBtn) {
                publishBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                return true;
            }
            return false;
        });

        if (!clicked) {
            for (const sel of publishSelectors.split(', ')) {
                const ok = await page.click(sel, { force: true, timeout: 5000 }).then(() => true).catch(() => false);
                if (ok) { console.log('✅ Force clicked:', sel); break; }
            }
        } else {
            console.log('✅ dispatchEvent click fired');
        }

        const wait = postWaitMs(hasMedia, isVideo);
        console.log(`⏳ Holding browser open for ${wait / 1000}s to ensure submission completes...`);
        await page.waitForTimeout(wait);
        await page.screenshot({ path: path.join(__dirname, '../debug_ig_6_after_publish.png') });

        console.log('🚀 Instagram Post Submitted!');
        await browser.close();
        return { success: true };

    } catch (err) {
        console.error('❌ Instagram Post Failed:', err.message);
        try {
            if (page) await page.screenshot({ path: path.join(__dirname, '../debug_ig_error.png') }).catch(() => null);
            await browser.close();
        } catch (e) { /* ignore */ }
        return { success: false, error: err.message };
    }
};
