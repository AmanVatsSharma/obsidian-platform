# Coolify Deployment Guide for Obsidian Platform

This guide covers deploying the Obsidian platform to [Coolify](https://coolify.io) using Docker.

## Prerequisites

1. **Coolify Instance** - Self-hosted or Coolify Cloud
2. **Domain/Subdomain** - For accessing the services
3. **PostgreSQL & Redis** - Either managed (Coolify addons) or included in docker-compose

---

## Deployment Options

### Option 1: Coolify + Docker Compose (Recommended)

This approach uses Coolify's native Docker Compose support.

#### Step 1: Push to Git

```bash
git add deploy/docker/
git commit -m "feat(docker): add Docker setup for Coolify deployment"
git push
```

#### Step 2: Create New Project in Coolify

1. Go to your Coolify dashboard
2. Click **"Add New Resource"** → **"Application"**
3. Connect your Git repository
4. Select the branch to deploy

#### Step 3: Configure Build Settings

In Coolify's application settings:

| Setting | Value |
|---------|-------|
| **Build Pack** | `dockercompose` |
| **Docker Compose File** | `deploy/docker/docker-compose.prod.yml` |
| **Workdir** | Leave empty |

#### Step 4: Environment Variables

Add these in Coolify's environment variables section:

```
# Database
DB_PASSWORD=your_secure_password

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=1d

# API URL (update for your domain)
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_PRANA_WS_URL=wss://your-domain.com/ws/prana
```

#### Step 5: Persistent Volumes

Map these volumes for data persistence:

| Volume | Container Path |
|--------|----------------|
| `postgres_data` | `/var/lib/postgresql/data` |
| `redis_data` | `/data` |

#### Step 6: Ports

Expose these ports:

| Service | Internal | External |
|---------|----------|----------|
| Backend | 3000 | 3000 |
| Web | 3000 | 4200 (or custom) |

---

### Option 2: Deploy Backend Separately

If you want backend and web on different servers:

#### Backend Deployment

1. Create new Coolify application
2. Set **Build Pack** to `dockerfile`
3. Dockerfile path: `deploy/docker/Dockerfile.backend`
4. Environment variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:pass@host:5432/obsidian
REDIS_URL=redis://host:6379
JWT_SECRET=your_secret
```

#### Web Deployment

1. Create new Coolify application
2. Set **Build Pack** to `dockerfile`
3. Dockerfile path: `deploy/docker/Dockerfile.web`
4. Environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_PRANA_WS_URL=wss://api.your-domain.com/ws/prana
```

---

## Coolify-Specific Tips

### Health Checks

Coolify uses health checks to determine if a service is running. The Dockerfiles include:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

### Resource Limits

Set appropriate resource limits in Coolify:

| Service | CPU | Memory |
|---------|-----|--------|
| Backend | 0.5 | 512 MB |
| Web | 0.5 | 512 MB |
| PostgreSQL | 0.5 | 512 MB |
| Redis | 0.25 | 256 MB |

### Domains & SSL

1. In Coolify, add a domain to each service:
   - Backend: `api.your-domain.com`
   - Web: `app.your-domain.com`

2. Enable **Let's Encrypt** for automatic SSL

3. Configure nginx/Caddy as reverse proxy (Coolify handles this automatically)

### Running Migrations

To run database migrations:

1. In Coolify, go to your application
2. Click **"Containers"** tab
3. Find the `migrations` service
4. Click **"Execute"**

Or via Coolify's manual deployment:

```bash
docker compose -f deploy/docker/docker-compose.prod.yml run --rm migrations
```

---

## Troubleshooting

### Backend Won't Start

1. Check logs: `docker logs obsidian-backend`
2. Verify DATABASE_URL is correct
3. Ensure PostgreSQL is healthy first

### Web Shows 502

1. Backend must be healthy before web starts
2. Check NEXT_PUBLIC_API_URL is accessible from browser

### WebSocket Issues

1. Ensure `NEXT_PUBLIC_PRANA_WS_URL` uses `wss://` in production
2. Check Coolify's WebSocket proxy settings

### Migration Failures

1. Run migrations manually first
2. Check PostgreSQL connection string format:
   ```
   postgres://user:password@host:5432/database
   ```

---

## Security Checklist

- [ ] Change default `DB_PASSWORD`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Enable SSL via Coolify's Let's Encrypt
- [ ] Set `SWAGGER_ENABLED=false` in production
- [ ] Configure firewall rules in Coolify
- [ ] Use Coolify's built-in backup for PostgreSQL volumes
