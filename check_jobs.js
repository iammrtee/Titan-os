const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl, supabaseKey;

for (const line of envLocal.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/^"|"$|^'|'$/g, '');
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/^"|"$|^'|'$/g, '');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    console.log("Checking jobs...");
    const { data, error } = await supabase
        .from('distribution_jobs')
        .select(`
            id,
            platform,
            status,
            error_message,
            retry_count,
            created_at,
            updated_at,
            campaign_assets!inner ( asset_url )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
    } else {
        const videoJobs = data.filter(job => job.campaign_assets.asset_url.match(/\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i));
        console.log("Video jobs found:");
        console.log(JSON.stringify(videoJobs.slice(0, 5), null, 2));
    }
}

checkJobs();
