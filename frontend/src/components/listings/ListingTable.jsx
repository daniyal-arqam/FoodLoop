import { Link } from "react-router-dom";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { Badge, statusTone } from "../ui/Badge.jsx";
import { DataTable } from "../ui/DataTable.jsx";

export function ListingTable({ listings, empty = "No listings yet." }) {
  return (
    <DataTable
      rows={listings}
      empty={empty}
      columns={[
        {
          key: "foodName",
          header: "Food",
          render: (row) => (
            <Link to={`/provider/listings/${row.id}`} className="table-link">
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
  );
}
