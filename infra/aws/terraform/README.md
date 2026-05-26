# Obsidian AWS Infrastructure

Terraform-managed AWS infrastructure for Obsidian broker SaaS platform.

## Modules

| Module | Purpose |
|--------|---------|
| `modules/vpc` | VPC, subnets, NAT, security groups |
| `modules/eks` | EKS cluster and node groups |
| `modules/rds` | RDS PostgreSQL for primary data |
| `modules/redis` | ElastiCache Redis for caching/sessions |
| `modules/kafka` | MSK (Managed Kafka) for event streaming |

## Usage

```bash
terraform init
terraform plan -var-file=envs/dev.tfvars
terraform apply -var-file=envs/dev.tfvars
```

## Environments

- `envs/dev.tfvars` — Development
- `envs/staging.tfvars` — Staging
- `envs/prod.tfvars` — Production
