/**
 * TitanOS Autopost — LinkedIn Platform Script
 * Posts to Titan Leap Agency company page via the Admin Dashboard "+ Create" button.
 * This approach navigates to the company admin page first, then clicks "+ Create"
 * which opens a post composer already in the Company Page context — no author switching needed.
 */
const { chromium } = require('playwright');
const path = require('path');
const { downloadMedia, postWaitMs } = require('../utils/media');

const COMPANY_ID = '100059033';
const COMPANY_NAME = 'Titan Leap Agency';

exports.post = async (postData) => {
    console.log(`🔗 TitanOS: Starting LinkedIn Company Page post...`);

    const authPath = path.join(__dirname, '../auth', 'linkedin.json');
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });

    try {
        const context = await browser.newContext({
            storageState: authPath,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 900 }
        });

        const page = await context.newPage();

        // Step 1: Go to Company Admin Dashboard (shows "+ Create" button for company posts)
        console.log('🏢 Loading Titan Leap Agency admin dashboard...');
        await page.goto(`https://www.linkedin.com/company/${COMPANY_ID}/admin/dashboard/`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(__dirname, '../debug_li_1_admin.png') });

        // BRAND GUARD — confirm we are on the Titan Leap page
        const html = await page.content();
        if (!html.toLowerCase().includes('titan leap')) {
            console.error('❌ BRAND GUARD: Not on Titan Leap Agency admin dashboard. Aborting.');
            await browser.close();
            return { success: false, error: 'Brand Guard: not on Titan Leap LinkedIn admin page' };
        }
        console.log('✅ On Titan Leap Agency Admin Dashboard');

        // Step 2: Click the "+ Create" button via coordinates (it's always at the same spot in admin sidebar)
        // This opens a Create menu. Then click "Start a post" from the menu.
        console.log('🖱️ Clicking + Create button...');
        // The + Create button is in the left sidebar of the admin dashboard
        // We click it, then click "Start a post" from the dropdown menu that appears
        await page.mouse.click(141, 281);
        await page.waitForTimeout(2000);

        // Now click "Start a post" from the Create menu (first option at top)
        await page.mouse.click(478, 133);
        await page.waitForTimeout(4000);

        let composerOpen = await page.isVisible('div[contenteditable="true"]').catch(() => false);
        if (!composerOpen) {
            // Fallback text click for "Start a post"
            await page.click('text=Start a post', { timeout: 5000 }).catch(() => null);
            await page.waitForTimeout(3000);
            composerOpen = await page.isVisible('div[contenteditable="true"]').catch(() => false);
        }

        if (!composerOpen) {
            // Fallback: try the Feed page's Start a post
            console.log('⚠️ Create button fallback → trying Feed page...');
            await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(5000);
            await page.evaluate(() => {
                const els = Array.from(document.querySelectorAll('button, [role="button"], [placeholder]'));
                const btn = els.find(el => (el.textContent || el.getAttribute('placeholder') || '').toLowerCase().includes('start a post'));
                if (btn) btn.click();
            });
            await page.waitForTimeout(4000);
            composerOpen = await page.isVisible('div[contenteditable="true"]').catch(() => false);
            if (!composerOpen) throw new Error('Could not open LinkedIn post composer after all attempts.');
        }
        await page.screenshot({ path: path.join(__dirname, '../debug_li_2_composer.png') });

        // Step 3: Type caption
        console.log('📝 Typing caption...');
        const editorSel = 'div[contenteditable="true"]';
        await page.click(editorSel, { timeout: 10000 });
        await page.waitForTimeout(300);
        await page.keyboard.type(postData.caption, { delay: 8 });
        console.log('✅ Caption typed');

        // Step 4: Attach media (if provided)
        let hasMedia = false;
        let isVideo = false;
        if (postData.mediaUrl) {
            const media = await downloadMedia(page, postData.mediaUrl, 'li');
            isVideo = media.isVideo;
            hasMedia = true;

            console.log(`📸 Clicking photo/video toolbar icon...`);
            // Intercept the file chooser directly to avoid flaky DOM selectors
            const mediaButton = page.locator('button[aria-label*="media" i], button[aria-label*="photo" i], button[aria-label*="video" i], button[aria-label="Add media"]').first();

            // Try to click the Media button using a trusted Playwright click so the OS file picker opens
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 15000 }),
                mediaButton.click({ force: true }).catch(async () => {
                    console.log('⚠️ Locator click failed, trying coordinate click as fallback...');
                    await page.mouse.click(483, 519);
                })
            ]);
            await fileChooser.setFiles(media.tempPath);

            const uploadWait = isVideo ? 30000 : 10000;
            console.log(`⏳ Waiting ${uploadWait / 1000}s for ${isVideo ? 'video' : 'image'} to upload...`);
            await page.waitForTimeout(uploadWait);

            // Dismiss the media preview/confirm modal (Done / Next button)
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(el => ['done', 'next', 'save'].includes((el.innerText || el.textContent || '').trim().toLowerCase()));
                if (btn) btn.click();
            });
            await page.click('button:has-text("Done"), button:has-text("Next")', { force: true, timeout: 8000 }).catch(() => null);
            await page.waitForTimeout(3000);
        }

        await page.screenshot({ path: path.join(__dirname, '../debug_li_3_ready.png') });

        // Step 5: Click Post
        console.log('🖱️ Clicking Post button...');
        const postClicked = await page.evaluate(() => {
            // Find the Post button in the modal — it's either button or div[role=button] with text "Post"
            const all = Array.from(document.querySelectorAll('button, [role="button"]'));
            const btn = all.find(el => (el.textContent || '').trim().toLowerCase() === 'post');
            if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
            return false;
        });
        if (!postClicked) {
            await page.click('button.share-actions__primary-action, button:has-text("Post"), [aria-label="Post"]', { force: true, timeout: 10000 }).catch(() => null);
        }

        const wait = postWaitMs(hasMedia, isVideo);
        console.log(`⏳ Holding open for ${wait / 1000}s to ensure post completes...`);
        await page.waitForTimeout(wait);
        await page.screenshot({ path: path.join(__dirname, '../debug_li_4_after_post.png') });

        console.log('🚀 LinkedIn Company Page Post Submitted!');
        await browser.close();
        return { success: true };

    } catch (err) {
        console.error('❌ LinkedIn Post Failed:', err.message);
        try { await browser.close(); } catch (e) { /* ignore */ }
        return { success: false, error: err.message };
    }
};
