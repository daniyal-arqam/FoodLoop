output "namespace" {
  description = "Kubernetes namespace created for FoodLoop."
  value       = kubernetes_namespace_v1.foodloop.metadata[0].name
}

output "environment" {
  description = "Environment label applied to Terraform-managed objects."
  value       = var.environment
}

output "config_map_name" {
  description = "ConfigMap that holds shared non-secret settings."
  value       = kubernetes_config_map_v1.foodloop.metadata[0].name
}

output "secret_name" {
  description = "Secret that holds JWT_SECRET and optional OPENAI_API_KEY."
  value       = kubernetes_secret_v1.foodloop.metadata[0].name
}

output "mongodb_pvc_name" {
  description = "PersistentVolumeClaim for MongoDB data."
  value       = kubernetes_persistent_volume_claim_v1.mongodb.metadata[0].name
}

output "service_urls" {
  description = "In-cluster Service DNS URLs. Nothing here implies a public cloud endpoint."
  value = {
    mongodb      = local.mongodb_uri
    auth         = local.auth_service_url
    food         = local.food_service_url
    organization = local.organization_service_url
    matcher      = local.matcher_url
    ai           = local.ai_service_url
    gateway      = "http://${local.gateway_host}:${var.gateway_port}"
  }
}

output "container_images" {
  description = "Image names expected by the Kubernetes workload manifests."
  value       = local.images
}

output "workload_manifests" {
  description = "Where Deployments and Services are defined. They are not created by this stack."
  value       = "${path.module}/../kubernetes"
}
