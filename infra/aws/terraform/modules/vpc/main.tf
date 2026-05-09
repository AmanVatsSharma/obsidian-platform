# NestTrade VPC Module
# Purpose: VPC, subnets, NAT, security groups
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

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-nesttrade-vpc"
    Environment = var.environment
  }
}

# Placeholder: add subnets, NAT, security groups per env requirements
