const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

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
