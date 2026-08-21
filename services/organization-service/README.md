# organization-service

Organization profiles, requirements, search, and admin verification.

## Endpoints

| Method | Path | Roles |
|--------|------|-------|
| GET | `/health` | public |
| POST | `/organizations` | Organization (create own profile, always unverified) |
| GET | `/organizations` | Provider, Organization, Admin |
| GET | `/organizations/:id` | Provider, Organization, Admin |
| PATCH | `/organizations/profile` | Organization (own profile only) |
| POST | `/organizations/:id/verify` | Admin |

Default search returns **verified** organizations only (eligible for matching/claiming). Admins can pass `verified=false` to review pending profiles.

Query filters: `q` / `name`, `category`, `verified`.

## Run

```bash
npm install
npm test
npm start
```
