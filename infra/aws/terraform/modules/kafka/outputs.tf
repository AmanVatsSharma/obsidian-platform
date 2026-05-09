# NestTrade Kafka Outputs
# Purpose: Output values for MSK module
# Author: BharatERP
# Last-updated: 2025-02-19

output "bootstrap_brokers" {
  description = "MSK bootstrap broker string"
  value       = "" # Populate when MSK added
  sensitive   = true
}

output "zookeeper_connect_string" {
  description = "Zookeeper connect string"
  value       = "" # Populate when MSK added
  sensitive   = true
}
