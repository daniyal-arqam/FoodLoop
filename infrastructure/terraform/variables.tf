variable "kubeconfig_path" {
  description = "Path to the kubeconfig file for an existing cluster."
  type        = string
  default     = "~/.kube/config"
}

variable "kubeconfig_context" {
  description = "Optional kubeconfig context. Empty uses the current context."
  type        = string
  default     = ""
}

variable "namespace" {
  description = "Kubernetes namespace for FoodLoop."
  type        = string
  default     = "foodloop"
}

variable "environment" {
  description = "Deployment environment label (local, hackathon, staging)."
  type        = string
  default     = "local"
}

variable "image_tag" {
  description = "Container image tag for FoodLoop service images."
  type        = string
  default     = "latest"
}

variable "mongodb_image" {
  description = "MongoDB container image."
  type        = string
  default     = "mongo:7"
}

variable "mongodb_storage_size" {
  description = "Requested size for the MongoDB persistent volume claim."
  type        = string
  default     = "1Gi"
}

variable "node_env" {
  description = "NODE_ENV for Node.js services."
  type        = string
  default     = "production"
}

variable "jwt_expires_in" {
  description = "JWT lifetime passed to Node services."
  type        = string
  default     = "1d"
}

variable "cors_origins" {
  description = "CORS origin list for gateway, matcher, and AI."
  type        = string
  default     = "*"
}

variable "auth_service_port" {
  description = "Auth service port."
  type        = number
  default     = 4001
}

variable "food_service_port" {
  description = "Food service port."
  type        = number
  default     = 4002
}

variable "organization_service_port" {
  description = "Organization service port."
  type        = number
  default     = 4003
}

variable "matcher_port" {
  description = "Matcher service port."
  type        = number
  default     = 8001
}

variable "ai_service_port" {
  description = "AI service port."
  type        = number
  default     = 8002
}

variable "gateway_port" {
  description = "API gateway port."
  type        = number
  default     = 8080
}

variable "mongodb_port" {
  description = "MongoDB port."
  type        = number
  default     = 27017
}

variable "proxy_timeout_ms" {
  description = "Gateway proxy timeout in milliseconds."
  type        = string
  default     = "10000"
}

variable "ai_proxy_timeout_ms" {
  description = "Gateway timeout for AI routes in milliseconds."
  type        = string
  default     = "30000"
}

variable "openai_base_url" {
  description = "OpenAI-compatible API base URL (not a secret)."
  type        = string
  default     = "https://api.openai.com/v1"
}

variable "openai_model" {
  description = "Model name for the AI advisor and agent."
  type        = string
  default     = "gpt-4o-mini"
}

variable "jwt_secret" {
  description = "JWT signing secret. Override via TF_VAR_jwt_secret or a tfvars file. Do not commit real values."
  type        = string
  sensitive   = true
  default     = "replace-with-a-strong-jwt-secret"
}

variable "openai_api_key" {
  description = "Optional OpenAI API key. Leave empty for health-only AI. Do not commit real values."
  type        = string
  sensitive   = true
  default     = ""
}

variable "ai_timeout_seconds" {
  description = "AI service LLM timeout in seconds."
  type        = string
  default     = "25"
}

variable "foodloop_timeout_seconds" {
  description = "AI service timeout when calling FoodLoop HTTP APIs."
  type        = string
  default     = "10"
}

variable "agent_max_steps" {
  description = "Matching-agent tool-loop cap."
  type        = string
  default     = "8"
}

variable "match_max_distance_km" {
  description = "Matcher maximum distance in kilometers."
  type        = string
  default     = "50"
}

variable "match_urgency_window_hours" {
  description = "Matcher urgency window in hours."
  type        = string
  default     = "72"
}

variable "match_min_quantity_ratio" {
  description = "Matcher minimum quantity ratio."
  type        = string
  default     = "0.2"
}

variable "match_weight_distance" {
  description = "Matcher score weight for distance."
  type        = string
  default     = "0.35"
}

variable "match_weight_quantity" {
  description = "Matcher score weight for quantity."
  type        = string
  default     = "0.25"
}

variable "match_weight_category" {
  description = "Matcher score weight for category."
  type        = string
  default     = "0.20"
}

variable "match_weight_urgency" {
  description = "Matcher score weight for urgency."
  type        = string
  default     = "0.20"
}

variable "quota_cpu" {
  description = "Namespace CPU quota (hackathon-sized)."
  type        = string
  default     = "4"
}

variable "quota_memory" {
  description = "Namespace memory quota (hackathon-sized)."
  type        = string
  default     = "4Gi"
}

variable "quota_pods" {
  description = "Namespace pod count quota."
  type        = string
  default     = "20"
}
