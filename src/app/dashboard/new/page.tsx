"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, label: "Business Info" },
  { id: 2, label: "Review & Generate" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    website_url: "",
    niche: "",
    target_audience: "",
    offer: "",
    revenue_goal: "",
    platform: "",
    tone: "Confident, authoritative, strategic",
    current_funnel: "",
    extra_details: "",
  });

  const progress = useMemo(
    () => Math.round((step / STEPS.length) * 100),
    [step],
  );

  const isStep1Complete = Boolean(
    form.name &&
    form.website_url &&
    form.niche &&
    form.target_audience &&
    form.offer &&
    form.revenue_goal &&
    form.platform,
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreate() {
    setLoading(true);
    setError("");

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

      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error ?? "Failed to create project");
      }

      const project = await createRes.json();
      router.push(`/dashboard/projects/${project.id}?generate=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>New Project</h1>
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: 4,
              fontSize: 14,
            }}
          >
            Tell us about your business and we&apos;ll generate your full
            marketing strategy.
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="new-project-layout">
          <aside className="new-project-sidebar">
            <div className="new-project-progress">
              <div className="progress-header">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-subtitle">
                Step {step} of {STEPS.length}
              </p>
            </div>

            <div className="new-project-steps">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`step-pill ${step >= s.id ? "active" : ""}`}
                >
                  <span>{s.id}</span>
                  {s.label}
                </div>
              ))}
            </div>

            <div className="new-project-summary">
              <h4>Project Snapshot</h4>
              <div className="summary-row">
                <span>Project</span>
                <strong>{form.name || "--"}</strong>
              </div>
              <div className="summary-row">
                <span>Website</span>
                <strong>{form.website_url || "--"}</strong>
              </div>
              <div className="summary-row">
                <span>Audience</span>
                <strong>{form.target_audience || "--"}</strong>
              </div>
              <div className="summary-row">
                <span>Tone</span>
                <strong>{form.tone || "--"}</strong>
              </div>
            </div>

            <div className="new-project-tips">
              <h4>Tips for better output</h4>
              <ul>
                <li>Include your main offer and pricing range.</li>
                <li>Describe your ideal buyer and pain points.</li>
                <li>Share any differentiators or proof points.</li>
              </ul>
            </div>
          </aside>

          <div className="new-project-form card">
            {step === 1 && (
              <>
                <div className="form-section">
                  <h2>Business Information</h2>
                  <p>
                    Provide details about your business so our AI can create the
                    most accurate strategy.
                  </p>
                </div>

                <div className="form-grid">
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
                    <input
                      id="niche"
                      name="niche"
                      className="input"
                      placeholder="e.g. B2B SaaS, Fitness Coaching"
                      value={form.niche}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="target_audience">
                      Target Audience *
                    </label>
                    <input
                      id="target_audience"
                      name="target_audience"
                      className="input"
                      placeholder="e.g. Stressed founders, Gen Z creators"
                      value={form.target_audience}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="offer">
                      Main Offer / Product *
                    </label>
                    <input
                      id="offer"
                      name="offer"
                      className="input"
                      placeholder="e.g. AI Workflow Software, $5k VIP Coaching"
                      value={form.offer}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="revenue_goal">
                      Monthly Revenue Goal *
                    </label>
                    <input
                      id="revenue_goal"
                      name="revenue_goal"
                      className="input"
                      placeholder="e.g. $50,000 MRR"
                      value={form.revenue_goal}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="platform">
                      Primary Social Platform *
                    </label>
                    <input
                      id="platform"
                      name="platform"
                      className="input"
                      placeholder="e.g. Instagram & LinkedIn"
                      value={form.platform}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="tone">
                      Brand Tone
                    </label>
                    <input
                      id="tone"
                      name="tone"
                      className="input"
                      placeholder="e.g. Confident, authoritative, strategic"
                      value={form.tone}
                      onChange={handleChange}
                    />
                  </div>
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
                  />
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
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Complete}
                  >
                    Continue
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-section">
                  <h2>Review & Generate</h2>
                  <p>
                    Confirm your details and start the AI generation process.
                  </p>
                </div>

                <div className="summary-grid">
                  <div>
                    <p>Project Name</p>
                    <strong>{form.name}</strong>
                  </div>
                  <div>
                    <p>Website</p>
                    <strong>{form.website_url}</strong>
                  </div>
                  <div>
                    <p>Audience</p>
                    <strong>{form.target_audience}</strong>
                  </div>
                  <div>
                    <p>Offer</p>
                    <strong>{form.offer}</strong>
                  </div>
                </div>

                {(form.current_funnel || form.extra_details) && (
                  <div className="summary-card">
                    <p>Notes</p>
                    <strong>{form.current_funnel || form.extra_details}</strong>
                  </div>
                )}

                <div className="ai-output-card">
                  <p>AI will generate</p>
                  <ul>
                    <li>Website & business analysis</li>
                    <li>Brand positioning strategy</li>
                    <li>Full marketing funnel</li>
                    <li>30-day content calendar</li>
                    <li>Ad campaign variants</li>
                  </ul>
                </div>

                {error && <div className="form-alert">{error}</div>}

                <div className="form-actions split">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner" /> : null}
                    {loading ? "Generating..." : "Generate Strategy"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
