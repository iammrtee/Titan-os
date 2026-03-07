import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Awaitable params for Next.js 15
) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
    }

    // Verify ownership and delete
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
