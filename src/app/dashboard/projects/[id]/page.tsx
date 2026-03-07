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

    let outputs = {};
    if (project.status === 'completed') {
        try {
            outputs = await getProjectOutputs(id);
        } catch {
            // Outputs might not exist yet
        }
    }

    return <ProjectDetailClient project={project as Project} outputs={outputs} />;
}
