require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('🔍 Checking all social_accounts in DB...\n');

    const { data: allAccounts, error } = await supabase
        .from('social_accounts')
        .select('id, user_id, platform, display_name, username, platform_user_id, access_token, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }

    if (!allAccounts || allAccounts.length === 0) {
        console.log('❌ social_accounts table is EMPTY — no OAuth tokens stored yet.');
        console.log('\n👉 You need to link a social account from the campaign page.');
        console.log('   Go to: https://titan-os-bay.vercel.app');
        console.log('   Open a Campaign → click "Instagram + Link" to connect it.\n');
        return;
    }

    console.log(`✅ Found ${allAccounts.length} social account(s):\n`);
    allAccounts.forEach(a => {
        console.log(`Platform: ${a.platform} | User: ${a.user_id}`);
        console.log(`  Name: ${a.display_name || a.username || 'N/A'}`);
        console.log(`  platform_user_id: ${a.platform_user_id}`);
        console.log(`  Token: ${a.access_token ? a.access_token.substring(0, 15) + '...' : '❌ MISSING'}`);
        console.log();
    });

    // Check if any accounts exist for the campaign user
    const campaignUserId = 'b366cc70-7553-452a-bbb3-4338aaf0c59e';
    const userAccounts = allAccounts.filter(a => a.user_id === campaignUserId);
    if (userAccounts.length === 0) {
        console.log(`⚠️  No accounts for campaign user ${campaignUserId}`);
        console.log('   Accounts exist but belong to different users.');
        console.log('   The accounts found belong to users:');
        [...new Set(allAccounts.map(a => a.user_id))].forEach(uid => console.log('  -', uid));
    }
}

diagnose().catch(console.error);
