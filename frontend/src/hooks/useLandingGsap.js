import { useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";

export function useLandingGsap(rootRef) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return undefined;
    let ctx;
    let killed = false;

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const hero = root.querySelector(".hero-cinematic");

        gsap.from(root.querySelectorAll(".hero-cinematic .reveal-line-inner"), {
          yPercent: 110,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
        });
        if (hero) {
          gsap.from(hero.querySelectorAll(".hero-eyebrow, .hero-support, .hero-actions"), {
            opacity: 0,
            y: 16,
            duration: 0.65,
            stagger: 0.08,
            ease: "power3.out",
            delay: 0.2,
          });
          const product = hero.querySelector(".hero-product");
          if (product) {
            gsap.from(product, { y: 18, duration: 0.9, ease: "power3.out", delay: 0.25 });
            gsap.to(product, {
              y: -20,
              ease: "none",
              scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.8 },
            });
          }
        }

        gsap.utils.toArray(root.querySelectorAll("[data-reveal]")).forEach((node) => {
          gsap.from(node, {
            y: 28,
            duration: 0.7,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: node,
              start: "top 92%",
              once: true,
            },
          });
        });

        const path = root.querySelector(".flow-path-draw");
        if (path?.getTotalLength) {
          const length = path.getTotalLength();
          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = `${length}`;
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.querySelector(".network-section"),
              start: "top 80%",
              end: "center 50%",
              scrub: 0.6,
            },
          });
        }

        const score = root.querySelector("[data-match-count]");
        if (score) {
          const obj = { value: 0 };
          gsap.to(obj, {
            value: 94,
            ease: "none",
            scrollTrigger: {
              trigger: root.querySelector(".matcher-visual"),
              start: "top 75%",
              end: "center 50%",
              scrub: 0.45,
              onUpdate: () => {
                score.textContent = `${Math.round(obj.value)}%`;
              },
            },
          });
        }

        const aiPin = root.querySelector(".ai-pin");
        if (aiPin) {
          ScrollTrigger.create({
            trigger: aiPin,
            start: "top 70%",
            end: "bottom 35%",
            onUpdate: (self) => {
              const mode = Math.min(2, Math.floor(self.progress * 3));
              aiPin.dataset.ai = String(mode);
              aiPin.querySelectorAll("[data-ai-step]").forEach((el) => {
                el.classList.toggle("is-active", Number(el.dataset.aiStep) === mode);
              });
            },
          });
        }

        requestAnimationFrame(() => ScrollTrigger.refresh());
      }, root);
    })();

    return () => {
      killed = true;
      ctx?.revert();
    };
  }, [reduced, rootRef]);
}
