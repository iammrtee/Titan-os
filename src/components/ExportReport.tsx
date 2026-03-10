import React from 'react';
import type { Project, WebsiteAnalysisOutput, PositioningResult, FunnelResult, ContentCalendarResult, AdCampaignsResult } from '@/types';

interface ProjectOutputs {
    analysis?: { analysis_json: WebsiteAnalysisOutput | null } | null;
    positioning?: { positioning_json: PositioningResult | null } | null;
    funnel?: { funnel_json: FunnelResult | null } | null;
    calendar?: { calendar_json: ContentCalendarResult | null } | null;
    ads?: { campaigns_json: AdCampaignsResult | null } | null;
    assets?: { assets_json: import('@/types').ContentAssetsResult | null } | null;
}

interface ExportReportProps {
    project: Project;
    outputs: ProjectOutputs;
}

export default function ExportReport({ project, outputs }: ExportReportProps) {
    const analysis = outputs.analysis?.analysis_json;
    const positioning = outputs.positioning?.positioning_json;
    const funnel = outputs.funnel?.funnel_json;
    const calendar = outputs.calendar?.calendar_json;
    const ads = outputs.ads?.campaigns_json;
    const assets = outputs.assets?.assets_json;

    // Backward compatibility for target audience
    const audience = analysis?.target_audience_segments || (analysis as any)?.target_audience_segments || [(analysis as any)?.target_audience].filter(Boolean) || [];

    return (
        <div style={{ padding: '2cm', background: 'white', color: 'black', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, marginBottom: 8, color: '#111' }}>TitanLeap Expert Strategy Report</h1>
                <h2 style={{ fontSize: 24, color: '#444' }}>{String(project.name || 'Project')}</h2>
                <p style={{ color: '#666', marginTop: 8 }}>{String(project.website_url || '')}</p>
            </div>

            {/* Analysis Section */}
            {analysis && (
                <div style={{ marginBottom: 40, breakInside: 'avoid' }}>
                    <h3 style={{ fontSize: 20, borderBottom: '2px solid #ccc', paddingBottom: 8, marginBottom: 16 }}>1. Market Intelligence Extraction</h3>
                    <p><strong>Business Type:</strong> {String(analysis.business_type || 'N/A')}</p>
                    <p><strong>Core Transformation:</strong> {String(analysis.core_transformation || 'N/A')}</p>
                    <p><strong>Target Audience Segments:</strong> {Array.isArray(audience) ? audience.join(', ') : String(audience || 'N/A')}</p>
                    <p><strong>Market Tension:</strong> {String(analysis.market_tension || 'N/A')}</p>
                    <p><strong>Value Proposition:</strong> {String(analysis.unique_value_proposition || 'N/A')}</p>
                    <p><strong>Messaging Gaps:</strong> {Array.isArray(analysis.messaging_gap_analysis) ? analysis.messaging_gap_analysis.join(', ') : String(analysis.messaging_gap_analysis || 'N/A')}</p>
                    <p><strong>Unfair Advantages:</strong> {Array.isArray(analysis.unfair_advantages) ? analysis.unfair_advantages.join(', ') : String(analysis.unfair_advantages || 'N/A')}</p>
                </div>
            )}

            {/* Positioning Section */}
            {positioning && (
                <div style={{ marginBottom: 40 }}>
                    <h3 style={{ fontSize: 20, borderBottom: '2px solid #ccc', paddingBottom: 8, marginBottom: 16 }}>2. Brand Positioning Strategy</h3>

                    <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Phase 1: Strategic Narrative</h4>
                        <p><strong>The Villain:</strong> {String(positioning.strategic_narrative?.the_villain || 'N/A')}</p>
                        <p><strong>The Enlightenment:</strong> {String(positioning.strategic_narrative?.the_enlightenment || 'N/A')}</p>
                        <p><strong>New Category:</strong> {String(positioning.strategic_narrative?.new_category_name || 'N/A')}</p>
                    </div>

                    <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ddd', background: '#f9f9f9', breakInside: 'avoid' }}>
                        <h4 style={{ fontSize: 14, color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>Phase 2: Positioning Architecture</h4>
                        <p><strong>Core Thesis:</strong> {String(positioning.positioning_architecture?.core_thesis || 'N/A')}</p>
                        <p><strong>Titan Promise:</strong> {String(positioning.positioning_architecture?.the_titan_promise || 'N/A')}</p>
                        <p style={{ fontSize: 15, fontWeight: 500, marginTop: 10 }}>{String(positioning.positioning_architecture?.identity_statement || '')}</p>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, color: '#555', textTransform: 'uppercase', marginBottom: 12 }}>Phase 3: Authority Pillars</h4>
                        {(Array.isArray(positioning.authority_pillars) ? positioning.authority_pillars : []).filter(Boolean).map((pillar: any, i: number) => (
                            <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '3px solid #ccc', breakInside: 'avoid' }}>
                                <p style={{ fontWeight: 600 }}>{String(pillar.pillar || 'N/A')}</p>
                                <p style={{ fontSize: 13 }}><strong>Hook:</strong> {String(pillar.psychological_hook || 'N/A')}</p>
                                <p style={{ fontSize: 13 }}><strong>Proof Requirement:</strong> {String(pillar.proof_requirement || 'N/A')}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: 20, breakInside: 'avoid' }}>
                        <h4 style={{ fontSize: 14, color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Phase 4: Conversion Psychology</h4>
                        <p><strong>Elite Headlines:</strong> {(Array.isArray(positioning.conversion_psychology?.elite_headlines) ? positioning.conversion_psychology?.elite_headlines : []).filter(Boolean).join(' | ') || 'N/A'}</p>
                        <p><strong>Irreversible CTAs:</strong> {(Array.isArray(positioning.conversion_psychology?.irreversible_ctas) ? positioning.conversion_psychology?.irreversible_ctas : []).filter(Boolean).join(' | ') || 'N/A'}</p>
                    </div>
                </div>
            )}

            {/* Funnel Section */}
            {funnel && (
                <div style={{ marginBottom: 40, breakInside: 'avoid' }}>
                    <h3 style={{ fontSize: 20, borderBottom: '2px solid #ccc', paddingBottom: 8, marginBottom: 16 }}>3. Funnel Architectural Upgrade</h3>

                    {funnel.funnel_architecture ? (
                        <div style={{ marginBottom: 16 }}>
                            <p><strong>Top of Funnel:</strong> {String(funnel.funnel_architecture.top_of_funnel?.mechanism || 'N/A')} ({String(funnel.funnel_architecture.top_of_funnel?.conversion_goal || 'N/A')})</p>
                            <p><strong>Middle of Funnel:</strong> {String(funnel.funnel_architecture.middle_of_funnel?.mechanism || 'N/A')} ({String(funnel.funnel_architecture.middle_of_funnel?.conversion_goal || 'N/A')})</p>
                            <p><strong>Bottom of Funnel:</strong> {String(funnel.funnel_architecture.bottom_of_funnel?.mechanism || 'N/A')} ({String(funnel.funnel_architecture.bottom_of_funnel?.conversion_goal || 'N/A')})</p>
                        </div>
                    ) : (
                        <p style={{ color: '#666', marginBottom: 16 }}>Funnel architecture details not available for this project version.</p>
                    )}

                    <div style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', background: '#fefefe' }}>
                        <h4 style={{ textTransform: 'uppercase', fontSize: 12, color: '#777', marginBottom: 4 }}>Gap Analysis Logic</h4>
                        <p style={{ fontSize: 13 }}>{String(funnel.gap_analysis_logic || 'N/A')}</p>
                    </div>

                    <div style={{ marginBottom: 16, padding: 12, border: '1px solid #e0f2fe', background: '#f0f9ff' }}>
                        <h4 style={{ textTransform: 'uppercase', fontSize: 12, color: '#0369a1', marginBottom: 4 }}>TitanLeap Optimization</h4>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>{String(funnel.titan_leap_optimization || 'N/A')}</p>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <p><strong>Lead Magnet:</strong> {String(funnel.lead_magnet_concept?.name || 'N/A')} - {String(funnel.lead_magnet_concept?.psychological_draw || '')}</p>
                        <p><strong>Primary Action:</strong> {String(funnel.primary_action_path || 'N/A')}</p>
                    </div>
                </div>
            )}

            {/* Content Calendar Section */}
            {calendar && (
                <div style={{ marginBottom: 40, breakBefore: 'page' }}>
                    <h3 style={{ fontSize: 20, borderBottom: '2px solid #ccc', paddingBottom: 8, marginBottom: 16 }}>4. Titan Growth Content Matrix</h3>
                    <p style={{ fontWeight: 600, marginBottom: 16 }}>Monthly Theme: {String(calendar.theme_of_month || 'N/A')}</p>

                    <div style={{ display: 'grid', gap: 12 }}>
                        {(Array.isArray(calendar?.entries) ? calendar?.entries : []).filter(Boolean).map((entry: any, i: number) => (
                            <div key={i} style={{ display: 'flex', border: '1px solid #eee', padding: 12, breakInside: 'avoid' }}>
                                <div style={{ width: 40, fontWeight: 'bold', borderRight: '1px solid #ddd', marginRight: 12, paddingRight: 12 }}>
                                    {String(entry?.day || '•')}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>{String(entry?.platform || 'N/A')} | {String(entry?.content_type || 'N/A')} | {String(entry?.framework_used || 'N/A')}</p>
                                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{String(entry?.core_message || entry?.topic || 'N/A')}</p>
                                    <p style={{ fontSize: 13, color: '#444' }}><strong>Hook:</strong> {String(entry?.caption_hook || 'N/A')}</p>
                                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Why it converts: {String(entry?.why_this_converts || 'Engagement optimization')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Assets Section */}
            {assets && (
                <div style={{ marginBottom: 40, breakBefore: 'page' }}>
                    <h3 style={{ fontSize: 20, borderBottom: '2px solid #ccc', paddingBottom: 8, marginBottom: 16 }}>5. Elite Creative Briefs</h3>

                    <h4 style={{ fontSize: 16, color: '#333', marginBottom: 12, textTransform: 'uppercase' }}>Video Scripts</h4>
                    <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                        {(Array.isArray(assets?.video_scripts) ? assets?.video_scripts : []).filter(Boolean).map((script: any, i: number) => (
                            <div key={i} style={{ padding: 16, border: '1px solid #ddd', breakInside: 'avoid' }}>
                                <p style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{String(script?.title || 'N/A')}</p>
                                <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Hook:</strong> {String(script?.hook || 'N/A')}</p>
                                <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Body:</strong> {String(script?.body || 'N/A')}</p>
                                <p style={{ fontSize: 13, marginBottom: 8 }}><strong>CTA:</strong> {String(script?.call_to_action || 'N/A')}</p>
                                <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>Visuals: {String(script?.visual_direction || 'N/A')}</p>
                            </div>
                        ))}
                    </div>

                    <h4 style={{ fontSize: 16, color: '#333', marginBottom: 12, textTransform: 'uppercase', breakBefore: 'page' }}>UGC Concepts</h4>
                    <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                        {(Array.isArray(assets?.ugc_concepts) ? assets?.ugc_concepts : []).filter(Boolean).map((ugc: any, i: number) => (
                            <div key={i} style={{ padding: 16, border: '1px solid #ddd', breakInside: 'avoid' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: 8 }}>Persona: {String(ugc?.creator_persona || 'N/A')}</p>
                                <p style={{ fontSize: 13, marginBottom: 8 }}>{String(ugc?.concept_description || 'N/A')}</p>
                                <p style={{ fontSize: 12, color: '#666' }}><strong>Audio/Sound:</strong> {String(ugc?.audio_trending_sound || 'N/A')}</p>
                            </div>
                        ))}
                    </div>

                    <h4 style={{ fontSize: 16, color: '#333', marginBottom: 12, textTransform: 'uppercase', breakBefore: 'page' }}>Static Creative Briefs</h4>
                    <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                        {(Array.isArray(assets?.static_creative_briefs) ? assets?.static_creative_briefs : []).filter(Boolean).map((brief: any, i: number) => (
                            <div key={i} style={{ padding: 16, border: '1px solid #ddd', breakInside: 'avoid' }}>
                                <p style={{ fontSize: 13, marginBottom: 8 }}><strong>Visual Concept:</strong> {String(brief?.visual_concept || 'N/A')}</p>
                                <p style={{ fontSize: 13, marginBottom: 8 }}><strong>Post Copy:</strong> {String(brief?.copy || 'N/A')}</p>
                                <p style={{ fontSize: 12, color: '#444', fontWeight: 'bold', background: '#f5f5f5', padding: 8 }}>Overlay Text: "{String(brief?.text_overlay || 'N/A')}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ads Section */}
            {ads && (
                <div style={{ marginBottom: 40, breakBefore: 'page' }}>
                    <h3 style={{ fontSize: 20, borderBottom: '2px solid #ccc', paddingBottom: 8, marginBottom: 16 }}>6. Performance Architecture Ads</h3>
                    <p><strong>Objective:</strong> {String(ads.campaign_objective || 'N/A')}</p>
                    <p><strong>Budget Recommendation:</strong> {String(ads.budget_recommendation || 'N/A')}</p>
                    <p><strong>KPIs:</strong> {Array.isArray(ads.kpis) ? ads.kpis.join(', ') : String(ads.kpis || 'N/A')}</p>

                    <div style={{ marginTop: 20 }}>
                        {(Array.isArray(ads?.variants) ? ads?.variants : []).filter(Boolean).map((v: any, i: number) => (
                            <div key={i} style={{ padding: 16, border: '1px solid #ddd', marginBottom: 16, breakInside: 'avoid' }}>
                                <p style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>Variant {i + 1} ({String(v?.platform || 'N/A')})</p>
                                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{String(v?.headline || 'N/A' )}</p>
                                <p style={{ marginBottom: 12 }}>{String(v?.body_text || 'N/A' )}</p>
                                <p style={{ fontSize: 13 }}><strong>CTA:</strong> {String(v?.cta || 'N/A' )} | <strong>Target Audience:</strong> {String(v?.target_audience_segment || 'N/A' )}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
