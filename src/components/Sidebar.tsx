'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/auth/actions';
import type { UserProfile } from '@/types';

interface SidebarProps {
    user: UserProfile;
    projects: { id: string; name: string }[];
}

const navItems = [
    {
        href: '/dashboard',
        label: 'Projects',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
    },
];

const ROLE_COLORS: Record<string, string> = {
    admin: '#ef4444',
    pro: '#a78bfa',
    growth: '#60a5fa',
    starter: '#6b7280',
};

export default function Sidebar({ user, projects }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Close sidebar on navigation
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    async function handleLogout() {
        setIsLoggingOut(true);
        await logout();
    }

    async function handleDelete(projectId: string, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        setDeletingId(projectId);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }

            // If we are currently viewing the deleted project, redirect to dashboard
            if (pathname === `/dashboard/projects/${projectId}`) {
                router.push('/dashboard');
            } else {
                router.refresh(); // Refresh the list
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <>
            {/* Mobile Header (Hidden on desktop via CSS) */}
            <div className="mobile-header">
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #7c6fff, #4f46e5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 14,
                            color: '#fff',
                            flexShrink: 0,
                        }}
                    >
                        T
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        TitanOS
                    </span>
                </Link>
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: 4 }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
                    <div className="sidebar-logo" style={{ borderBottom: 'none', flex: 1 }}>
                        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #7c6fff, #4f46e5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: '#fff',
                                    flexShrink: 0,
                                }}
                            >
                                T
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                                TitanOS
                            </span>
                        </Link>
                    </div>
                    {/* Close button for mobile inside sidebar */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="btn-ghost mobile-show"
                        style={{ padding: 8, display: 'none' }}
                        aria-label="Close menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 16px' }}></div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div style={{ marginBottom: 4, padding: '8px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Workspace
                    </div>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
                            >
                                {item.icon}
                                {item.label}
                            </div>
                        </Link>
                    ))}

                    <Link href="/dashboard/new">
                        <div
                            className="sidebar-nav-item"
                            style={{
                                marginTop: 4,
                                color: 'var(--accent)',
                                background: pathname === '/dashboard/new' ? 'var(--accent-subtle)' : 'transparent',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Project
                        </div>
                    </Link>

                    {projects && projects.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <div style={{ marginBottom: 4, padding: '8px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Your Projects
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px' }}>
                                {projects.map((project) => {
                                    const projectHref = `/dashboard/projects/${project.id}`;
                                    const isActive = pathname === projectHref;
                                    return (
                                        <Link key={project.id} href={projectHref}>
                                            <div
                                                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                                style={{
                                                    fontSize: 13,
                                                    padding: '8px 12px',
                                                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
                                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                    {project.name}
                                                </span>
                                                <button
                                                    onClick={(e) => handleDelete(project.id, e)}
                                                    disabled={deletingId === project.id}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--text-muted)',
                                                        cursor: deletingId === project.id ? 'wait' : 'pointer',
                                                        padding: 4,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        opacity: deletingId === project.id ? 0.5 : 1
                                                    }}
                                                    title="Delete project"
                                                >
                                                    {deletingId === project.id ? (
                                                        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentcolor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover-danger">
                                                            <path d="M3 6h18"></path>
                                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 4,
                            background: 'var(--bg-hover)',
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'var(--accent-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--accent)',
                                flexShrink: 0,
                            }}
                        >
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.email}
                            </p>
                            <p style={{ fontSize: 11, color: ROLE_COLORS[user.role] ?? 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {user.role}
                            </p>
                        </div>
                    </div>
                    <button
                        className="sidebar-nav-item btn-ghost"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        style={{ width: '100%', color: 'var(--text-muted)' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            </aside >
        </>
    );
}
