import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate, formatQuantity } from "../../utils/format.js";
import { formatDistance } from "../../utils/geo.js";
import { formatMatchScore } from "../../utils/organizationFood.js";
import { Badge, statusTone } from "../ui/Badge.jsx";
import { ClaimButton } from "./ClaimButton.jsx";

export function FoodCard({ listing, verified, detailsTo, onClaimed }) {
  const [current, setCurrent] = useState(listing);
  const score = formatMatchScore(current.matchScore);
  const href = detailsTo || `/organization/food/${current.id}`;

  useEffect(() => {
    setCurrent(listing);
  }, [listing]);

  function handleClaimed(result) {
    if (result?.listing) {
      setCurrent((existing) => ({ ...existing, ...result.listing, matchEligible: false }));
    }
    onClaimed?.(result);
  }

  return (
    <article className="card food-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 className="card-title" style={{ margin: 0 }}>
          <Link to={href} className="table-link">
            {current.foodName}
          </Link>
        </h3>
        <Badge tone={statusTone(current.status)}>{current.status}</Badge>
      </div>
      <dl className="food-card-meta">
        <div>
          <dt>Category</dt>
          <dd>{current.category}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{formatQuantity(current.quantity, current.unit)}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{formatDistance(current.distanceKm)}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{formatDate(current.expiryDate)}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{current.providerLabel}</dd>
        </div>
        <div>
          <dt>Match score</dt>
          <dd>{score == null ? "—" : `${score}%`}</dd>
        </div>
      </dl>
      <div className="row">
        <Link className="btn btn-ghost" to={href}>
          Details
        </Link>
        <ClaimButton listing={current} verified={verified} onSuccess={handleClaimed} compact />
      </div>
    </article>
  );
}
