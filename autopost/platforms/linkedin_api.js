const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

exports.post = async (postData) => {
    console.log("🌐 Attempting API Post for LinkedIn...");

    const supabase = createClient(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch token from social_accounts
    // We'll use the pageId we found earlier: 100059033
    const pageId = "100059033";

    const { data: accounts, error: authError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('platform', 'linkedin')
        .limit(1);

    if (authError || !accounts || accounts.length === 0) {
        console.error("❌ LinkedIn API Error: No account found in social_accounts.");
        return { success: false, error: "No LinkedIn account linked in database." };
    }

    const token = accounts[0].access_token;

    try {
        console.log("📤 Sending post to LinkedIn API...");
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify({
                author: `urn:li:organization:${pageId}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: postData.caption
                        },
                        shareMediaCategory: "NONE"
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            })
        });

        const result = await response.json();
        if (response.ok) {
            console.log("🚀 LinkedIn API Post Success!");
            return { success: true, id: result.id };
        } else {
            console.error("❌ LinkedIn API Error:", result);
            return { success: false, error: result.message || "API Error" };
        }
    } catch (err) {
        console.error("❌ LinkedIn API Exception:", err.message);
        return { success: false, error: err.message };
    }
};
