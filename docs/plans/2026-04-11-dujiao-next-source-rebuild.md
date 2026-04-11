# Dujiao-Next Source Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current image-based Dujiao-Next deployment with a source-cloned, source-built deployment that keeps `shop.xiaochens.com` for the storefront and moves the admin console to `admin.xiaochens.com`.

**Architecture:** Keep the current runtime split into `api`, `user`, `admin`, `gateway`, `admin-gateway`, and `redis`, but rebuild the `api`, `user`, and `admin` images from the official source repositories checked out on the server under `/opt/dujiao-next-source/`. Keep the storefront API same-origin on `shop.xiaochens.com`, point the admin frontend at `https://shop.xiaochens.com` for API calls, and route `admin.xiaochens.com` to the dedicated admin gateway.

**Tech Stack:** Docker Compose, Docker build, Go, Vue 3, Vite, Nginx, Redis, SQLite, Cloudflare DNS, Nginx Proxy Manager

### Task 1: Replace the deployment definition with source builds

**Files:**
- Modify: `dujiao-next/docker-compose.yml`
- Modify: `dujiao-next/nginx.conf`
- Modify: `dujiao-next/config.example.yml`
- Create: `dujiao-next/user.env.production.example`
- Create: `dujiao-next/admin.env.production.example`

**Step 1: Build containers from sibling source repos**

Point Compose build contexts at:
- `../dujiao-next-source/api`
- `../dujiao-next-source/user`
- `../dujiao-next-source/admin`

Expected: `/opt/dujiao-next/docker-compose.yml` can rebuild every application image from the cloned source trees on the server.

**Step 2: Fix the storefront gateway redirect**

Redirect `/admin` and `/admin/` on `shop.xiaochens.com` to `https://admin.xiaochens.com/`.

Expected: users stop landing on a broken same-origin admin path.

**Step 3: Template the frontend build env**

Create:
- `dujiao-next/user.env.production.example`
- `dujiao-next/admin.env.production.example`

Expected: the source-built frontends can be pointed at the correct API origin before each rebuild.

### Task 2: Prepare and refresh the official source repos on the server

**Files:**
- Remote create: `/opt/dujiao-next-source/api`
- Remote create: `/opt/dujiao-next-source/user`
- Remote create: `/opt/dujiao-next-source/admin`

**Step 1: Clone the official repos**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "rm -rf /opt/dujiao-next-source && mkdir -p /opt/dujiao-next-source"
ssh -p 2222 root@107.172.86.147 "git clone --depth 1 https://github.com/dujiao-next/dujiao-next.git /opt/dujiao-next-source/api"
ssh -p 2222 root@107.172.86.147 "git clone --depth 1 https://github.com/dujiao-next/user.git /opt/dujiao-next-source/user"
ssh -p 2222 root@107.172.86.147 "git clone --depth 1 https://github.com/dujiao-next/admin.git /opt/dujiao-next-source/admin"
```

Expected: the server contains a clean source checkout for each official repository.

**Step 2: Write frontend build env files**

Create:
- `/opt/dujiao-next-source/user/.env.production`
- `/opt/dujiao-next-source/admin/.env.production`

Expected:
- storefront uses same-origin API
- admin uses `VITE_API_BASE_URL=https://shop.xiaochens.com`

### Task 3: Rebuild the running stack from source

**Files:**
- Remote modify: `/opt/dujiao-next/config/config.yml`
- Remote modify: `/opt/dujiao-next/.env`

**Step 1: Keep API config valid**

Ensure:
- no stray `EOF` lines remain
- CORS includes both storefront and admin domains
- Redis host is `redis`

**Step 2: Rebuild application containers**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "cd /opt/dujiao-next && docker compose build api user admin"
ssh -p 2222 root@107.172.86.147 "cd /opt/dujiao-next && docker compose up -d --force-recreate api user admin gateway admin-gateway"
```

Expected: the live deployment now runs source-built images rather than the vendor images.

### Task 4: Add the dedicated admin domain

**Files:**
- Remote modify: `/opt/npm/data/database.sqlite`

**Step 1: Create DNS**

Add `admin.xiaochens.com` to Cloudflare as an orange-cloud `A` record pointed at `107.172.86.147`.

**Step 2: Add the proxy host**

Add a new Nginx Proxy Manager host:
- domain: `admin.xiaochens.com`
- target: `107.172.86.147:8093`
- SSL: Let's Encrypt

Expected: the admin frontend becomes reachable on a dedicated HTTPS domain.

### Task 5: Clean up retired artifacts and verify end-to-end

**Files:**
- Remote delete: `/root/service-cleanup-backups/20260411-dujiaoka-retire`

**Step 1: Remove the no-longer-needed old backup**

Run:

```bash
ssh -p 2222 root@107.172.86.147 "rm -rf /root/service-cleanup-backups/20260411-dujiaoka-retire"
```

**Step 2: Verify the final state**

Check:
- `https://shop.xiaochens.com`
- `https://shop.xiaochens.com/admin/` returns a redirect to `https://admin.xiaochens.com/`
- `https://admin.xiaochens.com/`
- admin login succeeds
- `docker compose images` shows locally built images for `api`, `user`, and `admin`
