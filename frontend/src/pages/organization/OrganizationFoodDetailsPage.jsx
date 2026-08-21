import { Link, useParams } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchListing } from "../../services/foodService.js";
import { fetchMyOrganization } from "../../services/organizationService.js";
import { decorateWithMatchScores } from "../../services/matchingService.js";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { formatDistance } from "../../utils/geo.js";
import { formatMatchScore } from "../../utils/organizationFood.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge, statusTone } from "../../components/ui/Badge.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";
import { ClaimButton } from "../../components/food/ClaimButton.jsx";
import { MatchBreakdown } from "../../components/food/MatchBreakdown.jsx";

async function loadDetails(listingId) {
  const [listing, organization] = await Promise.all([fetchListing(listingId), fetchMyOrganization()]);
  const [decorated] = await decorateWithMatchScores(listing ? [listing] : [], organization);
  return { listing: decorated, organization };
}

export function OrganizationFoodDetailsPage() {
  const { listingId } = useParams();
  const { data, error, loading, reload, setData } = useAsyncResource(() => loadDetails(listingId), [listingId]);

  function handleClaimed(result) {
    if (result?.listing) {
      setData((current) => ({
        ...current,
        listing: {
          ...current.listing,
          ...result.listing,
          matchEligible: false,
        },
      }));
    }
  }

  if (loading) return <LoadingState label="Loading food details…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.listing) return <ErrorState message="Listing not found." onRetry={reload} />;

  const listing = data.listing;
  const verified = Boolean(data.organization?.verified);
  const score = formatMatchScore(listing.matchScore);

  return (
    <div className="stack">
      <PageHeader
        title="Food Details"
        description={listing.foodName}
        actions={
          <Link className="btn btn-ghost" to="/organization/food">
            Back to discovery
          </Link>
        }
      />
      {listing.status === "Expired" ? (
        <p className="error" role="alert">
          This listing has expired and cannot be claimed.
        </p>
      ) : null}
      {listing.status === "Reserved" ? (
        <p className="banner-warning" role="status">
          This listing is already reserved.
        </p>
      ) : null}
      <Card title={listing.foodName} actions={<Badge tone={statusTone(listing.status)}>{listing.status}</Badge>}>
        <dl className="details-list">
          <div>
            <dt>Food name</dt>
            <dd>{listing.foodName}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{listing.category}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{formatQuantity(listing.quantity, listing.unit)}</dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>{formatDistance(listing.distanceKm)}</dd>
          </div>
          <div>
            <dt>Expiry</dt>
            <dd>{formatDate(listing.expiryDate)}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{listing.providerLabel}</dd>
          </div>
          <div>
            <dt>Match score</dt>
            <dd>{score == null ? "—" : `${score}%`}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <Badge tone={statusTone(listing.status)}>{listing.status}</Badge>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{listing.pickupLocation?.address || "—"}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{listing.description || "—"}</dd>
          </div>
        </dl>
      </Card>
      <Card title="Python matcher score">
        <MatchBreakdown listing={listing} />
      </Card>
      <Card title="Claim this food">
        <ClaimButton listing={listing} verified={verified} onSuccess={handleClaimed} />
      </Card>
    </div>
  );
}
