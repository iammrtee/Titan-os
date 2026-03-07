/**
 * TitanOS Autopost Daemon
 * Continuously polls Supabase for pending distribution_jobs and posts via Playwright.
 * Run this once: node autopost/daemon.js
 * It handles all platforms: Instagram, Facebook, LinkedIn, X (Twitter)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const instagram = require('./platforms/instagram');
const twitter = require('./platforms/twitter');
const linkedin = require('./platforms/linkedin');
const facebook = require('./platforms/facebook');
const tiktok = require('./platforms/tiktok');
const linkedinApi = require('./platforms/linkedin_api');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const PROCESSING_LOCK = new Set(); // prevent double-processing

async function processOnePlatformJob(job) {
    if (PROCESSING_LOCK.has(job.id)) return;
    PROCESSING_LOCK.add(job.id);

    const platform = (job.platform || '').toLowerCase();
    const caption = job.caption || job.campaigns?.flyer_content || 'Check out our latest update! 🚀';
    const mediaUrl = (job.media_urls && job.media_urls.length > 0)
        ? job.media_urls[0]
        : job.campaign_assets?.asset_url || null;

    const postData = {
        id: job.id,
        platform,
        caption,
        mediaUrl,
        mediaUrls: job.media_urls?.length > 0 ? job.media_urls : (mediaUrl ? [mediaUrl] : [])
    };

    console.log(`\n📦 [${new Date().toLocaleTimeString()}] Processing Job ${job.id} → ${platform.toUpperCase()}`);
    if (mediaUrl) console.log(`   Media: ${mediaUrl.substring(0, 60)}...`);

    // Mark as processing immediately to prevent runner.js duplicate processing
    await supabase.from('distribution_jobs').update({ status: 'processing' }).eq('id', job.id);

    let result;
    try {
        if (platform === 'instagram') {
            result = await instagram.post(postData);
        } else if (platform === 'facebook') {
            result = await facebook.post(postData);
        } else if (platform === 'x' || platform === 'twitter') {
            result = await twitter.post(postData);
        } else if (platform === 'linkedin') {
            // Try API first, fall back to browser
            result = await linkedinApi.post(postData);
            if (!result.success && (result.error?.includes('missing') || result.error?.includes('No LinkedIn'))) {
                console.log('⚠️  LinkedIn API failed, falling back to browser automation...');
                result = await linkedin.post(postData);
            }
        } else if (platform === 'tiktok') {
            result = await tiktok.post(postData);
        } else {
            result = { success: false, error: `Unsupported platform: ${platform}` };
        }
    } catch (err) {
        result = { success: false, error: err.message };
    }

    if (result?.success) {
        console.log(`✅ Job ${job.id} → ${platform.toUpperCase()} POSTED!`);
        await supabase.from('distribution_jobs').update({
            status: 'success',
            error_message: null,
            updated_at: new Date().toISOString()
        }).eq('id', job.id);
    } else {
        const errMsg = result?.error || 'Unknown error';
        console.error(`❌ Job ${job.id} failed: ${errMsg}`);
        const retries = (job.retry_count || 0) + 1;
        const isFinal = retries >= 3;
        const nextTime = new Date(Date.now() + 1000 * 60 * (5 * retries)).toISOString();
        await supabase.from('distribution_jobs').update({
            status: isFinal ? 'failed' : 'pending',
            error_message: errMsg,
            retry_count: retries,
            scheduled_time: nextTime,
            updated_at: new Date().toISOString()
        }).eq('id', job.id);
        if (isFinal) console.log(`⛔ Job ${job.id} permanently failed after ${retries} retries.`);
    }

    PROCESSING_LOCK.delete(job.id);
}

async function poll() {
    const { data: jobs, error } = await supabase
        .from('distribution_jobs')
        .select(`
            id, platform, status, caption, media_urls, retry_count, scheduled_time,
            campaign_assets(asset_url),
            campaigns(flyer_content)
        `)
        .eq('status', 'pending')
        .lte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(5);

    if (error) {
        console.error('❌ Poll error:', error.message);
        return;
    }

    if (!jobs || jobs.length === 0) {
        process.stdout.write('.'); // Show alive without flooding console
        return;
    }

    console.log(`\n🔔 Found ${jobs.length} pending job(s)`);
    // Process in parallel (up to 2 at a time to avoid rate limits)
    const batches = [];
    for (let i = 0; i < jobs.length; i += 2) {
        batches.push(jobs.slice(i, i + 2));
    }
    for (const batch of batches) {
        await Promise.all(batch.map(processOnePlatformJob));
    }
}

/**
 * Purge distribution_jobs older than 30 hours to keep the queue lean.
 * Jobs that are 'pending' but older than 30h are marked failed (stale).
 * Jobs that are 'success'/'failed' and older than 30h are deleted entirely.
 */
async function cleanupOldJobs() {
    const cutoff = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    console.log(`🧹 Running queue cleanup (removing jobs before ${cutoff})...`);

    // Mark stale pending jobs as failed
    const { count: staled } = await supabase
        .from('distribution_jobs')
        .update({ status: 'failed', error_message: 'Expired: job older than 30 hours' })
        .eq('status', 'pending')
        .lt('created_at', cutoff);

    // Delete completed/failed jobs older than 30h
    const { count: deleted } = await supabase
        .from('distribution_jobs')
        .delete()
        .in('status', ['success', 'failed'])
        .lt('updated_at', cutoff);

    console.log(`✅ Queue cleanup done: ${staled || 0} staled, ${deleted || 0} deleted.`);
}


async function startDaemon() {
    console.log('🤖 TitanOS Autopost Daemon ACTIVE');
    console.log(`   Polling every ${POLL_INTERVAL_MS / 1000}s for new jobs...`);
    console.log('   Press Ctrl+C to stop.\n');

    // Initial poll immediately, then every 30s
    await poll();
    await cleanupOldJobs(); // Clean on startup
    setInterval(async () => {
        await poll();
        // Run cleanup once per hour
        if (Date.now() % (60 * 60 * 1000) < POLL_INTERVAL_MS) {
            await cleanupOldJobs();
        }
    }, POLL_INTERVAL_MS);
}

startDaemon().catch(err => {
    console.error('Fatal error starting daemon:', err);
    process.exit(1);
});
