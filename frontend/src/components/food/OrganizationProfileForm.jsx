import { useState } from "react";
import { FOOD_CATEGORIES } from "../../utils/constants.js";
import { errorMessage } from "../../utils/errors.js";
import { useToast } from "../../hooks/useToast.js";
import { createOrganization, updateOrganizationProfile } from "../../services/organizationService.js";
import { Card } from "../ui/Card.jsx";
import { Input, Select, Textarea } from "../ui/FormFields.jsx";
import { Button } from "../ui/Button.jsx";

export function OrganizationProfileForm({ user, onSaved }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    organizationName: user?.name || "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    foodCategoriesNeeded: FOOD_CATEGORIES[0],
    requiredQuantity: 20,
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const payload = {
      organizationName: form.organizationName,
      description: form.description,
      address: form.address,
      location: { latitude: Number(form.latitude), longitude: Number(form.longitude) },
      foodCategoriesNeeded: [form.foodCategoriesNeeded],
      requiredQuantity: Number(form.requiredQuantity),
    };
    try {
      const created = await createOrganization(payload);
      toast.success("Organization profile submitted for verification");
      onSaved?.(created.data?.organization);
    } catch (err) {
      if (err.status === 409) {
        try {
          const updated = await updateOrganizationProfile(payload);
          toast.success("Organization profile updated");
          onSaved?.(updated.data?.organization);
        } catch (updateError) {
          toast.error(errorMessage(updateError));
        }
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Organization profile">
      <form className="stack" onSubmit={handleSubmit}>
        <div className="grid-2">
          <Input
            id="organizationName"
            label="Organization name"
            required
            minLength={2}
            value={form.organizationName}
            onChange={(event) => update("organizationName", event.target.value)}
          />
          <Input
            id="requiredQuantity"
            label="Typical quantity needed"
            type="number"
            min="0"
            value={form.requiredQuantity}
            onChange={(event) => update("requiredQuantity", event.target.value)}
          />
        </div>
        <Textarea
          id="description"
          label="Description"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
        <Input
          id="address"
          label="Address"
          required
          minLength={3}
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
        />
        <div className="grid-2">
          <Input
            id="latitude"
            label="Latitude"
            type="number"
            step="any"
            required
            value={form.latitude}
            onChange={(event) => update("latitude", event.target.value)}
          />
          <Input
            id="longitude"
            label="Longitude"
            type="number"
            step="any"
            required
            value={form.longitude}
            onChange={(event) => update("longitude", event.target.value)}
          />
          <Select
            id="foodCategoriesNeeded"
            label="Primary category needed"
            value={form.foodCategoriesNeeded}
            onChange={(event) => update("foodCategoriesNeeded", event.target.value)}
          >
            {FOOD_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
