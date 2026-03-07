/**
 * TitanOS Direct Post Test
 * Grabs a real asset from Supabase and posts it to Instagram via Playwright
 * Bypasses social_accounts table — uses Playwright browser automation directly
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function directPost() {
    console.log('🤖 TitanOS Direct Post Test\n');

    // 1. Grab a real asset URL
    const { data: asset, error } = await supabase
        .from('campaign_assets')
        .select('id, asset_url, campaigns(id, flyer_content)')
        .not('asset_url', 'is', null)
        .limit(1)
        .single();

    if (error || !asset) {
        console.error('❌ Cannot find asset:', error?.message);
        return;
    }

    console.log('✅ Asset found:');
    console.log('   URL:', asset.asset_url);
    console.log('   Campaign:', asset.campaigns?.id);

    const caption = asset.campaigns?.flyer_content || 'Engineered for growth. 🚀 #TitanLeap';

    const postData = {
        id: asset.id,
        platform: 'facebook',
        caption,
        mediaUrl: asset.asset_url,
        mediaUrls: [asset.asset_url]
    };

    console.log('\n📤 Posting to Facebook via browser automation...\n');

    // 2. Run platform script
    const facebook = require('./platforms/facebook');
    const result = await facebook.post(postData);

    console.log('\n📋 Result:', JSON.stringify(result, null, 2));

    if (result.success) {
        console.log('\n✅ POSTED SUCCESSFULLY!');
        // Mark any pending FB jobs as success
        await supabase
            .from('distribution_jobs')
            .update({ status: 'success', error_message: null })
            .eq('status', 'pending')
            .eq('platform', 'facebook')
            .eq('campaign_assets', asset.id);
    } else {
        console.log('\n❌ Post failed:', result.error);
    }
}

directPost().catch(console.error);
