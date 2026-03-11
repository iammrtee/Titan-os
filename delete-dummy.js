require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, KEY);

async function deleteDummy() {
    const { data, error } = await supabase
        .from('campaign_assets')
        .delete()
        .eq('id', 'c7dacec3-f786-415b-8507-bf2d3d222aa8');

    if (error) {
        console.log('Error deleting dummy:', error.message);
    } else {
        console.log('Dummy asset deleted successfully.');
    }
}

deleteDummy();
