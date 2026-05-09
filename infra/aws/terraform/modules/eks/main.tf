# NestTrade EKS Module
# Purpose: EKS cluster and node groups
# Author: BharatERP
# Last-updated: 2025-02-19

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

# Placeholder: EKS cluster and node group resources
# Depends on: modules/vpc (subnet_ids)
