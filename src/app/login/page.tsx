'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from '@/auth/actions';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo */}
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #7c6fff, #4f46e5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 16,
                                color: '#fff',
                            }}
                        >
                            T
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                            TitanOS
                        </span>
                    </div>
                    <h1 style={{ fontSize: 22, marginBottom: 6 }}>Welcome back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Sign in to your account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="label" htmlFor="password" style={{ marginBottom: 0 }}>
                                Password
                            </label>
                            <Link href="/login/forgot-password" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : null}
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p
                    style={{
                        textAlign: 'center',
                        marginTop: 24,
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                    }}
                >
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/signup"
                        style={{ color: 'var(--accent)', fontWeight: 500 }}
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
