import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";

export function PublicLayout() {
  return (
    <div className="app-shell">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="content page-enter">
        <div className="page-wide">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
