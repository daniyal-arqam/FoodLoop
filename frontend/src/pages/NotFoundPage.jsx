import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="center-state">
      <h1>Page not found</h1>
      <p className="muted">That route is not part of FoodLoop.</p>
      <Link className="btn btn-primary" to="/">
        Back home
      </Link>
    </div>
  );
}
