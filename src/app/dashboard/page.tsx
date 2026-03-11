import Link from "next/link";
import { getProjects } from "@/database/queries";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types";
import DeleteProjectButton from "@/components/DeleteProjectButton";

export default async function DashboardPage() {
  let projects: Project[] = [];
  try {
    projects = await getProjects();
  } catch {
    // If DB not set up yet, show empty state
  }

  const statusCounts = projects.reduce(
    (acc, project) => {
      acc.total += 1;
      if (project.status === "completed") acc.completed += 1;
      if (project.status === "generating") acc.generating += 1;
      if (project.status === "pending") acc.pending += 1;
      if (project.status === "failed") acc.failed += 1;
      return acc;
    },
    { total: 0, completed: 0, generating: 0, pending: 0, failed: 0 },
  );

  const activityItems = projects.slice(0, 5).map((project) => ({
    id: project.id,
    title: project.name,
    status: project.status,
    time: formatDate(project.created_at),
    description: `Project ${project.status} • ${project.website_url}`,
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: 4,
              fontSize: 14,
            }}
          >
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </Link>
      </div>

      <div className="page-content">
        <section className="dashboard-hero">
          <div>
            <p className="dashboard-kicker">Workspace Overview</p>
            <h2>
              Launch, manage, and scale campaigns from a single dashboard.
            </h2>
            <p className="dashboard-subtitle">
              TitanOS keeps your strategy, assets, and distribution in sync so
              every launch feels coordinated.
            </p>
          </div>
          <div className="dashboard-hero-actions">
            <Link href="/dashboard/new" className="btn btn-primary btn-lg">
              Start new project
            </Link>
            <Link
              href="/dashboard#activity"
              className="btn btn-secondary btn-lg"
            >
              View activity
            </Link>
          </div>
        </section>

        <section className="dashboard-stats">
          {[
            ["Total projects", statusCounts.total],
            ["Active builds", statusCounts.generating + statusCounts.pending],
            ["Completed", statusCounts.completed],
            ["Failed", statusCounts.failed],
          ].map(([label, value]) => (
            <div key={label} className="dashboard-stat-card">
              <div className="dashboard-stat-value">{value}</div>
              <div className="dashboard-stat-label">{label}</div>
            </div>
          ))}
        </section>

        <section id="activity" className="dashboard-activity">
          <div className="dashboard-section-header">
            <div>
              <h3>Latest activity</h3>
              <p>Recent project updates and status changes.</p>
            </div>
          </div>

          {activityItems.length === 0 ? (
            <div className="activity-empty">
              <div className="activity-dot" />
              <div>
                <h4>No activity yet</h4>
                <p>Kick off your first project to start building momentum.</p>
              </div>
            </div>
          ) : (
            <div className="activity-list">
              {activityItems.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-status status-${item.status}`} />
                  <div>
                    <div className="activity-title">{item.title}</div>
                    <p className="activity-desc">{item.description}</p>
                  </div>
                  <span className="activity-time">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {projects.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h2>No projects yet</h2>
            <p>
              Create your first project to let TitanOS analyze your business and
              generate a full AI marketing strategy.
            </p>
            <Link href="/dashboard/new" className="btn btn-primary btn-lg">
              Create your first project
            </Link>
          </div>
        ) : (
          <section className="dashboard-projects">
            <div className="dashboard-section-header">
              <div>
                <h3>Recent projects</h3>
                <p>Jump back into your latest launches and campaigns.</p>
              </div>
              <Link href="/dashboard/new" className="btn btn-secondary">
                New project
              </Link>
            </div>

            <div className="project-grid">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="card card-hover project-card"
                  style={{
                    position: "relative",
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                      padding: "18px 20px",
                      height: "100%",
                    }}
                  >
                    <div className="project-card-top">
                      <div className="project-avatar">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="project-status">
                        <span className={`badge badge-${project.status}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="project-title">{project.name}</h3>
                    <p className="project-url">{project.website_url}</p>

                    <div className="project-meta">
                      <span>Created {formatDate(project.created_at)}</span>
                      <span className="project-open">Open</span>
                    </div>
                  </Link>

                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      zIndex: 10,
                    }}
                  >
                    <DeleteProjectButton
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
