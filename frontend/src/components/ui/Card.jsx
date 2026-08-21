export function Card({ title, actions, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
          {title ? <h2 className="card-title">{title}</h2> : <span />}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <article className="card stat-card">
      <p className="muted">{label}</p>
      <p className="value">{value}</p>
      {hint ? <p className="muted">{hint}</p> : null}
    </article>
  );
}
