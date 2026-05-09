# NestTrade Kafka Variables
# Purpose: Input variables for MSK module
# Author: BharatERP
# Last-updated: 2025-02-19

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for MSK brokers"
  type        = list(string)
}

variable "kafka_version" {
  description = "MSK Kafka version"
  type        = string
  default     = "3.5.1"
}
