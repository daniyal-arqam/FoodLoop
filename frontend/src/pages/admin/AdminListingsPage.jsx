import { useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { fetchFoods } from "../../services/foodService.js";
import { FOOD_STATUSES } from "../../utils/constants.js";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { Badge, statusTone } from "../../components/ui/Badge.jsx";
import { Select } from "../../components/ui/FormFields.jsx";
import { LoadingState, ErrorState } from "../../components/ui/States.jsx";

export function AdminListingsPage() {
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useAsyncResource(
    () => fetchFoods(status ? { status } : {}),
    [status]
  );

  if (loading) return <LoadingState label="Loading listings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="stack">
      <PageHeader
        title="Listings"
        description="View every food listing and open details to manage status."
        actions={
          <Select id="statusFilter" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {FOOD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        }
      />
      <DataTable
        rows={data || []}
        empty="No listings found."
        columns={[
          {
            key: "foodName",
            header: "Food",
            render: (row) => (
              <Link className="table-link" to={`/admin/listings/${row.id}`}>
                {row.foodName}
              </Link>
            ),
          },
          { key: "category", header: "Category" },
          {
            key: "quantity",
            header: "Quantity",
            render: (row) => formatQuantity(row.quantity, row.unit),
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
        ]}
      />
    </div>
  );
}
