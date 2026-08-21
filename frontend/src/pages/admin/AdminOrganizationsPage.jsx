import { useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { useToast } from "../../hooks/useToast.js";
import { fetchOrganizations, verifyOrganization } from "../../services/organizationService.js";
import { errorMessage } from "../../utils/errors.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { Select } from "../../components/ui/FormFields.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

function filterOrganizations(organizations, filter) {
  if (filter === "pending") return organizations.filter((item) => !item.verified);
  if (filter === "verified") return organizations.filter((item) => item.verified);
  return organizations;
}

export function AdminOrganizationsPage() {
  const toast = useToast();
  const [filter, setFilter] = useState("pending");
  const [pendingAction, setPendingAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useAsyncResource(fetchOrganizations, []);

  async function confirmVerify() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      await verifyOrganization(pendingAction.id, pendingAction.verified);
      toast.success(pendingAction.verified ? "Organization verified" : "Verification removed");
      setPendingAction(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading organizations…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = filterOrganizations(data || [], filter);

  return (
    <div className="stack">
      <PageHeader
        title="Organizations"
        description="Review pending partners and verify them before they can claim food."
        actions={
          <Select id="orgFilter" label="Show" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="all">All</option>
          </Select>
        }
      />
      <DataTable
        rows={rows}
        empty={filter === "pending" ? "No pending organizations." : "No organizations found."}
        columns={[
          {
            key: "organizationName",
            header: "Name",
            render: (row) => (
              <Link className="table-link" to={`/admin/organizations/${row.id}`}>
                {row.organizationName}
              </Link>
            ),
          },
          { key: "address", header: "Address" },
          {
            key: "verified",
            header: "Status",
            render: (row) => (
              <Badge tone={row.verified ? "success" : "warning"}>{row.verified ? "Verified" : "Pending"}</Badge>
            ),
          },
          {
            key: "actions",
            header: "Action",
            render: (row) => (
              <Button
                variant={row.verified ? "danger" : "primary"}
                onClick={() => setPendingAction({ id: row.id, name: row.organizationName, verified: !row.verified })}
              >
                {row.verified ? "Unverify" : "Verify"}
              </Button>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.verified ? "Verify organization" : "Remove verification"}
        message={
          pendingAction?.verified
            ? `Verify ${pendingAction?.name}? They will be able to claim available food.`
            : `Remove verification from ${pendingAction?.name}? They will no longer be able to claim food.`
        }
        confirmLabel={pendingAction?.verified ? "Verify" : "Unverify"}
        variant={pendingAction?.verified ? "primary" : "danger"}
        busy={busy}
        onCancel={() => !busy && setPendingAction(null)}
        onConfirm={confirmVerify}
      />
    </div>
  );
}
