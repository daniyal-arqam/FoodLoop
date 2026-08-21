# FoodLoop cluster environment
#
# This stack prepares a Kubernetes namespace for the app: config, secrets,
# MongoDB storage, and a small resource quota. It does not create a cloud
# account, VPC, managed Kubernetes cluster, or MongoDB Atlas instance.
#
# Workloads (Deployments and Services) live in ../kubernetes and are applied
# with kubectl after this environment exists. Applying both this stack and
# namespace.yaml / configmap.yaml / secrets*.yaml / mongodb PVC will manage
# the same objects — pick Terraform *or* those YAML files for the platform
# layer.

locals {
  labels = {
    "app.kubernetes.io/part-of"     = "foodloop"
    "app.kubernetes.io/managed-by"  = "terraform"
    "app.kubernetes.io/environment" = var.environment
  }

  mongodb_host = "mongodb"
  auth_host    = "auth-service"
  food_host    = "food-service"
  org_host     = "organization-service"
  matcher_host = "matcher"
  ai_host      = "ai-service"
  gateway_host = "api-gateway"

  # Service DNS used inside the cluster. Match these names in Kubernetes YAML.
  mongodb_uri              = "mongodb://${local.mongodb_host}:${var.mongodb_port}/foodloop"
  auth_service_url         = "http://${local.auth_host}:${var.auth_service_port}"
  food_service_url         = "http://${local.food_host}:${var.food_service_port}"
  organization_service_url = "http://${local.org_host}:${var.organization_service_port}"
  matcher_url              = "http://${local.matcher_host}:${var.matcher_port}"
  ai_service_url           = "http://${local.ai_host}:${var.ai_service_port}"

  images = {
    frontend             = "foodloop-frontend:${var.image_tag}"
    api_gateway          = "foodloop-api-gateway:${var.image_tag}"
    auth_service         = "foodloop-auth-service:${var.image_tag}"
    food_service         = "foodloop-food-service:${var.image_tag}"
    organization_service = "foodloop-organization-service:${var.image_tag}"
    matcher              = "foodloop-python-matcher:${var.image_tag}"
    ai_service           = "foodloop-ai-service:${var.image_tag}"
    mongodb              = var.mongodb_image
  }
}

resource "kubernetes_namespace_v1" "foodloop" {
  metadata {
    name   = var.namespace
    labels = local.labels
  }
}

# Non-secret runtime settings shared by gateway, Node services, matcher, and AI.
resource "kubernetes_config_map_v1" "foodloop" {
  metadata {
    name      = "foodloop-config"
    namespace = kubernetes_namespace_v1.foodloop.metadata[0].name
    labels    = merge(local.labels, { "app.kubernetes.io/name" = "foodloop-config" })
  }

  data = {
    NODE_ENV                   = var.node_env
    JWT_EXPIRES_IN             = var.jwt_expires_in
    CORS_ORIGINS               = var.cors_origins
    MONGODB_URI                = local.mongodb_uri
    AUTH_SERVICE_URL           = local.auth_service_url
    FOOD_SERVICE_URL           = local.food_service_url
    ORGANIZATION_SERVICE_URL   = local.organization_service_url
    MATCHER_URL                = local.matcher_url
    AI_SERVICE_URL             = local.ai_service_url
    PROXY_TIMEOUT_MS           = var.proxy_timeout_ms
    AI_PROXY_TIMEOUT_MS        = var.ai_proxy_timeout_ms
    OPENAI_BASE_URL            = var.openai_base_url
    OPENAI_MODEL               = var.openai_model
    AI_TIMEOUT_SECONDS         = var.ai_timeout_seconds
    FOODLOOP_TIMEOUT_SECONDS   = var.foodloop_timeout_seconds
    AGENT_MAX_STEPS            = var.agent_max_steps
    MATCH_MAX_DISTANCE_KM      = var.match_max_distance_km
    MATCH_URGENCY_WINDOW_HOURS = var.match_urgency_window_hours
    MATCH_MIN_QUANTITY_RATIO   = var.match_min_quantity_ratio
    MATCH_WEIGHT_DISTANCE      = var.match_weight_distance
    MATCH_WEIGHT_QUANTITY      = var.match_weight_quantity
    MATCH_WEIGHT_CATEGORY      = var.match_weight_category
    MATCH_WEIGHT_URGENCY       = var.match_weight_urgency
  }
}

# Template secret only. Override jwt_secret / openai_api_key at apply time.
resource "kubernetes_secret_v1" "foodloop" {
  metadata {
    name      = "foodloop-secrets"
    namespace = kubernetes_namespace_v1.foodloop.metadata[0].name
    labels    = merge(local.labels, { "app.kubernetes.io/name" = "foodloop-secrets" })
  }

  type = "Opaque"

  data = {
    JWT_SECRET     = var.jwt_secret
    OPENAI_API_KEY = var.openai_api_key
  }
}

# Durable MongoDB disk. Needs a default StorageClass on the cluster.
resource "kubernetes_persistent_volume_claim_v1" "mongodb" {
  metadata {
    name      = "mongodb-data"
    namespace = kubernetes_namespace_v1.foodloop.metadata[0].name
    labels    = merge(local.labels, { app = "mongodb" })
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = var.mongodb_storage_size
      }
    }
  }

  wait_until_bound = false
}

# Soft cap so a local kind/minikube cluster is not starved by every replica.
resource "kubernetes_resource_quota_v1" "foodloop" {
  metadata {
    name      = "foodloop-quota"
    namespace = kubernetes_namespace_v1.foodloop.metadata[0].name
    labels    = local.labels
  }

  spec {
    hard = {
      cpu    = var.quota_cpu
      memory = var.quota_memory
      pods   = var.quota_pods
    }
  }
}
