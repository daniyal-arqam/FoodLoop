# food-service

Food listings, search, claims, collection, and expiration.

## Endpoints

| Method | Path | Roles |
|--------|------|-------|
| GET | `/health` | public |
| POST | `/foods` | Provider, Admin |
| GET | `/foods` | Provider, Organization, Admin |
| GET | `/foods/:id` | Provider, Organization, Admin |
| PATCH | `/foods/:id` | Provider (own, Available), Admin |
| POST | `/foods/:id/claim` | Organization (verified) |
| POST | `/foods/:id/collect` | Reserving org, listing provider, Admin |

Lifecycle: `Available → Reserved → Collected` and `Available → Expired`.

Query filters: `category`, `minQuantity`, `maxQuantity`, `status`, `urgency=true`, `urgencyHours`, `latitude`, `longitude`, `maxDistanceKm`, `mine=true`.

## Run

```bash
npm install
npm test
npm start
```
