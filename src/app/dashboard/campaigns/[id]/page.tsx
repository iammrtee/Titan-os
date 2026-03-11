'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/supabase/client';
import PostComposerModal from '@/components/PostComposerModal';

interface ContentRow { id: string; platform: string; content_type: string; body: string; sort_order: number; }
interface CalendarRow { id: string; day_number: number; platform: string; content_type: string; content_body: string; scheduled_for: string | null; status: string; }
interface Campaign { id: string; status: string; flyer_image_url: string | null; flyer_content: string; flyer_style: string; created_at: string; projects?: { name: string }; }

const PLATFORM_EMOJI: Record<string, string> = { instagram: '📸', facebook: '👥', linkedin: '💼', tiktok: '🎵', x: '🐦', general: '⚡' };
const TABS = ['Assets', 'Queue'];

interface ToastState { visible: boolean; message: string; type: 'success' | 'error' | 'info'; submessage?: string; }

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [content, setContent] = useState<ContentRow[]>([]);
    const [calendar, setCalendar] = useState<CalendarRow[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [distributionJobs, setDistributionJobs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('Strategy');
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'X']));
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });
    const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
    const [showComposer, setShowComposer] = useState(false);

    const fetchSocialAccounts = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase.from('social_accounts').select('*');
            setSocialAccounts(data || []);
        } catch (err) {
            console.error('Error fetching social accounts:', err);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', submessage?: string) => {
        setToast({ visible: true, message, type, submessage });
        if (type !== 'info') {
            setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
        }
    };

    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');
        const platform = searchParams.get('platform');
        if (error === 'missing_config') {
            showToast('Configuration Missing', 'error', `The ${platform} API keys are not set in the environment. Please contact the administrator.`);
        } else if (error === 'callback_failed') {
            showToast('Connection Failed', 'error', 'The social authentication callback encountered an error.');
        }
    }, [searchParams]);

    const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!id) {
            showToast('Sync Error', 'error', 'Campaign ID not found. Please refresh and try again.');
            return;
        }

        setUploading(true);
        showToast('Uploading engine...', 'info', 'Analyzing and optimizing asset for TitanLeap standards');
        try {
            // STEP 1: Get presigned upload URL
            const urlRes = await fetch('/api/assets/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    campaignId: id
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
                    campaignId: id,
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
                fetchCampaignData();
                showToast('Upload Successful', 'success', 'Media added to campaign inventory');
            } else {
                throw new Error(recordData.error || 'Database save failed');
            }
        } catch (err: any) {
            console.error(err);
            showToast('System Error', 'error', err.message || 'Failed to communicate with the upload engine');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        fetchCampaignData();
    }, [id]);

    const fetchCampaignData = () => {
        fetch(`/api/campaigns/${id}`)
            .then(r => r.json())
            .then(d => {
                setCampaign(d.campaign);
                setContent(d.content || []);
                setCalendar(d.calendar || []);
                setAssets(d.assets || []);
                setDistributionJobs(d.distributionJobs || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        fetchSocialAccounts();
    };

    const handleClearQueue = async () => {
        if (!confirm('Are you sure you want to clear the distribution queue? This will remove all pending and failed jobs.')) return;
        
        showToast('Clearing queue...', 'info', 'Purging distribution database...');
        try {
            const res = await fetch('/api/distribution/clear-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: id })
            });
            const result = await res.json();
            if (result.success) {
                showToast('Queue Cleared', 'success', 'All pending/failed jobs removed');
                fetchCampaignData();
            } else {
                showToast('Action Failed', 'error', result.error || 'Could not clear queue');
            }
        } catch (err) {
            console.error(err);
            showToast('System Error', 'error', 'Failed to reach distribution server');
        }
    };

    const handleScheduleDistribution = async (assetId: string, platform: string, isSilent = false) => {
        if (!isSilent) {
            setScheduling(assetId + platform);
            showToast(`Deploying to ${platform}...`, 'info', 'Communicating with platform API');
        }
        try {
            const res = await fetch('/api/distribution/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: id,
                    assetId,
                    platform,
                    scheduledTime: new Date().toISOString(),
                    executeNow: true
                })
            });
            const result = await res.json();
            if (result.success) {
                if (!isSilent) {
                    fetchCampaignData();
                    showToast('Post Sent!', 'success', `Asset is now live on ${platform}`);
                }
            } else {
                if (!isSilent) showToast('Deployment Failed', 'error', result.error || 'Check platform permissions');
            }
        } catch (err) {
            console.error(err);
            if (!isSilent) showToast('Deployment Error', 'error', 'Failed to reach distribution server');
        } finally {
            if (!isSilent) setScheduling(null);
        }
    };

    const handleDeleteAsset = async (assetId: string) => {
        if (!confirm('Are you sure you want to delete this asset? This will permanently remove it from TitanLeap and all linked storage.')) return;

        try {
            const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
            if (res.ok) {
                setAssets(prev => prev.filter(a => a.id !== assetId));
                showToast('Asset Deleted', 'success', 'Successfully removed from campaign inventory');
            } else {
                const err = await res.json();
                showToast('Deletion Failed', 'error', err.error || 'Could not delete asset');
            }
        } catch (err) {
            console.error(err);
            showToast('System Error', 'error', 'Failed to reach deletion server');
        }
    };

    const handleBulkSchedule = async () => {
        if (selectedAssets.size === 0 || selectedPlatforms.size === 0) return;
        setIsBulkProcessing(true);
        showToast('Initiating Bulk Deployment...', 'info', `Processing ${selectedAssets.size} assets across ${selectedPlatforms.size} platforms`);
        try {
            const platforms = Array.from(selectedPlatforms);
            const assetIds = Array.from(selectedAssets);

            for (const assetId of assetIds) {
                for (const platform of platforms) {
                    const status = getJobStatus(assetId, platform);
                    if (!status) {
                        await fetch('/api/distribution/schedule', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                campaignId: id,
                                assetId,
                                platform,
                                scheduledTime: new Date().toISOString(),
                                executeNow: false // Don't trigger worker yet
                            })
                        });
                    }
                }
            }

            // Trigger a single massive pulse
            const res = await fetch('/api/distribution/process-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: id })
            });

            if (res.ok) {
                fetchCampaignData();
                showToast('TitanLeap Pulse Complete', 'success', `Successfully deployed ${selectedAssets.size} assets to all platforms`);
                setSelectedAssets(new Set());
            }
        } catch (err) {
            console.error(err);
            showToast('Bulk Action Failed', 'error', 'Some jobs could not be enqueued');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleTogglePlatform = (platform: string) => {
        const next = new Set(selectedPlatforms);
        if (next.has(platform)) next.delete(platform);
        else next.add(platform);
        setSelectedPlatforms(next);
    };

    const handleToggleSelect = (assetId: string) => {
        const next = new Set(selectedAssets);
        if (next.has(assetId)) next.delete(assetId);
        else next.add(assetId);
        setSelectedAssets(next);
    };

    const handleSelectAll = () => {
        if (selectedAssets.size === assets.length) setSelectedAssets(new Set());
        else setSelectedAssets(new Set(assets.map(a => a.id)));
    };

    const getJobStatus = (assetId: string, platform: string) => {
        const job = distributionJobs.find(j => j.asset_id === assetId && j.platform.toLowerCase() === platform.toLowerCase());
        return job ? job.status : null;
    };

    const strategy = (() => {
        const row = content.find(r => r.content_type === 'strategy');
        try { return row ? JSON.parse(row.body) : null; } catch { return null; }
    })();

    const byPlatform = (platform: string, type: string) =>
        content.filter(r => r.platform === platform && r.content_type === type);

    const general = (type: string) =>
        content.filter(r => r.platform === 'general' && r.content_type === type);

    const statusColor = (s: string) => {
        if (s === 'complete' || s === 'success') return '#34d399';
        if (s === 'failed' || s === 'error') return '#f87171';
        if (s === 'processing') return '#60a5fa';
        return '#facc15';
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Loading campaign…
        </div>
    );

    if (!campaign) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Campaign not found.
        </div>
    );

    return (
        <div className="container" style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 16px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <Link href="/dashboard/campaigns" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px' }}>← Campaigns</Link>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            🚀 Campaign
                        </h1>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${statusColor(campaign.status)}22`, color: statusColor(campaign.status), textTransform: 'uppercase' }}>
                            {campaign.status}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                        {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Connected Accounts Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
                    Connected:
                </span>
                {['instagram', 'facebook', 'linkedin', 'x'].map(p => {
                    const account = socialAccounts.find((a: any) => a.platform === p);
                    return (
                        <div
                            key={p}
                            className="mobile-padding-sm"
                            title={account ? `Connected as ${account.display_name || account.username || account.platform_user_id}` : `Click to connect ${p}`}
                            onClick={() => { if (!account) window.location.href = `/api/auth/social/${p}`; }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 14px', borderRadius: 20,
                                border: `1.5px solid ${account ? '#34d399' : 'var(--border)'}`,
                                background: account ? 'rgba(52,211,153,0.08)' : 'var(--bg-secondary)',
                                fontSize: 11, fontWeight: 600,
                                color: account ? '#34d399' : 'var(--text-muted)',
                                cursor: account ? 'default' : 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: 13 }}>{PLATFORM_EMOJI[p]}</span>
                            <span style={{ textTransform: 'capitalize' }}>{p}</span>
                            {account
                                ? <span style={{ fontSize: 10 }}>✔</span>
                                : <span style={{ opacity: 0.55, fontSize: 10 }}>+ Link</span>
                            }
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0, overflowX: 'auto', whiteSpace: 'nowrap', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: 'none', border: 'none', color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                        borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'all 0.15s', marginBottom: -1,
                    }}>{tab}</button>
                ))}
            </div>

            {/* Assets Tab */}
            {activeTab === 'Assets' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                            <button className="btn btn-secondary" onClick={handleSelectAll} style={{ fontSize: 12 }}>
                                {selectedAssets.size === assets.length ? 'Deselect All' : 'Select All'}
                            </button>

                            {selectedAssets.size > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Platforms:</span>
                                    {['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'X'].map(platform => (
                                        <button
                                            key={platform}
                                            onClick={() => handleTogglePlatform(platform)}
                                            style={{
                                                padding: '6px 12px', border: selectedPlatforms.has(platform) ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                                                background: selectedPlatforms.has(platform) ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.02)',
                                                color: selectedPlatforms.has(platform) ? 'var(--accent)' : 'var(--text-muted)',
                                                borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: selectedPlatforms.has(platform) ? '0 4px 12px rgba(124, 111, 255, 0.15)' : 'none'
                                            }}
                                            onMouseEnter={e => !selectedPlatforms.has(platform) && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                            onMouseLeave={e => !selectedPlatforms.has(platform) && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        >
                                            {selectedPlatforms.has(platform) ? '✓ ' : ''}{platform}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedAssets.size > 0 && (
                                <button className="btn btn-primary" onClick={handleBulkSchedule} disabled={isBulkProcessing || selectedPlatforms.size === 0}>
                                    {isBulkProcessing ? 'Deploying...' : `🚀 Actually Deploy ${selectedAssets.size} Selected`}
                                </button>
                            )}
                        </div>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            {uploading ? 'Uploading...' : 'Upload Media'}
                            <input type="file" hidden accept="image/*,video/*" onChange={handleUploadAsset} disabled={uploading} />
                        </label>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowComposer(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            ✍️ Create Post
                        </button>
                    </div>

                    <div className="project-grid" style={{ gap: 20 }}>
                        {assets.map(asset => (
                            <div key={asset.id}
                                style={{
                                    background: 'rgba(15, 15, 20, 0.4)',
                                    backdropFilter: 'blur(12px)',
                                    border: selectedAssets.has(asset.id) ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 20, padding: 16, position: 'relative',
                                    boxShadow: selectedAssets.has(asset.id) ? '0 0 0 1px var(--accent), 0 8px 30px rgba(124, 111, 255, 0.2)' : '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.02)',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    transform: selectedAssets.has(asset.id) ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedAssets.has(asset.id)}
                                    onChange={() => handleToggleSelect(asset.id)}
                                    style={{ position: 'absolute', top: 12, left: 12, width: 22, height: 22, zIndex: 10, cursor: 'pointer', accentColor: 'var(--accent)' }}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
                                    style={{
                                        position: 'absolute', top: 12, right: 12, zIndex: 10, cursor: 'pointer',
                                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: 8,
                                        color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    title="Delete Asset"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                </button>
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 12, marginBottom: 16, overflow: 'hidden', background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                    {asset.asset_type === 'video' ? (
                                        <video
                                            src={`${asset.asset_url}#t=0.1`}
                                            controls
                                            muted
                                            playsInline
                                            preload="metadata"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Image
                                            src={asset.asset_url}
                                            alt="Asset"
                                            fill
                                            sizes="(max-width: 640px) 100vw, 300px"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                                    {['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'X'].map(platform => {
                                        const status = getJobStatus(asset.id, platform);
                                        return (
                                            <button
                                                key={platform}
                                                disabled={!!status || scheduling === asset.id + platform}
                                                onClick={() => handleScheduleDistribution(asset.id, platform)}
                                                style={{
                                                    padding: '10px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                    background: status ? `${statusColor(status)}22` : 'rgba(255,255,255,0.03)',
                                                    color: status ? statusColor(status) : 'var(--text-secondary)',
                                                    border: `1px solid ${status ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                                                    cursor: status ? 'default' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: status ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                }}
                                                onMouseEnter={e => !status && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                                                onMouseLeave={e => !status && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                            >
                                                {status ? (status.toUpperCase()) : platform}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {assets.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                No assets found. Upload or generate flyers to see them here.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Queue Tab */}
            {activeTab === 'Queue' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                            {distributionJobs.length} distribution jobs in queue
                        </p>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            {distributionJobs.length > 0 && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleClearQueue}
                                    style={{ fontSize: 12, padding: '6px 14px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                                >
                                    🗑️ Clear Queue
                                </button>
                            )}
                            {distributionJobs.length > 0 && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => fetchCampaignData()}
                                    style={{ fontSize: 12, padding: '6px 14px' }}
                                >
                                    🔄 Refresh Status
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                        <div className="mobile-hide" style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 140px 140px', gap: 0, borderBottom: '1px solid var(--border)', padding: '12px 20px', background: 'var(--bg-card)' }}>
                            {['Platform', 'Type', 'Asset / Details', 'Scheduled', 'Status'].map(h => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</span>
                            ))}
                        </div>

                        {distributionJobs.map((job, i) => (
                            <div key={job.id}
                                className="mobile-stack"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '120px 100px 1fr 140px 140px',
                                    gap: 0,
                                    padding: '16px 20px',
                                    borderBottom: i < distributionJobs.length - 1 ? '1px solid var(--border)' : 'none',
                                    alignItems: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {PLATFORM_EMOJI[job.platform.toLowerCase()] || '📢'} {job.platform}
                                </span>
                                <span className="mobile-hide" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                    {job.asset_type || 'image'}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                                    {job.campaign_assets?.asset_url && (
                                        <img src={job.campaign_assets.asset_url} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                                    )}
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {job.error_message ? <span style={{ color: 'var(--error)' }}>Error: {job.error_message}</span> : `Job #${job.id.slice(0, 8)}`}
                                        </p>
                                        <p className="mobile-show" style={{ display: 'none', fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                            {job.asset_type || 'image'} • {new Date(job.scheduled_time).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="mobile-hide" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {new Date(job.scheduled_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                        background: `${statusColor(job.status)}22`, color: statusColor(job.status),
                                        textTransform: 'uppercase', textAlign: 'center', flex: 1
                                    }}>
                                        {job.status}
                                    </span>
                                    {job.status === 'failed' && (
                                        <button
                                            onClick={() => handleScheduleDistribution(job.asset_id, job.platform)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 14, padding: 0 }}
                                            title="Retry Job"
                                        >
                                            🔄
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {distributionJobs.length === 0 && (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No jobs in queue. Approve an asset to start distribution.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Notification Toast */}
            {toast.visible && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
                    background: 'rgba(22, 22, 31, 0.85)', backdropFilter: 'blur(12px)',
                    border: `1px solid ${toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--error)' : 'var(--accent)'}`,
                    borderRadius: 16, padding: '16px 20px', minWidth: 320,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(124, 111, 255, 0.15)',
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: toast.type === 'success' ? 'var(--success-subtle)' : toast.type === 'error' ? 'var(--error-subtle)' : 'var(--accent-subtle)',
                        color: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--error)' : 'var(--accent)',
                        fontSize: 18, fontWeight: 700
                    }}>
                        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : '🚀'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{toast.message}</p>
                        {toast.submessage && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{toast.submessage}</p>}
                    </div>
                    <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 16
                    }}>✕</button>
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {showComposer && (
                <PostComposerModal
                    campaignId={id}
                    assets={assets}
                    onClose={() => setShowComposer(false)}
                    onSuccess={fetchCampaignData}
                />
            )}
        </div>
    );
}
