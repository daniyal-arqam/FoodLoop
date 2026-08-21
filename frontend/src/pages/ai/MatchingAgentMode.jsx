import { useRef, useState } from "react";
import { useToast } from "../../hooks/useToast.js";
import { runMatchingAgent } from "../../services/aiService.js";
import { errorMessage } from "../../utils/errors.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Textarea } from "../../components/ui/FormFields.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States.jsx";
import { formatMatchScore, matchScorePercent } from "./aiModes.js";

const STARTER = "Find organizations that could use the available vegetarian meals.";

function ToolCallList({ calls }) {
  if (!calls?.length) {
    return (
      <EmptyState
        title="No tool activity"
        body="The matching agent finished without reporting FoodLoop tool calls."
      />
    );
  }

  return (
    <ol className="ai-activity-list">
      {calls.map((call, index) => (
        <li key={call.id || `${call.name}-${index}`} className="ai-activity-item">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>
              {index + 1}. {call.name}
            </strong>
            <Badge tone={call.ok === false ? "danger" : "success"}>{call.ok === false ? "failed" : "ok"}</Badge>
          </div>
          <p className="muted">
            {call.durationMs != null ? `${call.durationMs} ms` : "duration unknown"}
            {call.error ? ` · ${call.error}` : ""}
          </p>
          {call.arguments && Object.keys(call.arguments).length ? (
            <pre className="ai-code">{JSON.stringify(call.arguments, null, 2)}</pre>
          ) : null}
          {call.listingIds?.length ? <p>Listings: {call.listingIds.join(", ")}</p> : null}
          {call.organizationIds?.length ? <p>Organizations: {call.organizationIds.join(", ")}</p> : null}
          {call.score != null ? <p>Score: {formatMatchScore(call.score)}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function MatchCard({ item }) {
  const percent = matchScorePercent(item.score);
  return (
    <article className="ai-match-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 className="ai-subhead" style={{ margin: 0 }}>
          {item.organizationName}
        </h3>
        <Badge tone={item.eligible === false ? "warning" : "success"}>
          {item.eligible === false ? "ineligible" : "eligible"}
        </Badge>
      </div>
      <div className="stat-bar">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted">Match score</span>
          <strong>{formatMatchScore(item.score)}</strong>
        </div>
        <div className="stat-bar-track" aria-hidden="true">
          <div className="stat-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <dl className="details-list">
        <div>
          <dt>Listing</dt>
          <dd>
            {item.listingName} ({item.listingQuantity} {item.listingUnit})
          </dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{item.distanceKm != null ? `${item.distanceKm} km` : "—"}</dd>
        </div>
        <div>
          <dt>Quantity fit</dt>
          <dd>{item.quantityFit != null ? formatMatchScore(item.quantityFit) : "—"}</dd>
        </div>
        <div>
          <dt>Urgency</dt>
          <dd>{item.urgency != null ? formatMatchScore(item.urgency) : "—"}</dd>
        </div>
      </dl>
      <h4 className="ai-subhead">Explanation</h4>
      <p>{item.why || "No matcher explanation was returned for this pair."}</p>
    </article>
  );
}

export function MatchingAgentMode() {
  const toast = useToast();
  const lastMessage = useRef("");
  const [message, setMessage] = useState(STARTER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  async function run(nextMessage) {
    const trimmed = nextMessage.trim();
    lastMessage.current = trimmed;
    setError("");
    setBusy(true);
    setSubmitted(true);
    try {
      const payload = await runMatchingAgent(trimmed);
      setResult(payload.data || { answer: "", toolCalls: [], recommendations: [] });
      toast.success("Matching agent finished");
    } catch (err) {
      const nextError = errorMessage(err);
      setResult(null);
      setError(nextError);
      toast.error(nextError);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    run(message);
  }

  const toolCalls = result?.toolCalls || [];
  const recommendations = result?.recommendations || [];

  return (
    <div className="ai-matching-layout">
      <div className="stack">
        <Card title="Natural language request">
          <form className="stack" onSubmit={handleSubmit}>
            <Textarea
              id="agentMessage"
              label="Ask the agent to match available food to organizations"
              required
              minLength={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Matching…" : "Run matching agent"}
            </Button>
          </form>
        </Card>
        {result?.answer && !busy && !error ? (
          <Card title="Agent answer">
            <p>{result.answer}</p>
          </Card>
        ) : null}
      </div>

      <div className="stack" aria-busy={busy}>
        {busy ? <LoadingState label="Calling POST /api/ai/agent — waiting for live FoodLoop tool results…" /> : null}
        {!busy && error ? (
          <ErrorState title="Request failed" message={error} onRetry={() => run(lastMessage.current || message)} />
        ) : null}
        {!busy && !error && !submitted ? (
          <EmptyState
            title="No agent activity yet"
            body="Submit a request. Tool calls, listing IDs, scores, and explanations come from FoodLoop APIs — not simulated."
          />
        ) : null}
        {!busy && !error && result ? (
          <>
            <Card title="Agent activity">
              <p className="muted">Live tool calls returned by POST /api/ai/agent.</p>
              <ToolCallList calls={toolCalls} />
            </Card>
            <Card title="Recommended matches">
              {recommendations.length ? (
                <div className="stack">
                  {recommendations.map((item) => (
                    <MatchCard key={`${item.listingId}-${item.organizationId}`} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No grounded matches"
                  body="The agent found no eligible organization match in FoodLoop data for this request."
                />
              )}
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
