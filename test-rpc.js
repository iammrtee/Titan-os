require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRpc() {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    console.log('Testing for exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });

    if (error) {
        console.log('RPC FAILED:', error.message);
    } else {
        console.log('RPC SUCCESS:', data);
    }
}

testRpc();
