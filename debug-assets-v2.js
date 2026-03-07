const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Njg3NTcsImV4cCI6MjA4NzQ0NDc1N30.FbAVQKwnO0Gg0b5zlABToH_E52WYyxos5ZmYGxUhFy4";

const supabase = createClient(URL, KEY);

async function checkAssets() {
    console.log('--- START ---');
    const { data: assets, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log('Total recent assets:', assets.length);
    const videos = assets.filter(a => a.asset_type === 'video');
    console.log('Video assets found:', videos.length);

    videos.forEach(v => {
        console.log(`VIDEO_FOUND: ${v.asset_url} | ID: ${v.id}`);
    });

    if (assets.length > 0) {
        console.log('Latest asset type:', assets[0].asset_type);
        console.log('Latest asset URL:', assets[0].asset_url);
    }
    console.log('--- END ---');
}

checkAssets();
