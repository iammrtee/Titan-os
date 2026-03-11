'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePDF } from 'react-to-pdf';
import type { Project, ChainStepStatus, WebsiteAnalysisOutput, PositioningResult, FunnelResult, ContentCalendarResult, AdCampaignsResult, ContentAssetsResult } from '@/types';
import ExportReport from './ExportReport';

interface ProjectOutputs {
    analysis?: { analysis_json: WebsiteAnalysisOutput | null } | null;
    positioning?: { positioning_json: PositioningResult | null } | null;
    funnel?: { funnel_json: FunnelResult | null } | null;
    calendar?: { calendar_json: ContentCalendarResult | null } | null;
    ads?: { campaigns_json: AdCampaignsResult | null } | null;
    assets?: { assets_json: ContentAssetsResult | null } | null;
}

interface ProjectDetailClientProps {
    project: Project;
    outputs: ProjectOutputs;
}

// Project services navigation based on core offerings
const SERVICES_MENU = [
    { key: 'strategy', label: 'Strategy and Brand Positioning', description: 'Market truth & value proposition' },
    { key: 'funnel', label: 'Funnel Design & Conversion Systems', description: 'Landing pages & lead magnets' },
    { key: 'ads', label: 'Paid Advertising (Performance Marketing)', description: 'Ad copy & creative strategy' },
    { key: 'content', label: 'Content Creation', description: 'Video scripts & visual concepts' },
    { key: 'social', label: 'Social Media Management', description: 'Content calendar & hooks' },
];

const CHAIN_STEPS: ChainStepStatus[] = [
    { step: 'website_analysis', status: 'pending', label: 'Analyzing Business & Market' },
    { step: 'positioning', status: 'pending', label: 'Extracting High-Conviction Positioning' },
    { step: 'funnel', status: 'pending', label: 'Architecting Conversion Funnel' },
    { step: 'content_calendar', status: 'pending', label: 'Creating 30-Day Content Matrix' },
    { step: 'ad_campaigns', status: 'pending', label: 'Generating Performance Ad Variants' },
    { step: 'content_assets', status: 'pending', label: 'Writing Storytelling Scripts & Creative Briefs' },
];

function JsonBlock({ data }: { data: unknown }) {
    return (
        <pre
            style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
                overflowX: 'auto',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
            }}
        >
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}

function KvRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 16,
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
                alignItems: 'flex-start',
            }}
        >
            <p style={{ width: 200, flexShrink: 0, color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>
                {label}
            </p>
            <div style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{value}</div>
        </div>
    );
}

function Tags({ items }: { items: string[] }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(Array.isArray(items) ? items : []).filter(Boolean).map((item, i) => (
                <span
                    key={i}
                    style={{
                        padding: '3px 10px',
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border)',
                        borderRadius: 100,
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                    }}
                >
                    {String(item)}
                </span>
            ))}
        </div>
    );
}

function AnalysisTab({ data }: { data: WebsiteAnalysisOutput | null | undefined }) {
    if (!data) return <p style={{ color: 'var(--text-muted)' }}>Not generated yet.</p>;

    // Backward compatibility for target audience
    const audience = data.target_audience_segments || (data as any).target_audience_segments || [(data as any).target_audience].filter(Boolean) || [];

    return (
        <div>
            <KvRow label="Business Type" value={data.business_type || 'N/A'} />
            <KvRow label="Core Transformation" value={data.core_transformation || 'N/A'} />
            <KvRow label="Target Audience" value={<Tags items={Array.isArray(audience) ? audience : []} />} />
            <KvRow label="Market Tension" value={String(data.market_tension || 'N/A')} />
            <KvRow label="Value Proposition" value={String(data.unique_value_proposition || 'N/A')} />
            <KvRow label="Messaging Gaps" value={<Tags items={Array.isArray(data.messaging_gap_analysis) ? data.messaging_gap_analysis : []} />} />
            <KvRow label="Unfair Advantages" value={<Tags items={Array.isArray(data.unfair_advantages) ? data.unfair_advantages : []} />} />

            {/* Competitor Analysis */}
            {(data as any).competitors && (Array.isArray((data as any).competitors) ? (data as any).competitors : []).length > 0 && (
                <div style={{ marginTop: 24, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>🛡️ Strategic Gaps & Competitors</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {(Array.isArray((data as any).competitors) ? (data as any).competitors : []).filter(Boolean).map((c: any, i: number) => (
                            <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', margin: '0 0 6px 0' }}>{String(c.name || 'Competitor')}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>The Gap:</span> {String(c.gap || 'N/A')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PositioningTab({ data }: { data: PositioningResult | null | undefined }) {
    if (!data) return <p style={{ color: 'var(--text-muted)' }}>Not generated yet.</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div className="card" style={{ borderColor: 'var(--accent-border)', background: 'var(--bg-hover)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em' }}>PHASE 1: STRATEGIC NARRATIVE</p>
                <KvRow label="The Villain" value={data.strategic_narrative?.the_villain || 'N/A'} />
                <KvRow label="The Enlightenment" value={data.strategic_narrative?.the_enlightenment || 'N/A'} />
                <KvRow label="New Category" value={<span style={{ fontWeight: 700, color: 'var(--success)' }}>{data.strategic_narrative?.new_category_name || 'N/A'}</span>} />
            </div>

            <div className="card" style={{ background: 'var(--accent-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>PHASE 2: POSITIONING ARCHITECTURE</p>
                <KvRow label="Core Thesis" value={<strong>{data.positioning_architecture?.core_thesis || 'N/A'}</strong>} />
                <KvRow label="Titan Promise" value={data.positioning_architecture?.the_titan_promise || 'N/A'} />
                <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 12 }}>{data.positioning_architecture?.identity_statement || ''}</p>
            </div>

            <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.08em' }}>PHASE 3: AUTHORITY PILLARS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(Array.isArray(data.authority_pillars) ? data.authority_pillars : []).filter(Boolean).map((pillar, i) => (
                        <div key={i} className="card">
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{String(pillar?.pillar || 'Pillar')}</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}><strong>Psych Hook:</strong> {String(pillar?.psychological_hook || 'N/A')}</p>
                            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}><strong>Proof Required:</strong> {String(pillar?.proof_requirement || 'N/A')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.08em' }}>PHASE 4: CONVERSION PSYCHOLOGY</p>
                <p><strong>Elite Headlines:</strong> {(Array.isArray(data.conversion_psychology?.elite_headlines) ? data.conversion_psychology?.elite_headlines : []).filter(Boolean).join(' | ') || 'N/A'}</p>
                <p><strong>Irreversible CTAs:</strong> {(Array.isArray(data.conversion_psychology?.irreversible_ctas) ? data.conversion_psychology?.irreversible_ctas : []).filter(Boolean).join(' | ') || 'N/A'}</p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--accent)', background: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.08em' }}>PHASE 5: STRATEGIC BLUEPRINT</p>
                <KvRow label="Ideal Customer Profile" value={data.strategic_blueprint?.icp || 'N/A'} />
                <KvRow label="Offer Angle" value={data.strategic_blueprint?.offer_angle || 'N/A'} />
                <KvRow label="Campaign Objective" value={data.strategic_blueprint?.campaign_objective || 'N/A'} />
            </div>
        </div>
    );
}

function FunnelTab({ data }: { data: FunnelResult | null | undefined }) {
    if (!data) return <p style={{ color: 'var(--text-muted)' }}>Not generated yet.</p>;
    const arch = data.funnel_architecture;

    // Safety check for architecture existence (legacy data might not have it)
    if (!arch) return <p style={{ color: 'var(--text-muted)' }}>Structure incompatible or not generated.</p>;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card">
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Top of Funnel</p>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{arch.top_of_funnel?.mechanism || 'N/A'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Goal: {arch.top_of_funnel?.conversion_goal || 'N/A'}</p>
                </div>
                <div className="card">
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Middle of Funnel</p>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{arch.middle_of_funnel?.mechanism || 'N/A'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Goal: {arch.middle_of_funnel?.conversion_goal || 'N/A'}</p>
                </div>
                <div className="card">
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Bottom of Funnel</p>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{arch.bottom_of_funnel?.mechanism || 'N/A'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Goal: {arch.bottom_of_funnel?.conversion_goal || 'N/A'}</p>
                </div>
            </div>

            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Gap Analysis & Logic</h4>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{data.gap_analysis_logic || 'N/A'}</p>
            </div>

            <div style={{ padding: 16, background: 'var(--accent-subtle)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--accent-border)' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>TitanLeap Optimization Path</h4>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{data.titan_leap_optimization || 'N/A'}</p>
            </div>

            <KvRow label="Lead Magnet" value={
                <div>
                    <p style={{ fontWeight: 600 }}>{data.lead_magnet_concept?.name || 'N/A'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{data.lead_magnet_concept?.psychological_draw || ''}</p>
                </div>
            } />
            <KvRow label="Primary Action" value={
                <span style={{ display: 'inline-flex', padding: '4px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                    {data.primary_action_path || 'N/A'}
                </span>
            } />
        </div>
    );
}

function ContentAssetsTab({ data }: { data: ContentAssetsResult | null | undefined }) {
    if (!data) return <p style={{ color: 'var(--text-muted)' }}>Not generated yet.</p>;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>1. Storytelling Video Scripts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(Array.isArray(data?.video_scripts) ? data?.video_scripts : []).filter(Boolean).map((script: any, i: number) => (
                        <div key={i} className="card" style={{ padding: '20px', borderColor: 'var(--border)' }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{String(script?.title || '')}</h4>
                            <p style={{ fontSize: 13, marginBottom: 8 }}><strong style={{ color: 'var(--accent)' }}>Hook (0-3s):</strong> {String(script?.hook || '')}</p>
                            <p style={{ fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}><strong>Body:</strong> {String(script?.body || '')}</p>
                            <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}><strong>Call to Action:</strong> {String(script?.call_to_action || '')}</p>
                            <div style={{ padding: '12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}><strong>Visual Direction:</strong> {String(script?.visual_direction || '')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>2. Short-form UGC Concepts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(Array.isArray(data?.ugc_concepts) ? data?.ugc_concepts : []).filter(Boolean).map((ugc: any, i: number) => (
                        <div key={i} className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Creator: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{String(ugc?.creator_persona || '')}</span></p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{String(ugc?.concept_description || '')}</p>
                            <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>🎵 {String(ugc?.audio_trending_sound || '')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>3. Static Graphic Creative Briefs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(Array.isArray(data?.static_creative_briefs) ? data?.static_creative_briefs : []).filter(Boolean).map((brief: any, i: number) => (
                        <div key={i} className="card" style={{ padding: '20px' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}><strong>Visual Concept:</strong> {String(brief?.visual_concept || '')}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}><strong>Post Copy:</strong> {String(brief?.copy || '')}</p>
                            <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center' }}>
                                <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>Text Layout on Image</p>
                                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{String(brief?.text_overlay || '')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const FLYER_STYLES = [
    {
        id: 'style-1',
        label: 'Style 1',
        name: 'Premium Glass',
        description: 'Elite 3D glassmorphism with Swiss-style bold typography and ray-traced reflections. High-converting SaaS aesthetic. Portrait 3:4.',
        emoji: '💎',
        accentColor: 'var(--accent)',
        accentSubtle: 'var(--accent-subtle)',
        accentBorder: 'var(--accent-border)',
    },
    {
        id: 'style-2',
        label: 'Style 2',
        name: 'Painterly 3D — Dark',
        description: 'Painterly 3D character inside a wireframe object, bold ribbon swooshes, deep brand-color background with grain texture. Portrait 3:4.',
        emoji: '🎨',
        accentColor: 'var(--warning)',
        accentSubtle: 'var(--warning-subtle)',
        accentBorder: 'rgba(251,191,36,0.3)',
    },
    {
        id: 'style-3',
        label: 'Style 3',
        name: '2D3D Hybrid',
        description: 'Flat bold 2D graphic layout (solid color BG, 2D typography blocks, flat shapes) with a single photorealistic 3D character bursting out of the composition. Portrait 3:4.',
        emoji: '🛒',
        accentColor: 'var(--success)',
        accentSubtle: 'var(--success-subtle)',
        accentBorder: 'rgba(52,211,153,0.3)',
    },
    {
        id: 'style-4',
        label: 'Style 4',
        name: 'Titan Elite',
        description: 'Luxury editorial style (Obsidian & Chrome). Executive dark mode with high-contrast serif typography and liquid metal 3D. Portrait 3:4.',
        emoji: '👑',
        accentColor: '#ffffff',
        accentSubtle: 'rgba(255,255,255,0.05)',
        accentBorder: 'rgba(255,255,255,0.2)',
    },
];


function ContentTab({
    data,
    projectName,
    projectId,
    campaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    onCampaignCreated,
    handleModifyCalendar,
    modifyingCalendar,
    calendarInstruction,
    setCalendarInstruction,
    showModifyInput,
    setShowModifyInput,
    modifyError,
    updateAssets,
    setUpdateAssets,
    modifyProgress = 0,
}: {
    data: ContentCalendarResult | null | undefined,
    projectName: string,
    projectId: string,
    campaigns: any[],
    selectedCampaignId: string,
    setSelectedCampaignId: (id: string) => void,
    onCampaignCreated?: (newId?: string) => void,
    handleModifyCalendar: () => Promise<void>,
    modifyingCalendar: boolean,
    calendarInstruction: string,
    setCalendarInstruction: (val: string) => void,
    showModifyInput: boolean,
    setShowModifyInput: (val: boolean) => void,
    modifyError: string,
    updateAssets: boolean,
    setUpdateAssets: (val: boolean) => void,
    modifyProgress?: number;
}) {
    const [selectedStyle, setSelectedStyle] = useState('style-1');
    const [customColor, setCustomColor] = useState('');
    const [customContent, setCustomContent] = useState('');
    const [characterGender, setCharacterGender] = useState('');
    const [characterEthnicity, setCharacterEthnicity] = useState('');
    const [hairStyle, setHairStyle] = useState('');
    const [outfitDescription, setOutfitDescription] = useState('');
    const [facialExpression, setFacialExpression] = useState('');
    const [poseDescription, setPoseDescription] = useState('');
    const [primaryObject, setPrimaryObject] = useState('');
    const [ctaButtonText, setCtaButtonText] = useState('');
    const [logoText, setLogoText] = useState('');
    const [bottomLeftText, setBottomLeftText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [labelText, setLabelText] = useState('');
    const [headlineText, setHeadlineText] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [customGenerating, setCustomGenerating] = useState(false);
    const [customFlyerUrl, setCustomFlyerUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
    const [referenceUploading, setReferenceUploading] = useState(false);

    // ── Campaign & Asset State ──
    const [isAddingToCampaign, setIsAddingToCampaign] = useState(false);
    const [assetAdded, setAssetAdded] = useState(false);
    const [showCampaignSelector, setShowCampaignSelector] = useState(false);

    const handleCreateLightweightCampaign = async () => {
        setIsAddingToCampaign(true);
        try {
            const res = await fetch('/api/campaigns/create-lightweight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, name: `Campaign for ${projectName}` })
            });
            const result = await res.json();
            if (result.success) {
                if (onCampaignCreated) onCampaignCreated(result.campaign.id);
                setShowCampaignSelector(false);
                // After creating, we can proceed to add asset
                await handleAddToCampaign(result.campaign.id);
            } else {
                alert(result.error || 'Failed to create campaign');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsAddingToCampaign(false);
        }
    };

    const handleAddToCampaign = async (overrideId?: string) => {
        const targetId = overrideId || selectedCampaignId;
        const campaignsCount = (campaigns || []).length;

        if (!targetId && campaignsCount > 0) {
            alert('Please select a campaign from the dropdown first.');
            setShowCampaignSelector(true);
            return;
        }
        if (!targetId && campaignsCount === 0) {
            setShowCampaignSelector(true); // This will show the "Create or Select" prompt
            return;
        }

        setIsAddingToCampaign(true);
        setAssetAdded(false);
        if (!customFlyerUrl) {
            alert('No flyer URL found to add.');
            setIsAddingToCampaign(false);
            return;
        }
        try {
            const res = await fetch('/api/campaigns/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: targetId,
                    assetType: 'flyer',
                    assetUrl: customFlyerUrl,
                    metadata: {
                        style: selectedStyle,
                        content: customContent,
                        headline: headlineText
                    }
                })
            });
            const result = await res.json();
            if (result.success) {
                setAssetAdded(true);
                setShowCampaignSelector(false);
            } else {
                alert(result.error || 'Failed to add flyer to campaign');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsAddingToCampaign(false);
        }
    };

    if (!data) return <p style={{ color: 'var(--text-muted)' }}>Not generated yet.</p>;

    const activeStyle = FLYER_STYLES.find(s => s.id === selectedStyle) || FLYER_STYLES[0];

    const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        const targetId = selectedCampaignId;
        if (!targetId) {
            alert('Please select or create a campaign first below before uploading manually.');
            setShowCampaignSelector(true);
            return;
        }

        setUploading(true);
        try {
            // STEP 1: Get presigned upload URL
            const urlRes = await fetch('/api/assets/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    campaignId: targetId
                })
            });
            const urlData = await urlRes.json();

            if (!urlData.success) {
                throw new Error(urlData.error || 'Failed to get upload URL');
            }

            // STEP 2: Upload file directly to Supabase Storage
            const uploadRes = await fetch(urlData.signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': urlData.contentType
                }
            });

            if (!uploadRes.ok) {
                const errorBody = await uploadRes.text();
                console.error('Storage upload error body:', errorBody);
                throw new Error(`Storage upload failed: ${errorBody || uploadRes.statusText}`);
            }

            // STEP 3: Create database record
            const recordRes = await fetch('/api/assets/create-record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: urlData.filePath,
                    campaignId: targetId,
                    assetType: urlData.assetType,
                    metadata: {
                        original_name: file.name,
                        size_bytes: file.size,
                        mime_type: file.type
                    }
                })
            });

            const recordData = await recordRes.json();

            if (recordData.success) {
                setAssetAdded(true);
                alert('Media uploaded and added to campaign!');
                if (onCampaignCreated) onCampaignCreated();
            } else {
                throw new Error(recordData.error || 'Database save failed');
            }
        } catch (err: any) {
            console.error(err);
            alert(`Upload error: ${err.message || 'An error occurred during upload.'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        let targetId = selectedCampaignId;
        if (!targetId) {
            // Auto-create campaign if missing
            setReferenceUploading(true);
            try {
                const res = await fetch('/api/campaigns/create-lightweight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId, name: `Campaign for ${projectName}` })
                });
                const result = await res.json();
                if (result.success) {
                    targetId = result.campaign.id;
                    if (onCampaignCreated) onCampaignCreated(targetId);
                } else {
                    throw new Error(result.error || 'Failed to auto-create campaign');
                }
            } catch (err: any) {
                console.error(err);
                alert(`Could not auto-create campaign: ${err.message}`);
                setReferenceUploading(false);
                return;
            }
        }

        setReferenceUploading(true);
        try {
            // STEP 1: Get presigned upload URL (reuse existing API)
            const urlRes = await fetch('/api/assets/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: `ref_${file.name}`,
                    fileType: file.type,
                    campaignId: targetId
                })
            });
            const urlData = await urlRes.json();

            if (!urlData.success) throw new Error(urlData.error || 'Failed to get upload URL');

            // STEP 2: Upload file directly to Supabase Storage
            const uploadRes = await fetch(urlData.signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': urlData.contentType }
            });

            if (!uploadRes.ok) throw new Error(`Reference upload failed: ${uploadRes.statusText}`);

            // STEP 3: Instead of full record, just get the public URL to use in generation
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/titanleap-assets-v1/${urlData.filePath}`;

            setReferenceImageUrl(publicUrl);
        } catch (err: any) {
            console.error(err);
            alert(`Reference upload error: ${err.message}`);
        } finally {
            setReferenceUploading(false);
        }
    };

    const handleGenerateCustomFlyer = async () => {
        if (!customContent.trim()) return;
        setCustomGenerating(true);
        setCustomFlyerUrl(null);

        let targetId = selectedCampaignId;

        // Auto-create campaign if missing
        if (!targetId) {
            try {
                const res = await fetch('/api/campaigns/create-lightweight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId, name: `Campaign for ${projectName}` })
                });
                const result = await res.json();
                if (result.success) {
                    targetId = result.campaign.id;
                    if (onCampaignCreated) onCampaignCreated(targetId);
                } else {
                    alert(result.error || 'Failed to auto-create campaign');
                    setCustomGenerating(false);
                    return;
                }
            } catch (err) {
                console.error(err);
                setCustomGenerating(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/generate-flyer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName: projectName,
                    style: selectedStyle,
                    color: customColor || undefined,
                    customContent: customContent,
                    referenceImageUrl: referenceImageUrl || undefined,
                    characterGender: characterGender || undefined,
                    characterEthnicity: characterEthnicity || undefined,
                    hairStyle: hairStyle || undefined,
                    outfitDescription: outfitDescription || undefined,
                    facialExpression: facialExpression || undefined,
                    poseDescription: poseDescription || undefined,
                    primaryObject: primaryObject || undefined,
                    ctaButtonText: ctaButtonText || undefined,
                    logoText: logoText || undefined,
                    bottomLeftText: bottomLeftText || undefined,
                    footerText: footerText || undefined,
                    labelText: (selectedStyle === 'style-3') ? labelText : undefined,
                    headlineText: headlineText || undefined,
                })
            });
            const result = await res.json();
            if (result.success && result.image) {
                setCustomFlyerUrl(result.image);

                // AUTOMATION: Automatically add to campaign
                if (targetId) {
                    const assetRes = await fetch('/api/campaigns/assets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            campaignId: targetId,
                            assetType: 'flyer',
                            assetUrl: result.image,
                            metadata: { style: selectedStyle, content: customContent, autoGenerated: true }
                        })
                    });
                    const assetData = await assetRes.json();

                    if (assetData.success && assetData.asset?.id) {
                        setAssetAdded(true);
                        console.log("Automatically added to campaign assets.");
                    }
                }
            } else {
                alert(result.error || 'Failed to generate flyer.');
            }
        } catch (error: any) {
            console.error(error);
            alert(`An error occurred: ${error.message || 'Generation failed'}`);
        } finally {
            setCustomGenerating(false);
        }
    };


    return (
        <div>
            {/* ── Campaign Selection & Management ── */}
            <div style={{
                marginBottom: 24, padding: 20, borderRadius: 16, border: '1px solid var(--border)',
                background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 20, flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24 }}>📁</div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Active Growth Campaign</p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Assets generated below will be added to this campaign.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 300 }}>
                    {(Array.isArray(campaigns) ? campaigns : []).length > 0 ? (
                        <select
                            className="input"
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            style={{ maxWidth: 300, borderRadius: 10, fontSize: 13, background: 'var(--bg-primary)', height: 42 }}
                        >
                            <option value="" disabled>Select a campaign...</option>
                            {(Array.isArray(campaigns) ? campaigns : []).filter(Boolean).map(c => (
                                <option key={c.id} value={c.id}>
                                    Campaign ({new Date(c.created_at).toLocaleDateString()}) — {String(c.status || '')}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>No campaigns created yet</span>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleCreateLightweightCampaign}
                        disabled={isAddingToCampaign}
                        style={{ height: 42, padding: '0 20px', fontSize: 13 }}
                    >
                        {isAddingToCampaign ? 'Creating...' : '+ New Campaign'}
                    </button>
                </div>
            </div>

            {!selectedCampaignId && (Array.isArray(campaigns) ? campaigns : []).length > 0 && (
                <div style={{
                    marginBottom: 24, padding: 16, borderRadius: 12, border: '1px solid #facc1544',
                    background: '#facc1511', color: '#facc15',
                    display: 'flex', alignItems: 'center', gap: 12
                }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Please select an existing campaign from the dropdown above to continue.</p>
                </div>
            )}

            {/* ── Express Flyer Generator ── */}
            <div style={{
                marginBottom: 32,
                borderRadius: 16,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
                {/* Header */}
                <div 
                    id="flyer-generator-section"
                    style={{
                    padding: '24px 28px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(124,111,255,0.35)',
                    }}>✨</div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.02em' }}>Express Flyer Generator</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>AI-powered flyer generation — choose your style and describe your content</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
                        <label style={{
                            fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.5 : 1
                        }}>
                            <span style={{ fontSize: 16 }}>📁</span>
                            {uploading ? 'Uploading...' : 'Upload Manually'}
                            <input type="file" hidden accept="image/*" onChange={handleUploadAsset} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div style={{ padding: '24px 28px' }}>
                    {/* Style Selector */}
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>Choose a Style</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {FLYER_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    style={{
                                        padding: '16px 14px',
                                        border: `2px solid ${selectedStyle === style.id ? style.accentColor : 'var(--border)'}`,
                                        borderRadius: 12,
                                        background: selectedStyle === style.id ? style.accentSubtle : 'var(--bg-secondary)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        transform: selectedStyle === style.id ? 'translateY(-2px)' : 'none',
                                        boxShadow: selectedStyle === style.id ? `0 6px 20px rgba(0,0,0,0.15)` : 'none',
                                        position: 'relative',
                                    }}
                                >
                                    {selectedStyle === style.id && (
                                        <div style={{
                                            position: 'absolute', top: 10, right: 10,
                                            width: 18, height: 18, borderRadius: '50%',
                                            background: style.accentColor,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 10, color: '#fff', fontWeight: 800,
                                        }}>✓</div>
                                    )}
                                    <div style={{ fontSize: 22, marginBottom: 8 }}>{style.emoji}</div>
                                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: style.accentColor, marginBottom: 4 }}>{style.label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{style.name}</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Input */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Content / Idea</label>
                        <textarea
                            className="input"
                            placeholder="e.g. A post about how we helped 50 brands grow their Instagram to 100K followers in 60 days..."
                            value={customContent}
                            onChange={e => setCustomContent(e.target.value)}
                            style={{ minHeight: 90, resize: 'vertical', width: '100%', boxSizing: 'border-box', borderRadius: 10, fontSize: 13, lineHeight: 1.6 }}
                        />
                    </div>

                    {/* Prominent Headline Input */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                            Headline / Main Text <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — leave empty for AI to generate)</span>
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder='e.g. "Ads guy. Content creator." — your exact words'
                            value={headlineText}
                            onChange={e => setHeadlineText(e.target.value)}
                            style={{ borderRadius: 10, fontSize: 13, height: 42 }}
                        />
                    </div>

                    {/* Reference Image Input */}
                    {selectedStyle === 'style-1' && (
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
                                Reference Visual Inspiration (Optional)
                            </label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: 16,
                                background: 'var(--bg-secondary)',
                                borderRadius: 12,
                                border: '1px dashed var(--border)'
                            }}>
                                <label className="btn btn-secondary" style={{
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    padding: '8px 16px',
                                    background: referenceImageUrl ? 'var(--success-subtle)' : 'var(--bg-primary)',
                                    color: referenceImageUrl ? 'var(--success)' : 'var(--text-primary)',
                                    border: referenceImageUrl ? '1px solid var(--success)' : '1px solid var(--border)'
                                }}>
                                    {referenceUploading ? 'Uploading...' : referenceImageUrl ? '✓ Image Provided' : '📸 Upload Inspiration'}
                                    <input type="file" hidden accept="image/*" onChange={handleReferenceImageUpload} disabled={referenceUploading} />
                                </label>
                                {referenceImageUrl && (
                                    <div style={{ position: 'relative', height: 40, width: 40, borderRadius: 6, overflow: 'hidden' }}>
                                        <img src={referenceImageUrl} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                                        <button
                                            onClick={() => setReferenceImageUrl(null)}
                                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', padding: 2, fontSize: 8 }}
                                        >✕</button>
                                    </div>
                                )}
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                                    {referenceImageUrl ? 'Flyer will look familiar to this image' : 'Upload an image and Flyer 1 will match its colors & style.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Color + Character Fields */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
                        <div style={{ flex: '1 1 180px' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Brand Color <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. Deep Purple or #7c6fff"
                                value={customColor}
                                onChange={e => setCustomColor(e.target.value)}
                                style={{ borderRadius: 10, fontSize: 13 }}
                            />
                        </div>
                        {(selectedStyle === 'style-2' || selectedStyle === 'style-3') && (
                            <>
                                <div style={{ flex: '1 1 150px' }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Character <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                                    <select
                                        className="input"
                                        value={characterGender}
                                        onChange={e => setCharacterGender(e.target.value)}
                                        style={{ borderRadius: 10, fontSize: 13, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                    >
                                        <option value="">Any gender</option>
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                    </select>
                                </div>
                                <div style={{ flex: '1 1 180px' }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Ethnicity <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Black, South Asian, Latina…"
                                        value={characterEthnicity}
                                        onChange={e => setCharacterEthnicity(e.target.value)}
                                        style={{ borderRadius: 10, fontSize: 13 }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Advanced Controls Toggle */}
                    <div style={{ marginBottom: 16 }}>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                background: 'rgba(124,111,255,0.1)',
                                border: '1px solid #7c6fff',
                                color: '#7c6fff',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 16px',
                                borderRadius: 8,
                                marginBottom: 12
                            }}
                        >
                            {showAdvanced ? '− Hide Advanced Visual Controls' : '+ Show Advanced Visual Controls'}
                        </button>
                    </div>

                    {showAdvanced && (
                        <div style={{
                            marginBottom: 24,
                            padding: 20,
                            background: 'var(--bg-secondary)',
                            borderRadius: 12,
                            border: '1px solid var(--border)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 16
                        }}>
                            {/* Headline removed from here and moved to main section */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Hair Style</label>
                                <input type="text" className="input" placeholder="e.g. long straight hair" value={hairStyle} onChange={e => setHairStyle(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Outfit</label>
                                <input type="text" className="input" placeholder="e.g. minimal black hoodie" value={outfitDescription} onChange={e => setOutfitDescription(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Expression</label>
                                <input type="text" className="input" placeholder="e.g. focused and confident" value={facialExpression} onChange={e => setFacialExpression(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Pose</label>
                                <input type="text" className="input" placeholder="e.g. sitting on hologram" value={poseDescription} onChange={e => setPoseDescription(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Primary 3D Object</label>
                                <input type="text" className="input" placeholder="e.g. AI hologram interface" value={primaryObject} onChange={e => setPrimaryObject(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Button CTA</label>
                                <input type="text" className="input" placeholder="e.g. Launch AI" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Brand Logo Text</label>
                                <input type="text" className="input" placeholder="e.g. AutoGen" value={logoText} onChange={e => setLogoText(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Footer Label (Left)</label>
                                <input type="text" className="input" placeholder="e.g. See how it works" value={bottomLeftText} onChange={e => setBottomLeftText(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Footer Label (Right)</label>
                                <input type="text" className="input" placeholder="e.g. MARKETING HUB" value={footerText} onChange={e => setFooterText(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                            </div>
                            {selectedStyle === 'style-3' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Category Label <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(leave empty or type "none" to hide)</span></label>
                                    <input type="text" className="input" placeholder="e.g. MARKETING INSIGHT — or leave empty" value={labelText} onChange={e => setLabelText(e.target.value)} style={{ borderRadius: 8, fontSize: 12 }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generate Button */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <button
                            onClick={handleGenerateCustomFlyer}
                            disabled={customGenerating || !customContent.trim()}
                            style={{
                                flex: '1 1 200px',
                                height: 48,
                                borderRadius: 12,
                                border: 'none',
                                cursor: customGenerating || !customContent.trim() ? 'not-allowed' : 'pointer',
                                background: customGenerating || !customContent.trim()
                                    ? 'var(--bg-hover)'
                                    : `linear-gradient(135deg, ${activeStyle.accentColor} 0%, var(--accent) 100%)`,
                                color: customGenerating || !customContent.trim() ? 'var(--text-muted)' : '#fff',
                                fontWeight: 700,
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                transition: 'all 0.2s ease',
                                boxShadow: customGenerating || !customContent.trim() ? 'none' : '0 4px 16px rgba(124,111,255,0.3)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {customGenerating ? (
                                <><span className="spinner" style={{ width: 16, height: 16 }}></span> Generating {activeStyle.name}...</>
                            ) : (
                                <>{activeStyle.emoji} Generate {activeStyle.label} Flyer</>
                            )}
                        </button>
                    </div>

                    {/* Result */}
                    {customFlyerUrl && (
                        <div style={{
                            marginTop: 24,
                            padding: 20,
                            background: 'var(--bg-secondary)',
                            borderRadius: 12,
                            border: `1px solid ${activeStyle.accentBorder}`,
                            display: 'flex',
                            gap: 20,
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                        }}>
                            <img
                                src={customFlyerUrl}
                                alt="Generated Flyer"
                                style={{ width: 180, borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
                            />
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: activeStyle.accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>✓ {activeStyle.name} Flyer Ready</p>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>Your flyer has been generated. Use it to build an entire AI campaign or download it.</p>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <a
                                        href={customFlyerUrl}
                                        download="express-flyer.jpg"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '10px 20px',
                                            borderRadius: 10,
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border)',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = activeStyle.accentColor}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >↓ Download</a>

                                    <button
                                        onClick={() => handleAddToCampaign()}
                                        disabled={isAddingToCampaign}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '10px 20px',
                                            borderRadius: 10,
                                            background: assetAdded ? 'var(--success)' : 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
                                            color: '#fff',
                                            fontWeight: 800,
                                            fontSize: 13,
                                            cursor: isAddingToCampaign ? 'default' : 'pointer',
                                            border: 'none',
                                            boxShadow: isAddingToCampaign ? 'none' : '0 4px 12px rgba(124,111,255,0.3)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {isAddingToCampaign ? (
                                            <><span className="spinner" style={{ width: 14, height: 14, borderLeftColor: 'rgba(255,255,255,0.7)' }}></span> Processing...</>
                                        ) : assetAdded ? (
                                            <>✓ Added to Assets</>
                                        ) : (
                                            <>➕ Add to Campaign</>
                                        )}
                                    </button>
                                </div>

                                {showCampaignSelector && (
                                    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--accent-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{(Array.isArray(campaigns) ? campaigns : []).length > 0 ? 'Select Campaign' : 'Create or Select Campaign'}</p>

                                        {(Array.isArray(campaigns) ? campaigns : []).length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <select
                                                    className="input"
                                                    value={selectedCampaignId}
                                                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                                                    style={{ borderRadius: 8, fontSize: 13 }}
                                                >
                                                    {(Array.isArray(campaigns) ? campaigns : []).filter(Boolean).map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            Campaign ({new Date(c.created_at).toLocaleDateString()})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ flex: 1, height: 40, fontSize: 13 }}
                                                        onClick={() => handleAddToCampaign()}
                                                        disabled={isAddingToCampaign}
                                                    >
                                                        Confirm Selection
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ flex: 1, height: 40, fontSize: 13 }}
                                                        onClick={handleCreateLightweightCampaign}
                                                        disabled={isAddingToCampaign}
                                                    >
                                                        Create New
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>No active campaigns found for this project. Create one to store this flyer.</p>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', height: 44 }}
                                                    onClick={handleCreateLightweightCampaign}
                                                    disabled={isAddingToCampaign}
                                                >
                                                    🚀 Create Campaign Container
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setShowCampaignSelector(false)}
                                            style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {assetAdded && (
                                    <div style={{ marginTop: 20, padding: 12, background: 'var(--success-subtle)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 16 }}>✅</span>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 2 }}>Flyer added to Campaign Assets</p>
                                            <Link href={`/dashboard/campaigns`} style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, textDecoration: 'underline' }}>
                                                View in Campaigns Dashboard
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content Calendar ── */}
            <div className="card" style={{ marginBottom: 16, borderColor: 'var(--accent-border)', background: 'var(--accent-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>MONTHLY THEME</p>
                    <button
                        onClick={() => setShowModifyInput(!showModifyInput)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        {showModifyInput ? '✕ CANCEL' : '✨ MODIFY'}
                    </button>
                </div>

                {showModifyInput ? (
                    <div style={{ marginTop: 12 }}>
                        <textarea
                            className="input"
                            placeholder="e.g. Focus more on B2B lead generation, make the tone more technical..."
                            value={calendarInstruction}
                            onChange={(e) => setCalendarInstruction(e.target.value)}
                            style={{ width: '100%', height: 80, fontSize: 13, padding: 12, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--accent-border)' }}
                        />

                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="checkbox"
                                id="updateAssets"
                                checked={updateAssets}
                                onChange={e => setUpdateAssets(e.target.checked)}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <label htmlFor="updateAssets" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                Also update Creative Assets (Video Scripts, etc.) — <span style={{ color: 'var(--text-muted)' }}>Heavy Generation</span>
                            </label>
                        </div>
                        {modifyError && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6, fontSize: 12, color: 'var(--error)' }}>
                                ⚠️ <strong>Critique:</strong> {modifyError}
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                            {modifyingCalendar ? (
                                <div style={{
                                    width: '100%',
                                    marginTop: 10,
                                    padding: '24px',
                                    background: 'rgba(124,111,255,0.05)',
                                    borderRadius: 16,
                                    border: '1px solid rgba(124,111,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
                                            Deep Strategy Refinement <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Phase {modifyProgress < 40 ? '1: Intent Analysis' : modifyProgress < 75 ? '2: Strategic Mapping' : '3: Content Generation'})</span>
                                        </p>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospaced' }}>{Math.round(modifyProgress)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: `${modifyProgress}%`,
                                            background: 'linear-gradient(90deg, #7c6fff 0%, #a78bfa 100%)',
                                            borderRadius: 10,
                                            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 0 12px rgba(124,111,255,0.4)'
                                        }} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Sense-making engine is processing your instructions...
                                    </p>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    style={{ height: 32, padding: '0 16px', fontSize: 12 }}
                                    onClick={handleModifyCalendar}
                                    disabled={!calendarInstruction.trim()}
                                >
                                    Regenerate Content Matrix
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <p style={{ fontWeight: 600, margin: 0 }}>{String(data?.theme_of_month || 'Monthly Strategy')}</p>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(Array.isArray(data?.entries) ? data?.entries : []).filter(Boolean).map((entry: any, i: number) => (
                    <div key={i} className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                                {entry?.day || '•'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                    <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 11 }}>{String(entry?.platform || 'General')}</span>
                                    <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: 11 }}>{String(entry?.content_type || 'Post')}</span>
                                    {entry?.funnel_stage && (
                                        <span className="badge" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)', fontSize: 11 }}>{String(entry.funnel_stage)}</span>
                                    )}
                                </div>

                                 <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{String(entry?.core_message || entry?.topic || '')}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontStyle: 'italic', marginBottom: entry?.framework_used || entry?.cta || entry?.why_this_converts ? 12 : 0 }}>&ldquo;{String(entry?.caption_hook || '')}&rdquo;</p>

                                 {(entry?.framework_used || entry?.cta || entry?.execution_script) && (
                                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {entry?.framework_used && (
                                            <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Framework:</span> {String(entry.framework_used)}</div>
                                        )}
                                        {entry?.execution_script && (
                                            <div style={{ marginTop: 4 }}>
                                                <span style={{ fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: 4 }}>Execution Script:</span>
                                                <div style={{ lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{String(entry.execution_script)}</div>
                                            </div>
                                        )}
                                        {entry?.cta && (
                                            <div style={{ marginTop: 4 }}><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>CTA:</span> {String(entry.cta)}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


function AdsTab({ data }: { data: AdCampaignsResult | null | undefined }) {
    if (!data) return <p style={{ color: 'var(--text-muted)' }}>Not generated yet.</p>;
    return (
        <div>
            <KvRow label="Objective" value={String(data.campaign_objective || 'N/A')} />
            <KvRow label="Budget" value={String(data.budget_recommendation || 'N/A')} />
            <KvRow label="KPIs" value={<Tags items={Array.isArray(data.kpis) ? data.kpis : []} />} />
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(Array.isArray(data.variants) ? data.variants : []).filter(Boolean).map((v: import('@/types').AdVariant, i: number) => (
                    <div key={i} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>VARIANT {i + 1}</span>
                            <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{String(v.platform || 'General')}</span>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{String(v.headline || '')}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>{String(v.body_text || '')}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'inline-flex', padding: '4px 12px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                {String(v.cta || 'Learn More')}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→ {String(v.target_audience_segment || 'All')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StrategyTab({ analysis, positioning }: { analysis: WebsiteAnalysisOutput | null | undefined, positioning: PositioningResult | null | undefined }) {
    // Inject strategy data into positioning result for the UI
    const enhancedPositioning = positioning ? {
        ...positioning,
        strategic_blueprint: {
            icp: String((positioning as any).icp || (positioning as any).strategic_blueprint?.icp || 'N/A'),
            offer_angle: String((positioning as any).offer_angle || (positioning as any).strategic_blueprint?.offer_angle || 'N/A'),
            campaign_objective: String((positioning as any).campaign_objective || (positioning as any).strategic_blueprint?.campaign_objective || 'N/A')
        }
    } : positioning;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Market & Competitor Analysis</h2>
                <AnalysisTab data={analysis} />
            </div>
            <div style={{ height: 1, background: 'var(--border)' }}></div>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Brand Positioning (6-Phase Framework)</h2>
                <PositioningTab data={enhancedPositioning} />
            </div>
        </div>
    );
}

export default function ProjectDetailClient({ project: initialProject, outputs: initialOutputs }: ProjectDetailClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shouldGenerate = searchParams.get('generate') === 'true';
    const { toPDF, targetRef } = usePDF({ filename: `${initialProject.name}-Strategy.pdf` });

    const [project, setProject] = useState(initialProject);
    const [outputs, setOutputs] = useState(initialOutputs);
    const [activeMainTab, setActiveMainTab] = useState<'overview' | 'strategy' | 'campaigns'>('overview');
    const [activeTab, setActiveTab] = useState<'strategy' | 'funnel' | 'ads' | 'social' | 'content'>('strategy');
    const [generating, setGenerating] = useState(false);
    const [steps, setSteps] = useState<ChainStepStatus[]>(CHAIN_STEPS);
    const [genError, setGenError] = useState('');
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [socialUrl, setSocialUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [projectCampaigns, setProjectCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [modifyingCalendar, setModifyingCalendar] = useState(false);
    const [calendarInstruction, setCalendarInstruction] = useState('');
    const [showModifyInput, setShowModifyInput] = useState(false);
    const [modifyError, setModifyError] = useState('');
    const [updateAssets, setUpdateAssets] = useState(false);
    const [modifyProgress, setModifyProgress] = useState(0);
    const [loadingOutputs, setLoadingOutputs] = useState(false);

    useEffect(() => {
        if (project.id) {
            // Parallelize initial project data loading
            Promise.all([
                fetchAnalytics(),
                fetchProjectCampaigns()
            ]);
        }
    }, [project.id]);

    // REAL-TIME POLLING: If there are pending/processing jobs, refresh every 5s
    useEffect(() => {
        if (!project.id || analytics?.stats?.distribution?.pending === 0) return;

        const interval = setInterval(() => {
            fetchAnalytics();
            fetchProjectCampaigns();
        }, 5000);

        return () => clearInterval(interval);
    }, [project.id, analytics?.stats?.distribution?.pending]);

    const fetchProjectCampaigns = async (newId?: string) => {
        setLoadingCampaigns(true);
        try {
            const res = await fetch(`/api/campaigns?projectId=${project.id}`);
            const data = await res.json();
            setProjectCampaigns(data.campaigns || []);

            // Auto-select the first campaign if none selected, or select the newly created one
            if (newId) {
                setSelectedCampaignId(newId);
            } else if ((data.campaigns || []).length > 0 && !selectedCampaignId) {
                const firstId = (data.campaigns && data.campaigns[0] && data.campaigns[0].id) ? data.campaigns[0].id : '';
                if (firstId) setSelectedCampaignId(firstId);
            }
        } catch (err) {
            console.error('Failed to fetch project campaigns', err);
        } finally {
            setLoadingCampaigns(false);
        }
    };


    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/projects/${project.id}/analytics`);
            const data = await res.json();
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const fetchProjectOutputs = async () => {
        if (!project.id || project.status !== 'completed') return;
        setLoadingOutputs(true);
        try {
            const res = await fetch(`/api/projects/${project.id}`);
            if (!res.ok) throw new Error('Failed to fetch strategy outputs');
            const data = await res.json();
            
            setOutputs({
                analysis: data.analysis,
                positioning: data.positioning,
                funnel: data.funnel,
                calendar: data.calendar,
                ads: data.ads,
                assets: data.assets,
            });
        } catch (err) {
            console.error('Failed to fetch project outputs', err);
        } finally {
            setLoadingOutputs(false);
        }
    };

    // On-demand fetch strategy data when navigating to strategy tabs
    useEffect(() => {
        if (activeMainTab === 'strategy' && !outputs.analysis && !loadingOutputs) {
            fetchProjectOutputs();
        }
    }, [activeMainTab]);


    const handleCreateCampaignFromDashboard = async () => {
        // Switch to Growth Campaigns and open manual upload or flyer generator
        setActiveMainTab('strategy');
        setActiveTab('social');
        // Smooth scroll to flyer generator section
        setTimeout(() => {
            const el = document.getElementById('flyer-generator-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    useEffect(() => {
        if (shouldGenerate && project.status === 'pending') {
            startGeneration();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleModifyCalendar() {
        if (!calendarInstruction.trim()) return;
        setModifyingCalendar(true);
        setModifyError('');
        setModifyProgress(0);

        // Simulation logic for smooth Apple-style progress
        const interval = setInterval(() => {
            setModifyProgress(prev => {
                if (prev >= 92) return prev; // Hold at 92 until actual finish
                const increase = Math.random() * 5;
                return Math.min(prev + increase, 95);
            });
        }, 400);

        try {
            const res = await fetch('/api/projects/modify-calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id,
                    customInstruction: calendarInstruction,
                    updateAssets: updateAssets
                }),
            });
            const result = await res.json();
            if (!res.ok) {
                // If the error is 'vague_prompt', we show the critique nicely
                if (result.reason === 'vague_prompt') {
                    setModifyError(result.error);
                } else {
                    throw new Error(result.error || 'Modification failed');
                }
                return;
            }

            // Finish the progress
            setModifyProgress(100);
            await new Promise(r => setTimeout(r, 600)); // Small delay for the user to see 100%

            // Update local state with new calendar and assets (if updated)
            setOutputs(prev => ({
                ...prev,
                calendar: { calendar_json: result.data.calendar },
                assets: result.data.assets ? { assets_json: result.data.assets } : prev.assets
            }));
            setShowModifyInput(false);
            setCalendarInstruction('');
            setUpdateAssets(false);
        } catch (err: any) {
            setModifyError(err.message || 'Something went wrong');
        } finally {
            clearInterval(interval);
            setModifyingCalendar(false);
            setModifyProgress(0);
        }
    }

    async function startGeneration() {
        setGenerating(true);
        setGenError('');

        // Optimistically set steps to running
        setSteps((prev) =>
            prev.map((s, i) => (i === 0 ? { ...s, status: 'running' as const } : s)),
        );

        try {
            const res = await fetch('/api/projects/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error ?? 'Generation failed');
            }

            // Update all steps to done
            setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));

            // Update local state
            setProject((p) => ({ ...p, status: 'completed' }));
            setOutputs({
                analysis: { analysis_json: data.data.analysis },
                positioning: { positioning_json: data.data.positioning },
                funnel: { funnel_json: data.data.funnel },
                calendar: { calendar_json: data.data.calendar },
                ads: { campaigns_json: data.data.ads },
                assets: { assets_json: data.data.assets },
            });

            // Remove the ?generate param from URL
            router.replace(`/dashboard/projects/${project.id}`);
        } catch (err: unknown) {
            setGenError(err instanceof Error ? err.message : 'Unknown error');
            setSteps((prev) =>
                prev.map((s) =>
                    s.status === 'running' ? { ...s, status: 'error' as const } : s,
                ),
            );
            setProject((p) => ({ ...p, status: 'failed' as const }));
        } finally {
            setGenerating(false);
        }
    }



    return (
        <>
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h1 style={{ fontSize: 20 }}>{project.name}</h1>
                        <span
                            className={`badge badge-${project.status}`}
                        >
                            {project.status}
                        </span>
                    </div>
                    <a href={project.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {project.website_url} ↗
                    </a>
                </div>
                {project.status === 'pending' && !generating && (
                    <button className="btn btn-primary" onClick={startGeneration}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Generate Strategy
                    </button>
                )}
                {project.status === 'completed' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => toPDF()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export
                        </button>
                        <button className="btn btn-secondary" onClick={startGeneration}>
                            Regenerate
                        </button>
                    </div>
                )}
            </div>

            {/* Main Tabs */}
            <div style={{ display: 'flex', gap: 24, padding: '0 40px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
                {[
                    { id: 'overview', label: 'Dashboard', icon: '📊' },
                    { id: 'strategy', label: 'Strategy Workspace', icon: '🧠' },
                    { id: 'campaigns', label: 'Growth Campaigns', icon: '🚀' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveMainTab(t.id as any)}
                        style={{
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeMainTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeMainTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.2s',
                            marginBottom: -1,
                        }}
                    >
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            <div className="page-content">
                {/* Generation UI */}
                {generating && (
                    <div style={{ marginBottom: 32 }}>
                        <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                            Generating your strategy...
                        </h3>
                        <div className="step-list">
                            {steps.map((step) => (
                                <div key={step.step} className={`step-item ${step.status}`}>
                                    <div
                                        className="step-icon"
                                        style={{
                                            background:
                                                step.status === 'done'
                                                    ? 'var(--success-subtle)'
                                                    : step.status === 'running'
                                                        ? 'var(--accent-subtle)'
                                                        : step.status === 'error'
                                                            ? 'var(--error-subtle)'
                                                            : 'var(--bg-hover)',
                                            color:
                                                step.status === 'done'
                                                    ? 'var(--success)'
                                                    : step.status === 'running'
                                                        ? 'var(--accent)'
                                                        : step.status === 'error'
                                                            ? 'var(--error)'
                                                            : 'var(--text-muted)',
                                        }}
                                    >
                                        {step.status === 'running' ? (
                                            <span className="spinner" style={{ width: 14, height: 14 }} />
                                        ) : step.status === 'done' ? (
                                            '✓'
                                        ) : step.status === 'error' ? (
                                            '✕'
                                        ) : (
                                            '○'
                                        )}
                                    </div>
                                    <p style={{ fontSize: 14, fontWeight: 500 }}>{step.label}</p>
                                </div>
                            ))}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
                            This may take 1-2 minutes. Please don&apos;t close the page.
                        </p>
                    </div>
                )}

                {genError && (
                    <div
                        style={{
                            padding: 16,
                            background: 'var(--error-subtle)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--error)',
                            marginBottom: 24,
                        }}
                    >
                        {genError}
                    </div>
                )}

                {/* Dashboard View */}
                {activeMainTab === 'overview' && project.status === 'completed' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {[
                                { label: 'Active Campaigns', value: analytics?.stats?.campaigns || 0, icon: '🚀', color: 'var(--accent)' },
                                { label: 'Generated Assets', value: analytics?.stats?.assets || 0, icon: '🖼️', color: 'var(--success)' },
                                { label: 'Distribution Success', value: `${analytics?.stats?.distribution?.success || 0}/${(analytics?.stats?.distribution?.success || 0) + (analytics?.stats?.distribution?.failed || 0)}`, icon: '📈', color: '#60a5fa' },
                                { label: 'Jobs Pending', value: analytics?.stats?.distribution?.pending || 0, icon: '⏳', color: '#facc15' },
                            ].map(stat => (
                                <div key={stat.label} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 48, opacity: 0.1, transform: 'rotate(15deg)' }}>{stat.icon}</div>
                                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{stat.label}</p>
                                    <h4 style={{ fontSize: 28, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</h4>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {/* Strategy Workspace */}
                {
                    activeMainTab === 'strategy' && project.status === 'completed' && (
                        <div className="project-detail-layout">
                            {/* Interactive Services Sidebar */}
                            <div className="project-detail-sidebar">
                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 12 }}>Core Services</p>
                                {SERVICES_MENU.map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveTab(item.key as any)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            padding: '16px',
                                            border: '1px solid transparent',
                                            borderColor: activeTab === item.key ? 'var(--accent-border)' : 'var(--border)',
                                            background: activeTab === item.key ? 'var(--accent-subtle)' : 'var(--bg-card)',
                                            borderRadius: 'var(--radius)',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            boxShadow: activeTab === item.key ? '0 4px 12px rgba(124, 111, 255, 0.08)' : 'none'
                                        }}
                                    >
                                        <span style={{ fontSize: 14, fontWeight: 700, color: activeTab === item.key ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 6 }}>{item.label}</span>
                                        <span style={{ fontSize: 12, color: activeTab === item.key ? 'var(--accent)' : 'var(--text-secondary)', opacity: 0.85, lineHeight: 1.4 }}>{item.description}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Detail Panels */}
                            <div style={{ flex: 1, minWidth: 0, paddingBottom: 64 }}>
                                {loadingOutputs ? (
                                    <div style={{ 
                                        padding: 80, 
                                        textAlign: 'center', 
                                        background: 'var(--bg-card)', 
                                        borderRadius: 24, 
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 24,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                                    }}>
                                        <span className="spinner" style={{ width: 48, height: 48, borderWidth: 5, borderLeftColor: 'var(--accent)' }}></span>
                                        <div>
                                            <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Syncing AI Strategy Nodes</p>
                                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Retrieving deep market analysis and positioning maps...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'strategy' && <StrategyTab analysis={outputs?.analysis?.analysis_json} positioning={outputs?.positioning?.positioning_json} />}
                                        {activeTab === 'funnel' && <FunnelTab data={outputs?.funnel?.funnel_json} />}
                                        {activeTab === 'ads' && <AdsTab data={outputs?.ads?.campaigns_json} />}
                                {activeTab === 'social' && (
                                    <ContentTab
                                        data={outputs?.calendar?.calendar_json}
                                        projectName={project.name}
                                        projectId={project.id}
                                        campaigns={projectCampaigns}
                                        selectedCampaignId={selectedCampaignId}
                                        setSelectedCampaignId={setSelectedCampaignId}
                                        onCampaignCreated={fetchProjectCampaigns}
                                        handleModifyCalendar={handleModifyCalendar}
                                        modifyingCalendar={modifyingCalendar}
                                        calendarInstruction={calendarInstruction}
                                        setCalendarInstruction={setCalendarInstruction}
                                        showModifyInput={showModifyInput}
                                        setShowModifyInput={setShowModifyInput}
                                        modifyError={modifyError}
                                        updateAssets={updateAssets}
                                        setUpdateAssets={setUpdateAssets}
                                        modifyProgress={modifyProgress}
                                    />
                                )}
                                {activeTab === 'content' && <ContentAssetsTab data={outputs?.assets?.assets_json} />}
                            </>
                        )}
                            </div>
                        </div>
                    )
                }

                {/* Campaigns View */}
                {
                    activeMainTab === 'campaigns' && project.status === 'completed' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <div>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Project Campaigns</h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage and monitor marketing campaigns for {project.name}</p>
                                </div>
                                <button className="btn btn-primary" onClick={handleCreateCampaignFromDashboard}>
                                    + New Campaign
                                </button>
                            </div>

                            {loadingCampaigns ? (
                                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading campaigns...</div>
                            ) : projectCampaigns.length === 0 ? (
                                <div className="card" style={{ padding: 60, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
                                    <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No campaigns yet</h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px' }}>
                                        Launch your first marketing campaign by generating a flyer and activating its growth sequence.
                                    </p>
                                    <button className="btn btn-primary" onClick={handleCreateCampaignFromDashboard}>
                                        Start Your First Campaign
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                                    {projectCampaigns.map((c: any) => (
                                        <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                                            <div className="card" style={{
                                                padding: 0, overflow: 'hidden', border: '1px solid var(--border)',
                                                transition: 'transform 0.2s, border-color 0.2s',
                                                cursor: 'pointer'
                                            }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.borderColor = 'var(--accent)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.borderColor = 'var(--border)';
                                                }}>
                                                {c.flyer_image_url && (
                                                    <img src={c.flyer_image_url} alt="flyer" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                                                )}
                                                <div style={{ padding: 16 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)' }}>
                                                            {c.flyer_style || 'Campaign'}
                                                        </span>
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                                            background: c.status === 'complete' ? '#34d39922' : '#facc1522',
                                                            color: c.status === 'complete' ? '#34d399' : '#facc15'
                                                        }}>
                                                            {(c.status || 'pending').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {c.flyer_content || 'AI Marketing Campaign'}
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 12 }}>
                                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                            {new Date(c.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>View Details →</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }
            </div >
            {
                project.status === 'completed' && (
                    <div style={{ position: 'absolute', top: -9999, left: -9999, pointerEvents: 'none' }}>
                        <div ref={targetRef} style={{ width: '800px', backgroundColor: 'white', color: 'black', padding: '40px' }}>
                            <ExportReport project={project} outputs={outputs} />
                        </div>
                    </div>
                )
            }
        </>
    );
}
