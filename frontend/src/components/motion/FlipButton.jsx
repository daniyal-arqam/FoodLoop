import { Link } from "react-router-dom";
import { useMagnetic } from "../../hooks/useMagnetic.js";

export function FlipButton({
  to,
  href,
  children,
  backLabel,
  className = "",
  variant = "primary",
  magnetic = false,
  type = "button",
  onClick,
}) {
  const mag = useMagnetic();
  const variantClass = variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "";
  const classes = `btn ${variantClass} flip-btn ${className}`.trim();
  const inner = (
    <span className="flip-btn-stage">
      <span className="flip-btn-face">{children}</span>
      <span className="flip-btn-face flip-btn-back" aria-hidden="true">
        {backLabel || children}
      </span>
    </span>
  );
  const magnet = magnetic ? { ref: mag.ref, onPointerMove: mag.onPointerMove, onPointerLeave: mag.onPointerLeave } : {};

  if (to) {
    return (
      <Link to={to} className={classes} {...magnet}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...magnet}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={classes} onClick={onClick} {...magnet}>
      {inner}
    </button>
  );
}
