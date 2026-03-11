import { notFound } from 'next/navigation';
import { createClient } from '@/supabase/server';
import { getProjectOutputs } from '@/database/queries';
import ProjectDetailClient from '@/components/ProjectDetailClient';
import type { Project } from '@/types';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !project) notFound();

    // Authorization check: Only owner or admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || user.email === 'tazrt37@gmail.com';
    const isOwner = project.user_id === user.id;

    if (!isOwner && !isAdmin) notFound();

    const outputs = {};

    return <ProjectDetailClient project={project as Project} outputs={outputs} />;
}
