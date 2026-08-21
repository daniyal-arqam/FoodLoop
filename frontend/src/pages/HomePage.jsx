import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { dashboardPathForRole } from "../utils/roles.js";
import { Card } from "../components/ui/Card.jsx";
import { GoogleSignIn } from "../components/auth/GoogleSignIn.jsx";

function HeroStage() {
  const stageRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 10, y: -16 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTilt({ x: 0, y: 0 });
    }
  }, []);

  function handleMove(event) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return;
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    setTilt({ x: 8 - py * 14, y: -12 + px * 22 });
  }

  function handleLeave() {
    setTilt({ x: 10, y: -16 });
  }

  return (
    <div
      className="hero-stage"
      ref={stageRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      aria-hidden="true"
    >
      <div className="hero-orb hero-orb-a" />
      <div className="hero-orb hero-orb-b" />
      <div
        className="hero-stack"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <article className="hero-float-card hero-float-back">
          <p className="muted">Tonight’s leftover</p>
          <p className="hero-metric">40</p>
          <p className="muted">portions still edible</p>
        </article>
        <article className="hero-float-card hero-float-mid">
          <p className="muted">A kitchen two streets over</p>
          <strong>Needs dinner by 8pm</strong>
          <p className="muted">Verified · ready to collect</p>
        </article>
        <article className="hero-float-card hero-float-front">
          <p className="muted">The loop</p>
          <ol className="hero-steps">
            <li>List what would be wasted.</li>
            <li>Match the nearest trusted org.</li>
            <li>Collect before it expires.</li>
          </ol>
        </article>
      </div>
    </div>
  );
}

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="badge badge-success">Food rescue, in one loop</p>
          <h1 className="display hero-title">The meal that almost went to waste can still reach a table tonight.</h1>
          <p className="lede">
            Kitchens close with trays left over. Nearby community organizations are still looking for food. FoodLoop is
            the quiet coordination layer in between — list surplus, match a trusted claimant, and close the loop before
            the clock runs out.
          </p>
          <div className="row hero-actions">
            {isAuthenticated ? (
              <Link className="btn btn-primary" to={dashboardPathForRole(user.role)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary" to="/register">
                  Start rescuing food
                </Link>
                <Link className="btn btn-ghost" to="/login">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
        <HeroStage />
      </section>

      <section className="story-grid" aria-label="How FoodLoop works">
        <Card title="Tonight’s surplus">
          <p className="muted">
            A cafeteria, restaurant, or household publishes what is still safe to eat — how much, what kind, where to
            pick it up, and when it expires.
          </p>
        </Card>
        <Card title="A trusted neighbor">
          <p className="muted">
            Verified community organizations see nearby listings, a match score, and a clear claim path. No marketplace.
            No payments. Just coordination.
          </p>
        </Card>
        <Card title="The loop closes">
          <p className="muted">
            Status moves from available to reserved to collected. Advisories and matching help sit on the same live
            records, so guidance is about real food still in the system.
          </p>
        </Card>
      </section>

      <section className="story-close">
        <Card>
          <h2 className="display story-close-title">Waste is a logistics problem. Treat it like one.</h2>
          <p className="lede">
            If you cook more than you can serve, list it. If you feed a neighborhood, claim it. FoodLoop keeps both
            sides on the same timeline.
          </p>
          {!isAuthenticated ? (
            <div className="stack">
              <div className="row hero-actions">
                <Link className="btn btn-primary" to="/register">
                  Create an account
                </Link>
                <Link className="btn btn-ghost" to="/login">
                  Continue with email
                </Link>
              </div>
              <GoogleSignIn onSignedIn={(nextUser) => navigate(dashboardPathForRole(nextUser.role), { replace: true })} />
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
