# NestTrade VPC Outputs
# Purpose: Output values for VPC module
# Author: BharatERP
# Last-updated: 2025-02-19

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [] # Populate when subnets added
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [] # Populate when subnets added
}
