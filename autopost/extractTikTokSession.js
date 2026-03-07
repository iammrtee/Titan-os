/**
 * extractTikTokSession.js - SCAN VERSION
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

const CHROME_ROOT = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const AUTH_OUT = path.join(__dirname, 'auth/tiktok.json');
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    const allDirs = fs.readdirSync(CHROME_ROOT);
    const candidateProfiles = allDirs.filter(d => d === 'Default' || d.startsWith('Profile '));

    console.log(`🔍 Scanning ${candidateProfiles.length} profiles for TikTok session...`);

    let sessionSaved = false;

    for (const profile of candidateProfiles) {
        console.log(`\n=== Checking: ${profile} ===`);

        const tempDir = path.join(os.tmpdir(), `tt_extract_${profile.replace(' ', '')}_${Date.now()}`);
        const destProfileDir = path.join(tempDir, profile);
        const srcProfileDir = path.join(CHROME_ROOT, profile);

        if (!fs.existsSync(path.join(srcProfileDir, 'Network', 'Cookies'))) {
            continue;
        }

        fs.mkdirSync(tempDir, { recursive: true });
        try { fs.copyFileSync(path.join(CHROME_ROOT, 'Local State'), path.join(tempDir, 'Local State')); } catch (e) { }

        try {
            execSync(`powershell -Command "Copy-Item -Path '${srcProfileDir}' -Destination '${destProfileDir}' -Recurse -Force -ErrorAction SilentlyContinue"`);
        } catch (e) { }

        let browser;
        try {
            browser = await chromium.launchPersistentContext(tempDir, {
                headless: false, // Keep headed to avoid bot checks
                executablePath: CHROME_EXE,
                args: [`--profile-directory=${profile}`, '--disable-blink-features=AutomationControlled'],
                ignoreDefaultArgs: ['--enable-automation'],
            });

            const page = browser.pages()[0] || await browser.newPage();
            console.log(`🌐 Checking tiktok.com...`);
            await page.goto('https://www.tiktok.com/home', { waitUntil: 'load', timeout: 30000 }).catch(() => { });
            await page.waitForTimeout(5000);

            const isLoggedIn = await page.isVisible('[data-tt="header-upload-icon"]').catch(() => false) ||
                await page.isVisible('p:has-text("Upload")').catch(() => false);

            if (isLoggedIn) {
                console.log(`✅ Logged in on ${profile}! Saving TikTok session...`);
                await browser.storageState({ path: AUTH_OUT });
                console.log(`🎉 Saved → ${AUTH_OUT}`);
                await browser.close();
                sessionSaved = true;
                break;
            } else {
                console.log(`⚠️ Not logged in on ${profile}.`);
                await browser.close();
            }
        } catch (e) {
            console.error(`❌ Error: ${e.message}`);
            if (browser) await browser.close();
        }
    }

    if (!sessionSaved) {
        console.log('\n❌ No TikTok session found in any profile.');
        process.exit(1);
    }
})();
