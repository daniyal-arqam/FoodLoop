import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { ThemeToggle } from "../ui/ThemeToggle.jsx";
import { Button } from "../ui/Button.jsx";
import { FlipButton } from "../motion/FlipButton.jsx";
import { dashboardPathForRole } from "../../utils/roles.js";
import { BrandLogo } from "../brand/BrandLogo.jsx";

export function Navbar({ onMenuToggle, showMenu = false, menuOpen = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboard = user ? dashboardPathForRole(user.role) : "/login";
  const [scrolled, setScrolled] = useState(false);
  const marketing = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className={`navbar ${scrolled ? "is-scrolled" : ""} ${marketing ? "navbar-marketing" : ""}`}>
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
          <BrandLogo size={40} />
          <span className="brand-text">FoodLoop</span>
        </NavLink>
      </div>
      <nav className="nav-links" aria-label="Primary">
        {marketing ? (
          <>
            <a className="nav-link" href="#how-it-works">
              How it works
            </a>
            <a className="nav-link" href="#matching">
              Matching
            </a>
            <a className="nav-link" href="#ai">
              AI
            </a>
            <a className="nav-link" href="#impact">
              Impact
            </a>
          </>
        ) : (
          <NavLink to="/" className="nav-link" end>
            Home
          </NavLink>
        )}
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
          <NavLink to="/login" className="nav-link">
            Sign in
          </NavLink>
        )}
      </nav>
      <div className="nav-actions">
        {user ? <span className="muted nav-user-name">{user.name}</span> : null}
        <ThemeToggle />
        {isAuthenticated ? (
          <Button onClick={handleLogout}>Log out</Button>
        ) : (
          <FlipButton to="/register" backLabel="Join →">
            Get started
          </FlipButton>
        )}
      </div>
    </header>
  );
}
