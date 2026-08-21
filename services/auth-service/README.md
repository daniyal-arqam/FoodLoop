# auth-service

Authentication, JWT, and RBAC for FoodLoop.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | public | Liveness |
| POST | `/auth/register` | public | Register Provider or Organization |
| POST | `/auth/login` | public | Issue JWT |
| GET | `/auth/me` | JWT | Current user |
| POST | `/auth/logout` | JWT | Client-side token discard |
| GET | `/auth/admin/me` | JWT + Admin | Admin-only current user |

Admin accounts cannot be created through `POST /auth/register`.

JWT payload: `{ userId, role }`. Expiration is `JWT_EXPIRES_IN` (default `1d`).

## Run

```bash
npm install
npm start
```

Requires MongoDB (`MONGODB_URI`) and `JWT_SECRET`.

```bash
npm test
```
