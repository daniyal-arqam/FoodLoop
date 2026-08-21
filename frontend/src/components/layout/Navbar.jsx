import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { ThemeToggle } from "../ui/ThemeToggle.jsx";
import { Button } from "../ui/Button.jsx";
import { dashboardPathForRole } from "../../utils/roles.js";

export function Navbar({ onMenuToggle, showMenu = false, menuOpen = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const dashboard = user ? dashboardPathForRole(user.role) : "/login";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="navbar">
      <div className="row">
        {showMenu ? (
          <Button
            className="menu-toggle btn-icon"
            onClick={onMenuToggle}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
          >
            ☰
          </Button>
        ) : null}
        <NavLink to="/" className="brand" aria-label="FoodLoop home">
          <span className="brand-mark" aria-hidden="true">↻</span>
          <span className="brand-text">FoodLoop</span>
        </NavLink>
      </div>
      <nav className="nav-links" aria-label="Primary">
        <NavLink to="/" className="nav-link" end>
          Home
        </NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to={dashboard} className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/ai" className="nav-link">
              FoodLoop AI
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
            <NavLink to="/register" className="nav-link">
              Register
            </NavLink>
          </>
        )}
      </nav>
      <div className="nav-actions">
        {user ? <span className="muted nav-user-name">{user.name}</span> : null}
        <ThemeToggle />
        {isAuthenticated ? (
          <Button onClick={handleLogout}>Log out</Button>
        ) : (
          <NavLink to="/login" className="btn btn-primary">
            Sign in
          </NavLink>
        )}
      </div>
    </header>
  );
}
