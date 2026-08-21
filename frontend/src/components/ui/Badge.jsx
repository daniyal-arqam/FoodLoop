export function Badge({ children, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "badge-success"
      : tone === "warning"
        ? "badge-warning"
        : tone === "danger"
          ? "badge-danger"
          : tone === "info"
            ? "badge-info"
            : "";
  return <span className={`badge ${toneClass}`}>{children}</span>;
}

export function statusTone(status) {
  if (status === "Available" || status === "verified") return "success";
  if (status === "Reserved" || status === "pending") return "warning";
  if (status === "Expired" || status === "Cancelled") return "danger";
  if (status === "Collected") return "info";
  return "neutral";
}
