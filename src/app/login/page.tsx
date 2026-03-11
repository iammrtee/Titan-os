"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { login, signup } from "@/auth/actions";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const result =
      mode === "login" ? await login(formData) : await signup(formData);

    if (!result) {
      setLoading(false);
      return;
    }

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (mode === "signup" && "success" in result && result.success) {
      setSuccess(result.success);
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

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
          <h1>{isLogin ? "Welcome back" : "Build your AI marketing engine"}</h1>
          <p className="auth-intro">
            {isLogin
              ? "TitanOS is your AI marketing operating system. Launch strategy, content, and distribution in minutes so your team ships faster without losing consistency."
              : "Create a workspace, brief your goals, and let TitanOS generate the strategy, content, and distribution plan you need to launch."}
          </p>
          <ul className="auth-info-list">
            <li>Automated positioning and funnel strategy</li>
            <li>Multi-platform content and ad generation</li>
            <li>Distribution, scheduling, and analytics</li>
          </ul>
          <div className="auth-info-actions">
            <Link href="/" className="btn btn-secondary">
              Back to landing
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>

        <div className="auth-card auth-form">
          <div className="auth-form-header">
            <h2>{isLogin ? "Sign in" : "Create your account"}</h2>
            <p>
              {isLogin
                ? "Access your workspace and keep launches moving."
                : "Start building campaigns with TitanOS."}
            </p>
          </div>

          {success ? (
            <div className="form-success">{success}</div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form-body">
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
                <div className="auth-form-row">
                  <label
                    className="label"
                    htmlFor="password"
                    style={{ marginBottom: 0 }}
                  >
                    Password
                  </label>
                  {isLogin ? (
                    <Link href="/login/forgot-password">Forgot password?</Link>
                  ) : null}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  placeholder={isLogin ? "********" : "Min 8 characters"}
                  required
                  minLength={isLogin ? undefined : 8}
                  autoComplete={isLogin ? "current-password" : "new-password"}
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
                {loading
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          )}

          <p className="auth-footer">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="auth-switch"
              onClick={() => setMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
