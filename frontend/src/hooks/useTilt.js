import { useCallback, useRef } from "react";
import { isFinePointer } from "./useReducedMotion.js";

export function useTilt({ maxX = 3, maxY = 5 } = {}) {
  const ref = useRef(null);

  const onPointerMove = useCallback(
    (event) => {
      const node = ref.current;
      if (!node || !isFinePointer()) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const box = node.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      node.style.transform = `perspective(900px) rotateX(${(-py * maxX).toFixed(2)}deg) rotateY(${(px * maxY).toFixed(2)}deg) translateZ(8px)`;
    },
    [maxX, maxY]
  );

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.transform = "";
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
