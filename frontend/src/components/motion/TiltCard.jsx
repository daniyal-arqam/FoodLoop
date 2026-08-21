import { useTilt } from "../../hooks/useTilt.js";

export function TiltCard({ as: Tag = "div", className = "", children, ...props }) {
  const tilt = useTilt();
  return (
    <Tag
      className={`tilt-card ${className}`.trim()}
      {...props}
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <div className="tilt-card-shine" aria-hidden="true" />
      {children}
    </Tag>
  );
}
