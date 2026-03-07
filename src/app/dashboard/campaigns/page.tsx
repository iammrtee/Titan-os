'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Campaign {
    id: string;
    status: string;
    flyer_image_url: string | null;
    flyer_content: string;
    flyer_style: string;
    created_at: string;
    projects: { id: string; name: string };
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/campaigns')
            .then(r => r.json())
            .then(d => { setCampaigns(d.campaigns || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const statusColor = (s: string) => s === 'complete' ? '#34d399' : s === 'failed' ? '#f87171' : '#facc15';

    return (
        <div className="container" style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px 16px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 32, borderBottom: 'none', padding: 0 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🚀 Campaigns</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13 }}>AI marketing campaigns from your flyers</p>
                </div>
                <Link href="/dashboard" className="btn btn-secondary">
                    ← Dashboard
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading campaigns…</div>
            ) : campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No campaigns yet</p>
                    <p style={{ fontSize: 13 }}>Generate a flyer and click "Generate Campaign" to create your first campaign.</p>
                </div>
            ) : (
                <div className="project-grid">
                    {campaigns.map(c => (
                        <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16,
                                padding: 20, cursor: 'pointer', transition: 'border-color 0.2s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                            >
                                {c.flyer_image_url && (
                                    <div style={{ position: 'relative', width: '100%', height: 180, marginBottom: 14, borderRadius: 10, overflow: 'hidden' }}>
                                        <Image
                                            src={c.flyer_image_url}
                                            alt="flyer"
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {c.projects?.name || 'Campaign'}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${statusColor(c.status)}22`, color: statusColor(c.status), textTransform: 'uppercase' }}>
                                        {c.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.flyer_content?.slice(0, 80) || 'No content'}
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
                                    {new Date(c.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
