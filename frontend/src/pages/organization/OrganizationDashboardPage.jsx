import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchFoods } from "../../services/foodService.js";
import { fetchMyOrganization } from "../../services/organizationService.js";
import { decorateWithMatchScores } from "../../services/matchingService.js";
import {
  listingsForOrganization,
  recommendedMatches,
  summarizeOrganizationDashboard,
} from "../../utils/organizationFood.js";
import { formatDate } from "../../utils/format.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card, StatCard } from "../../components/ui/Card.jsx";
import { Badge, statusTone } from "../../components/ui/Badge.jsx";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States.jsx";
import { FoodCard } from "../../components/food/FoodCard.jsx";
import { OrganizationProfileForm } from "../../components/food/OrganizationProfileForm.jsx";

async function loadDashboard() {
  const organization = await fetchMyOrganization();
  const [availableRaw, reservedRaw, collectedRaw] = await Promise.all([
    fetchFoods(),
    fetchFoods({ status: "Reserved" }),
    fetchFoods({ status: "Collected" }),
  ]);
  const available = await decorateWithMatchScores(availableRaw, organization);
  const reserved = listingsForOrganization(reservedRaw, organization);
  const collected = listingsForOrganization(collectedRaw, organization);
  const recommended = recommendedMatches(available);
  return { organization, available, reserved, collected, recommended };
}

export function OrganizationDashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useAsyncResource(loadDashboard, []);

  if (loading) return <LoadingState label="Loading organization dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const stats = summarizeOrganizationDashboard(data);
  const verified = Boolean(data.organization?.verified);

  return (
    <div className="stack">
      <PageHeader
        title="Organization Dashboard"
        description="Available surplus, matcher recommendations, and your claims from live APIs."
        actions={
          <Link className="btn btn-primary" to="/organization/food">
            Discover food
          </Link>
        }
      />
      {data.organization && !verified ? (
        <p className="banner-warning" role="status">
          Your profile is waiting for admin verification. You can browse food, but claiming is disabled.
        </p>
      ) : null}
      <div className="stat-grid">
        <StatCard label="Available Food" value={stats.availableCount} />
        <StatCard label="Recommended Matches" value={stats.recommendedCount} />
        <StatCard label="Active Claims" value={stats.activeClaims} />
        <StatCard label="Collected Food" value={stats.collectedCount} />
      </div>
      <Card
        title="Recommended Matches"
        actions={
          <Link className="btn btn-ghost" to="/organization/food">
            See all
          </Link>
        }
      >
        {data.recommended.length ? (
          <div className="food-grid">
            {data.recommended.slice(0, 4).map((listing) => (
              <FoodCard key={listing.id} listing={listing} verified={verified} onClaimed={reload} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recommended matches yet"
            body="Matches appear when the matcher scores an available listing as eligible for your organization."
          />
        )}
      </Card>
      <Card title="Recent Activity">
        {stats.recent.length ? (
          <ul className="activity-list">
            {stats.recent.map((item) => (
              <li key={`${item.id}-${item.status}`} className="row" style={{ justifyContent: "space-between" }}>
                <span>
                  {item.foodName} <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </span>
                <span className="muted">{formatDate(item.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No recent activity" body="Claims and newly listed food will show up here." />
        )}
      </Card>
      {!data.organization ? (
        <OrganizationProfileForm
          user={user}
          onSaved={(organization) => setData((current) => ({ ...current, organization }))}
        />
      ) : null}
    </div>
  );
}
