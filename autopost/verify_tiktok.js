/**
 * verify_tiktok.js
 * Dedicated verification for TikTok Video
 */
const tiktok = require('./platforms/tiktok');
const TEST_VIDEO = 'C:\\Users\\HP\\Documents\\New folder\\test_octet.mp4';

async function verify() {
    console.log('🎬 Starting TikTok Specific Verification...\n');
    try {
        const result = await tiktok.postToTikTok(TEST_VIDEO, 'TitanOS TikTok Final Verification 🎬');
        if (result === true) {
            console.log('\n✅ TikTok Verification: SUCCESS');
        } else {
            console.error('\n❌ TikTok Verification: FAILED');
        }
    } catch (err) {
        console.error('\n💥 TikTok Verification: CRASHED -', err.message);
    }
}

verify();
