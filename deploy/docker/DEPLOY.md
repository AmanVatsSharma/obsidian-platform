# Docker Compose Deployment Guide — Obsidian Platform

## Prerequisites

- Docker Engine 24+ / Docker Compose V2
- 4 CPU cores, 8 GB RAM minimum
- SSL certificates (or use Let's Encrypt)

## Quick Start

```bash
# 1. Clone and enter repo
cd obsidian-platform

# 2. Copy environment template
cp deploy/docker/.env.example deploy/docker/.env

# 3. Edit .env — set POSTGRES_PASSWORD, JWT secrets, AWS keys
nano deploy/docker/.env

# 4. (First deploy) Generate SSL certs for nginx
mkdir -p deploy/docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/docker/ssl/key.pem \
  -out deploy/docker/ssl/cert.pem \
  -subj "/CN=localhost"

# 5. Build and start all services
docker compose -f deploy/docker/docker-compose.prod.yml up -d --build

# 6. Run database migrations (first deploy only)
docker compose -f deploy/docker/docker-compose.prod.yml run --rm migrations

# 7. Verify all services are healthy
docker compose -f deploy/docker/docker-compose.prod.yml ps

# 8. Check logs if needed
docker compose -f deploy/docker/docker-compose.prod.yml logs -f
```

## Architecture

```
                        ┌─────────────────┐
                        │   Internet      │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Nginx :80/443 │  ← TLS termination, rate limiting
                        │   Reverse Proxy │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
      ┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼───────┐
      │   Web :3000   │  │ Broker-Admin│  │  Backend :3000│
      │  Trader Terminal│ │   :3000     │  │   NestJS API  │
      └───────────────┘  └─────────────┘  └───────┬───────┘
                                                  │
                    ┌─────────────────────────────┼──────────────┐
                    │                             │              │
            ┌───────▼───────┐            ┌────────▼──────┐  ┌───▼───┐
            │  Postgres 16  │            │    Redis 7    │  │ Kafka │
            │  (persistent) │            │  (cache + WS) │  │(TBD)  │
            └───────────────┘            └───────────────┘  └───────┘
```

## Services

| Service | Image | Port (internal) | Purpose |
|---------|-------|-----------------|---------|
| `nginx` | nginx:1.27-alpine | 80/443 | Reverse proxy, TLS, rate limiting |
| `web` | Custom build | 3000 | Trader terminal (Next.js SSR) |
| `broker-admin` | Custom build | 3000 | Broker back-office (static export) |
| `backend` | Custom build | 3000 | NestJS API, GraphQL, WebSocket |
| `postgres` | postgres:16-alpine | 5432 | Primary database |
| `redis` | redis:7-alpine | 6379 | Cache + PranaStream scale |
| `migrations` | Custom (one-shot) | — | TypeORM migrations runner |

## Routing

| Path | Service | Notes |
|------|---------|-------|
| `/` | Web (Next.js) | Trader terminal |
| `/admin/*` | Broker Admin | Back-office UI |
| `/api/*` | Backend | REST API |
| `/graphql` | Backend | GraphQL endpoint |
| `/ws/prana` | Backend | PranaStream WebSocket |

## Environment Variables

See [`.env.example`](.env.example) for full list. Critical variables:

```bash
# REQUIRED — set before first deploy
POSTGRES_PASSWORD=<strong-random-password>
JWT_ACCESS_SECRET=<openssl-rand-base64-32>
JWT_REFRESH_SECRET=<openssl-rand-base64-32>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>

# Optional — has defaults
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
NEXT_PUBLIC_API_URL=http://backend:3000
NEXT_PUBLIC_PRANA_WS_URL=ws://backend:3000/ws/prana
MARKET_DATA_PROVIDER=kite
SWAGGER_ENABLED=false
OTP_DEV_MODE=false
```

## SSL/TLS

### Option A: Self-signed (dev/staging)

```bash
mkdir -p deploy/docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/docker/ssl/key.pem \
  -out deploy/docker/ssl/cert.pem \
  -subj "/CN=localhost"
```

### Option B: Let's Encrypt (production)

```bash
# Install certbot
docker compose -f deploy/docker/docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path /var/www/letsencrypt \
  -d your-domain.com

# Copy certs to deploy/docker/ssl/ and restart nginx
docker compose -f deploy/docker/docker-compose.prod.yml restart nginx
```

### Option C: Coolify managed SSL

If deploying via Coolify, paste the SSL cert/key in the Coolify UI under
**Settings → SSL**. The `ssl` volume mount in nginx expects:
- `/etc/nginx/ssl/cert.pem`
- `/etc/nginx/ssl/key.pem`

## Migrations

**First deploy:**
```bash
docker compose -f deploy/docker/docker-compose.prod.yml run --rm migrations
```

**Schema changes (new feature):**
```bash
# 1. Generate migration
cd apps/backend
npx typeorm migration:generate -d src/shared/database/typeorm.config.ts src/migrations/SchemaChangeName

# 2. Commit the migration file

# 3. Deploy + run migrations
docker compose -f deploy/docker/docker-compose.prod.yml up -d --build
docker compose -f deploy/docker/docker-compose.prod.yml run --rm migrations
```

## Operations

### View logs

```bash
# All services
docker compose -f deploy/docker/docker-compose.prod.yml logs -f

# Single service
docker compose -f deploy/docker/docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f deploy/docker/docker-compose.prod.yml logs --tail=100 backend
```

### Restart a service

```bash
docker compose -f deploy/docker/docker-compose.prod.yml restart backend
```

### Shell into a container

```bash
docker compose -f deploy/docker/docker-compose.prod.yml exec backend sh
docker compose -f deploy/docker/docker-compose.prod.yml exec postgres psql -U obsidian -d obsidian
```

### Stop everything

```bash
docker compose -f deploy/docker/docker-compose.prod.yml down
```

### Update and redeploy

```bash
git pull origin main
docker compose -f deploy/docker/docker-compose.prod.yml up -d --build
docker compose -f deploy/docker/docker-compose.prod.yml run --rm migrations
docker compose -f deploy/docker/docker-compose.prod.yml ps  # verify
```

## Resource Limits

| Service | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
|---------|-----------|--------------|-------------|----------------|
| postgres | 2 cores | 2 GB | 0.5 cores | 512 MB |
| redis | 1 core | 1 GB | 0.25 cores | 256 MB |
| backend | 4 cores | 4 GB | 1 core | 1 GB |
| web | 2 cores | 1 GB | 0.5 cores | 256 MB |
| broker-admin | 1 core | 512 MB | 0.25 cores | 128 MB |
| nginx | 0.5 cores | 128 MB | 0.1 cores | 64 MB |
| **Total** | **~10 cores** | **~9 GB** | | |

Minimum host: 4 cores, 8 GB RAM. Recommended: 8 cores, 16 GB RAM.

## Security

- **Non-root containers** — all services run as dedicated non-root users
- **no-new-privileges** — prevents privilege escalation
- **Read-only mounts** — nginx.conf and SSL certs mounted read-only
- **Health checks** — all services with proper start_period
- **Restart policies** — `unless-stopped` for resilience
- **Resource limits** — prevents OOM cascades
- **Network isolation** — frontend/backend networks; services only see what they need
- **Security headers** — X-Frame-Options, X-Content-Type-Options, etc. via nginx
- **Rate limiting** — API (10r/s), web (30r/s), admin (10r/s)
- **dumb-init** — proper PID 1 signal handling (no zombie processes)

## Troubleshooting

### Backend won't start — "connection refused" to postgres

Postgres may still be initializing. The compose file uses `condition: service_healthy`
which should handle this. Check postgres logs:
```bash
docker compose -f deploy/docker/docker-compose.prod.yml logs postgres
```

### Migrations fail — "relation already exists"

This means migrations already ran. Safe to ignore if the schema is correct.
If you need to re-run: `docker compose -f deploy/docker/docker-compose.prod.yml down -v`
(destroys Postgres data — destructive).

### Web app shows 404

Check broker-admin static export is working:
```bash
docker compose -f deploy/docker/docker-compose.prod.yml logs broker-admin
```

### WebSocket connections failing

Ensure nginx has the WS headers configured (it does in this config).
Check that `NEXT_PUBLIC_PRANA_WS_URL` matches the nginx-proxied path.
The frontend connects to `ws://your-domain.com/ws/prana` which nginx forwards to backend.

### "Cannot find module" errors

The `deploy/docker/Dockerfile.*` files use multi-stage builds with pnpm.
Make sure `pnpm-lock.yaml` is present at the repo root. If using npm,
change the Dockerfiles to use `npm ci` instead of pnpm.

## Coolify Deployment

This compose is Coolify-compatible:

1. In Coolify, create a new **Docker Compose** resource
2. Point to your Git repo
3. Set compose file path: `deploy/docker/docker-compose.prod.yml`
4. Set environment variables in the Coolify UI
5. Enable **Automatic SSL** in Coolify settings
6. Deploy

Coolify will automatically handle:
- HTTPS via Let's Encrypt
- Environment variable injection
- Health check monitoring
- Rolling restarts