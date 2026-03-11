const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple env parser for .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStuckProjects() {
    console.log('[Fix] Checking for projects stuck in "generating" status...');
    
    // Find projects in generating status
    const { data: generatingProjects, error: fetchError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'generating');

    if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        return;
    }

    console.log(`[Fix] Found ${generatingProjects?.length || 0} projects to check.`);

    for (const project of (generatingProjects || [])) {
        // Check if the final step (content_assets) exists
        const { count, error: countError } = await supabase
            .from('content_assets')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

        if (countError) {
            console.error(`Error checking assets for ${project.name}:`, countError);
            continue;
        }

        if (count && count > 0) {
            console.log(`[Fix] Repairing project "${project.name}" → completed`);
            await supabase
                .from('projects')
                .update({ status: 'completed' })
                .eq('id', project.id);
        } else {
            console.log(`[Fix] Project "${project.name}" is genuinely still generating or failed.`);
        }
    }
    
    console.log('[Fix] Repair complete.');
}

fixStuckProjects();
