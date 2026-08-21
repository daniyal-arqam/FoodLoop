import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { getFrontendHealth, getGatewayHealth } from "../services/healthService.js";
import { dashboardPathForRole } from "../utils/roles.js";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { DEMO_ACCOUNTS } from "../utils/demoAccounts.js";

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const frontend = useAsyncResource(getFrontendHealth, []);
  const gateway = useAsyncResource(getGatewayHealth, []);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="badge badge-success">Smart food rescue · PS-04</p>
          <h1 className="display hero-title">Surplus food, looped back to people who need it.</h1>
          <p className="lede">
            FoodLoop connects kitchens with verified community organizations so edible surplus is claimed before it
            expires — not left in a chat thread.
          </p>
          <div className="row hero-actions">
            {isAuthenticated ? (
              <Link className="btn btn-primary" to={dashboardPathForRole(user.role)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary" to="/register">
                  Create an account
                </Link>
                <Link className="btn btn-ghost" to="/login">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-stage" aria-hidden="true">
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="hero-stack">
            <article className="hero-float-card hero-float-back">
              <p className="muted">Match score</p>
              <p className="hero-metric">92</p>
              <p className="muted">Distance · category · urgency</p>
            </article>
            <article className="hero-float-card hero-float-mid">
              <p className="muted">Listing</p>
              <strong>Vegetarian meal trays</strong>
              <p className="muted">Available · 40 portions</p>
            </article>
            <article className="hero-float-card hero-float-front">
              <p className="muted">How it works</p>
              <ol className="hero-steps">
                <li>Providers publish surplus.</li>
                <li>Verified orgs claim nearby food.</li>
                <li>Python matcher ranks the fit.</li>
              </ol>
            </article>
          </div>
        </div>
      </section>

      <section className="grid-3 home-pillars" aria-label="Platform pillars">
        <Card title="List & rescue">
          <p className="muted">Providers post quantity, category, pickup window, and expiry. Status moves Available → Reserved → Collected.</p>
        </Card>
        <Card title="Verified claimants">
          <p className="muted">Organizations wait for Admin verification, then browse, score, and collect surplus food.</p>
        </Card>
        <Card title="Live AI workspace">
          <p className="muted">Waste advisor, food-safety RAG, and a matching agent that calls the same APIs — not a mocked chatbot.</p>
        </Card>
      </section>

      <Card title="Hackathon demo login">
        <p className="muted">Use these accounts on the live app after seed, or locally after `./scripts/seed-demo.sh`.</p>
        <ul className="stack">
          <li>
            Provider: {DEMO_ACCOUNTS.provider.email} / {DEMO_ACCOUNTS.provider.password}
          </li>
          <li>
            Organization: {DEMO_ACCOUNTS.organization.email} / {DEMO_ACCOUNTS.organization.password}
          </li>
          <li>
            Admin: {DEMO_ACCOUNTS.admin.email} / {DEMO_ACCOUNTS.admin.password}
          </li>
        </ul>
      </Card>

      <div className="grid-2">
        <Card title="Frontend">
          {frontend.loading && <p role="status">Checking health…</p>}
          {frontend.error && <p role="alert">{frontend.error}</p>}
          {frontend.data && (
            <p>
              <Badge tone="success">{frontend.data.data?.status || "ok"}</Badge> {frontend.data.data?.service}
            </p>
          )}
        </Card>
        <Card title="API gateway">
          {gateway.loading && <p role="status">Checking gateway…</p>}
          {gateway.error && (
            <p role="alert">
              Gateway is waking up or unreachable. Wait a few seconds, then refresh. Confirm <code>VITE_API_BASE_URL</code>{" "}
              if this persists.
            </p>
          )}
          {gateway.data && (
            <p>
              <Badge tone="success">{gateway.data.data?.status || "ok"}</Badge> {gateway.data.data?.service}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
