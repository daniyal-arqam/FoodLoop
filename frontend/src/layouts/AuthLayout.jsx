import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";

export function AuthLayout() {
  return (
    <div className="app-shell">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="auth-panel">
        <Outlet />
      </main>
    </div>
  );
}
