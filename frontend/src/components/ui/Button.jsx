export function Button({
  children,
  variant = "ghost",
  type = "button",
  className = "",
  ...props
}) {
  const variantClass = variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-ghost";
  return (
    <button type={type} className={`btn ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
