# FoodLoop presentation (5–7 minutes)

Speaker notes for a live walkthrough. Author: Daniyal Arqam.

1. **Problem (30s)** — Surplus kitchens and hungry community orgs do not share a listing/claim system. SDG 2, 11, 12, 13. No payments.

2. **Solution (30s)** — FoodLoop: Provider lists food, Admin verifies orgs, Organization claims and collects. Status Available → Reserved → Collected.

3. **Live demo (2–3 min)** — Follow `docs/DEMO.md`: login provider, listing, org browse, Python matcher breakdown, claim, collect, advisor, RAG sources, matching agent tool calls.

4. **AI (1 min)** — Advisor `POST /api/ai/recommend`. RAG from `ai-service/knowledge-base/` + FAISS. Agent tools hit live food, org, matcher APIs (`calculate_match_score` included). Not a decorative chatbot.

5. **Architecture (45s)** — React → API Gateway → auth / food / organization → matcher + AI. MongoDB. Diagram: `docs/architecture.svg`.

6. **DevOps (45s)** — `docker-compose.yml`, `infrastructure/kubernetes/`, `infrastructure/terraform/`, `scripts/setup.sh` and `deploy.sh`. Cloud cluster optional per PDF.

7. **Python OOP (20s)** — `FoodMatcher`, `WasteAnalyzer`, `SustainabilityCalculator`.

8. **Future (20s)** — Token revocation, Mongo auth, neural embeddings. See `docs/FYP.md`.
