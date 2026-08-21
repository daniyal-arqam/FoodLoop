import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function MatchScore({ percent, label = "Match" }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [shown, setShown] = useState(reduced ? percent : 0);
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const safe = percent == null || Number.isNaN(Number(percent)) ? null : Math.max(0, Math.min(100, Number(percent)));

  useEffect(() => {
    if (safe == null) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    if (reduced) {
      setShown(safe);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(safe);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [safe, reduced]);

  if (safe == null) {
    return <span className="muted">Match —</span>;
  }

  const offset = circ - (shown / 100) * circ;

  return (
    <div className="match-score" ref={ref} aria-label={`${label} ${Math.round(shown)} percent`}>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <circle className="match-score-track" cx="28" cy="28" r={radius} />
        <circle
          className="match-score-ring"
          cx="28"
          cy="28"
          r={radius}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="match-score-value">{Math.round(shown)}%</span>
    </div>
  );
}
