"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true" />

      <header className="landing-nav container">
        <div className="landing-brand">
          <Image
            src="/titanos-logo.png"
            alt="TitanOS logo"
            width={38}
            height={38}
            className="landing-logo"
          />
          <span className="landing-wordmark">TitanOS</span>
        </div>
        <nav className="landing-links desktop-only">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">Workflow</a>
          <a href="#proof">Results</a>
        </nav>
        <div className="landing-actions desktop-only">
          <Link className="btn btn-secondary" href="/login">
            Sign in
          </Link>
          <Link className="btn btn-primary" href="/dashboard">
            Enter dashboard
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-btn mobile-show"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Navigation Overlay */}
      <div
        className={`landing-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-links">
          <a href="#capabilities" onClick={() => setIsMobileMenuOpen(false)}>
            Capabilities
          </a>
          <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)}>
            Workflow
          </a>
          <a href="#proof" onClick={() => setIsMobileMenuOpen(false)}>
            Results
          </a>
        </nav>
        <div className="mobile-nav-actions">
          <Link
            className="btn btn-secondary btn-lg"
            href="/login"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sign in
          </Link>
          <Link
            className="btn btn-primary btn-lg"
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Enter dashboard
          </Link>
        </div>
      </div>

      <main>
        <section className="landing-hero container">
          <div className="hero-kicker">Hybrid AI Growth Engine</div>
          <h1 className="hero-title">
            Titan<span>OS</span>
          </h1>
          <p className="hero-subtitle">
            The marketing operating system that turns a single brief into a
            complete strategy, multi-platform content, and distribution plan in
            minutes.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" href="/dashboard">
              Enter dashboard
            </Link>
            <Link className="btn btn-secondary btn-lg" href="/login">
              Sign in
            </Link>
          </div>
          <div className="hero-proof">
            Built for SaaS teams, agencies, and growth studios
          </div>

          <div className="hero-panels">
            <div className="hero-panel">
              <div className="panel-title">Strategy Snapshot</div>
              <p>
                Positioning, ICP, and messaging map auto-generated from your
                brief.
              </p>
              <div className="panel-tags">
                <span>ICP</span>
                <span>Offer</span>
                <span>Competitive angle</span>
              </div>
            </div>
            <div className="hero-panel">
              <div className="panel-title">Campaign Engine</div>
              <p>Hooks, captions, CTAs, and paid ads tailored per platform.</p>
              <div className="panel-tags">
                <span>LinkedIn</span>
                <span>Instagram</span>
                <span>TikTok</span>
              </div>
            </div>
            <div className="hero-panel">
              <div className="panel-title">Distribution Grid</div>
              <p>
                Queue, schedule, and deploy content across channels with
                analytics.
              </p>
              <div className="panel-tags">
                <span>Queue</span>
                <span>Schedule</span>
                <span>Optimize</span>
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="landing-section container">
          <div className="section-header">
            <div className="section-kicker">Capabilities</div>
            <h2>Everything a modern marketing team needs to scale</h2>
            <p>
              TitanOS blends research, strategy, content, and orchestration into
              one unified system so your team ships faster without losing
              consistency.
            </p>
          </div>
          <div className="feature-grid">
            {[
              [
                "Market intelligence",
                "Analyze competitor positioning and extract winning angles.",
              ],
              [
                "Strategy synthesis",
                "Generate positioning, messaging, and funnels from a single brief.",
              ],
              [
                "Content at scale",
                "Multi-platform captions, hooks, scripts, and ads in minutes.",
              ],
              [
                "Campaign orchestration",
                "Coordinate assets, calendars, and distribution with one view.",
              ],
              [
                "Cross-channel scheduling",
                "Queue posts, schedule launches, and manage deployment.",
              ],
              [
                "Performance feedback",
                "Track what is landing and refine in the next sprint.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="feature-card">
                <div className="feature-title">{title}</div>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="landing-section container">
          <div className="section-header">
            <div className="section-kicker">Workflow</div>
            <h2>From brief to launch in four moves</h2>
          </div>
          <div className="workflow-grid">
            {[
              [
                "01",
                "Brief intake",
                "Capture goals, offer, audience, and platform focus.",
              ],
              [
                "02",
                "Strategy build",
                "TitanOS writes your positioning and funnel backbone.",
              ],
              [
                "03",
                "Content engine",
                "Instantly generate posts, ads, and creative briefs.",
              ],
              [
                "04",
                "Distribution",
                "Schedule, deploy, and monitor performance across channels.",
              ],
            ].map(([step, title, body]) => (
              <div key={step} className="workflow-card">
                <div className="workflow-step">{step}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="proof" className="landing-section container">
          <div className="section-header">
            <div className="section-kicker">Results</div>
            <h2>Operate like a full growth team</h2>
            <p>
              Launch campaigns faster, stay consistent, and keep your pipeline
              full.
            </p>
          </div>
          <div className="stats-grid">
            {[
              ["4x", "Faster campaign setup"],
              ["24/7", "Always-on production"],
              ["90%", "Less time spent on drafting"],
              ["100%", "Brand consistency across channels"],
            ].map(([metric, label]) => (
              <div key={metric} className="stat-card">
                <div className="stat-metric">{metric}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div className="container cta-inner">
            <div>
              <h2>Ready to run marketing like an operating system?</h2>
              <p>Launch TitanOS and build your next growth cycle in minutes.</p>
            </div>
            <div className="cta-actions">
              <Link className="btn btn-primary btn-lg" href="/dashboard">
                Enter dashboard
              </Link>
              <Link className="btn btn-secondary btn-lg" href="/signup">
                Create account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer container">
        <div className="landing-brand">
          <Image
            src="/titanos-logo.png"
            alt="TitanOS logo"
            width={32}
            height={32}
            className="landing-logo"
          />
          <span className="landing-wordmark">TitanOS</span>
        </div>
        <p>AI marketing engine for modern SaaS and agencies.</p>
      </footer>
    </div>
  );
}
