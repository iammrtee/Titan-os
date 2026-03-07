/**
 * extractXSession.js — COLD BOOT VERSION
 * Run from the autopost/ directory
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_ROOT = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const AUTH_OUT = path.join(__dirname, 'auth/x.json');
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const { execSync } = require('child_process');

(async () => {
    const allDirs = fs.readdirSync(CHROME_ROOT);
    const candidateProfiles = allDirs.filter(d => d === 'Default' || d.startsWith('Profile '));

    console.log(`🔍 Scanning ${candidateProfiles.length} profiles for active X session...`);

    let sessionSaved = false;

    for (const profile of candidateProfiles) {
        console.log(`\n=== Checking: ${profile} ===`);

        const tempDir = path.join(os.tmpdir(), `x_extract_${profile.replace(' ', '')}_${Date.now()}`);
        const destProfileDir = path.join(tempDir, profile);
        const srcProfileDir = path.join(CHROME_ROOT, profile);

        if (!fs.existsSync(path.join(srcProfileDir, 'Network', 'Cookies'))) {
            console.log(`   (No cookies found in ${profile}, skipping)`);
            continue;
        }

        console.log(`📁 Copying profile ${profile} to temp directory...`);
        fs.mkdirSync(tempDir, { recursive: true });
        try { fs.copyFileSync(path.join(CHROME_ROOT, 'Local State'), path.join(tempDir, 'Local State')); } catch (e) { }

        try {
            execSync(`powershell -Command "Copy-Item -Path '${srcProfileDir}' -Destination '${destProfileDir}' -Recurse -Force -ErrorAction SilentlyContinue"`);
        } catch (e) {
            console.log('   (Some locked files skipped, which is normal)');
        }

        let browser;
        try {
            browser = await chromium.launchPersistentContext(tempDir, {
                headless: false,
                executablePath: CHROME_EXE,
                args: [`--profile-directory=${profile}`, '--disable-blink-features=AutomationControlled', '--no-sandbox'],
                ignoreDefaultArgs: ['--enable-automation'],
            });

            const page = browser.pages()[0] || await browser.newPage();
            console.log(`🌐 Checking x.com...`);
            await page.goto('https://x.com/home', { waitUntil: 'load', timeout: 30000 }).catch(() => { });
            await page.waitForTimeout(5000);

            const isLoggedIn = await page.isVisible('[data-testid="SideNav_NewTweet_Button"]').catch(() => false);

            if (isLoggedIn) {
                console.log(`✅ Logged in on ${profile}! Saving...`);
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
            console.error(`❌ Error checking ${profile}: ${e.message}`);
            if (browser) await browser.close();
        }
    }

    if (!sessionSaved) {
        console.log('\n❌ Could not find an active X session in any Chrome profile.');
        process.exit(1);
    }
})();
