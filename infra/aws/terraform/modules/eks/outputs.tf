# NestTrade EKS Outputs
# Purpose: Output values for EKS module
# Author: BharatERP
# Last-updated: 2025-02-19

output "cluster_endpoint" {
  description = "EKS API endpoint"
  value       = "" # Populate when cluster added
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = var.cluster_name
}

output "cluster_certificate_authority_data" {
  description = "CA data for kubeconfig"
  value       = "" # Populate when cluster added
  sensitive   = true
}
