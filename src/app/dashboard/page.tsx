import { createClient } from '@/supabase/server';
import Link from 'next/link';
import { getProjects } from '@/database/queries';
import { formatDate } from '@/lib/utils';
import type { Project } from '@/types';
import DeleteProjectButton from '@/components/DeleteProjectButton';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let projects: Project[] = [];
    try {
        projects = await getProjects();
    } catch {
        // If DB not set up yet, show empty state
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Projects</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
                        {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link href="/dashboard/new" className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Project
                </Link>
            </div>

            <div className="page-content">
                {projects.length === 0 ? (
                    /* Empty state */
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '80px 20px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'var(--accent-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                        </div>
                        <h2 style={{ marginBottom: 8 }}>No projects yet</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 360 }}>
                            Create your first project to let TitanOS analyze your business and generate a full AI marketing strategy.
                        </p>
                        <Link href="/dashboard/new" className="btn btn-primary btn-lg">
                            Create your first project
                        </Link>
                    </div>
                ) : (
                    <div className="project-grid">
                        {projects.map((project) => (
                            <div key={project.id} className="card card-hover project-card" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
                                <Link
                                    href={`/dashboard/projects/${project.id}`}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        display: 'block',
                                        padding: '16px 20px',
                                        height: '100%'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 10,
                                                background: 'var(--accent-subtle)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 18,
                                                fontWeight: 700,
                                                color: 'var(--accent)',
                                            }}
                                        >
                                            {project.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ paddingRight: 32 }}>
                                            <span className={`badge badge-${project.status}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 style={{ marginBottom: 4, fontSize: 15 }}>{project.name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                                        {project.website_url}
                                    </p>

                                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                        Created {formatDate(project.created_at)}
                                    </p>
                                </Link>

                                {/* Delete Button - Absolute positioned outside the link to prevent event hijacking */}
                                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                                    <DeleteProjectButton projectId={project.id} projectName={project.name} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
