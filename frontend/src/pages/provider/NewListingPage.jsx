import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publishListing } from "../../services/foodService.js";
import { emptyListingForm, toCreateListingPayload, validateListingForm, demoListingForm } from "../../utils/listingForm.js";
import { errorMessage } from "../../utils/errors.js";
import { useToast } from "../../hooks/useToast.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ListingForm } from "../../components/listings/ListingForm.jsx";
import { ListingCreatedBanner } from "../../components/listings/ListingCreatedBanner.jsx";

export function NewListingPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyListingForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [createdListing, setCreatedListing] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateListingForm(form);
    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length) {
      return;
    }

    setSubmitting(true);
    try {
      const listing = await publishListing(toCreateListingPayload(form));
      setCreatedListing(listing);
      toast.success("Listing published");
      navigate("/provider/listings", { replace: false, state: { createdListing: listing } });
    } catch (error) {
      setApiError(errorMessage(error));
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Create Listing"
        description="Share surplus food. The food service stores the listing as Available."
      />
      {createdListing ? <ListingCreatedBanner listing={createdListing} /> : null}
      {apiError ? (
        <p className="error" role="alert">
          {apiError}
        </p>
      ) : null}
      <Card>
        <ListingForm
          form={form}
          errors={errors}
          submitting={submitting}
          onChange={setForm}
          onSubmit={handleSubmit}
          onFillDemo={() => {
            setForm(demoListingForm());
            setErrors({});
            setApiError("");
          }}
        />
      </Card>
      <div className="row">
        <Link className="btn btn-ghost" to="/provider/listings">
          Back to My Listings
        </Link>
        {createdListing ? (
          <Button variant="primary" onClick={() => navigate(`/provider/listings/${createdListing.id}`)}>
            View details
          </Button>
        ) : null}
      </div>
    </div>
  );
}
