import { Link, useParams } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { useToast } from "../../hooks/useToast.js";
import { collectListing, fetchListing } from "../../services/foodService.js";
import { errorMessage } from "../../utils/errors.js";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge, statusTone } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

export function ListingDetailsPage() {
  const { listingId } = useParams();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useAsyncResource(() => fetchListing(listingId), [listingId]);

  async function handleCollect() {
    try {
      const result = await collectListing(listingId);
      if (result?.listing) {
        setData(result.listing);
      }
      toast.success("Collection recorded. Status is now Collected.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (loading) return <LoadingState label="Loading listing…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <ErrorState message="Listing not found." onRetry={reload} />;

  const listing = data;

  return (
    <div className="stack">
      <PageHeader
        title="Listing Details"
        description={listing.foodName}
        actions={
          <Link className="btn btn-ghost" to="/provider/listings">
            My Listings
          </Link>
        }
      />
      <Card
        title={listing.foodName}
        actions={
          <>
            <Badge tone={statusTone(listing.status)}>{listing.status}</Badge>
            {listing.status === "Reserved" ? (
              <Button variant="primary" onClick={handleCollect}>
                Mark collected
              </Button>
            ) : null}
          </>
        }
      >
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
            <dt>Status</dt>
            <dd>
              <Badge tone={statusTone(listing.status)}>{listing.status}</Badge>
            </dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{listing.description || "—"}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{listing.pickupLocation?.address || "—"}</dd>
          </div>
          <div>
            <dt>Latitude</dt>
            <dd>{listing.pickupLocation?.latitude ?? "—"}</dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>{listing.pickupLocation?.longitude ?? "—"}</dd>
          </div>
          <div>
            <dt>Available From</dt>
            <dd>{formatDate(listing.availableFrom)}</dd>
          </div>
          <div>
            <dt>Available Until</dt>
            <dd>{formatDate(listing.availableUntil)}</dd>
          </div>
          <div>
            <dt>Expiry Date</dt>
            <dd>{formatDate(listing.expiryDate)}</dd>
          </div>
          <div>
            <dt>Claimed quantity</dt>
            <dd>{listing.claimedQuantity ?? 0}</dd>
          </div>
          <div>
            <dt>Reserved by</dt>
            <dd>{listing.reservedBy || "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
