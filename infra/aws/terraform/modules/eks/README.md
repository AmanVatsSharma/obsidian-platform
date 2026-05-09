# EKS Module

Creates EKS cluster and node groups for NestTrade workloads.

## Inputs

| Name | Description | Type |
|------|-------------|------|
| environment | Environment name | string |
| cluster_name | EKS cluster name | string |
| subnet_ids | Subnet IDs for EKS | list(string) |

## Outputs

| Name | Description |
|------|-------------|
| cluster_endpoint | EKS API endpoint |
| cluster_name | Cluster name |
| cluster_certificate_authority_data | CA data for kubeconfig |
