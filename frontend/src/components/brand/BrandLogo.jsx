export function BrandLogo({ size = 36, className = "" }) {
  return (
    <span
      className={`brand-logo ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      FL
    </span>
  );
}
