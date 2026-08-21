# FoodLoop security

This document describes the security controls that are implemented in the repository, what was tightened in the latest audit, and the residual risks that remain for a hackathon / local-cluster deployment.

The public edge is the API gateway (`http://localhost:8080` in Docker Compose). The React app talks only to the gateway. Auth, food, organization, matcher, and AI services are intended to sit on the private network.

## Authentication

- Users register and log in through `POST /api/auth/register` and `POST /api/auth/login`.
- Public Admin registration is rejected. Admin accounts are seeded or created out of band.
- Passwords are hashed with bcrypt (cost 10). The `passwordHash` field is `select: false` and stripped from JSON.
- Login uses a generic `"Invalid email or password"` message so callers cannot tell whether the email exists.
- Deactivated accounts cannot obtain a session on auth-service routes: `authenticate` loads the user from MongoDB and checks `isActive`, and uses the **database role**, not the role claim in the JWT.
- JWT payload is `{ userId, role }` only. Tokens are signed and verified with **HS256** (`algorithms: ['HS256']` on verify, `algorithm: 'HS256'` on sign). Unsigned `alg=none` tokens are rejected.
- `JWT_SECRET` must be set to a non-placeholder value when `NODE_ENV=production`. The placeholder `change-me-in-local-env` is rejected. Compose may still use a local-only secret such as `foodloop-local-dev-secret` — replace that before any shared or public deployment.
- Access tokens are sent as `Authorization: Bearer`. They are never placed in URLs or request bodies by the frontend client.

## Authorization (RBAC)

Roles are `Provider`, `Organization`, and `Admin`.

- Gateway: JWT is required for `/api/foods`, `/api/organizations`, `/api/matching` (except matcher health), and `/api/ai` (except AI health). Register and login stay public.
- Food-service: create/update/delete listings are Provider (and Admin where applicable); claim/collect are Organization; lifecycle transitions are enforced in the service layer.
- Organization-service: profile create/update is the owning Organization; verification is **Admin only**; unverified orgs are hidden from Providers; owners cannot self-verify via profile PATCH (`verified` and `userId` are stripped from updates).
- Auth-service: `/auth/admin/*` requires Admin.

The gateway forwards `x-user-id` / `x-user-role` **only after JWT verification**. Inbound client values for those headers are stripped so they cannot be spoofed on public or authenticated routes.

## API validation and MongoDB

- Request bodies are limited to **1mb**.
- Auth, food, and organization routes validate payloads before hitting the database (email/password rules, ObjectIds, enums for categories/status, coordinates).
- Mongo queries are built from allow-listed fields. Client JSON is not passed through as a filter.
- Organization name search escapes regex metacharacters and caps `q` at 100 characters.

## CORS, headers, and the frontend

- Gateway CORS: if `CORS_ORIGINS=*`, the gateway reflects the request Origin and **does not** send `Access-Control-Allow-Credentials`. The SPA uses Bearer tokens, not cookies. For a named frontend origin, set `CORS_ORIGINS` to that origin (comma-separated list) to allow credentials.
- Node services disable `X-Powered-By` and set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy: no-referrer`.
- Frontend nginx adds the same class of headers plus a Content-Security-Policy that allows `connect-src` to `http:`/`https:` so the SPA can reach the gateway on another port (Compose / NodePort).
- The browser stores the access token in memory and **sessionStorage**, not localStorage. On load, any leftover localStorage token is migrated then deleted. The UI never decodes JWT claims for authorization; `GET /api/auth/me` is the source of truth.

## Rate limiting

- Gateway: in-memory limit on `POST /api/auth/login` and `POST /api/auth/register` (60 attempts / 15 minutes / client IP). Skipped when `NODE_ENV=test`.
- Auth-service: in-memory limit on the same routes keyed by email (20 attempts / 15 minutes). Also skipped in tests.

This is process-local. Multiple replicas do not share a counter. It is a brute-force slowdown, not a cluster-wide WAF.

## Errors and logging

- Production (`NODE_ENV=production`) error handlers return a generic `"Internal server error"` for unhandled 500s and do not attach internal `data`.
- Validation and known domain errors return `{ success, message, data }` without stack traces.
- Application logs are startup/listen messages. Authorization headers are not logged by app code.

## Secrets and configuration

| Location | Practice |
| --- | --- |
| `.env` | Gitignored. Copy from `.env.example`. |
| `*.env.example` | Placeholders only (`change-me-in-local-env`). |
| Kubernetes `secrets.example.yaml` | Placeholder Secret. Copy to `secrets.yaml` (gitignored) and replace values. |
| Terraform `jwt_secret` / `openai_api_key` | Marked `sensitive`. Override with `TF_VAR_*` or a tfvars file that is not committed. |
| Dockerfiles | No API keys or JWT secrets baked in. JWT and OpenAI key come from env / K8s Secret. |
| Node images | Run as `USER node`. |
| Python images | Run as non-root `appuser`. `ENVIRONMENT=production` disables FastAPI `/docs`, `/redoc`, and `/openapi.json`. |

Never commit real `JWT_SECRET` or `OPENAI_API_KEY` values.

## Docker, Kubernetes, Terraform

- Services bind `0.0.0.0` inside containers so Compose and Kubernetes probes work. Do not publish auth/food/org/matcher/AI ports on a public interface in production; only the gateway (and frontend) should be reachable.
- Kubernetes Secrets hold `JWT_SECRET` and optional `OPENAI_API_KEY`. ConfigMap holds non-secret URLs and tunables, including `CORS_ORIGINS: "*"` for hackathon NodePort. Change that to the real frontend origin before a public launch.
- `./scripts/deploy.sh` requires `infrastructure/kubernetes/secrets.yaml` (copy from `secrets.example.yaml`). It will not apply the placeholder Secret.
- Terraform creates the namespace, ConfigMap, and Secret template. It does not print secret values in outputs.

## Residual risks (accepted for this deployment)

1. **Stateless JWT.** Logout clears the client store only. A stolen token works until `JWT_EXPIRES_IN` (default `1d`). There is no server-side denylist.
2. **Stale role / deactivation on food and org services.** Auth-service reloads the user from MongoDB. The gateway and food/org services trust the signed JWT. A demotion or deactivation takes effect on `/api/auth/me` immediately, but food/org calls succeed until the token expires. Gateway tests sign tokens without a User row, so they do not look up users.
3. **MongoDB has no auth** in Compose and the in-cluster MongoDB Deployment. Anyone who can reach `mongodb:27017` can read/write the database. Restrict that to the cluster network.
4. **Matcher and AI have no application-level auth** if called on their own ports. The gateway requires JWT for `/api/matching` and `/api/ai` (except health). Keep those services ClusterIP-only. The matching agent and some e2e helpers call matcher HTTP directly on the private URL.
5. **In-memory rate limits** reset on process restart and are not shared across replicas.
6. **Default `CORS_ORIGINS=*`** is convenient for local and NodePort demos. Use an explicit origin list when the app has a stable public hostname.
7. **CSP `connect-src` includes `http:` and `https:`** so the Dockerized frontend can call the gateway on another host/port. Tighten this when the API origin is fixed.

## Checklist before a public deployment

- [ ] Set a long random `JWT_SECRET` (not `foodloop-local-dev-secret` or `change-me-in-local-env`).
- [ ] Set `CORS_ORIGINS` to the real frontend origin.
- [ ] Do not expose MongoDB, auth, food, org, matcher, or AI ports publicly.
- [ ] Enable MongoDB authentication and TLS, or use a managed database.
- [ ] Store K8s/Terraform secrets in a sealed-secret or external secret manager.
- [ ] Consider shortening `JWT_EXPIRES_IN` and adding refresh tokens or a denylist if logout must revoke immediately.
