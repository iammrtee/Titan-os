require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
