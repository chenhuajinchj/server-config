# Dujiao-Next Switch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the retired legacy `dujiaoka` shop on `shop.xiaochens.com` with a fresh Dujiao-Next deployment while keeping the existing domain and reverse-proxy entrypoint.

**Architecture:** Keep `shop.xiaochens.com` on the existing Nginx Proxy Manager host and reuse backend port `8091`, but replace the service behind it with a new Docker Compose stack for Dujiao-Next. Run Dujiao-Next in same-origin mode: a lightweight gateway container serves the user frontend at `/`, the admin frontend at `/admin/`, and proxies `/api/` plus `/uploads/` to the API container. Use SQLite + Redis because there is no production order history to migrate.

**Tech Stack:** Docker Compose, `dujiaonext/api`, `dujiaonext/user`, `dujiaonext/admin`, `nginx:alpine`, Redis 7, SQLite, Nginx Proxy Manager

### Task 1: Confirm retirement scope and capture rollback data

**Files:**
- Create: `docs/plans/2026-04-11-dujiao-next-switch.md`
- Remote backup: `/root/service-cleanup-backups/20260411-dujiaoka-retire/`

**Step 1: Reconfirm legacy data footprint**

Run:

```bash
ssh -p 2222 root@107.172.86.147 \
  "docker exec lsky-mysql mysql -uroot -pLskyPro2026! -Nse \
  'SELECT COUNT(*) FROM dujiaoka.goods; SELECT COUNT(*) FROM dujiaoka.orders; SELECT COUNT(*) FROM dujiaoka.coupons;'"
```

Expected: goods are non-zero only if old test data exists; orders should be `0` before destructive cutover.

**Step 2: Back up old app directory and database**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "mkdir -p /root/service-cleanup-backups/20260411-dujiaoka-retire"
ssh -p 2222 root@107.172.86.147 \
  "tar -C /opt -czf /root/service-cleanup-backups/20260411-dujiaoka-retire/dujiaoka-opt.tgz dujiaoka"
ssh -p 2222 root@107.172.86.147 \
  "docker exec lsky-mysql mysqldump -uroot -pLskyPro2026! dujiaoka > /root/service-cleanup-backups/20260411-dujiaoka-retire/dujiaoka.sql"
```

Expected: both backup artifacts exist on the server before any containers are removed.

### Task 2: Add reproducible Dujiao-Next deployment assets to the repo

**Files:**
- Create: `dujiao-next/docker-compose.yml`
- Create: `dujiao-next/nginx.conf`
- Create: `dujiao-next/config.example.yml`
- Modify: `deploy.sh`

**Step 1: Add a same-origin gateway config**

Create `dujiao-next/nginx.conf` with:

```nginx
server {
    listen 80;
    server_name _;

    location = /admin {
        return 301 /admin/;
    }

    location /admin/ {
        proxy_pass http://admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://api:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://api:8080/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://user/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Step 2: Add a Compose stack that only exposes `8091`**

Create `dujiao-next/docker-compose.yml` with services:
- `gateway` binding `8091:80`
- `redis` with password protection and healthcheck
- `api` mounting `./config/config.yml`, `./data/db`, `./data/uploads`, `./data/logs`
- `user`
- `admin`

All services share an internal bridge network `dujiao-next`.

**Step 3: Add a safe config template**

Create `dujiao-next/config.example.yml` based on the official `config.yml.example`, but set:
- `server.mode: release`
- `database.driver: sqlite`
- `database.dsn: /app/db/dujiao.db`
- `redis.host: redis`
- `queue.host: redis`

Leave the JWT secrets and Redis password as placeholders so production secrets are generated remotely.

**Step 4: Make `deploy.sh` aware of the new project**

Add `dujiao-next` to `ALL_PROJECTS`, and sync the full `dujiao-next/` directory excluding `.env`, `config/config.yml`, and `data/`.

### Task 3: Prepare the remote Dujiao-Next stack

**Files:**
- Remote create: `/opt/dujiao-next/.env`
- Remote create: `/opt/dujiao-next/config/config.yml`
- Remote create: `/opt/dujiao-next/data/{db,uploads,logs,redis}`

**Step 1: Sync repo-managed files**

Run:

```bash
./deploy.sh dujiao-next
```

Expected: `/opt/dujiao-next/` contains `docker-compose.yml`, `nginx.conf`, and `config.example.yml`.

**Step 2: Generate production secrets remotely**

Generate:
- a strong admin password
- `jwt.secret`
- `user_jwt.secret`
- `REDIS_PASSWORD`

Store them in `/opt/dujiao-next/.env` and `/opt/dujiao-next/config/config.yml`.

**Step 3: Create runtime directories and permissions**

Run:

```bash
ssh -p 2222 root@107.172.86.147 \
  "mkdir -p /opt/dujiao-next/config /opt/dujiao-next/data/{db,uploads,logs,redis} && chmod -R 0777 /opt/dujiao-next/data"
```

Expected: API container can write SQLite, upload, and log data without permission failures.

### Task 4: Cut over `shop.xiaochens.com`

**Files:**
- Remote remove: `/opt/dujiaoka/`
- Remote stack: `/opt/dujiao-next/`

**Step 1: Stop and remove the legacy containers**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "cd /opt/dujiaoka && docker compose down"
```

Expected: old `dujiaoka` and `dujiaoka-redis` containers are gone and host port `8091` is free.

**Step 2: Optionally drop the retired legacy database after backup**

Run:

```bash
ssh -p 2222 root@107.172.86.147 \
  "docker exec lsky-mysql mysql -uroot -pLskyPro2026! -e 'DROP DATABASE IF EXISTS dujiaoka;'"
```

Expected: no live dependency remains on the retired schema.

**Step 3: Start the new stack**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "cd /opt/dujiao-next && docker compose up -d"
```

Expected: `dujiaonext-gateway` owns port `8091`, so the existing NPM proxy host keeps serving the same public domain with no DNS change.

### Task 5: Verify and document the new state

**Files:**
- Optional modify: `/Users/chenhuajin/Library/Mobile Documents/iCloud~md~obsidian/Documents/资源库/存档/服务器清单.md`

**Step 1: Verify the runtime**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "cd /opt/dujiao-next && docker compose ps"
ssh -p 2222 root@107.172.86.147 "curl -I http://127.0.0.1:8091/"
ssh -p 2222 root@107.172.86.147 "curl -I http://127.0.0.1:8091/admin/"
ssh -p 2222 root@107.172.86.147 "curl -s http://127.0.0.1:8091/api/health || curl -s http://127.0.0.1:8091/health"
```

Expected: user homepage, admin page, and API health endpoint all respond successfully.

**Step 2: Verify the public site**

Check:
- `https://shop.xiaochens.com`
- `https://shop.xiaochens.com/admin/`

Expected: both load over the existing domain and TLS certificate.

**Step 3: Record the result**

Document:
- deployment path
- admin URL
- initial admin username/password
- backup location of the retired service
- whether the old MySQL database was dropped
