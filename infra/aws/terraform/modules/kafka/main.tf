# NestTrade Kafka (MSK) Module
# Purpose: Managed Kafka for event streaming
# Author: BharatERP
# Last-updated: 2025-02-19

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Placeholder: MSK cluster, broker nodes, security groups
# Depends on: modules/vpc (private_subnet_ids)
