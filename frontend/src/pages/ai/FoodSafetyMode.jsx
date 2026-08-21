import { useRef, useState } from "react";
import { useToast } from "../../hooks/useToast.js";
import { queryKnowledgeBase } from "../../services/aiService.js";
import { errorMessage } from "../../utils/errors.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Textarea } from "../../components/ui/FormFields.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States.jsx";

const STARTER = "What should we consider before redistributing prepared food?";

export function FoodSafetyMode() {
  const toast = useToast();
  const lastQuestion = useRef("");
  const [question, setQuestion] = useState(STARTER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [thread, setThread] = useState([]);

  async function ask(nextQuestion) {
    const trimmed = nextQuestion.trim();
    lastQuestion.current = trimmed;
    setError("");
    setBusy(true);
    try {
      const payload = await queryKnowledgeBase(trimmed);
      const data = payload.data || {};
      setThread((current) => [
        ...current,
        {
          question: trimmed,
          answer: data.answer || "",
          sources: data.sources || [],
        },
      ]);
      toast.success("Grounded answer ready");
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    ask(question);
  }

  return (
    <div className="ai-mode-layout">
      <Card title="Ask the knowledge base">
        <form className="stack" onSubmit={handleSubmit}>
          <Textarea
            id="ragQuestion"
            label="Question about safety, storage, donation, or redistribution"
            required
            minLength={5}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <div className="row">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Searching…" : "Ask food safety"}
            </Button>
          </div>
        </form>
      </Card>

      <div aria-busy={busy}>
        {busy ? <LoadingState label="Calling POST /api/ai/rag/query…" /> : null}
        {!busy && error ? (
          <ErrorState title="Request failed" message={error} onRetry={() => ask(lastQuestion.current || question)} />
        ) : null}
        {!busy && !error && thread.length === 0 ? (
          <EmptyState
            title="No grounded answers yet"
            body="Ask a question. The assistant answers only from retrieved FoodLoop knowledge-base chunks and lists those sources."
          />
        ) : null}
        {!busy && thread.length ? (
          <Card title="Conversation">
            <ol className="ai-chat-thread">
              {thread.map((turn, index) => (
                <li key={`${turn.question}-${index}`} className="ai-chat-turn">
                  <article className="ai-chat-bubble ai-chat-user">
                    <p className="muted">You</p>
                    <p>{turn.question}</p>
                  </article>
                  <article className="ai-chat-bubble ai-chat-assistant">
                    <p className="muted">Food Safety Assistant</p>
                    <p>{turn.answer}</p>
                    {turn.sources?.length ? (
                      <div>
                        <h3 className="ai-subhead">Sources</h3>
                        <ul className="advice-list">
                          {turn.sources.map((source) => (
                            <li key={source.chunkId || `${source.path}-${source.chunkIndex}`}>
                              {source.title} ({source.path}
                              {source.topic ? ` · ${source.topic}` : ""})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="muted">No source citations — the knowledge base did not cover this question.</p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
