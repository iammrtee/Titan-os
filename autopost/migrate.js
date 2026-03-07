const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
    console.log("Running DB migration...");

    // Try direct insert approach to test if columns exist
    const { error: testError } = await supabase
        .from('distribution_jobs')
        .select('caption, media_urls')
        .limit(1);

    if (testError && testError.message.includes('caption')) {
        console.log("Column caption not found. Need to add via Supabase Dashboard SQL editor.");
        console.log("\n📋 Copy and run this SQL in your Supabase Dashboard SQL editor:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("ALTER TABLE distribution_jobs ADD COLUMN IF NOT EXISTS caption TEXT;");
        console.log("ALTER TABLE distribution_jobs ADD COLUMN IF NOT EXISTS media_urls TEXT[];");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else if (testError) {
        console.log("Other error:", testError.message);
    } else {
        console.log("✅ Columns already exist or were added successfully!");
    }
}

migrate().catch(console.error);
