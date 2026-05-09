# NestTrade Redis Outputs
# Purpose: Output values for Redis module
# Author: BharatERP
# Last-updated: 2025-02-19

output "endpoint" {
  description = "Redis endpoint"
  value       = "" # Populate when ElastiCache added
}

output "port" {
  description = "Redis port"
  value       = 6379
}
