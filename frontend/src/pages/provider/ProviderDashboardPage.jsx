import { Link } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchMyListings } from "../../services/foodService.js";
import { estimateImpact } from "../../services/matchingService.js";
import { summarizeProviderListings } from "../../utils/listingStats.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card, StatCard } from "../../components/ui/Card.jsx";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States.jsx";
import { ListingTable } from "../../components/listings/ListingTable.jsx";

async function loadProviderDashboard() {
  const listings = await fetchMyListings();
  let impact = null;
  try {
    const payload = await estimateImpact(listings);
    impact = payload.data || null;
  } catch {
    impact = null;
  }
  return { listings, impact };
}

export function ProviderDashboardPage() {
  const { data, error, loading, reload } = useAsyncResource(loadProviderDashboard, []);

  if (loading) return <LoadingState label="Loading provider dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const listings = data.listings || [];
  const stats = summarizeProviderListings(listings);
  const wasteKg = data.impact?.estimatedWasteKg;
  const co2Kg = data.impact?.co2AvoidedKg;

  return (
    <div className="stack">
      <PageHeader
        title="Provider Dashboard"
        description="Live counts from your food listings and Python sustainability estimates."
        actions={
          <Link className="btn btn-primary" to="/provider/listings/new">
            Create Listing
          </Link>
        }
      />
      <div className="stat-grid">
        <StatCard label="Active Listings" value={stats.active} hint="Status: Available" />
        <StatCard label="Claimed Food" value={stats.claimed} hint="Status: Reserved" />
        <StatCard label="Collected Food" value={stats.collected} hint="Status: Collected" />
        <StatCard label="Expired Food" value={stats.expired} hint="Status: Expired" />
        <StatCard
          label="Total Portions Rescued"
          value={stats.portionsRescued}
          hint="Quantity from collected listings"
        />
        <StatCard
          label="Estimated Waste Reduction"
          value={wasteKg == null ? "—" : `${wasteKg} kg`}
          hint={co2Kg == null ? "Python WasteAnalyzer" : `${co2Kg} kg CO₂e avoided`}
        />
      </div>
      <Card
        title="Recent Listings"
        actions={
          <Link className="btn btn-ghost" to="/provider/listings">
            My Listings
          </Link>
        }
      >
        {stats.recent.length ? (
          <ListingTable listings={stats.recent} />
        ) : (
          <EmptyState
            title="No listings yet"
            body="Publish surplus food to see it here. Counts above stay at zero until the API returns listings."
            action={
              <Link className="btn btn-primary" to="/provider/listings/new">
                Create Listing
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
