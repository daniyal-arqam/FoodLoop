# Kubernetes

Manifests for the FoodLoop namespace. Images are the same ones built by Docker Compose (`foodloop-*:latest`). Load them into the cluster before apply (for example `kind load docker-image` or `minikube image load`).

Internal traffic uses Kubernetes Service DNS:

| Service | DNS | Port |
|---------|-----|------|
| MongoDB | `mongodb` | 27017 |
| Auth | `auth-service` | 4001 |
| Food | `food-service` | 4002 |
| Organizations | `organization-service` | 4003 |
| Matcher | `matcher` | 8001 |
| AI | `ai-service` | 8002 |
| API Gateway | `api-gateway` | 8080 |
| Frontend | `frontend` | 80 |

## Secrets

Do not store real secrets in git.

```bash
cp infrastructure/kubernetes/secrets.example.yaml infrastructure/kubernetes/secrets.yaml
# edit JWT_SECRET (and OPENAI_API_KEY if you use the advisor/agent)
```

`secrets.yaml` is gitignored. `./scripts/deploy.sh` requires `secrets.yaml` and will not apply the placeholder file.

## Apply

From the repository root:

```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml

kubectl apply -f infrastructure/kubernetes/mongodb-deployment.yaml
kubectl apply -f infrastructure/kubernetes/mongodb-service.yaml

kubectl apply -f infrastructure/kubernetes/auth-deployment.yaml
kubectl apply -f infrastructure/kubernetes/auth-service.yaml
kubectl apply -f infrastructure/kubernetes/food-deployment.yaml
kubectl apply -f infrastructure/kubernetes/food-service.yaml
kubectl apply -f infrastructure/kubernetes/organization-deployment.yaml
kubectl apply -f infrastructure/kubernetes/organization-service.yaml
kubectl apply -f infrastructure/kubernetes/matcher-deployment.yaml
kubectl apply -f infrastructure/kubernetes/matcher-service.yaml

kubectl apply -f infrastructure/kubernetes/ai-deployment.yaml
kubectl apply -f infrastructure/kubernetes/ai-service.yaml

kubectl apply -f infrastructure/kubernetes/gateway-deployment.yaml
kubectl apply -f infrastructure/kubernetes/gateway-service.yaml
kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/frontend-service.yaml
```

Or apply the directory after the secret exists:

```bash
kubectl apply -f infrastructure/kubernetes/
```

## Inspect

```bash
kubectl get pods -n foodloop
kubectl get services -n foodloop
kubectl logs -n foodloop deploy/api-gateway
kubectl logs -n foodloop deploy/auth-service
kubectl logs -n foodloop deploy/food-service
kubectl logs -n foodloop deploy/organization-service
kubectl logs -n foodloop deploy/matcher
kubectl logs -n foodloop deploy/ai-service
kubectl logs -n foodloop deploy/frontend
kubectl logs -n foodloop deploy/mongodb
```

## Access

Frontend NodePort `30080`, gateway NodePort `30808`.

```bash
kubectl port-forward -n foodloop svc/frontend 5173:80
kubectl port-forward -n foodloop svc/api-gateway 8080:8080
```

Build the frontend image with `VITE_API_BASE_URL` pointing at the gateway URL the browser will use (for port-forward that is `http://localhost:8080`; for NodePort that is `http://localhost:30808`).

If the `mongodb-data` PVC stays Pending, the cluster has no default StorageClass. Create one, or switch the MongoDB volume to `emptyDir` for a throwaway local run.

Requires `kubectl` and a cluster. Build images with Docker Compose, load them (`kind load docker-image` or `minikube image load`), then apply.

To create the namespace, ConfigMap, Secret, and MongoDB PVC with Terraform instead of the YAML files above, see [../terraform](../terraform/README.md). Do not manage those objects with both tools.

## Health

| Service | Probe path |
|---------|------------|
| Frontend | `/health.json` |
| API Gateway | `/health` |
| Auth, food, organization, matcher, AI | `/health` |
| MongoDB | TCP 27017 |
