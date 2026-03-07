const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFailedJobs() {
    console.log("🔍 Checking recently failed jobs...");
    const { data: jobs, error } = await supabase
        .from('distribution_jobs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching jobs:", error.message);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log("📭 No jobs found.");
        return;
    }

    jobs.forEach(job => {
        console.log(`📌 ID: ${job.id} | Platform: ${job.platform} | Status: ${job.status}`);
        console.log(`   Error: ${job.error_message}`);
        console.log(`   Time: ${job.updated_at}`);
        console.log('---');
    });
}

checkFailedJobs();
