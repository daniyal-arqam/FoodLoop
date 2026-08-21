# Scripts

| Script | Purpose |
|--------|---------|
| `setup.sh` | Check Node, Python, Docker, Mongo; install deps; copy `.env` from examples |
| `dev.sh` | Start local processes (`compose` uses Docker Compose) |
| `test.sh` | Frontend, Node service, and Python tests |
| `build.sh` | Frontend production build, backend syntax check, Docker images if available |
| `deploy.sh` | `kubectl apply` for `infrastructure/kubernetes` |
| `start-local.ps1` / `start-local.sh` | Same as `dev.sh` (Windows / Unix) |
| `health-check.ps1` / `health-check.sh` | Hit every health endpoint |
| `seed-demo.sh` | Deterministic hackathon users, verified orgs, and Available listings |
| `start-mongo-memory.sh` | In-memory MongoDB on 27017 when Docker / local mongod is missing |

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/test.sh
./scripts/build.sh
./scripts/dev.sh
./scripts/seed-demo.sh
./scripts/deploy.sh
```

Windows (Git Bash):

```bash
"C:/Program Files/Git/bin/bash.exe" ./scripts/setup.sh
```

Do not put secrets in these scripts. Use local `.env` files (gitignored).
