import { useState } from "react";
import { useToast } from "../../hooks/useToast.js";
import { claimListing } from "../../services/foodService.js";
import { claimErrorMessage } from "../../utils/claimErrors.js";
import { Button } from "../ui/Button.jsx";

export function ClaimButton({ listing, verified, onSuccess, compact = false }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const unavailable = listing.status && listing.status !== "Available";
  const expired = listing.status === "Expired";
  const reserved = listing.status === "Reserved";

  async function handleClaim() {
    setError("");
    if (!verified) {
      const message = "Only verified organizations can claim food.";
      setError(message);
      toast.error(message);
      return;
    }
    if (expired) {
      const message = "This listing has expired and cannot be claimed.";
      setError(message);
      toast.error(message);
      return;
    }
    if (reserved) {
      const message = "This listing is already reserved.";
      setError(message);
      toast.error(message);
      return;
    }

    setBusy(true);
    try {
      const result = await claimListing(listing.id);
      setSuccess(true);
      toast.success("Food claimed successfully.");
      onSuccess?.(result);
    } catch (err) {
      const message = claimErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <Button
        variant="primary"
        onClick={handleClaim}
        disabled={busy || success || unavailable || !verified}
      >
        {busy ? "Claiming…" : success ? "Claimed" : "Claim"}
      </Button>
      {!verified && !compact ? (
        <p className="muted">Your organization must be verified before you can claim food.</p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="banner-success" role="status">
          Claim recorded. The listing is now Reserved.
        </p>
      ) : null}
    </div>
  );
}
