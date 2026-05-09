# NestTrade EKS Variables
# Purpose: Input variables for EKS module
# Author: BharatERP
# Last-updated: 2025-02-19

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for EKS cluster"
  type        = list(string)
}
