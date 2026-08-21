terraform {
  required_version = ">= 1.6.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
  }

  # State stays on disk. No remote backend is configured because this
  # repository does not have a provisioned cloud account.
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Talks to whichever cluster kubeconfig points at (kind, minikube, Docker
# Desktop, or a real kubeconfig you pass in). Terraform does not create
# that cluster.
provider "kubernetes" {
  config_path    = pathexpand(var.kubeconfig_path)
  config_context = var.kubeconfig_context == "" ? null : var.kubeconfig_context
}
