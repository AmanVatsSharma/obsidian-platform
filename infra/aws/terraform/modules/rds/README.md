# RDS Module

Creates RDS PostgreSQL instance for NestTrade primary data store.

## Inputs

| Name | Description | Type |
|------|-------------|------|
| environment | Environment name | string |
| subnet_ids | Private subnet IDs | list(string) |
| instance_class | DB instance class | string |

## Outputs

| Name | Description |
|------|-------------|
| endpoint | RDS endpoint |
| port | RDS port |
| database_name | Database name |
