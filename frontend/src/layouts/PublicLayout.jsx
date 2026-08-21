import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";
import { RouteFade } from "../components/layout/RouteFade.jsx";

export function PublicLayout() {
  return (
    <div className="app-shell">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="content">
        <RouteFade>
          <div className="page-wide">
            <Outlet />
          </div>
        </RouteFade>
      </main>
    </div>
  );
}
