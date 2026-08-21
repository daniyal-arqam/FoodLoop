import { useState } from "react";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchFoods } from "../../services/foodService.js";
import { fetchMyOrganization } from "../../services/organizationService.js";
import { decorateWithMatchScores } from "../../services/matchingService.js";
import { toFoodQuery } from "../../utils/organizationFood.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States.jsx";
import { FoodCard } from "../../components/food/FoodCard.jsx";
import { FoodFilters } from "../../components/food/FoodFilters.jsx";

const EMPTY_FILTERS = {
  category: "",
  minQuantity: "",
  maxDistanceKm: "",
  urgencyHours: "",
};

async function loadDiscovery(filters) {
  const organization = await fetchMyOrganization();
  const listings = await fetchFoods(toFoodQuery(filters, organization));
  const decorated = await decorateWithMatchScores(listings, organization);
  return { organization, listings: decorated };
}

export function OrganizationFoodPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { data, error, loading, reload } = useAsyncResource(() => loadDiscovery(filters), [filters]);

  if (loading && !data) return <LoadingState label="Loading available food…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const verified = Boolean(data.organization?.verified);

  return (
    <div className="stack">
      <PageHeader
        title="Available Food"
        description="Filter surplus listings and claim food if your organization is verified."
      />
      <FoodFilters filters={filters} onChange={setFilters} />
      {loading ? <p role="status">Updating results…</p> : null}
      {!data.listings.length ? (
        <EmptyState
          title="No food matches these filters"
          body="Try a different category, quantity, distance, or urgency window."
        />
      ) : (
        <div className="food-grid">
          {data.listings.map((listing) => (
            <FoodCard key={listing.id} listing={listing} verified={verified} onClaimed={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
