# Node services

| Service | Port | Responsibility |
|---------|------|----------------|
| `api-gateway` | 8080 | Client entry point |
| `auth-service` | 4001 | Authentication and RBAC |
| `food-service` | 4002 | Food listings |
| `organization-service` | 4003 | Organizations |

Each service currently exposes `GET /health` only.

MongoDB models live in the owning service (`User` in auth, `FoodListing`/`Claim` in food, `Organization` in organization). Shared enums and connection helpers are in `services/shared`.

Auth service implements JWT login/registration, `authenticate`, and `authorize(...roles)`.
Food service implements listing CRUD, search, claim/collect, and expiration (`Available → Reserved → Collected`, `Available → Expired`).
Organization service implements profiles, requirement search, and Admin verification. Only verified orgs are eligible for matching/claiming.
API Gateway is the public entry point (`/api/auth`, `/api/foods`, `/api/organizations`, `/api/matching`, `/api/ai`).
