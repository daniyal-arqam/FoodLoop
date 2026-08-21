import { useCountUp } from "../../hooks/useCountUp.js";

export function AnimatedCounter({ value, className = "" }) {
  const { display, ref } = useCountUp(value);
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
