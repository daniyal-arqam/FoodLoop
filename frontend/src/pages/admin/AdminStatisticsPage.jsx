import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchFoods } from "../../services/foodService.js";
import { fetchOrganizations } from "../../services/organizationService.js";
import { fetchAdminUsers } from "../../services/authService.js";
import { summarizeAdmin } from "../../utils/adminStats.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card, StatCard } from "../../components/ui/Card.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

async function loadStatistics() {
  const [listings, organizations, users] = await Promise.all([
    fetchFoods(),
    fetchOrganizations(),
    fetchAdminUsers(),
  ]);
  return { listings, organizations, users };
}

function StatBar({ label, value, total }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="stat-bar">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span>{label}</span>
        <span className="muted">
          {value} ({percent}%)
        </span>
      </div>
      <div className="stat-bar-track" aria-hidden="true">
        <div className="stat-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function AdminStatisticsPage() {
  const { data, error, loading, reload } = useAsyncResource(loadStatistics, []);

  if (loading) return <LoadingState label="Loading statistics…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const stats = summarizeAdmin(data);
  const listingTotal = stats.totalListings || 0;
  const orgTotal = stats.totalOrganizations || 0;
  const userTotal = stats.totalUsers || 0;

  return (
    <div className="stack">
      <PageHeader title="Statistics" description="Breakdowns from live listings, organizations, and users." />
      <div className="stat-grid">
        <StatCard label="Total Listings" value={stats.totalListings} />
        <StatCard label="Food Rescued" value={stats.foodRescued} />
        <StatCard label="Organizations" value={stats.totalOrganizations} />
        <StatCard label="Users" value={stats.totalUsers} />
      </div>
      <div className="grid-2">
        <Card title="Listings by status">
          {stats.byStatus.map((item) => (
            <StatBar key={item.label} label={item.label} value={item.value} total={listingTotal} />
          ))}
        </Card>
        <Card title="Listings by category">
          {stats.byCategory.length ? (
            stats.byCategory.map((item) => (
              <StatBar key={item.label} label={item.label} value={item.value} total={listingTotal} />
            ))
          ) : (
            <p className="muted">No listings yet.</p>
          )}
        </Card>
        <Card title="Organizations">
          <StatBar label="Verified" value={stats.verifiedOrganizations} total={orgTotal} />
          <StatBar label="Pending" value={stats.pendingOrganizations} total={orgTotal} />
        </Card>
        <Card title="Listings by month">
          {stats.byMonth.length ? (
            stats.byMonth.map((item) => (
              <StatBar key={item.label} label={item.label} value={item.value} total={listingTotal} />
            ))
          ) : (
            <p className="muted">No listing dates yet.</p>
          )}
        </Card>
        <Card title="Users by role">
          {stats.byRole.map((item) => (
            <StatBar key={item.label} label={item.label} value={item.value} total={userTotal} />
          ))}
        </Card>
      </div>
    </div>
  );
}
