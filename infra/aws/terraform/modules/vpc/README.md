# VPC Module

Creates VPC with public/private subnets, NAT gateways, and security groups for NestTrade.

## Inputs

| Name | Description | Type |
|------|-------------|------|
| environment | Environment name (dev/staging/prod) | string |
| vpc_cidr | VPC CIDR block | string |
| availability_zones | List of AZs | list(string) |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | VPC ID |
| private_subnet_ids | Private subnet IDs |
| public_subnet_ids | Public subnet IDs |
