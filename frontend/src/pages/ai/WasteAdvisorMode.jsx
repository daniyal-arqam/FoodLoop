import { useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { recommendWasteReduction } from "../../services/aiService.js";
import { errorMessage } from "../../utils/errors.js";
import { FOOD_CATEGORIES } from "../../utils/constants.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input, Select, Textarea } from "../../components/ui/FormFields.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States.jsx";

const EXAMPLE = {
  surplusQuantity: "120",
  foodCategory: "Prepared Meals",
  timePattern: "7 PM - 9 PM",
  frequency: "weekly",
  unit: "servings",
  notes: "",
};

function AdviceList({ items }) {
  if (!items?.length) return <p className="muted">None provided.</p>;
  return (
    <ul className="advice-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function WasteAdvisorMode() {
  const { user } = useAuth();
  const toast = useToast();
  const lastPayload = useRef(null);
  const [form, setForm] = useState(EXAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [advice, setAdvice] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestAdvice(payload) {
    lastPayload.current = payload;
    setError("");
    setBusy(true);
    setSubmitted(true);
    try {
      const response = await recommendWasteReduction(payload);
      setAdvice(response.data?.advice || null);
      toast.success("Advice generated");
    } catch (err) {
      const message = errorMessage(err);
      setAdvice(null);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    requestAdvice({
      surplusQuantity: Number(form.surplusQuantity),
      foodCategory: form.foodCategory,
      timePattern: form.timePattern,
      frequency: form.frequency,
      unit: form.unit || undefined,
      providerName: user?.name,
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="ai-mode-layout">
      <Card title="Surplus information">
        <form className="stack" onSubmit={handleSubmit}>
          <div className="grid-2">
            <Input
              id="surplusQuantity"
              label="Surplus quantity"
              type="number"
              min="0.01"
              step="any"
              required
              value={form.surplusQuantity}
              onChange={(event) => update("surplusQuantity", event.target.value)}
            />
            <Input
              id="unit"
              label="Unit"
              value={form.unit}
              onChange={(event) => update("unit", event.target.value)}
            />
            <div className="field">
              <label htmlFor="foodCategory">Food category</label>
              <input
                id="foodCategory"
                className="input"
                list="food-category-options"
                required
                minLength={2}
                value={form.foodCategory}
                onChange={(event) => update("foodCategory", event.target.value)}
              />
              <datalist id="food-category-options">
                <option value="Prepared Meals" />
                {FOOD_CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <Input
              id="timePattern"
              label="Time pattern"
              required
              minLength={2}
              value={form.timePattern}
              onChange={(event) => update("timePattern", event.target.value)}
            />
            <Select
              id="frequency"
              label="Frequency"
              value={form.frequency}
              onChange={(event) => update("frequency", event.target.value)}
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="weekends">weekends</option>
              <option value="occasional">occasional</option>
            </Select>
          </div>
          <Textarea
            id="notes"
            label="Notes (optional)"
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Generating…" : "Get recommendations"}
          </Button>
        </form>
      </Card>

      <div aria-busy={busy}>
        {busy ? <LoadingState label="Calling POST /api/ai/recommend…" /> : null}
        {!busy && error ? <ErrorState title="Request failed" message={error} onRetry={() => requestAdvice(lastPayload.current)} /> : null}
        {!busy && !error && !advice && !submitted ? (
          <EmptyState
            title="No recommendations yet"
            body="Submit surplus quantity, category, and timing to request structured advice from the AI service."
          />
        ) : null}
        {!busy && !error && submitted && !advice ? (
          <EmptyState
            title="No advice returned"
            body="The advisor completed without structured recommendations. Adjust the surplus details and submit again."
          />
        ) : null}
        {!busy && !error && advice ? (
          <div className="stack">
            <Card title="Situation summary">
              <p>{advice.situationSummary}</p>
            </Card>
            <Card title="Immediate actions">
              <AdviceList items={advice.immediateActions} />
            </Card>
            <Card title="Operational improvements">
              <AdviceList items={advice.operationalImprovements} />
            </Card>
            <Card title="Redistribution suggestions">
              <AdviceList items={advice.redistributionSuggestions} />
            </Card>
            <Card title="Long-term recommendations">
              <AdviceList items={advice.longTermRecommendations} />
            </Card>
            {advice.caveats?.length ? (
              <Card title="Recommendations vs facts">
                <AdviceList items={advice.caveats} />
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
