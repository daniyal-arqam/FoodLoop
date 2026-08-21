import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { USER_ROLES } from "../utils/constants.js";

const NAV_BY_ROLE = {
  [USER_ROLES.PROVIDER]: [
    { to: "/provider/dashboard", label: "Dashboard", end: true },
    { to: "/provider/listings", label: "My Listings", end: true },
    { to: "/provider/listings/new", label: "Create Listing" },
    { to: "/ai", label: "FoodLoop AI" },
  ],
  [USER_ROLES.ORGANIZATION]: [
    { to: "/organization/dashboard", label: "Dashboard", end: true },
    { to: "/organization/food", label: "Available Food", end: true },
    { to: "/organization/claims", label: "Active Claims" },
    { to: "/ai", label: "FoodLoop AI" },
  ],
  [USER_ROLES.ADMIN]: [
    { to: "/admin/dashboard", label: "Dashboard", end: true },
    { to: "/admin/organizations", label: "Organizations" },
    { to: "/admin/listings", label: "Listings" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/statistics", label: "Statistics" },
    { to: "/ai", label: "FoodLoop AI" },
  ],
};

export function DashboardLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = useMemo(() => NAV_BY_ROLE[user?.role] || [], [user]);

  return (
    <div className="app-shell">
      <SkipLink />
      <Navbar showMenu menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
      <div className="sidebar-layout">
        <Sidebar items={items} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <main id="main-content" className="content">
          <div className="page-wide">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
