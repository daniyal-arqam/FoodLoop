import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar.jsx";
import { SkipLink } from "../components/layout/SkipLink.jsx";
import { RouteFade } from "../components/layout/RouteFade.jsx";
import { GlowBackground } from "../components/motion/GlowBackground.jsx";
import { ScrollProgress } from "../components/motion/ScrollProgress.jsx";
import { CursorGlow } from "../components/motion/CursorGlow.jsx";

export function PublicLayout() {
  return (
    <div className="app-shell marketing-shell">
      <GlowBackground />
      <ScrollProgress />
      <CursorGlow />
      <SkipLink />
      <Navbar />
      <main id="main-content" className="content">
        <RouteFade>
          <div className="page-cinematic">
            <Outlet />
          </div>
        </RouteFade>
      </main>
    </div>
  );
}
