import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { useToast } from "../../hooks/useToast.js";
import { fetchOrganization, verifyOrganization } from "../../services/organizationService.js";
import { errorMessage } from "../../utils/errors.js";
import { formatDate } from "../../utils/format.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

export function AdminOrganizationDetailsPage() {
  const { organizationId } = useParams();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useAsyncResource(
    () => fetchOrganization(organizationId),
    [organizationId]
  );

  async function confirmVerify() {
    if (!data) return;
    setBusy(true);
    try {
      await verifyOrganization(data.id, !data.verified);
      toast.success(data.verified ? "Verification removed" : "Organization verified");
      setConfirmOpen(false);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading organization…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <ErrorState message="Organization not found." onRetry={reload} />;

  const nextVerified = !data.verified;

  return (
    <div className="stack">
      <PageHeader
        title={data.organizationName}
        description="Organization details and verification."
        actions={
          <Link className="btn btn-ghost" to="/admin/organizations">
            All organizations
          </Link>
        }
      />
      <Card
        title="Profile"
        actions={
          <>
            <Badge tone={data.verified ? "success" : "warning"}>
              {data.verified ? "Verified" : "Pending"}
            </Badge>
            <Button variant={nextVerified ? "primary" : "danger"} onClick={() => setConfirmOpen(true)}>
              {nextVerified ? "Verify" : "Unverify"}
            </Button>
          </>
        }
      >
        <dl className="details-list">
          <div>
            <dt>Organization name</dt>
            <dd>{data.organizationName}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <Badge tone={data.verified ? "success" : "warning"}>
                {data.verified ? "Verified" : "Pending"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{data.address || "—"}</dd>
          </div>
          <div>
            <dt>Latitude</dt>
            <dd>{data.location?.latitude ?? "—"}</dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>{data.location?.longitude ?? "—"}</dd>
          </div>
          <div>
            <dt>Required quantity</dt>
            <dd>{data.requiredQuantity ?? "—"}</dd>
          </div>
          <div>
            <dt>Food categories needed</dt>
            <dd>{data.foodCategoriesNeeded?.length ? data.foodCategoriesNeeded.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{data.description || "—"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(data.createdAt)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(data.updatedAt)}</dd>
          </div>
        </dl>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        title={nextVerified ? "Verify organization" : "Remove verification"}
        message={
          nextVerified
            ? `Verify ${data.organizationName}? They will be able to claim available food.`
            : `Remove verification from ${data.organizationName}? They will no longer be able to claim food.`
        }
        confirmLabel={nextVerified ? "Verify" : "Unverify"}
        variant={nextVerified ? "primary" : "danger"}
        busy={busy}
        onCancel={() => !busy && setConfirmOpen(false)}
        onConfirm={confirmVerify}
      />
    </div>
  );
}
