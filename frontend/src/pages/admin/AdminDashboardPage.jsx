import { Link } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchFoods } from "../../services/foodService.js";
import { fetchOrganizations } from "../../services/organizationService.js";
import { summarizeAdmin } from "../../utils/adminStats.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card, StatCard } from "../../components/ui/Card.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

async function loadAdminDashboard() {
  const [listings, organizations] = await Promise.all([fetchFoods(), fetchOrganizations()]);
  return { listings, organizations };
}

export function AdminDashboardPage() {
  const { data, error, loading, reload } = useAsyncResource(loadAdminDashboard, []);

  if (loading) return <LoadingState label="Loading admin dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const stats = summarizeAdmin(data);

  return (
    <div className="stack">
      <PageHeader
        title="Admin Dashboard"
        description="Live platform metrics from listings and organizations."
      />
      <div className="stat-grid">
        <StatCard label="Total Listings" value={stats.totalListings} hint="All food listings" />
        <StatCard label="Active Listings" value={stats.activeListings} hint="Status: Available" />
        <StatCard label="Food Rescued" value={stats.foodRescued} hint="Quantity from collected listings" />
        <StatCard
          label="Verified Organizations"
          value={stats.verifiedOrganizations}
          hint={`${stats.pendingOrganizations} pending review`}
        />
        <StatCard label="Expired Listings" value={stats.expiredListings} hint="Status: Expired" />
        <StatCard label="Claims" value={stats.claims} hint="Reserved + Collected" />
      </div>
      <Card title="Manage the platform">
        <div className="row">
          <Link className="btn btn-primary" to="/admin/organizations">
            Organizations
          </Link>
          <Link className="btn btn-ghost" to="/admin/listings">
            Listings
          </Link>
          <Link className="btn btn-ghost" to="/admin/users">
            Users
          </Link>
          <Link className="btn btn-ghost" to="/admin/statistics">
            Statistics
          </Link>
        </div>
      </Card>
    </div>
  );
}
