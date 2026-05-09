# NestTrade RDS Variables
# Purpose: Input variables for RDS module
# Author: BharatERP
# Last-updated: 2025-02-19

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for RDS"
  type        = list(string)
}

variable "instance_class" {
  description = "DB instance class"
  type        = string
  default     = "db.t3.micro"
}
