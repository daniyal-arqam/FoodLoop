import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { useToast } from "../../hooks/useToast.js";
import { fetchListing, updateFood } from "../../services/foodService.js";
import { errorMessage } from "../../utils/errors.js";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge, statusTone } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

export function AdminListingDetailsPage() {
  const { listingId } = useParams();
  const toast = useToast();
  const [pendingStatus, setPendingStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useAsyncResource(() => fetchListing(listingId), [listingId]);

  async function confirmStatusChange() {
    if (!data || !pendingStatus) return;
    setBusy(true);
    try {
      await updateFood(data.id, { status: pendingStatus });
      toast.success(pendingStatus === "Expired" ? "Listing marked expired" : "Listing restored to Available");
      setPendingStatus(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading listing…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <ErrorState message="Listing not found." onRetry={reload} />;

  const canExpire = data.status === "Available" || data.status === "Reserved";
  const canRestore = data.status === "Expired";

  return (
    <div className="stack">
      <PageHeader
        title="Listing details"
        description={data.foodName}
        actions={
          <Link className="btn btn-ghost" to="/admin/listings">
            All listings
          </Link>
        }
      />
      <Card
        title={data.foodName}
        actions={
          <>
            <Badge tone={statusTone(data.status)}>{data.status}</Badge>
            {canExpire ? (
              <Button variant="danger" onClick={() => setPendingStatus("Expired")}>
                Mark expired
              </Button>
            ) : null}
            {canRestore ? (
              <Button variant="primary" onClick={() => setPendingStatus("Available")}>
                Restore listing
              </Button>
            ) : null}
          </>
        }
      >
        <dl className="details-list">
          <div>
            <dt>Food name</dt>
            <dd>{data.foodName}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{data.category}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{formatQuantity(data.quantity, data.unit)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <Badge tone={statusTone(data.status)}>{data.status}</Badge>
            </dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{data.description || "—"}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{data.pickupLocation?.address || "—"}</dd>
          </div>
          <div>
            <dt>Latitude</dt>
            <dd>{data.pickupLocation?.latitude ?? "—"}</dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>{data.pickupLocation?.longitude ?? "—"}</dd>
          </div>
          <div>
            <dt>Available from</dt>
            <dd>{formatDate(data.availableFrom)}</dd>
          </div>
          <div>
            <dt>Available until</dt>
            <dd>{formatDate(data.availableUntil)}</dd>
          </div>
          <div>
            <dt>Expiry date</dt>
            <dd>{formatDate(data.expiryDate)}</dd>
          </div>
          <div>
            <dt>Claimed quantity</dt>
            <dd>{data.claimedQuantity ?? 0}</dd>
          </div>
          <div>
            <dt>Reserved by</dt>
            <dd>{data.reservedBy || "—"}</dd>
          </div>
        </dl>
      </Card>
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus === "Expired" ? "Expire listing" : "Restore listing"}
        message={
          pendingStatus === "Expired"
            ? `Mark ${data.foodName} as expired? Organizations will no longer be able to claim it.`
            : `Restore ${data.foodName} to Available?`
        }
        confirmLabel={pendingStatus === "Expired" ? "Expire listing" : "Restore listing"}
        variant={pendingStatus === "Expired" ? "danger" : "primary"}
        busy={busy}
        onCancel={() => !busy && setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
