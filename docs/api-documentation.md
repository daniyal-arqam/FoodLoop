# FoodLoop API documentation

Public clients call the **API gateway** only (`http://localhost:8080`). Downstream services are not the browser entry point.

Envelope: `{ "success": true|false, "message": "...", "data": ... }`.

Authenticated routes: `Authorization: Bearer <JWT>`.

## Auth (`/api/auth`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | No | Provider or Organization account. Admin registration is rejected. |
| POST | `/api/auth/login` | No | Returns `accessToken` and user. |
| POST | `/api/auth/logout` | Yes | Client discards token. |
| GET | `/api/auth/me` | Yes | Current user from the database. |
| GET | `/api/auth/admin/users` | Admin | List users. |
| PATCH | `/api/auth/admin/users/:id` | Admin | Activate/deactivate. |

Register body: `{ name, email, password, role }` where `role` is `Provider` or `Organization`.

## Food (`/api/foods`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/foods` | Provider | Create Available listing. |
| GET | `/api/foods` | Yes | Search/filter. Query: `category`, `status`, `minQuantity`, `maxQuantity`, `urgency`, `latitude`, `longitude`, `maxDistanceKm`. |
| GET | `/api/foods/:id` | Yes | Listing details. |
| PATCH | `/api/foods/:id` | Provider (own) / Admin | Update Available listing (including quantity). |
| POST | `/api/foods/:id/claim` | Organization (verified) | Available → Reserved. |
| POST | `/api/foods/:id/collect` | Claiming organization | Reserved → Collected. |

Listing body includes `foodName`, `category`, `quantity`, `unit`, `description`, `pickupLocation` `{ address, latitude, longitude }`, `availableFrom`, `availableUntil`, `expiryDate`.

Status: `Available` → `Reserved` → `Collected`, or `Available` → `Expired`.

## Organizations (`/api/organizations`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/organizations` | Organization | Create profile. |
| GET | `/api/organizations/profile` | Organization | Own profile. |
| PATCH | `/api/organizations/profile` | Organization | Update (cannot self-verify). |
| GET | `/api/organizations` | Yes | Search verified orgs (category, name). |
| GET | `/api/organizations/:id` | Yes | Details (unverified hidden except owner/admin). |
| POST | `/api/organizations/:id/verify` | Admin | Set `verified`. |

## Matcher (`/api/matching`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/matching/health` | No | Matcher health. |
| POST | `/api/matching/score` | Yes | `FoodMatcher.calculate_match_score`. |
| POST | `/api/matching/find` | Yes | `find_matches` + `rank_matches`. |
| POST | `/api/matching/impact` | Yes | `WasteAnalyzer` + `SustainabilityCalculator`. |

Score body: `{ listing: { id, foodName, category, quantity, latitude, longitude, expiryDate, status }, organization: { id, organizationName, verified, latitude, longitude, foodCategoriesNeeded, requiredQuantity } }`.

Impact body: `{ listings: [{ quantity, claimedQuantity, status, category }] }`.

## AI (`/api/ai`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/ai/health` | No | Includes `ragIndexReady`. |
| POST | `/api/ai/recommend` | Yes | Waste-reduction advisor. |
| POST | `/api/ai/rag/query` | Yes | Grounded food-safety answer + `sources`. |
| POST | `/api/ai/agent` | Yes | Matching agent with live tools. |

Recommend body example: `{ surplusQuantity: 120, foodCategory: "Prepared Meals", timePattern: "7 PM - 9 PM", frequency: "weekly", unit: "servings" }`.

RAG body: `{ question: "What should we consider before redistributing prepared food?" }`.

Agent body: `{ message: "Find organizations that could use the available vegetarian meals." }`.

Agent tools: `find_available_food`, `find_organizations`, `calculate_match_score`, `generate_match_recommendation`.

## Health

| URL | Service |
|-----|---------|
| `GET http://localhost:8080/health` | Gateway |
| `GET http://localhost:5173/health.json` | Frontend |
| `GET http://localhost:4001/health` | Auth |
| `GET http://localhost:4002/health` | Food |
| `GET http://localhost:4003/health` | Organization |
| `GET http://localhost:8001/health` | Matcher |
| `GET http://localhost:8002/health` | AI |
