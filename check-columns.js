const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Njg3NTcsImV4cCI6MjA4NzQ0NDc1N30.FbAVQKwnO0Gg0b5zlABToH_E52WYyxos5ZmYGxUhFy4";

const supabase = createClient(URL, KEY);

async function checkColumns() {
    console.log('--- CHECKING COLUMNS ---');
    const { data, error } = await supabase.from('campaign_assets').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('Sample Data:', data[0]);
        console.log('Available Columns:', Object.keys(data[0] || {}));
    }
}

checkColumns();
