import { useLocation } from "react-router-dom";

export function RouteFade({ children, className = "" }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className={`route-fade ${className}`.trim()}>
      {children}
    </div>
  );
}
