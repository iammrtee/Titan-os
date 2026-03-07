'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
    { id: 1, label: 'Business Info' },
    { id: 2, label: 'Review & Generate' },
];

export default function NewProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        website_url: '',
        niche: '',
        target_audience: '',
        offer: '',
        revenue_goal: '',
        platform: '',
        tone: 'Confident, authoritative, strategic',
        current_funnel: '',
        extra_details: '',
    });

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleCreate() {
        setLoading(true);
        setError('');

        try {
            const payload = {
                name: form.name,
                website_url: form.website_url,
                business_details: JSON.stringify({
                    niche: form.niche,
                    target_audience: form.target_audience,
                    offer: form.offer,
                    revenue_goal: form.revenue_goal,
                    platform: form.platform,
                    tone: form.tone,
                    current_funnel: form.current_funnel,
                    extra_details: form.extra_details,
                }),
            };

            // 1. Create the project
            const createRes = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                const data = await createRes.json();
                throw new Error(data.error ?? 'Failed to create project');
            }

            const project = await createRes.json();

            // 2. Kick off AI generation
            router.push(`/dashboard/projects/${project.id}?generate=true`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>New Project</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
                        Tell us about your business and we&apos;ll generate your full marketing strategy.
                    </p>
                </div>
            </div>

            <div className="page-content" style={{ maxWidth: 640 }}>
                {/* Step indicator */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: step >= s.id ? 'var(--accent)' : 'var(--text-muted)',
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: step >= s.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
                                    border: `1px solid ${step >= s.id ? 'var(--accent-border)' : 'var(--border)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}
                            >
                                {s.id}
                            </div>
                            {s.label}
                            {s.id < STEPS.length && (
                                <div
                                    style={{
                                        width: 40,
                                        height: 1,
                                        background: step > s.id ? 'var(--accent)' : 'var(--border)',
                                        marginLeft: 4,
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="card">
                    {step === 1 && (
                        <div>
                            <h2 style={{ marginBottom: 4 }}>Business Information</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                                Provide details about your business so our AI can create the most accurate strategy.
                            </p>

                            <div className="form-group">
                                <label className="label" htmlFor="name">
                                    Project Name *
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    className="input"
                                    placeholder="e.g. Acme Corp Q1 Strategy"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="website_url">
                                    Website URL *
                                </label>
                                <input
                                    id="website_url"
                                    name="website_url"
                                    className="input"
                                    placeholder="https://yourwebsite.com"
                                    value={form.website_url}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="niche">
                                    Industry / Niche *
                                </label>
                                <input id="niche" name="niche" className="input" placeholder="e.g. B2B SaaS, Fitness Coaching" value={form.niche} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="target_audience">
                                    Target Audience *
                                </label>
                                <input id="target_audience" name="target_audience" className="input" placeholder="e.g. Stressed founders, Gen Z creators" value={form.target_audience} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="offer">
                                    Main Offer / Product *
                                </label>
                                <input id="offer" name="offer" className="input" placeholder="e.g. AI Workflow Software, $5k VIP Coaching" value={form.offer} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="revenue_goal">
                                    Monthly Revenue Goal *
                                </label>
                                <input id="revenue_goal" name="revenue_goal" className="input" placeholder="e.g. $50,000 MRR" value={form.revenue_goal} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="platform">
                                    Primary Social Platform *
                                </label>
                                <input id="platform" name="platform" className="input" placeholder="e.g. Instagram & LinkedIn" value={form.platform} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="tone">
                                    Brand Tone
                                </label>
                                <input id="tone" name="tone" className="input" placeholder="e.g. Confident, authoritative, strategic" value={form.tone} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="current_funnel">
                                    Current Marketing Funnel (Optional)
                                </label>
                                <textarea
                                    id="current_funnel"
                                    name="current_funnel"
                                    className="input textarea"
                                    placeholder="e.g. Meta Ads -> Landing Page -> Lead Magnet -> Email Sequence -> Sales Call"
                                    value={form.current_funnel}
                                    onChange={handleChange}
                                    style={{ minHeight: 80 }}
                                />
                                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                                    If you already have a funnel, describe it here and we&apos;ll optimize it.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="extra_details">
                                    Extra Magic Details (Optional)
                                </label>
                                <textarea
                                    id="extra_details"
                                    name="extra_details"
                                    className="input textarea"
                                    placeholder="Any specific angles, stories, or constraints you want the AI to know?"
                                    value={form.extra_details}
                                    onChange={handleChange}
                                    style={{ minHeight: 100 }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setStep(2)}
                                    disabled={!form.name || !form.website_url || !form.niche || !form.target_audience || !form.offer}
                                >
                                    Continue
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 style={{ marginBottom: 4 }}>Review & Generate</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                                Confirm your details and start the AI generation process.
                            </p>

                            {/* Summary */}
                            <div
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    padding: 16,
                                    marginBottom: 24,
                                }}
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>PROJECT NAME</p>
                                    <p style={{ fontWeight: 600 }}>{form.name}</p>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>WEBSITE</p>
                                    <p style={{ color: 'var(--accent)' }}>{form.website_url}</p>
                                </div>
                                {form.current_funnel && (
                                    <div style={{ marginBottom: 12 }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>CURRENT FUNNEL</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                            {form.current_funnel.substring(0, 100)}{form.current_funnel.length > 100 ? '...' : ''}
                                        </p>
                                    </div>
                                )}
                                {form.extra_details && (
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>EXTRA DETAILS</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                            {form.extra_details.substring(0, 200)}{form.extra_details.length > 200 ? '...' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* What will be generated */}
                            <div
                                style={{
                                    background: 'var(--accent-subtle)',
                                    border: '1px solid var(--accent-border)',
                                    borderRadius: 'var(--radius)',
                                    padding: 16,
                                    marginBottom: 24,
                                }}
                            >
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>
                                    AI will generate:
                                </p>
                                {[
                                    '🔍 Website & Business Analysis',
                                    '🎯 Brand Positioning Strategy',
                                    '🚀 Full Marketing Funnel',
                                    '📅 30-Day Content Calendar',
                                    '📣 Ad Campaign Variants',
                                ].map((item) => (
                                    <div key={item} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0' }}>
                                        {item}
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        background: 'var(--error-subtle)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--error)',
                                        fontSize: 13,
                                        marginBottom: 16,
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleCreate}
                                    disabled={loading}
                                >
                                    {loading ? <span className="spinner" /> : null}
                                    {loading ? 'Starting generation...' : 'Generate Strategy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
