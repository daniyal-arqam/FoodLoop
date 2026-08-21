import { useEffect, useRef, useState } from "react";

function parseMetric(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { prefix: "", number: value, suffix: "", decimals: Number.isInteger(value) ? 0 : 1 };
  }
  const text = String(value ?? "");
  const match = text.match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", number: null, suffix: text, decimals: 0 };
  const raw = match[2];
  return {
    prefix: match[1],
    number: Number(raw),
    suffix: match[3],
    decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
  };
}

export function useCountUp(value, { duration = 900 } = {}) {
  const [display, setDisplay] = useState(() => String(value ?? ""));
  const ref = useRef(null);

  useEffect(() => {
    setDisplay(String(value ?? ""));
    const next = parseMetric(value);
    if (next.number == null) return undefined;
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const from = 0;
        const to = next.number;
        const started = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - started) / duration);
          const eased = 1 - (1 - t) ** 3;
          const current = from + (to - from) * eased;
          setDisplay(`${next.prefix}${current.toFixed(next.decimals)}${next.suffix}`);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return { display, ref };
}
