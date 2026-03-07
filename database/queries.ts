import { createClient, createAdminClient } from '@/supabase/server';
import type { Project, CreateProjectInput, UserProfile } from '@/types';

// ─── User Queries ─────────────────────────────────────────────

export async function getCurrentUser(): Promise<UserProfile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    return data;
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'pro' | 'growth' | 'starter'): Promise<void> {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) throw error;
}

// ─── Project Queries ──────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function getProjectById(id: string): Promise<Project | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('projects')
        .insert({
            ...input,
            user_id: user.id,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProjectStatus(
    id: string,
    status: Project['status'],
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}

// ─── AI Output Queries ────────────────────────────────────────

export async function getProjectOutputs(projectId: string) {
    const supabase = await createClient();

    const [analysis, positioning, funnel, calendar, ads, assets] = await Promise.all([
        supabase.from('website_analysis').select('*').eq('project_id', projectId).single(),
        supabase.from('positioning_output').select('*').eq('project_id', projectId).single(),
        supabase.from('funnel_output').select('*').eq('project_id', projectId).single(),
        supabase.from('content_calendar').select('*').eq('project_id', projectId).single(),
        supabase.from('ad_campaigns').select('*').eq('project_id', projectId).single(),
        supabase.from('content_assets').select('*').eq('project_id', projectId).single(),
    ]);

    return {
        analysis: analysis.data,
        positioning: positioning.data,
        funnel: funnel.data,
        calendar: calendar.data,
        ads: ads.data,
        assets: assets.data,
    };
}
