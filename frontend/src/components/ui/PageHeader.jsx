export function PageHeader({ title, description, actions }) {
  return (
    <header className="row" style={{ justifyContent: "space-between", marginBottom: "1.25rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>{title}</h1>
        {description ? <p className="muted" style={{ margin: 0 }}>{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}
