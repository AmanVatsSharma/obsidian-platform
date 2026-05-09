# NestTrade RDS Outputs
# Purpose: Output values for RDS module
# Author: BharatERP
# Last-updated: 2025-02-19

output "endpoint" {
  description = "RDS endpoint"
  value       = "" # Populate when RDS added
}

output "port" {
  description = "RDS port"
  value       = 5432
}

output "database_name" {
  description = "Database name"
  value       = "nesttrade"
}
