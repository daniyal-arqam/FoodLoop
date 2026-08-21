import { useCallback, useRef } from "react";
import { isFinePointer } from "./useReducedMotion.js";

export function useMagnetic({ radius = 80, strength = 0.14, max = 7 } = {}) {
  const ref = useRef(null);

  const onPointerMove = useCallback(
    (event) => {
      const node = ref.current;
      if (!node || !isFinePointer()) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const box = node.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        node.style.transform = "";
        return;
      }
      const tx = Math.max(-max, Math.min(max, dx * strength));
      const ty = Math.max(-max, Math.min(max, dy * strength));
      node.style.transform = `translate(${tx}px, ${ty}px)`;
    },
    [radius, strength, max]
  );

  const onPointerLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
