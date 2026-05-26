# Kafka (MSK) Module

Creates Amazon MSK cluster for Obsidian event streaming.

## Inputs

| Name | Description | Type |
|------|-------------|------|
| environment | Environment name | string |
| subnet_ids | Private subnet IDs | list(string) |
| kafka_version | MSK Kafka version | string |

## Outputs

| Name | Description |
|------|-------------|
| bootstrap_brokers | MSK bootstrap broker string |
| zookeeper_connect_string | Zookeeper connect string |
