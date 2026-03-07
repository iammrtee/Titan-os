const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

const supabase = createClient(URL, SERVICE_KEY);

async function updateBucket() {
    console.log("--- UPDATING BUCKET CONFIG ---");
    // Update to allow everything and 200MB limit
    const { data, error } = await supabase.storage.updateBucket('campaign-assets', {
        public: true,
        allowed_mime_types: null, // Allow all
        file_size_limit: 209715200 // 200MB
    });

    if (error) {
        console.log('ERROR:', error.message);
    } else {
        console.log('Bucket updated successfully.');
    }
    console.log("--- END ---");
}

updateBucket();
