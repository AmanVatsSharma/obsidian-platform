# NestTrade RDS Module
# Purpose: RDS PostgreSQL for primary data
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

# Placeholder: RDS instance, subnet group, parameter group
# Depends on: modules/vpc (private_subnet_ids)
