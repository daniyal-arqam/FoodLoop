export function BrandLogo({ size = 36, className = "" }) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src="/brand/foodloop-logo.png"
      alt=""
      width={Math.round(size * 1.7)}
      height={size}
      decoding="async"
    />
  );
}
