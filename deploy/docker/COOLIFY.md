# Coolify Deployment Guide for Obsidian Platform

This guide covers deploying the Obsidian platform to [Coolify](https://coolify.io) using Docker.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Coolify Server                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Nginx (Port 80/443)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐     ┌─────────────┐    ┌──────────────┐      │
│  │    Web     │     │   Broker    │    │   Backend    │      │
│  │  :3000     │     │   Admin     │    │    :3000     │      │
│  │ (Trader)   │     │   :3000     │    │    (API)     │      │
│  └─────────────┘     └─────────────┘    └──────┬───────┘      │
│                                                  │              │
│                              ┌───────────────────┼───────────┐  │
│                              ▼                   ▼           │  │
│                       ┌─────────────┐     ┌─────────────┐   │  │
│                       │ PostgreSQL  │     │    Redis    │   │  │
│                       │   :5432     │     │   :6379     │   │  │
│                       └─────────────┘     └─────────────┘   │  │
│                                                               │  │
└───────────────────────────────────────────────────────────────┘
```

---

## Quick Deployment Steps

### Step 1: Push Changes to Git

```bash
git add deploy/docker/
git commit -m "feat(docker): add Docker setup for Coolify with broker-admin"
git push origin main
```

### Step 2: Create Project in Coolify

1. Go to your Coolify dashboard
2. Click **"Add New Resource"** → **"Application"**
3. Connect your Git repository: `https://github.com/AmanVatsSharma/obsidian-platform`
4. Select **Branch**: `main`

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Build Pack** | `Docker Compose` |
| **Base Directory** | `/` |
| **Docker Compose Location** | `deploy/docker/docker-compose.prod.yml` |

### Step 4: Environment Variables

In Coolify's environment variables section, add:

```
# ===================
# Database
# ===================
DB_PASSWORD=your_secure_password_min_32_chars

# ===================
# Authentication (REQUIRED)
# ===================
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=1d

# ===================
# URLs (Update with your domain after setup)
# ===================
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_PRANA_WS_URL=wss://api.your-domain.com/ws/prana
```

### Step 5: Deploy

Click **"Deploy"** — Coolify will:
1. Pull the latest code from Git
2. Build all Docker images (backend, web, broker-admin)
3. Start PostgreSQL and Redis
4. Run health checks on all services

### Step 6: Run Migrations

After first deploy, run database migrations:

1. In Coolify, go to **Containers** tab
2. Find `obsidian-migrations`
3. Click **Execute**

---

## Domain Connection Guide

### Option 1: Coolify Managed Domains (Recommended)

Coolify can automatically handle SSL with Let's Encrypt.

#### Step 1: Configure Nginx for Domain Routing

Update `deploy/docker/nginx.conf` with your domain:

```nginx
server {
    listen 80;
    server_name api.your-domain.com admin.your-domain.com app.your-domain.com;
    # ...
}
```

#### Step 2: Add Domains in Coolify

1. Go to your **Project** → **Environment** → **Networking**
2. Click **"Add Domain"**
3. Add domains for each service:

| Service | Domain | SSL |
|---------|--------|-----|
| Main App | `app.your-domain.com` | Auto (Let's Encrypt) |
| API | `api.your-domain.com` | Auto (Let's Encrypt) |
| Broker Admin | `admin.your-domain.com` | Auto (Let's Encrypt) |

#### Step 3: Update DNS Records

Add these DNS records at your registrar:

```
Type    Name    Value
A       app     <YOUR_COOLIFY_SERVER_IP>
A       api     <YOUR_COOLIFY_SERVER_IP>
A       admin   <YOUR_COOLIFY_SERVER_IP>
```

#### Step 4: Update Environment Variables

After adding domains, update in Coolify:

```
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_PRANA_WS_URL=wss://api.your-domain.com/ws/prana
```

---

### Option 2: External Nginx/Caddy with Coolify

If you're using an external reverse proxy:

#### Using Caddy (Recommended for Easy SSL)

```caddyfile
# Caddyfile
api.your-domain.com {
    reverse_proxy localhost:3000
}

admin.your-domain.com {
    reverse_proxy localhost:4500
}

app.your-domain.com {
    reverse_proxy localhost:4200
}
```

#### Using Nginx with Let's Encrypt

```nginx
# /etc/nginx/sites-available/obsidian
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Service URLs After Deployment

| Service | Internal URL | External URL (with domain) |
|---------|--------------|---------------------------|
| Backend API | `http://backend:3000` | `https://api.your-domain.com` |
| Web (Trader) | `http://web:3000` | `https://app.your-domain.com` |
| Broker Admin | `http://broker-admin:3000` | `https://admin.your-domain.com` |
| PostgreSQL | `postgres://postgres:5432` | Internal only |
| Redis | `redis://redis:6379` | Internal only |

---

## Nginx Routing for Multiple Subdomains

Update `deploy/docker/nginx.conf` to route by subdomain:

```nginx
http {
    # Default server (catch-all)
    server {
        listen 80 default_server;
        server_name _;
        return 404;
    }

    # API Server
    server {
        listen 80;
        server_name api.your-domain.com;

        location / {
            proxy_pass http://backend:3000;
            # ... proxy headers ...
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # Broker Admin
    server {
        listen 80;
        server_name admin.your-domain.com;

        location / {
            proxy_pass http://broker-admin:3000;
            # ... proxy headers ...
        }
    }

    # Main App (Trader Terminal)
    server {
        listen 80;
        server_name app.your-domain.com;

        location / {
            proxy_pass http://web:3000;
            # ... proxy headers ...
        }
    }
}
```

---

## SSL Configuration with Let's Encrypt

### Option A: Coolify Automatic SSL (Recommended)

1. In Coolify, add domains with **"Generate Let's Encrypt Certificate"** enabled
2. Coolify handles certificate renewal automatically

### Option B: Manual Let's Encrypt

```bash
# On your Coolify server
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d api.your-domain.com -d admin.your-domain.com -d app.your-domain.com

# Auto-renewal is automatic
sudo certbot renew --dry-run
```

---

## Troubleshooting

### "502 Bad Gateway" Error

1. Check if backend is healthy: `docker logs obsidian-backend`
2. Verify `NEXT_PUBLIC_API_URL` points to correct backend URL
3. Ensure nginx can reach backend: `docker exec obsidian-nginx ping backend`

### WebSocket Connection Failed

1. Ensure `NEXT_PUBLIC_PRANA_WS_URL` uses `wss://` in production
2. Check nginx WebSocket headers:
   ```nginx
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```
3. Verify Coolify's websocket proxy settings

### Database Connection Failed

1. Check PostgreSQL logs: `docker logs obsidian-postgres`
2. Verify `DATABASE_URL` format:
   ```
   postgres://user:password@host:5432/database
   ```
3. Ensure PostgreSQL is healthy before backend starts

### Build Failures

1. Check Coolify build logs
2. Ensure sufficient disk space on server
3. Try rebuilding without cache

---

## Security Checklist

- [ ] Change default `DB_PASSWORD` to strong password (32+ chars)
- [ ] Use strong `JWT_SECRET` (32+ chars)
- [ ] Enable SSL via Coolify's Let's Encrypt or manual certbot
- [ ] Set `SWAGGER_ENABLED=false` in production
- [ ] Configure firewall rules (only ports 80, 443 exposed)
- [ ] Enable Coolify's built-in backup for PostgreSQL
- [ ] Use subdomains instead of paths for service isolation

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_PASSWORD` | Yes | - | PostgreSQL password |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | `1d` | Token expiration |
| `NEXT_PUBLIC_API_URL` | No | `http://backend:3000` | Backend API URL |
| `NEXT_PUBLIC_PRANA_WS_URL` | No | `ws://backend:3000/ws/prana` | WebSocket URL |
| `SWAGGER_ENABLED` | No | `false` | Enable Swagger docs |
