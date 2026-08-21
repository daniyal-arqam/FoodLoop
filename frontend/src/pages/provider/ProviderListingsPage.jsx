import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchMyListings } from "../../services/foodService.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States.jsx";
import { ListingTable } from "../../components/listings/ListingTable.jsx";
import { ListingCreatedBanner } from "../../components/listings/ListingCreatedBanner.jsx";

export function ProviderListingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [createdListing, setCreatedListing] = useState(location.state?.createdListing || null);
  const { data, error, loading, reload } = useAsyncResource(fetchMyListings, []);

  useEffect(() => {
    if (!location.state?.createdListing) {
      return;
    }
    setCreatedListing(location.state.createdListing);
    navigate(".", { replace: true, state: {} });
    reload();
  }, [location.state, navigate, reload]);

  if (loading && !data) return <LoadingState label="Loading listings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="stack">
      <PageHeader
        title="My Listings"
        description="Every listing you have published, with live status from the food service."
        actions={
          <Link className="btn btn-primary" to="/provider/listings/new">
            Create Listing
          </Link>
        }
      />
      {createdListing ? <ListingCreatedBanner listing={createdListing} /> : null}
      {!data?.length ? (
        <EmptyState
          title="No listings yet"
          body="Create a listing to make surplus food visible to organizations."
          action={
            <Link className="btn btn-primary" to="/provider/listings/new">
              Create Listing
            </Link>
          }
        />
      ) : (
        <ListingTable listings={data} />
      )}
    </div>
  );
}
