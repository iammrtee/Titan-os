const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './autopost/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
    console.log('🧹 TitanOS Distribution Queue Cleanup...');

    // 1. Cancel all pending/processing jobs
    const { data: cancelled, error: cancelError } = await supabase
        .from('distribution_jobs')
        .update({ status: 'cancelled', error_message: 'User cancelled via maintenance' })
        .in('status', ['pending', 'processing']);

    if (cancelError) {
        console.error('❌ Cancel Error:', cancelError.message);
        return;
    }
    console.log('✅ Cancelled all bulk pending jobs.');

    // 2. Find the most recent job (latest created)
    const { data: latest, error: findError } = await supabase
        .from('distribution_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (findError) {
        console.error('❌ Find Latest Error:', findError.message);
        return;
    }

    if (latest) {
        console.log(`🎯 Re-queuing most recent job: ${latest.id} (${latest.platform})`);

        // 3. Mark the most recent one as pending + set scheduled time to NOW
        const { error: resetError } = await supabase
            .from('distribution_jobs')
            .update({
                status: 'pending',
                scheduled_time: new Date().toISOString(),
                error_message: null
            })
            .eq('id', latest.id);

        if (resetError) {
            console.error('❌ Reset Error:', resetError.message);
        } else {
            console.log('🚀 Most recent post is now LIVE in the queue!');
        }
    }
}

cleanup();
