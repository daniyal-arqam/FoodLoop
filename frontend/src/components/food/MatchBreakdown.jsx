import { formatMatchScore } from "../../utils/organizationFood.js";

function percent(score) {
  if (score == null || Number.isNaN(Number(score))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(score) * 100)));
}

function Row({ label, score }) {
  const value = formatMatchScore(score);
  return (
    <div className="match-breakdown-row">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <dt>{label}</dt>
        <dd>{value == null ? "—" : `${value}%`}</dd>
      </div>
      <div className="stat-bar-track" aria-hidden="true">
        <div className="stat-bar-fill" style={{ width: `${percent(score)}%` }} />
      </div>
    </div>
  );
}

export function MatchBreakdown({ listing }) {
  const breakdown = listing?.matchBreakdown;
  const total = formatMatchScore(listing?.matchScore);

  if (!breakdown && listing?.matchScore == null) {
    return <p className="muted">Matcher did not return a score for this listing.</p>;
  }

  return (
    <div className="match-breakdown">
      <p>
        Python matcher total: <strong>{total == null ? "—" : `${total}%`}</strong>
        {listing.matchEligible ? " · eligible" : " · not eligible"}
        {listing.matchRejection ? ` (${listing.matchRejection})` : ""}
      </p>
      {breakdown ? (
        <dl className="match-breakdown-list">
          <Row label="Distance" score={breakdown.distance} />
          <Row label="Quantity fit" score={breakdown.quantity} />
          <Row label="Category" score={breakdown.category} />
          <Row label="Urgency" score={breakdown.urgency} />
        </dl>
      ) : null}
    </div>
  );
}
