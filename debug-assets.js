const { createClient } = require('@supabase/supabase-js');

// Manually injecting from .env.local since it's a quick debug script
const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

const supabase = createClient(URL, KEY);

async function checkAssets() {
    console.log('--- Checking Supabase Assets ---');
    const { data: assets, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!assets || assets.length === 0) {
        console.log('No assets found.');
    } else {
        assets.forEach(a => {
            console.log(`[${a.created_at}] ID: ${a.id} | Type: ${a.asset_type} | URL: ${a.asset_url}`);
        });
    }
}

checkAssets();
