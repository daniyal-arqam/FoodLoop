import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { dashboardPathForRole } from "../utils/roles.js";
import { Card } from "../components/ui/Card.jsx";
import { GoogleSignIn } from "../components/auth/GoogleSignIn.jsx";
import { BrandLogo } from "../components/brand/BrandLogo.jsx";

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
          <div className="hero-brand">
            <BrandLogo size={56} />
            <div>
              <p className="badge badge-success">Food rescue, in one loop</p>
              <p className="hero-wordmark">FoodLoop</p>
            </div>
          </div>
          <h1 className="display hero-title">That leftover tray can still feed someone tonight.</h1>
          <p className="lede">
            Kitchens close with food still good to eat. Nearby community kitchens are still looking for dinner. FoodLoop
            is the quiet middle: list what you have, match a trusted neighbor, and get it picked up before it expires.
          </p>
          <div className="row hero-actions">
            {isAuthenticated ? (
              <Link className="btn btn-primary" to={dashboardPathForRole(user.role)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary" to="/register">
                  Join the loop
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

      <section className="story-define" aria-labelledby="what-foodloop-is">
        <Card>
          <h2 id="what-foodloop-is" className="display story-close-title">
            What this is, in plain words
          </h2>
          <p className="lede">
            Not a shop. Not a delivery app. You post leftover food that is still safe. A verified community group claims
            it, comes to pick it up, and serves it. Both of you watch the same listing move from available, to reserved,
            to collected.
          </p>
        </Card>
      </section>

      <section className="story-grid-2" aria-label="Who FoodLoop is for">
        <Card title="If you cooked more than you served">
          <p className="muted">
            Café, canteen, bakery, or home kitchen — tell us how much is left, what it is, when someone can collect it,
            and when it expires. You are a Provider. You keep good food out of the bin.
          </p>
        </Card>
        <Card title="If you feed people nearby">
          <p className="muted">
            Shelter, community kitchen, or similar group — register as an Organization. After we verify you, you can
            claim food close to you, see why it fits, and pick it up in time.
          </p>
        </Card>
      </section>

      <section aria-labelledby="how-a-night-works">
        <h2 id="how-a-night-works" className="home-section-title">
          A normal night
        </h2>
        <div className="story-grid-2">
          <Card title="1. List it">
            <p className="muted">Put up what’s still good, with a pickup time you can actually keep.</p>
          </Card>
          <Card title="2. We match">
            <p className="muted">Nearby verified groups see a score — how close they are, what they need, how soon it expires.</p>
          </Card>
          <Card title="3. Someone claims">
            <p className="muted">One group reserves it. Nobody else can grab the same tray at the same time.</p>
          </Card>
          <Card title="4. They collect">
            <p className="muted">Pickup happens in the window. The listing closes. The loop is done for the night.</p>
          </Card>
        </div>
      </section>

      <section className="story-grid-2" aria-label="Guidance and limits">
        <Card title="A little help, on real food">
          <p className="muted">
            Safety and waste tips talk about the listings actually on the platform — not a made-up fridge.
          </p>
        </Card>
        <Card title="What this isn’t">
          <p className="muted">
            Not groceries. Not paid delivery. Not “anyone can take it.” Only verified organizations can claim.
          </p>
        </Card>
      </section>

      <section className="story-close">
        <Card>
          <h2 className="display story-close-title">If it’s still good, it still belongs on a plate.</h2>
          <p className="lede">
            Got extra? List it. Feeding people? Claim it. We’ll keep you on the same clock until someone collects it.
          </p>
          {!isAuthenticated ? (
            <div className="stack">
              <div className="row hero-actions">
                <Link className="btn btn-primary" to="/register">
                  Create an account
                </Link>
                <Link className="btn btn-ghost" to="/login">
                  I already have one
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
