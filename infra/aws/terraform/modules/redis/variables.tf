# NestTrade Redis Variables
# Purpose: Input variables for Redis module
# Author: BharatERP
# Last-updated: 2025-02-19

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for ElastiCache"
  type        = list(string)
}

variable "node_type" {
  description = "Cache node type"
  type        = string
  default     = "cache.t3.micro"
}
