export function Spinner({ label = "Loading" }) {
  return (
    <div className="row" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="center-state card">
      <Spinner label={label} />
    </div>
  );
}

export function ErrorState({ title = "Could not load this page", message, onRetry }) {
  return (
    <div className="center-state card" role="alert">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="center-state card">
      <h2>{title}</h2>
      <p className="muted">{body}</p>
      {action}
    </div>
  );
}
