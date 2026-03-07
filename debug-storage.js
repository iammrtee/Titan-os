const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

const supabase = createClient(URL, KEY);
const campaignId = "bef0957a-cbe8-4e0b-8b41-7d2093deb717";

async function listStorageFiles() {
    console.log(`--- LISTING STORAGE FOR CAMPAIGN: ${campaignId} ---`);
    const { data, error } = await supabase
        .storage
        .from('campaign-assets')
        .list(`assets/${campaignId}`);

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log(`Found ${data.length} files in storage.`);
    data.forEach(f => {
        console.log(`FILE: ${f.name} | Size: ${f.metadata?.size} | Created: ${f.created_at}`);
    });
    console.log('--- END ---');
}

listStorageFiles();
