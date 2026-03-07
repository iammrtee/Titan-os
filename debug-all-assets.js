const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Njg3NTcsImV4cCI6MjA4NzQ0NDc1N30.FbAVQKwnO0Gg0b5zlABToH_E52WYyxos5ZmYGxUhFy4";

const supabase = createClient(URL, KEY);

async function checkAllAssets() {
    console.log('--- ALL ASSETS CHECK ---');
    const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log('Recent Asset Summary:');
    data.forEach(a => {
        const metadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        const name = metadata?.original_name || 'unknown';
        console.log(`[${a.created_at}] TYPE: ${a.asset_type} | NAME: ${name} | URL: ${a.asset_url}`);
    });
}

checkAllAssets();
