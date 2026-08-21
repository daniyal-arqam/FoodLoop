# Terraform

Defines the FoodLoop **cluster environment** (namespace, ConfigMap, Secret, MongoDB PVC, resource quota) for an **existing** Kubernetes cluster.

This repository has no provisioned cloud account. Terraform does not create AWS/GCP/Azure resources, EKS/GKE/AKS, or a database service. Nothing is live until you point kubeconfig at a real cluster and run `terraform apply`.

Workloads (Deployments and Services) stay in [../kubernetes](../kubernetes/README.md). Apply them with `kubectl` after this stack, **or** skip Terraform and apply the Kubernetes YAML platform files instead. Do not manage the same namespace/config/secret/PVC with both tools.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) 1.6 or newer
- An existing cluster and kubeconfig (kind, minikube, Docker Desktop, or similar)
- Container images built and loaded into that cluster (`docker compose build`, then `kind load` / `minikube image load`)

## Exact steps

From the repository root:

```bash
cd infrastructure/terraform
```

1. Copy defaults if you need a tfvars file (optional). Do not commit secrets.

```bash
# PowerShell
$env:TF_VAR_jwt_secret = "replace-with-a-strong-jwt-secret"
# optional: $env:TF_VAR_openai_api_key = "sk-..."
```

Or create `terraform.tfvars` locally (gitignored):

```hcl
kubeconfig_path    = "~/.kube/config"
kubeconfig_context = ""
namespace          = "foodloop"
environment        = "local"
image_tag          = "latest"
jwt_secret         = "replace-with-a-strong-jwt-secret"
openai_api_key     = ""
```

2. Initialize providers (downloads the Kubernetes provider; uses **local** state).

```bash
terraform init
```

3. Format and validate configuration (no cluster or cloud credentials required).

```bash
terraform fmt
terraform validate
```

4. Preview changes. This talks to the cluster in kubeconfig. If kubeconfig or the cluster is missing, skip this step — do not invent credentials.

```bash
terraform plan
```

5. Create the namespace, ConfigMap, Secret, PVC, and quota **only** when you intend to change a real cluster.

```bash
terraform apply
```

6. Deploy application workloads (images must already be on the cluster):

```bash
kubectl apply -f ../kubernetes/mongodb-deployment.yaml
kubectl apply -f ../kubernetes/mongodb-service.yaml
kubectl apply -f ../kubernetes/auth-deployment.yaml
kubectl apply -f ../kubernetes/auth-service.yaml
kubectl apply -f ../kubernetes/food-deployment.yaml
kubectl apply -f ../kubernetes/food-service.yaml
kubectl apply -f ../kubernetes/organization-deployment.yaml
kubectl apply -f ../kubernetes/organization-service.yaml
kubectl apply -f ../kubernetes/matcher-deployment.yaml
kubectl apply -f ../kubernetes/matcher-service.yaml
kubectl apply -f ../kubernetes/ai-deployment.yaml
kubectl apply -f ../kubernetes/ai-service.yaml
kubectl apply -f ../kubernetes/gateway-deployment.yaml
kubectl apply -f ../kubernetes/gateway-service.yaml
kubectl apply -f ../kubernetes/frontend-deployment.yaml
kubectl apply -f ../kubernetes/frontend-service.yaml
```

Skip `namespace.yaml`, `configmap.yaml`, `secrets*.yaml`, and the PVC document in `mongodb-deployment.yaml` if Terraform already created those objects.

7. Inspect:

```bash
terraform output
kubectl get pods -n foodloop
kubectl get services -n foodloop
```

8. Tear down the Terraform-managed environment (does not delete kubectl-created Deployments/Services):

```bash
terraform destroy
```

## Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `kubeconfig_path` | Cluster kubeconfig | `~/.kube/config` |
| `kubeconfig_context` | Context name; empty = current | `""` |
| `namespace` | Kubernetes namespace | `foodloop` |
| `environment` | Label only | `local` |
| `image_tag` | Tag for `foodloop-*` images | `latest` |
| `mongodb_image` | Mongo image | `mongo:7` |
| `mongodb_storage_size` | PVC size | `1Gi` |
| `jwt_secret` | Sensitive; do not commit real values | placeholder |
| `openai_api_key` | Sensitive; optional | empty |

Override with `-var`, `TF_VAR_*`, or a local `terraform.tfvars`.

## Outputs

`namespace`, `config_map_name`, `secret_name`, `mongodb_pvc_name`, `service_urls`, `container_images`, `workload_manifests`.

`service_urls` are in-cluster DNS names (`http://auth-service:4001`, and so on). They are not public cloud URLs.
