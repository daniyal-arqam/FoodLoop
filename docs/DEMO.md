# Hackathon demo runbook

Repeatable end-to-end demo for LoopLearn Hackathon 2026 (PS-04). Every food, matcher, and AI step uses live backend data — not a mocked chatbot.

## Start the stack

From the repository root (Git Bash on Windows):

```bash
cp .env.example .env   # once
./scripts/setup.sh     # once
./scripts/dev.sh
```

Leave that process running. `./scripts/dev.sh` starts Docker Mongo when Docker is available; otherwise it starts an in-memory MongoDB on port 27017 so auth, food, and organizations still work without Docker Desktop.

In a second terminal:

```bash
./scripts/seed-demo.sh
```

Open **http://localhost:5173**.

`OPENAI_API_KEY` is optional. With a key, the advisor, RAG answer, and agent planner use the configured model. Without a key, the same `/api/ai/*` endpoints still run: the advisor is structured from the surplus form, RAG is extractive from the knowledge base, and the matching agent still calls food, organization, and matcher APIs.

## Accounts (after seed)

| Role | Email | Password |
|------|--------|----------|
| Provider | ayesha.provider@example.com | Password1 |
| Organization | kitchen.org@example.com | Password1 |
| Admin | admin@foodloop.org | AdminPass1 |

The login page has shortcuts that fill these. Seed also verifies **Karachi Food Bank** and **Clifton Community Kitchen**, and publishes two **Available** listings: **Vegetarian meal** (claim and collect) and **Vegetarian meal trays** (left Available for the matching agent after collection).

Re-run `./scripts/seed-demo.sh` to reset those listings and start clean.

## Demo flow (24 steps)

1. **Login as Provider** — Sign in as `ayesha.provider@example.com`.
2. **Create surplus food listing** — My Listings → Create Listing → **Fill demo surplus** → Publish listing.
3. **Show listing as Available** — The listings table and details page show status **Available**.
4. **Login as Organization** — Sign out, then sign in as `kitchen.org@example.com`.
5. **Browse/search food** — Available Food. Filter category **Prepared** if needed.
6. **Show Python Matcher recommendation** — Organization Dashboard **Recommended Matches**, or open the listing.
7. **Show match score breakdown** — Food details → **Python matcher score** (distance, quantity, category, urgency from `POST /api/matching/score`).
8. **Claim listing** — Claim on the details page.
9. **Show status changes to Reserved** — Badge updates to **Reserved**; Active Claims lists it.
10. **Complete collection** — Active Claims → **Mark collected**.
11. **Show Collected status** — Success toast and listing status **Collected**. Sign back in as provider to show it on My Listings.
12. **Open Waste Reduction Advisor** — FoodLoop AI (sidebar) → Waste Advisor.
13. **Generate real recommendation** — Submit the pre-filled surplus form. Response is `POST /api/ai/recommend` (situation, immediate actions, redistribution, caveats).
14. **Open Food Safety RAG** — Food Safety tab.
15. **Ask a food safety question** — Keep the starter question: *What should we consider before redistributing prepared food?*
16. **Show grounded answer and sources** — Answer plus knowledge-base paths (for example `prepared-food-redistribution.md`).
17. **Open Matching Agent** — Matching Agent tab.
18. **Ask it to find suitable organizations** — Keep: *Find organizations that could use the available vegetarian meals.* Seed already left **Vegetarian meal trays** Available after you collected the first listing.
19. **Show real tool calls** — Agent activity lists `find_available_food`, `find_organizations`, `calculate_match_score`, and `generate_match_recommendation` with listing/org IDs.
20. **Show recommendation** — Ranked org, score, distance, quantity fit, urgency, and matcher explanation.
21. **Open Docker setup** — `docker-compose.yml` at the repo root. If Docker is installed: `docker compose ps`.
22. **Show containers/services** — Compose services: mongodb, auth, food, organization, matcher, ai, gateway, frontend.
23. **Show Kubernetes manifests** — `infrastructure/kubernetes/` (`kubectl get -f` only if a cluster exists). See `infrastructure/kubernetes/README.md`.
24. **Show Terraform configuration** — `infrastructure/terraform/` (`terraform validate` does not need a live cloud account). See `infrastructure/terraform/README.md`.

## If a step is empty

- No listing: run `./scripts/seed-demo.sh` or publish with **Fill demo surplus**.
- Claim blocked: org must be verified (seed does this; otherwise Admin → Organizations → Verify).
- RAG 503: ingest the knowledge base: `ai-service/.venv/Scripts/python.exe ai-service/scripts/ingest.py` (or `./scripts/setup.sh`).
- Agent has no matches: there must be an **Available** Prepared listing and a verified org that needs Prepared. Re-run seed, or Create Listing → **Fill demo surplus**.

## Automated check

`./scripts/test.sh` includes `tests/e2e/hackathon-demo.test.js`, which seeds the same accounts (plus the leftover Available listing) and walks listing → matcher breakdown → claim → collect → advisor → RAG → matching agent against a clean in-memory stack.
