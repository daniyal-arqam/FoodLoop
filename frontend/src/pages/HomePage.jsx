import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { dashboardPathForRole } from "../utils/roles.js";
import { USER_ROLES } from "../utils/constants.js";
import { GoogleSignIn } from "../components/auth/GoogleSignIn.jsx";
import { BrandLogo } from "../components/brand/BrandLogo.jsx";
import { FlipButton } from "../components/motion/FlipButton.jsx";
import { RevealHeading } from "../components/motion/RevealHeading.jsx";
import { useLandingGsap } from "../hooks/useLandingGsap.js";
import { useTilt } from "../hooks/useTilt.js";

const STEPS = [
  { n: "01", title: "Provider lists food", copy: "A kitchen publishes surplus that is still safe, with pickup time and expiry." },
  { n: "02", title: "FoodLoop checks availability", copy: "The listing stays in one shared status: Available, then Reserved, then Collected." },
  { n: "03", title: "Python matcher scores candidates", copy: "Distance, quantity, category, and urgency become a ranked fit." },
  { n: "04", title: "Organization claims food", copy: "One verified group reserves it so the same tray cannot be double-booked." },
  { n: "05", title: "Food gets rescued", copy: "Pickup happens in the window. Surplus becomes a meal." },
];

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  useLandingGsap(rootRef);
  const startTo = isAuthenticated ? dashboardPathForRole(user.role) : "/register";
  const findTo =
    !isAuthenticated
      ? "/login"
      : user.role === USER_ROLES.ORGANIZATION
        ? "/organization/food"
        : dashboardPathForRole(user.role);
  const [workflowStep, setWorkflowStep] = useState(0);

  return (
    <div className="home-page cinematic editorial" ref={rootRef}>
      <section className="hero-cinematic" id="top">
        <p className="hero-eyebrow">Smart food rescue network</p>
        <RevealHeading
          className="hero-display"
          lines={["Rescue food.", "Connect communities.", "Reduce waste."]}
        />
        <p className="hero-support">
          FoodLoop connects surplus food providers with verified community organizations using Python matching, AI
          guidance, and the same live listing until someone collects it.
        </p>
        <div className="row hero-actions">
          {isAuthenticated ? (
            <FlipButton to={startTo} magnetic backLabel="Open dashboard →">
              Continue
            </FlipButton>
          ) : (
            <FlipButton to="/register" magnetic backLabel="Create account →">
              Start rescuing food
            </FlipButton>
          )}
          <a className="btn btn-ghost" href="#how-it-works">
            Explore how it works
          </a>
        </div>
        <HeroComposition />
      </section>

      <section className="impact-strip" id="impact" data-reveal>
        <p className="section-kicker">Impact</p>
        <RevealHeading
          as="h2"
          className="editorial-title"
          lines={["Live counts live in your dashboard.", "This page does not invent them."]}
        />
        <div className="impact-row" data-stagger>
          <article>
            <p className="impact-label">Food rescued</p>
            <p className="muted">Portions from listings marked Collected — admin and provider views.</p>
          </article>
          <article>
            <p className="impact-label">Active listings</p>
            <p className="muted">Available surplus still waiting for a verified claim.</p>
          </article>
          <article>
            <p className="impact-label">Verified organizations</p>
            <p className="muted">Admin verification unlocks claiming. Browse stays open before that.</p>
          </article>
          <article>
            <p className="impact-label">Successful matches</p>
            <p className="muted">Python FoodMatcher ranks eligible orgs; live scores sit on food details.</p>
          </article>
        </div>
      </section>

      <section className="home-section workflow-pin" id="how-it-works" data-step={workflowStep}>
        <div className="workflow-stage editorial-split">
          <div>
            <p className="section-kicker">How it works</p>
            <RevealHeading as="h2" className="editorial-title" lines={["From surplus", "to support."]} />
            <ol className="workflow-steps">
              {STEPS.map((step, index) => (
                <li key={step.n}>
                  <button
                    type="button"
                    className={`workflow-step-btn ${index === workflowStep ? "is-active" : ""}`}
                    aria-pressed={index === workflowStep}
                    onClick={() => setWorkflowStep(index)}
                  >
                    <span className="workflow-index">{step.n}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p className="muted">{step.copy}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="workflow-visual glass-panel" aria-hidden="true">
            <div className="workflow-scene workflow-scene-0">
              <p className="chip">Provider</p>
              <h3>Vegetarian meals</h3>
              <p className="display">50 portions</p>
              <p className="muted">Expires in 8h · list it tonight</p>
            </div>
            <div className="workflow-scene workflow-scene-1">
              <p className="chip">Availability</p>
              <p className="badge badge-success">Available</p>
              <p className="muted">Shared clock. One listing. No chat thread.</p>
            </div>
            <div className="workflow-scene workflow-scene-2">
              <p className="chip">Python Matcher</p>
              <ul className="mini-factors">
                <li>Distance</li>
                <li>Quantity</li>
                <li>Category</li>
                <li>Urgency</li>
              </ul>
            </div>
            <div className="workflow-scene workflow-scene-3">
              <p className="chip">Organization</p>
              <h3>Community kitchen</h3>
              <p className="badge badge-warning">Reserved</p>
            </div>
            <div className="workflow-scene workflow-scene-4">
              <p className="chip">Rescue</p>
              <p className="status-flow">
                Available → Reserved → <strong>Collected</strong>
              </p>
              <p className="display">Food rescued</p>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-band feature-band-reverse matcher-visual" id="matching">
        <div className="feature-copy" data-reveal>
          <p className="section-kicker">Matching</p>
          <RevealHeading as="h2" className="editorial-title" lines={["Matching that", "understands urgency."]} />
          <p className="lede">
            FoodLoop evaluates location, quantity, category, and expiry urgency to rank the most suitable organizations.
            Live scores come from POST /api/matching/score after you sign in.
          </p>
        </div>
        <div className="matcher-stage glass-panel" data-reveal>
          <p className="chip">Food</p>
          <div className="matcher-hub">Python Matcher</div>
          <div className="matcher-factors" data-stagger>
            <span>Distance</span>
            <span>Quantity</span>
            <span>Category</span>
            <span>Urgency</span>
          </div>
          <p className="display matcher-score" data-match-count>
            0%
          </p>
          <p className="muted">Illustrative match · not a live Atlas number</p>
        </div>
      </section>

      <section className="home-section network-section" data-reveal>
        <p className="section-kicker">The loop</p>
        <RevealHeading as="h2" className="editorial-title" lines={["A network,", "not a chat thread."]} />
        <svg className="network-svg" viewBox="0 0 760 280" role="img" aria-label="Provider, listing, and organization connected in a loop">
          <path className="flow-path-draw network-path" d="M90 140 C 220 40, 380 40, 490 140 S 640 240, 670 140" fill="none" stroke="currentColor" strokeWidth="2" />
          <g className="network-node" transform="translate(70 118)">
            <circle r="22" />
            <text y="48" textAnchor="middle">
              Restaurant
            </text>
          </g>
          <g className="network-node" transform="translate(380 70)">
            <circle r="22" />
            <text y="48" textAnchor="middle">
              Vegetarian meals
            </text>
          </g>
          <g className="network-node" transform="translate(650 118)">
            <circle r="22" />
            <text y="48" textAnchor="middle">
              Community kitchen
            </text>
          </g>
        </svg>
      </section>

      <section className="ai-pin" id="ai" data-ai="0">
        <div className="ai-pin-stage">
          <div className="ai-copy-col">
            <p className="section-kicker">AI</p>
            <RevealHeading as="h2" className="editorial-title" lines={["AI that does", "more than chat."]} />
            <article className="ai-copy-block is-active" data-ai-step="0">
              <p className="chip">01 — Generative</p>
              <h3>Waste Reduction Advisor</h3>
              <p className="muted">A real surplus form becomes structured advice via POST /api/ai/recommend — not a fake fridge.</p>
            </article>
            <article className="ai-copy-block" data-ai-step="1">
              <p className="chip">02 — RAG</p>
              <h3>Food Safety Assistant</h3>
              <p className="muted">Answers cite ai-service/knowledge-base after embeddings and vector search.</p>
            </article>
            <article className="ai-copy-block" data-ai-step="2">
              <p className="chip">03 — Agentic</p>
              <h3>Food Matching Agent</h3>
              <p className="muted">Tools call live food, organization, and matcher APIs, then rank a fit.</p>
            </article>
            <FlipButton to={isAuthenticated ? "/ai" : "/login"} backLabel="Open workspace →">
              Ask FoodLoop AI
            </FlipButton>
          </div>
          <div className="ai-visual glass-panel" aria-hidden="true">
            <div className="ai-scene ai-scene-0">
              <p className="muted">Surplus input</p>
              <p className="display">120 meals</p>
              <ul className="advice-list">
                <li>List surplus earlier</li>
                <li>Reduce evening prep</li>
                <li>Track demand patterns</li>
              </ul>
            </div>
            <div className="ai-scene ai-scene-1">
              <ol className="pipeline pipeline-stack">
                <li>Documents</li>
                <li>Embeddings</li>
                <li>Vector search</li>
                <li>Context</li>
                <li>Grounded answer</li>
              </ol>
            </div>
            <div className="ai-scene ai-scene-2">
              <p className="muted">Find organizations that need vegetarian meals.</p>
              <ol className="agent-tools">
                <li className="agent-tool-step">find_available_food()</li>
                <li className="agent-tool-step">find_organizations()</li>
                <li className="agent-tool-step">calculate_match_score()</li>
              </ol>
              <p>Community kitchen · example 94% match</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section sdg-section" id="about" data-reveal>
        <p className="section-kicker">Sustainability</p>
        <RevealHeading as="h2" className="editorial-title" lines={["One loop.", "Four global goals."]} />
        <div className="sdg-list" data-stagger>
          <p>
            <span>02</span> Zero Hunger
          </p>
          <p>
            <span>11</span> Sustainable communities
          </p>
          <p>
            <span>12</span> Responsible consumption
          </p>
          <p>
            <span>13</span> Climate action
          </p>
        </div>
      </section>

      <section className="final-cta" data-reveal>
        <div className="final-cta-ring" data-parallax="40" aria-hidden="true" />
        <RevealHeading as="h2" className="hero-display" lines={["Turn surplus", "into impact."]} />
        <p className="hero-support">Join a smarter network for food redistribution. No payments. Verified claims only.</p>
        <div className="row hero-actions">
          <FlipButton to={isAuthenticated ? startTo : "/register"} magnetic backLabel="List surplus →">
            Donate food
          </FlipButton>
          <FlipButton to={findTo} variant="ghost" backLabel="Explore listings →">
            Find food
          </FlipButton>
        </div>
        {!isAuthenticated ? (
          <div className="final-google">
            <GoogleSignIn onSignedIn={(nextUser) => navigate(dashboardPathForRole(nextUser.role), { replace: true })} />
          </div>
        ) : null}
      </section>

      <footer className="site-footer">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Link to="/" className="brand" aria-label="FoodLoop home">
            <BrandLogo size={32} />
            <span className="brand-text">FoodLoop</span>
          </Link>
          <p className="muted">Rescue food. Strengthen communities.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#how-it-works">Platform</a>
          <a href="#ai">AI</a>
          <a href="#impact">Impact</a>
          <a href="https://github.com/daniyal-arqam/FoodLoop" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </footer>
    </div>
  );
}

function HeroComposition() {
  const tilt = useTilt({ maxX: 3, maxY: 4 });
  return (
    <div className="hero-canvas">
      <div
        className="hero-product"
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
      >
        <article className="ui-card ui-card-main">
          <p className="chip">Listing</p>
          <h3>Vegetarian meals</h3>
          <p className="display">50 portions</p>
          <p className="muted">Expires in 8h</p>
        </article>
        <p className="match-label">Match</p>
        <article className="ui-card ui-card-org">
          <p className="chip">Organization</p>
          <h3>Community kitchen</h3>
          <p className="display">94%</p>
          <p className="muted">Example match score</p>
        </article>
        <span className="sat-card sat-a">3.2 km away</span>
        <span className="sat-card sat-b">Urgency: High</span>
        <span className="sat-card sat-c">Verified organization</span>
        <span className="sat-card sat-d">Python Matcher</span>
      </div>
    </div>
  );
}
