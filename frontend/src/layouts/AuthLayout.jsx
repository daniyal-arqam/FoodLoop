import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";
import { RouteFade } from "../components/layout/RouteFade.jsx";

export function AuthLayout() {
  return (
    <div className="app-shell auth-shell">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="auth-panel">
        <RouteFade>
          <Outlet />
        </RouteFade>
      </main>
    </div>
  );
}
