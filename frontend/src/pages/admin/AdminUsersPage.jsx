import { useState } from "react";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { fetchAdminUsers, setAdminUserActive } from "../../services/authService.js";
import { errorMessage } from "../../utils/errors.js";
import { formatDate } from "../../utils/format.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

export function AdminUsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useAsyncResource(fetchAdminUsers, []);

  async function confirmActiveChange() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      await setAdminUserActive(pendingAction.id, pendingAction.isActive);
      toast.success(pendingAction.isActive ? "User reactivated" : "User deactivated");
      setPendingAction(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading users…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="stack">
      <PageHeader title="Users" description="Accounts on FoodLoop. Deactivating an account blocks sign-in." />
      <DataTable
        rows={data || []}
        empty="No users found."
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role" },
          {
            key: "isActive",
            header: "Account",
            render: (row) => (
              <Badge tone={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Inactive"}</Badge>
            ),
          },
          {
            key: "createdAt",
            header: "Joined",
            render: (row) => formatDate(row.createdAt),
          },
          {
            key: "actions",
            header: "Action",
            render: (row) => {
              if (row.id === user?.id) {
                return <span className="muted">You</span>;
              }
              return (
                <Button
                  variant={row.isActive ? "danger" : "primary"}
                  onClick={() =>
                    setPendingAction({
                      id: row.id,
                      name: row.name,
                      isActive: !row.isActive,
                    })
                  }
                >
                  {row.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              );
            },
          },
        ]}
      />
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.isActive ? "Reactivate user" : "Deactivate user"}
        message={
          pendingAction?.isActive
            ? `Reactivate ${pendingAction?.name}? They will be able to sign in again.`
            : `Deactivate ${pendingAction?.name}? They will no longer be able to sign in.`
        }
        confirmLabel={pendingAction?.isActive ? "Reactivate" : "Deactivate"}
        variant={pendingAction?.isActive ? "primary" : "danger"}
        busy={busy}
        onCancel={() => !busy && setPendingAction(null)}
        onConfirm={confirmActiveChange}
      />
    </div>
  );
}
