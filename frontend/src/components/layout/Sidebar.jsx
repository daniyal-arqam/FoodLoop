import { NavLink } from "react-router-dom";

export function Sidebar({ items, open, onNavigate }) {
  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "open" : ""}`} aria-label="Section">
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="sidebar-link"
            end={item.end}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
