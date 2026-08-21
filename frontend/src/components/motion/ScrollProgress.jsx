import { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function ScrollProgress() {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(max <= 0 ? 0 : Math.min(100, (window.scrollY / max) * 100));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (reduced) return null;

  return <div className="scroll-progress" style={{ transform: `scaleX(${width / 100})` }} aria-hidden="true" />;
}
