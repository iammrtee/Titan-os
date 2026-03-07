/**
 * TitanOS Autopost - Shared Media Utility
 * Handles downloading, saving, and determining media type for all platform scripts.
 */
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Determines if a URL points to a video asset.
 * @param {string} url 
 * @returns {boolean}
 */
function isVideoUrl(url) {
    if (!url) return false;
    return /\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i.test(url);
}

/**
 * Downloads or extracts a media file and saves it to a temp path.
 * Returns the local file path and whether it is a video.
 * @param {object} page - Playwright page instance for fetching remote URLs
 * @param {string} mediaUrl - The remote URL or base64 data URL of the media
 * @param {string} prefix - Short prefix for the temp filename, e.g. 'ig', 'fb', 'li', 'x'
 * @returns {{ tempPath: string, isVideo: boolean }}
 */
async function downloadMedia(page, mediaUrl, prefix) {
    const isVideo = isVideoUrl(mediaUrl);
    const ext = isVideo ? 'mp4' : 'png';
    const tempPath = path.join(__dirname, `../../temp_media_${prefix}.${ext}`);

    if (mediaUrl.startsWith('data:')) {
        const base64Data = mediaUrl.split(',')[1];
        fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
        console.log(`📝 Extracted base64 and wrote to temp file before upload`);
    } else if (fs.existsSync(mediaUrl)) {
        console.log(`📂 Using local file: ${mediaUrl}`);
        fs.copyFileSync(mediaUrl, tempPath);
        console.log(`✅ Copied local file → ${tempPath}`);
    } else {
        console.log(`📂 Downloading ${isVideo ? 'video' : 'image'} from remote URL...`);
        const response = await page.request.get(mediaUrl);
        if (!response.ok()) {
            throw new Error(`Failed to download media: HTTP ${response.status()}`);
        }
        const buffer = await response.body();
        fs.writeFileSync(tempPath, buffer);
        console.log(`✅ Downloaded ${buffer.length} bytes → ${tempPath}`);
    }

    return { tempPath, isVideo };
}

/**
 * Calculates how long to wait (ms) after clicking post based on media presence and type.
 * @param {boolean} hasMedia
 * @param {boolean} isVideo
 * @returns {number}
 */
function postWaitMs(hasMedia, isVideo) {
    if (!hasMedia) return 10000;    // Text-only: 10s
    if (isVideo) return 45000;      // Video: 45s (server needs time to transcode)
    return 20000;                   // Image: 20s
}

/**
 * Converts a static image to a 3-second MP4 video using FFmpeg.
 * Useful for platforms like TikTok that strictly require video files.
 * @param {string} inputImagePath
 * @param {string} outputVideoPath
 * @returns {Promise<void>}
 */
function convertImageToVideo(inputImagePath, outputVideoPath) {
    return new Promise((resolve, reject) => {
        console.log(`🎬 Converting image to video: ${path.basename(inputImagePath)}`);
        ffmpeg()
            .input(inputImagePath)
            .loop(1) // Loop the single input image
            .input('anullsrc') // Generate silent audio
            .inputFormat('lavfi')
            .duration(4) // 4 seconds total duration
            .fps(30)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
                '-pix_fmt yuv420p',
                '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure dimensions are even
                '-shortest' // Finish exactly at 4 seconds
            ])
            .save(outputVideoPath)
            .on('end', () => {
                console.log(`✅ Image converted to exactly 4s video with silent audio → ${outputVideoPath}`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`❌ FFmpeg conversion error:`, err.message);
                reject(err);
            });
    });
}

module.exports = { isVideoUrl, downloadMedia, postWaitMs, convertImageToVideo };
