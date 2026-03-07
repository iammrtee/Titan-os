const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const instagram = require('./platforms/instagram');
const twitter = require('./platforms/twitter');
const linkedin = require('./platforms/linkedin');
const facebook = require('./platforms/facebook');

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("🤖 TitanOS Autopost Runner Active");

    // 1. Fetch pending jobs from Supabase
    const { data: jobs, error } = await supabase
        .from('distribution_jobs')
        .select(`
            id,
            platform,
            status,
            caption,
            media_urls,
            scheduled_time,
            campaign_assets(asset_url),
            campaigns(flyer_content)
        `)
        .eq('status', 'pending')
        .lte('scheduled_time', new Date().toISOString());

    if (error) {
        console.error("❌ Error fetching jobs:", error.message);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log("📭 No pending posts in queue.");
        return;
    }

    console.log(`🚀 Found ${jobs.length} pending jobs.`);

    for (const job of jobs) {
        console.log(`📦 Processing ${job.platform} for Job ID: ${job.id}`);

        // Prefer user-composed caption, fall back to campaign flyer content
        const caption = job.caption
            || job.campaigns?.flyer_content
            || "Check out our latest update!";

        // Prefer user-selected media list (multi-image), fall back to single asset url
        const mediaUrls = job.media_urls && job.media_urls.length > 0
            ? job.media_urls
            : (job.campaign_assets?.asset_url ? [job.campaign_assets.asset_url] : []);

        const postData = {
            id: job.id,
            platform: job.platform.toLowerCase(),
            caption,
            mediaUrl: mediaUrls[0] || null,  // primary image
            mediaUrls                          // all images (for carousels)
        };

        // Mark as processing
        await supabase.from('distribution_jobs').update({ status: 'processing' }).eq('id', job.id);

        let result;
        const linkedinApi = require('./platforms/linkedin_api');

        if (postData.platform === 'instagram') {
            result = await instagram.post(postData);
        } else if (postData.platform === 'twitter' || postData.platform === 'x') {
            result = await twitter.post(postData);
        } else if (postData.platform === 'linkedin') {
            // First try API
            console.log("尝试通过 API 发布到 LinkedIn...");
            result = await linkedinApi.post(postData);

            // If API fails due to missing config, fallback to Browser
            if (!result.success && (result.error?.includes("missing") || result.error?.includes("No LinkedIn account"))) {
                console.log("⚠️ LinkedIn API 配置缺失或失败，回退到浏览器自动化...");
                result = await linkedin.post(postData);
            }
        } else if (postData.platform === 'facebook') {
            result = await facebook.post(postData);
        }

        if (result && result.success) {
            console.log(`✅ Job ${job.id} completed successfully.`);
            await supabase.from('distribution_jobs').update({
                status: 'success',
                updated_at: new Date().toISOString()
            }).eq('id', job.id);
        } else {
            console.error(`❌ Job ${job.id} failed:`, result?.error);
            await supabase.from('distribution_jobs').update({
                status: 'pending', // Reset for retry or mark failed
                error_message: result?.error,
                updated_at: new Date().toISOString()
            }).eq('id', job.id);
        }
    }
}

run().catch(console.error);
