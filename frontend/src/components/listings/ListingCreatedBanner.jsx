import { Link } from "react-router-dom";
import { Badge, statusTone } from "../ui/Badge.jsx";

export function ListingCreatedBanner({ listing }) {
  if (!listing) return null;
  return (
    <div className="banner-success" role="status">
      <p>
        <strong>{listing.foodName}</strong> was published and is now{" "}
        <Badge tone={statusTone(listing.status || "Available")}>{listing.status || "Available"}</Badge>
      </p>
      <Link to={`/provider/listings/${listing.id}`}>View listing details</Link>
    </div>
  );
}
