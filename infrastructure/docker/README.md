# Docker

Per-service Dockerfiles live next to each service. Auth, food, organization, and API gateway images are built with the repository root as context so they can copy `services/shared`.

| Service | Dockerfile | Compose service |
|---------|------------|-----------------|
| Frontend | `frontend/Dockerfile` | `frontend` |
| API Gateway | `services/api-gateway/Dockerfile` | `api-gateway` |
| Auth Service | `services/auth-service/Dockerfile` | `auth-service` |
| Food Service | `services/food-service/Dockerfile` | `food-service` |
| Organization Service | `services/organization-service/Dockerfile` | `organization-service` |
| Matcher | `python-services/matcher/Dockerfile` | `python-matcher` |
| AI Service | `ai-service/Dockerfile` | `ai-service` |
| MongoDB | `mongo:7` | `mongodb` |

```bash
docker compose build
docker compose up
```

Secrets such as `JWT_SECRET` and `OPENAI_API_KEY` come from the environment or `.env`, never from Dockerfiles.

Kubernetes manifests that consume these images are in [../kubernetes](../kubernetes/README.md).
