# NestTrade Helm Charts

Helm chart skeletons for deploying NestTrade workloads to EKS.

## Charts

| Chart | Purpose |
|-------|---------|
| `backend` | NestJS backend API |
| `web` | Trader Web (Next.js) frontend |

## Usage

```bash
helm install backend ./backend -f backend/values-dev.yaml
helm install web ./web -f web/values-dev.yaml
```
