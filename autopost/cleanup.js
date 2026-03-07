const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
    console.log('🧹 TitanOS Distribution Queue Cleanup...');

    // 1. Mark as failed (since cancelled isn't in the enum)
    const { data: cancelled, error: cancelError } = await supabase
        .from('distribution_jobs')
        .update({ status: 'failed', error_message: 'User requested reset' })
        .in('status', ['pending', 'processing']);

    if (cancelError) {
        console.error('❌ Cancel Error:', cancelError.message);
        return;
    }
    console.log('✅ Cancelled all bulk pending jobs.');

    // 2. Find the most recent LinkedIn job
    const { data: jobs, error: findError } = await supabase
        .from('distribution_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Fetch a few recent jobs to find a LinkedIn one

    if (findError) {
        console.error('❌ Find Latest Error:', findError.message);
        return;
    }

    // Priority: Instagram, then X (Twitter), then LinkedIn, then others
    const jobToReset = jobs.find(j => j.platform.toLowerCase() === 'instagram') ||
        jobs.find(j => j.platform.toLowerCase() === 'x' || j.platform.toLowerCase() === 'twitter') ||
        jobs.find(j => j.platform.toLowerCase() === 'linkedin') ||
        jobs[0];

    if (jobToReset) {
        console.log(`🎯 Re-queuing most recent job: ${jobToReset.id} (${jobToReset.platform})`);

        const { error: resetErr } = await supabase
            .from('distribution_jobs')
            .update({
                status: 'pending',
                error_message: null,
                retry_count: 0,
                scheduled_time: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', jobToReset.id);

        if (resetErr) console.error("❌ Failed to re-queue job:", resetErr.message);
        else console.log("🚀 Most recent post is now LIVE in the queue!");
    }
}

cleanup().catch(console.error);
