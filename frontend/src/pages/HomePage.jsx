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
    <div>
      <section className="hero">
        <div>
          <p className="badge badge-success">Smart food rescue</p>
          <h1 className="display" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", margin: "0.6rem 0" }}>
            Surplus food, looped back to people who need it.
          </h1>
          <p className="lede">
            FoodLoop connects providers, community organizations, and admins so edible surplus is claimed before it
            expires.
          </p>
          <div className="row" style={{ marginTop: "1.5rem" }}>
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
        <Card title="How it works">
          <ol className="stack" style={{ paddingLeft: "1.1rem" }}>
            <li>Providers publish surplus listings with quantity, category, and expiry.</li>
            <li>Verified organizations claim and collect nearby food.</li>
            <li>The matcher ranks candidates by distance, category, quantity, and urgency.</li>
          </ol>
        </Card>
      </section>

      <Card title="Hackathon demo login">
        <p className="muted">
          Run <code>./scripts/seed-demo.sh</code> with the stack up, then sign in with these accounts.
        </p>
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
              Gateway unreachable. Start it on port 8080 or set <code>VITE_API_BASE_URL</code>.
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
