# NestTrade AWS Root Outputs
# Purpose: Root-level outputs
# Author: BharatERP
# Last-updated: 2025-02-19

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}
