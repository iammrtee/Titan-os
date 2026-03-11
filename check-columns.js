require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, KEY);

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
