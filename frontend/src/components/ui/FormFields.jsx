function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <span id={id} className="field-error">
        {error}
      </span>
    );
  }
  if (hint) {
    return <span className="muted">{hint}</span>;
  }
  return null;
}

export function Input({ id, label, hint, error, ...props }) {
  const describedBy = error || hint ? `${id}-message` : undefined;
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input
        id={id}
        className={`input ${error ? "input-invalid" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      <FieldMessage id={describedBy} error={error} hint={hint} />
    </div>
  );
}

export function Select({ id, label, hint, error, children, ...props }) {
  const describedBy = error || hint ? `${id}-message` : undefined;
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select
        id={id}
        className={`select ${error ? "input-invalid" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={describedBy} error={error} hint={hint} />
    </div>
  );
}

export function Textarea({ id, label, hint, error, ...props }) {
  const describedBy = error || hint ? `${id}-message` : undefined;
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <textarea
        id={id}
        className={`textarea ${error ? "input-invalid" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      <FieldMessage id={describedBy} error={error} hint={hint} />
    </div>
  );
}
