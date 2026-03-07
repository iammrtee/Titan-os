const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";
const campaignId = "bef0957a-cbe8-4e0b-8b41-7d2093deb717";

const supabase = createClient(URL, SERVICE_KEY);

async function simulateUpload() {
    console.log("--- SIMULATING VIDEO UPLOAD ---");

    // 1. Create a dummy tiny mp4 file
    const tempVideoPath = path.join(__dirname, 'test_video.mp4');
    fs.writeFileSync(tempVideoPath, Buffer.from([0, 0, 0, 20, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 1, 105, 115, 111, 109]));

    const fileStats = fs.statSync(tempVideoPath);
    const fileBuffer = fs.readFileSync(tempVideoPath);

    // 2. Storage Upload
    const fileName = `${campaignId}/test-${Date.now()}.mp4`;
    const filePath = `assets/${fileName}`;

    console.log(`Uploading to storage: ${filePath}...`);
    const { data: storageData, error: storageError } = await supabase
        .storage
        .from('campaign-assets')
        .upload(filePath, fileBuffer, { contentType: 'video/mp4' });

    if (storageError) {
        console.log('STORAGE ERROR:', storageError.message);
        return;
    }
    console.log('Storage upload successful.');

    // 3. Get URL
    const { data: { publicUrl } } = supabase.storage.from('campaign-assets').getPublicUrl(filePath);
    console.log('Public URL:', publicUrl);

    // 4. DB Insert
    console.log('Inserting into database...');
    const { data: dbData, error: dbError } = await supabase
        .from('campaign_assets')
        .insert({
            campaign_id: campaignId,
            asset_type: 'video',
            asset_url: publicUrl,
            metadata: {
                original_name: 'test_video.mp4',
                size_bytes: fileStats.size,
                mime_type: 'video/mp4',
                manual_upload: true
            }
        })
        .select();

    if (dbError) {
        console.log('DATABASE ERROR:', dbError.message);
    } else {
        console.log('Database insertion successful:', dbData[0].id);
    }

    // Cleanup
    fs.unlinkSync(tempVideoPath);
    console.log("--- END ---");
}

simulateUpload();
