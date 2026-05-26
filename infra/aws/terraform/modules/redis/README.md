# Redis Module

Creates ElastiCache Redis cluster for Obsidian caching and sessions.

## Inputs

| Name | Description | Type |
|------|-------------|------|
| environment | Environment name | string |
| subnet_ids | Private subnet IDs | list(string) |
| node_type | Cache node type | string |

## Outputs

| Name | Description |
|------|-------------|
| endpoint | Redis endpoint |
| port | Redis port |
