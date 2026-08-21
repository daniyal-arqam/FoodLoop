import { Link } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { useToast } from "../../hooks/useToast.js";
import { collectListing, fetchFoods } from "../../services/foodService.js";
import { fetchMyOrganization } from "../../services/organizationService.js";
import { listingsForOrganization } from "../../utils/organizationFood.js";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { errorMessage } from "../../utils/errors.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { Badge, statusTone } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States.jsx";

async function loadClaims() {
  const organization = await fetchMyOrganization();
  const reserved = await fetchFoods({ status: "Reserved" });
  return listingsForOrganization(reserved, organization);
}

export function OrganizationClaimsPage() {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useAsyncResource(loadClaims, []);

  async function handleCollect(id) {
    try {
      const result = await collectListing(id);
      setData((rows) => (rows || []).filter((row) => row.id !== id));
      toast.success(`Collection recorded. ${result?.listing?.foodName || "Listing"} is now Collected.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (loading) return <LoadingState label="Loading claims…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="stack">
      <PageHeader title="Active Claims" description="Reserved listings waiting for pickup." />
      {!data?.length ? (
        <EmptyState
          title="No active claims"
          body="Claim available food to see it here."
          action={
            <Link className="btn btn-primary" to="/organization/food">
              Discover food
            </Link>
          }
        />
      ) : (
        <DataTable
          rows={data}
          columns={[
            {
              key: "foodName",
              header: "Food",
              render: (row) => (
                <Link to={`/organization/food/${row.id}`} className="table-link">
                  {row.foodName}
                </Link>
              ),
            },
            {
              key: "claimedQuantity",
              header: "Claimed",
              render: (row) => formatQuantity(row.claimedQuantity, row.unit),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
            },
            {
              key: "expiryDate",
              header: "Expires",
              render: (row) => formatDate(row.expiryDate),
            },
            {
              key: "actions",
              header: "Action",
              render: (row) => (
                <Button variant="primary" onClick={() => handleCollect(row.id)}>
                  Mark collected
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
