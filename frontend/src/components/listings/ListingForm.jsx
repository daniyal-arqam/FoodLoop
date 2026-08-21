import { FOOD_CATEGORIES, FOOD_UNITS } from "../../utils/constants.js";
import { Button } from "../ui/Button.jsx";
import { Input, Select, Textarea } from "../ui/FormFields.jsx";

export function ListingForm({ form, errors, submitting, onChange, onSubmit, onFillDemo }) {
  function update(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <div className="grid-2">
        <Input
          id="foodName"
          label="Food name"
          required
          value={form.foodName}
          error={errors.foodName}
          onChange={(event) => update("foodName", event.target.value)}
        />
        <Select
          id="category"
          label="Category"
          required
          value={form.category}
          error={errors.category}
          onChange={(event) => update("category", event.target.value)}
        >
          {FOOD_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Input
          id="quantity"
          label="Quantity"
          type="number"
          min="0.1"
          step="0.1"
          required
          value={form.quantity}
          error={errors.quantity}
          onChange={(event) => update("quantity", event.target.value)}
        />
        <Select
          id="unit"
          label="Unit"
          required
          value={form.unit}
          error={errors.unit}
          onChange={(event) => update("unit", event.target.value)}
        >
          {FOOD_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </Select>
      </div>
      <Textarea
        id="description"
        label="Description"
        value={form.description}
        error={errors.description}
        onChange={(event) => update("description", event.target.value)}
      />
      <Input
        id="address"
        label="Address"
        required
        value={form.address}
        error={errors.address}
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
          error={errors.latitude}
          onChange={(event) => update("latitude", event.target.value)}
        />
        <Input
          id="longitude"
          label="Longitude"
          type="number"
          step="any"
          required
          value={form.longitude}
          error={errors.longitude}
          onChange={(event) => update("longitude", event.target.value)}
        />
        <Input
          id="availableFrom"
          label="Available From"
          type="datetime-local"
          required
          value={form.availableFrom}
          error={errors.availableFrom}
          onChange={(event) => update("availableFrom", event.target.value)}
        />
        <Input
          id="availableUntil"
          label="Available Until"
          type="datetime-local"
          required
          value={form.availableUntil}
          error={errors.availableUntil}
          onChange={(event) => update("availableUntil", event.target.value)}
        />
        <Input
          id="expiryDate"
          label="Expiry Date"
          type="datetime-local"
          required
          value={form.expiryDate}
          error={errors.expiryDate}
          onChange={(event) => update("expiryDate", event.target.value)}
        />
      </div>
      <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting}>
        {submitting ? "Publishing…" : "Publish listing"}
      </Button>
      {onFillDemo ? (
        <Button type="button" variant="ghost" onClick={onFillDemo} disabled={submitting}>
          Fill demo surplus
        </Button>
      ) : null}
    </form>
  );
}
