#!/usr/bin/env bash
# Apply FoodLoop Kubernetes manifests. Does not invent cluster credentials.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

KUBE_DIR="$ROOT/infrastructure/kubernetes"

have_cmd kubectl || die "kubectl is not installed. Install kubectl, point it at a cluster, then re-run ./scripts/deploy.sh"

if ! kubectl cluster-info >/dev/null 2>&1; then
  die "No Kubernetes cluster is reachable from the current kubeconfig. Start kind/minikube/Docker Desktop, or skip deploy until a cluster exists."
fi

[[ -d "$KUBE_DIR" ]] || die "Missing ${KUBE_DIR}"

log "Applying namespace and config"
kubectl apply -f "$KUBE_DIR/namespace.yaml"
kubectl apply -f "$KUBE_DIR/configmap.yaml"

if [[ -f "$KUBE_DIR/secrets.yaml" ]]; then
  log "Applying secrets.yaml (file is gitignored; values are not printed)"
  kubectl apply -f "$KUBE_DIR/secrets.yaml"
else
  die "Missing ${KUBE_DIR}/secrets.yaml. Copy secrets.example.yaml to secrets.yaml, set a real JWT_SECRET, then re-run ./scripts/deploy.sh"
fi

log "Applying workloads and services"
kubectl apply -f "$KUBE_DIR/mongodb-deployment.yaml"
kubectl apply -f "$KUBE_DIR/mongodb-service.yaml"
kubectl apply -f "$KUBE_DIR/auth-deployment.yaml"
kubectl apply -f "$KUBE_DIR/auth-service.yaml"
kubectl apply -f "$KUBE_DIR/food-deployment.yaml"
kubectl apply -f "$KUBE_DIR/food-service.yaml"
kubectl apply -f "$KUBE_DIR/organization-deployment.yaml"
kubectl apply -f "$KUBE_DIR/organization-service.yaml"
kubectl apply -f "$KUBE_DIR/matcher-deployment.yaml"
kubectl apply -f "$KUBE_DIR/matcher-service.yaml"
kubectl apply -f "$KUBE_DIR/ai-deployment.yaml"
kubectl apply -f "$KUBE_DIR/ai-service.yaml"
kubectl apply -f "$KUBE_DIR/gateway-deployment.yaml"
kubectl apply -f "$KUBE_DIR/gateway-service.yaml"
kubectl apply -f "$KUBE_DIR/frontend-deployment.yaml"
kubectl apply -f "$KUBE_DIR/frontend-service.yaml"

log "Cluster status (namespace foodloop)"
kubectl get pods -n foodloop
kubectl get services -n foodloop

ok "kubectl apply completed. Images must already be loaded into the cluster."
printf '%s\n' "Logs: kubectl logs -n foodloop deploy/api-gateway"
