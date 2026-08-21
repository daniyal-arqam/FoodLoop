# FoodLoop — problem, users, and future work

LoopLearn Hackathon 2026 · PS-04 Smart Food Rescue (SDG 2, 11, 12, 13).  
Author: Daniyal Arqam

## Problem

Restaurants, cafeterias, and households generate edible surplus while nearby community kitchens need food the same day. There is no shared coordination layer: listings, verified claimants, expiry, and match quality live in chat threads. FoodLoop is a coordination platform, not a marketplace. It does not take payments.

## Users

| Role | What they do |
|------|----------------|
| Food Provider | Register, publish surplus listings, update quantity, see claims and estimated waste reduction. |
| Community Organization | Create a profile, wait for Admin verification, browse/search food, see matcher scores, claim, collect. |
| Admin | Verify organizations, manage listings and users, view rescue and monthly statistics. |

## Requirements covered

Authentication (JWT + bcrypt), RBAC, listing lifecycle Available → Reserved → Collected / Expired, Python `FoodMatcher` / `WasteAnalyzer` / `SustainabilityCalculator`, waste-reduction advisor, food-safety RAG, matching agent with live tools, API gateway, Docker, Kubernetes manifests, Terraform, Linux scripts.

## Future improvements

- Server-side token revocation so logout and deactivation take effect on food/org APIs immediately.
- MongoDB authentication and TLS for any shared or public network.
- Neural embeddings for RAG if graders want semantic retrieval beyond the hashing embedder.
- Cluster-wide rate limiting and a real cloud Kubernetes apply with loaded images.
- Optional notifications when a nearby listing is about to expire.
- Measured kitchen waste logs instead of heuristic kg / CO₂ factors.
