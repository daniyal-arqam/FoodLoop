import { useId } from "react";

export function BrandLogo({ size = 36, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const fill = `fl-fill-${uid}`;
  const shine = `fl-shine-${uid}`;

  return (
    <svg
      className={`brand-logo ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={fill} x1="8" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="0.55" stopColor="#2f8a58" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <linearGradient id={shine} x1="18" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${fill})`} />
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${shine})`} />
      <path
        className="brand-logo-leaf"
        d="M22 38c0-9.4 7.2-16.6 16.8-12.8 7.2 2.8 6.4 13.2-2.2 16.4-6.4 2.4-12.2-1-14.6-6.2"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        className="brand-logo-orbit"
        d="M38.6 18.4c6.2 2.2 10.4 8.2 9.6 14.8"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M41.2 16.2c3.8.4 6.6 3.2 7.2 6.4-3.4-1-6.6.2-8.8 2.8-1-3.2.2-6.6 1.6-9.2z"
        fill="#fffdf8"
      />
      <ellipse cx="32.4" cy="36.2" rx="5.1" ry="6.4" fill="#fffdf8" />
      <ellipse cx="32.4" cy="36.2" rx="2.2" ry="3.4" fill="var(--accent)" opacity="0.85" />
    </svg>
  );
}
