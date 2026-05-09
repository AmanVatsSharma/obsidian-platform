# NestTrade AWS Root
# Purpose: Orchestrates infra modules
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

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source               = "./modules/vpc"
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
}

# Uncomment when modules are fully implemented:
# module "eks" {
#   source      = "./modules/eks"
#   environment = var.environment
#   cluster_name = "${var.environment}-nesttrade"
#   subnet_ids   = module.vpc.private_subnet_ids
# }
# module "rds" { ... }
# module "redis" { ... }
# module "kafka" { ... }
