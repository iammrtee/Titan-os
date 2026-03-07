/**
 * verify_all_platforms.js
 * Comprehensive verification for all social platforms: Image & Video
 */
const x = require('./platforms/twitter');
const fb = require('./platforms/facebook');
const ig = require('./platforms/instagram');
const linkedin = require('./platforms/linkedin');
const tiktok = require('./platforms/tiktok');
const path = require('path');

const TEST_VIDEO = 'C:\\Users\\HP\\Documents\\New folder\\test_octet.mp4';
const TEST_IMAGE = 'C:\\Users\\HP\\Documents\\New folder\\temp_media_fb.png';

async function verify() {
    console.log('🏁 Starting Final Multi-Platform Verification...\n');

    const tests = [
        { name: 'X (Twitter) - Image', fn: () => x.post({ caption: 'TitanOS Final Test: X Image 📸', mediaUrl: TEST_IMAGE }) },
        { name: 'X (Twitter) - Video', fn: () => x.post({ caption: 'TitanOS Final Test: X Video 🎬', mediaUrl: TEST_VIDEO }) },
        { name: 'LinkedIn - Image', fn: () => linkedin.post({ caption: 'TitanOS Final Test: LinkedIn Image 📸', mediaUrl: TEST_IMAGE }) },
        { name: 'LinkedIn - Video', fn: () => linkedin.post({ caption: 'TitanOS Final Test: LinkedIn Video 🎬', mediaUrl: TEST_VIDEO }) },
        { name: 'Facebook - Image', fn: () => fb.post({ caption: 'TitanOS Final Test: Facebook Image 📸', mediaUrl: TEST_IMAGE }) },
        { name: 'Instagram - Image', fn: () => ig.post({ caption: 'TitanOS Final Test: Instagram Image 📸', mediaUrl: TEST_IMAGE }) },
        // TikTok only supports video in our current adapter
        { name: 'TikTok - Video', fn: () => tiktok.postToTikTok(TEST_VIDEO, 'TitanOS Final Test: TikTok Video 🎬') }
    ];

    for (const test of tests) {
        console.log(`\n--------------------------------------------------`);
        console.log(`🧪 Testing: ${test.name}...`);
        try {
            const result = await test.fn();
            if (result === true || (result && result.success)) {
                console.log(`✅ ${test.name}: SUCCESS`);
            } else {
                console.error(`❌ ${test.name}: FAILED - ${JSON.stringify(result)}`);
            }
        } catch (err) {
            console.error(`💥 ${test.name}: CRASHED - ${err.message}`);
        }
    }

    console.log('\n==================================================');
    console.log('✅ Final Verification Complete');
    console.log('==================================================');
}

verify();
