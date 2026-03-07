/**
 * tiktok.js - TikTok Distribution Adapter
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');
const { downloadMedia, postWaitMs } = require('../utils/media');

exports.post = async (postData) => {
    console.log(`🎬 TitanOS: Starting TikTok post sequence: "${postData.caption ? postData.caption.substring(0, 30) : ''}..."`);

    if (!postData.mediaUrl) {
        console.error('❌ TikTok requires a media URL (video or image).');
        return { success: false, error: 'TikTok requires a media URL (video or image).' };
    }

    const authPath = path.join(__dirname, '../auth/tiktok.json');
    if (!fs.existsSync(authPath)) {
        throw new Error('TikTok session not found. Please run manualLogin.js first.');
    }

    const browser = await chromium.launch({
        headless: false, // TikTok aggressively blocks headless chromium uploads
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    try {
        console.log('📂 Downloading TikTok media...');
        const media = await downloadMedia(page, postData.mediaUrl, 'tiktok');

        let uploadPath = media.tempPath;
        if (!media.isVideo) {
            console.log('🔄 TikTok requires video files. Converting image asset to MP4 loop...');
            uploadPath = uploadPath.replace(/\.png$/i, '.mp4');
            const { convertImageToVideo } = require('../utils/media');
            await convertImageToVideo(media.tempPath, uploadPath);
            media.isVideo = true; // treat as video for the remainder of the script
        }

        // Navigate to upload page - increased timeout for TikTok Studio
        await page.goto('https://www.tiktok.com/tiktokstudio/upload', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Handle the file upload using a native click to bypass bot protection
        console.log("🖱️ Clicking 'Select video' to open file chooser...");
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 45000 }),
            page.click('button:has-text("Select video"), div[role="button"]:has-text("Select video")', { force: true })
        ]);
        await fileChooser.setFiles(uploadPath);

        console.log('⏳ Uploading media (waiting 20s for processing)...');
        await page.waitForTimeout(20000);

        // Wait for upload progress to finish and caption field to be available
        await page.waitForSelector('div[contenteditable="true"]', { timeout: 60000 });

        // Enter description - use focus/fill to avoid pointer interception issues
        await page.focus('div[contenteditable="true"]');
        await page.keyboard.type(postData.caption || '');

        // Wait for the "Post" button to be available (attached)
        await page.waitForSelector('button:has-text("Post"), button:has-text("Publish"), button:has-text("Share")', { state: 'attached', timeout: 60000 });

        // Final settling delay
        await page.waitForTimeout(5000);

        console.log('🚀 Clicking Post button (Cross-Frame Search)...');

        const success = await page.evaluate(async () => {
            const findAndClick = (root) => {
                if (!root) return false;

                // Aggressively remove overlays in this root
                const overlays = root.querySelectorAll('.TUXModal-overlay, [class*="Modal-overlay"], [id^="floating-ui-portal"], [class*="Popup"], [class*="Mask"]');
                overlays.forEach(o => o.remove());

                // Find elements containing Post variants
                const allElements = Array.from(root.querySelectorAll('button, div[role="button"], span, p, div'));
                const postBtn = allElements.find(b => {
                    const text = (b.textContent || '').trim();
                    const isRed = window.getComputedStyle(b).backgroundColor.includes('rgb(254, 44, 85)'); // TikTok red
                    return (text === 'Post' || text === 'Publish' || text === 'Share') && (b.tagName === 'BUTTON' || isRed);
                });

                if (postBtn) {
                    postBtn.scrollIntoView();
                    postBtn.click();
                    return true;
                }
                return false;
            };

            // 1. Try main document
            if (findAndClick(document)) return true;

            // 2. Try all iframes
            const iframes = Array.from(document.querySelectorAll('iframe'));
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (findAndClick(doc)) return true;
                } catch (e) { /* ignore cross-origin errors */ }
            }
            return false;
        });

        if (!success) {
            // Fallback: try locating via Playwright locator across all frames
            let postClicked = false;
            for (const frame of page.frames()) {
                const btn = frame.locator('button:has-text("Post"), button:has-text("Publish"), button:has-text("Share")').first();
                if (await btn.isVisible().catch(() => false)) {
                    await btn.click({ force: true });
                    postClicked = true;
                    break;
                }
            }
            if (!postClicked) throw new Error('Post button not found in any frame');
        }

        // Wait for success indicator
        console.log('⏳ Waiting for success confirmation...');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: path.join(__dirname, '../tiktok_success_final.png') });

        const successIndicator = await page.waitForSelector('text=Manage your posts, text=Uploaded, text=processing, text=Successfully, text=Studio, text=Video', { timeout: 60000 }).catch(() => null);

        if (successIndicator) {
            console.log('✅ TikTok post successful! (Detected via UI)');
        } else {
            console.log('⚠️ TikTok post might have succeeded (check tiktok_success_final.png)');
        }

        const wait = postWaitMs(true, media.isVideo);
        console.log(`⏳ Holding browser open for ${wait / 1000}s to ensure submission completes...`);
        await page.waitForTimeout(wait);

        await browser.close();
        return { success: true };
    } catch (e) {
        console.error('❌ TikTok posting error:', e.message);
        try {
            if (page) await page.screenshot({ path: path.join(__dirname, '../tiktok_error.png') }).catch(() => null);
        } catch (screenshotError) {
            console.error('📸 Could not take error screenshot:', screenshotError.message);
        }
        await browser.close().catch(() => null);
        return { success: false, error: e.message };
    }
};
