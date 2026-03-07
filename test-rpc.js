const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

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
