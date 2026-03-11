"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signup } from "@/auth/actions";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-info">
          <div className="auth-brand">
            <Image
              src="/titanos-logo.png"
              alt="TitanOS logo"
              width={40}
              height={40}
            />
            <span>TitanOS</span>
          </div>
          <h1>Build your AI marketing engine</h1>
          <p className="auth-intro">
            Create a workspace, brief your goals, and let TitanOS generate the
            strategy, content, and distribution plan you need to launch.
          </p>
          <ul className="auth-info-list">
            <li>Kick off a full marketing strategy in minutes</li>
            <li>Keep brand tone consistent across every channel</li>
            <li>Manage campaigns, assets, and analytics in one view</li>
          </ul>
          <div className="auth-info-actions">
            <Link href="/" className="btn btn-secondary">
              Back to landing
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
          </div>
        </div>

        <div className="auth-card auth-form">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Start building campaigns with TitanOS.</p>
          </div>

          {success ? (
            <div className="form-success">{success}</div>
          ) : (
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
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="form-alert">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : null}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <p className="auth-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
