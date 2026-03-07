const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

const supabase = createClient(URL, KEY);

async function searchAllVideos() {
    console.log("--- SEARCHING ALL VIDEO ASSETS ---");
    const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .eq('asset_type', 'video');

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log(`Found ${data.length} video assets globaly.`);
    data.forEach(a => {
        console.log(`[${a.created_at}] Campaign: ${a.campaign_id} | URL: ${a.asset_url}`);
    });
    console.log('--- END ---');
}

searchAllVideos();
