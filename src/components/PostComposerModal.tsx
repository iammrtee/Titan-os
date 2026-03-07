'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';

interface Asset { id: string; asset_url: string; asset_type: string; file_name?: string; }

const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', emoji: '📸', charLimit: 2200 },
    { id: 'facebook', label: 'Facebook', emoji: '👥', charLimit: 63206 },
    { id: 'linkedin', label: 'LinkedIn', emoji: '💼', charLimit: 3000 },
    { id: 'tiktok', label: 'TikTok', emoji: '🎵', charLimit: 2200 },
    { id: 'x', label: 'X', emoji: '🐦', charLimit: 280 },
];

interface Props {
    campaignId: string;
    assets: Asset[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function PostComposerModal({ campaignId, assets, onClose, onSuccess }: Props) {
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['instagram']));
    const [caption, setCaption] = useState('');
    const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
    const [scheduledTime, setScheduledTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const imageAssets = assets.filter(a => !!a.asset_url);

    const toggleImage = (id: string) => {
        setSelectedImages(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); return next; }
            if (next.size >= 5) return prev; // max 5
            next.add(id);
            return next;
        });
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const activePlatform = PLATFORMS.find(p => selectedPlatforms.has(p.id));
    const charLimit = activePlatform?.charLimit ?? 2200;
    const smallest = Math.min(...PLATFORMS.filter(p => selectedPlatforms.has(p.id)).map(p => p.charLimit));

    const handleSubmit = async () => {
        if (!caption.trim()) { setResult({ type: 'error', message: 'Please write a caption.' }); return; }
        if (selectedPlatforms.size === 0) { setResult({ type: 'error', message: 'Choose at least one platform.' }); return; }

        setSubmitting(true);
        setResult(null);

        const selectedAssetObjs = imageAssets.filter(a => selectedImages.has(a.id));
        const mediaUrls = selectedAssetObjs.map(a => a.asset_url);
        const primaryAssetId = selectedAssetObjs[0]?.id || assets[0]?.id || '';
        const time = scheduleMode === 'later' && scheduledTime ? scheduledTime : new Date().toISOString();

        let allOk = true;
        const platforms = Array.from(selectedPlatforms);

        for (const platform of platforms) {
            const res = await fetch('/api/distribution/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    assetId: primaryAssetId,
                    platform,
                    caption: caption.trim(),
                    mediaUrls,
                    scheduledTime: time,
                    executeNow: scheduleMode === 'now'
                })
            });
            if (!res.ok) allOk = false;
        }

        setSubmitting(false);
        if (allOk) {
            setResult({
                type: 'success', message: scheduleMode === 'now'
                    ? `✅ Post sent to ${platforms.join(', ')}!`
                    : `✅ Scheduled for ${new Date(time).toLocaleString()}`
            });
            setTimeout(() => { onSuccess(); onClose(); }, 2000);
        } else {
            setResult({ type: 'error', message: '❌ Some platforms failed. Check the Queue tab.' });
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: '#111118', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 24, width: '100%', maxWidth: 780,
                maxHeight: '90vh', overflowY: 'auto', padding: 'var(--modal-padding, 32px)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <style jsx>{`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    div { --modal-padding: 36px; }
                    @media (max-width: 640px) {
                        div { --modal-padding: 24px; }
                        .actions { flex-direction: column !important; }
                        .actions button { width: 100% !important; }
                    }
                `}</style>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                            ✍️ Create Post
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                            Compose your post with images and caption
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4
                    }}>✕</button>
                </div>

                {/* IMAGE PICKER */}
                <section style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📷 Select Images
                        </label>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {selectedImages.size}/5 selected
                        </span>
                    </div>
                    {imageAssets.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 12 }}>
                            No images found. Upload assets in the Assets tab first.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                            {imageAssets.map(asset => {
                                const selected = selectedImages.has(asset.id);
                                const idx = selected ? Array.from(selectedImages).indexOf(asset.id) + 1 : 0;
                                return (
                                    <div key={asset.id} onClick={() => toggleImage(asset.id)} style={{
                                        position: 'relative', borderRadius: 12, overflow: 'hidden',
                                        border: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`,
                                        cursor: 'pointer', height: 110, transition: 'all 0.2s',
                                        opacity: !selected && selectedImages.size >= 5 ? 0.4 : 1,
                                        boxShadow: selected ? '0 0 0 2px var(--bg-secondary), 0 0 0 4px var(--accent)' : '0 4px 12px rgba(0,0,0,0.2)'
                                    }}>
                                        <Image src={asset.asset_url} alt="" fill style={{ objectFit: 'cover' }} sizes="110px" />
                                        {selected && (
                                            <div style={{
                                                position: 'absolute', top: 6, right: 6,
                                                background: 'var(--accent)', color: '#fff',
                                                width: 22, height: 22, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 800
                                            }}>{idx}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* CAPTION */}
                <section style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            💬 Caption
                        </label>
                        <span style={{ fontSize: 12, color: caption.length > smallest ? '#f87171' : 'var(--text-muted)' }}>
                            {caption.length} / {smallest === Infinity ? '∞' : smallest} chars
                        </span>
                    </div>
                    <textarea
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        placeholder="Write your post caption here... Use hashtags, emojis, calls-to-action!"
                        rows={6}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16, padding: '16px',
                            color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.6,
                            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                            transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle), inset 0 2px 4px rgba(0,0,0,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)'; }}
                    />
                </section>

                {/* PLATFORM SELECTOR */}
                <section style={{ marginBottom: 28 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                        📡 Post To
                    </label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {PLATFORMS.map(p => {
                            const active = selectedPlatforms.has(p.id);
                            return (
                                <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 20px', borderRadius: 12,
                                    border: `1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                                    background: active ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.02)',
                                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: active ? '0 4px 12px rgba(124, 111, 255, 0.15)' : 'none'
                                }}>
                                    <span>{p.emoji}</span> {p.label}
                                    {active && <span style={{ fontSize: 11, opacity: 0.7 }}>· {p.charLimit >= 10000 ? '∞' : p.charLimit}</span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* SCHEDULE */}
                <section style={{ marginBottom: 28 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                        🕐 When to Post
                    </label>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        {(['now', 'later'] as const).map(m => (
                            <button key={m} onClick={() => setScheduleMode(m)} style={{
                                padding: '10px 24px', borderRadius: 12,
                                border: `1px solid ${scheduleMode === m ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                                background: scheduleMode === m ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.02)',
                                color: scheduleMode === m ? 'var(--accent)' : 'var(--text-muted)',
                                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: scheduleMode === m ? '0 4px 12px rgba(124, 111, 255, 0.15)' : 'none'
                            }}>
                                {m === 'now' ? '⚡ Post Now' : '📅 Schedule'}
                            </button>
                        ))}
                    </div>
                    {scheduleMode === 'later' && (
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={e => setScheduledTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            style={{
                                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                borderRadius: 10, padding: '10px 14px',
                                color: 'var(--text-primary)', fontSize: 14, outline: 'none'
                            }}
                        />
                    )}
                </section>

                {/* RESULT */}
                {result && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                        background: result.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                        border: `1px solid ${result.type === 'success' ? '#34d399' : '#f87171'}`,
                        color: result.type === 'success' ? '#34d399' : '#f87171',
                        fontSize: 14, fontWeight: 600
                    }}>
                        {result.message}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '12px 24px', borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                        color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s'
                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || selectedPlatforms.size === 0 || !caption.trim()}
                        style={{
                            padding: '12px 32px', borderRadius: 14,
                            background: submitting || selectedPlatforms.size === 0 || !caption.trim()
                                ? 'rgba(124, 111, 255, 0.4)'
                                : 'linear-gradient(135deg, var(--accent), #9080ff)',
                            border: 'none', color: '#fff',
                            fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: submitting || selectedPlatforms.size === 0 || !caption.trim() ? 'none' : '0 8px 16px rgba(124, 111, 255, 0.25)'
                        }}
                    >
                        {submitting ? '⏳ Posting...' : scheduleMode === 'now' ? '🚀 Post Now' : '📅 Schedule Post'}
                    </button>
                </div>
            </div>
        </div>
    );
}
