const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPending() {
    console.log("🔍 Fetching pending distribution jobs...");
    const { data: jobs, error } = await supabase
        .from('distribution_jobs')
        .select(`
            id,
            platform,
            status,
            scheduled_time,
            campaigns(flyer_content)
        `)
        .eq('status', 'pending');

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log("📭 Queue is empty.");
        return;
    }

    console.log(`🚀 Found ${jobs.length} pending jobs:`);
    jobs.forEach(j => {
        console.log(`- [${j.platform}] ID: ${j.id} | Scheduled: ${j.scheduled_time}`);
    });
}

checkPending();
