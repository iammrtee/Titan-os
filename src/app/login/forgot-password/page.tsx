'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/auth/actions';

export default function ForgotPasswordPage() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(e.currentTarget);
        const result = await resetPassword(formData);

        if (result?.error) {
            setError(result.error);
        } else if (result?.success) {
            setSuccess(result.success);
        }

        setLoading(false);
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
                    <h1 style={{ fontSize: 22, marginBottom: 6 }}>Reset Password</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Enter your email to receive a password reset link
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

                    {success && (
                        <div
                            style={{
                                padding: '10px 12px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#22c55e',
                                fontSize: 13,
                                marginBottom: 16,
                            }}
                        >
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : null}
                        {loading ? 'Sending...' : 'Send Reset Link'}
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
                    Remember your password?{' '}
                    <Link
                        href="/login"
                        style={{ color: 'var(--accent)', fontWeight: 500 }}
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
