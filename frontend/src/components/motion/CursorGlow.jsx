import { useEffect, useState } from "react";
import { isFinePointer, useReducedMotion } from "../../hooks/useReducedMotion.js";

export function CursorGlow() {
  const reduced = useReducedMotion();
  const [pos, setPos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    if (reduced || !isFinePointer()) return undefined;
    const move = (event) => setPos({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduced]);

  if (reduced || (typeof window !== "undefined" && !isFinePointer())) return null;

  return (
    <div
      className="cursor-glow"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      aria-hidden="true"
    />
  );
}
