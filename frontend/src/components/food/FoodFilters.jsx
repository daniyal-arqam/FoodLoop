import { FOOD_CATEGORIES } from "../../utils/constants.js";
import { Input, Select } from "../ui/FormFields.jsx";

export function FoodFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <form className="card filter-bar" onSubmit={(event) => event.preventDefault()}>
      <div className="grid-2">
        <Select
          id="filter-category"
          label="Category"
          value={filters.category}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="">All categories</option>
          {FOOD_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Input
          id="filter-quantity"
          label="Quantity"
          type="number"
          min="0"
          step="1"
          placeholder="Minimum quantity"
          value={filters.minQuantity}
          onChange={(event) => update("minQuantity", event.target.value)}
        />
        <Input
          id="filter-distance"
          label="Distance"
          type="number"
          min="1"
          step="1"
          placeholder="Max km"
          value={filters.maxDistanceKm}
          onChange={(event) => update("maxDistanceKm", event.target.value)}
        />
        <Select
          id="filter-urgency"
          label="Urgency"
          value={filters.urgencyHours}
          onChange={(event) => update("urgencyHours", event.target.value)}
        >
          <option value="">Any expiry</option>
          <option value="24">Expires within 24 hours</option>
          <option value="48">Expires within 48 hours</option>
          <option value="72">Expires within 72 hours</option>
        </Select>
      </div>
    </form>
  );
}
