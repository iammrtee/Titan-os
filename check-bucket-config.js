const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

const supabase = createClient(URL, SERVICE_KEY);

async function checkBucket() {
    console.log("--- CHECKING BUCKET CONFIG ---");
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    const bucket = buckets.find(b => b.name === 'campaign-assets');
    if (bucket) {
        console.log('Bucket: campaign-assets');
        console.log('Public:', bucket.public);
        console.log('Allowed MIME Types:', bucket.allowed_mime_types);
        console.log('Max File Size:', bucket.file_size_limit);
    } else {
        console.log('Bucket campaign-assets NOT FOUND.');
    }
    console.log("--- END ---");
}

checkBucket();
