#!/usr/bin/env bash
set -euo pipefail

SERVER="root@107.172.86.147"
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${YELLOW}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

ALL_PROJECTS=(homepage homepage-v2 halo lsky newapi aiclient dujiaoka npm cliproxyapi blog blog-landing)

usage() {
    echo "Usage: $0 <project|all>"
    echo ""
    echo "Available projects:"
    for p in "${ALL_PROJECTS[@]}"; do
        echo "  - $p"
    done
    echo "  - all  (deploy every project)"
    exit 1
}

deploy_project() {
    local project="$1"
    local remote_dir="/opt/${project}"
    local local_dir="${BASE_DIR}/${project}"
    local files=()

    case "$project" in
        homepage)
            files=(index.html avatar.png shop-card.png robots.txt sitemap.xml google36cc04761872de85.html docker-compose.yml)
            ;;
        homepage-v2)
            info "Deploying homepage-v2 (full project rsync)..."
            ssh "$SERVER" "mkdir -p ${remote_dir}"
            rsync -avz --delete \
                --exclude='node_modules' \
                --exclude='.next' \
                --exclude='.git' \
                --exclude='.env' \
                "${local_dir}/" "${SERVER}:${remote_dir}/"
            if [[ -f "${local_dir}/.env" ]]; then
                info "Syncing .env → ${SERVER}:${remote_dir}/.env"
                rsync -avz "${local_dir}/.env" "${SERVER}:${remote_dir}/.env"
            fi
            info "Building and starting containers for homepage-v2..."
            ssh "$SERVER" "cd ${remote_dir} && docker compose up -d --build"
            success "Deploy complete: homepage-v2"
            return 0
            ;;
        dujiaoka)
            files=(docker-compose.yml .env pixel-theme.css install.lock shop-logo.png)
            ;;
        cliproxyapi)
            files=(config.yaml)
            ;;
        blog)
            info "Building blog..."
            (cd "${local_dir}" && pnpm build)
            ssh "$SERVER" "mkdir -p ${remote_dir}"
            info "Syncing dist/ → ${SERVER}:${remote_dir}/dist/"
            rsync -avz --delete "${local_dir}/dist/" "${SERVER}:${remote_dir}/dist/"
            for f in docker-compose.yml nginx.conf; do
                info "Syncing ${f} → ${SERVER}:${remote_dir}/${f}"
                rsync -avz "${local_dir}/${f}" "${SERVER}:${remote_dir}/${f}"
            done
            info "Restarting containers for blog..."
            ssh "$SERVER" "cd ${remote_dir} && docker compose up -d --force-recreate"
            success "Deploy complete: blog"
            return 0
            ;;
        newapi)
            files=(docker-compose.yml)
            # Also sync custom-pages to both newapi and NPM paths
            local custom_src="${local_dir}/custom-pages"
            if [[ -d "$custom_src" ]]; then
                local npm_custom="/opt/npm/data/nginx/custom-pages/newapi"
                local newapi_custom="${remote_dir}/custom-pages"
                ssh "$SERVER" "mkdir -p ${newapi_custom} ${npm_custom}"
                info "Syncing custom-pages → ${SERVER}:${newapi_custom}/"
                rsync -avz "${custom_src}/" "${SERVER}:${newapi_custom}/"
                info "Syncing custom-pages → ${SERVER}:${npm_custom}/"
                rsync -avz "${custom_src}/" "${SERVER}:${npm_custom}/"
            fi
            ;;
        blog-landing)
            files=(index.html docker-compose.yml robots.txt)
            ;;
        halo|lsky|aiclient|npm)
            files=(docker-compose.yml)
            ;;
        *)
            error "Unknown project: ${project}"
            echo "Valid projects: ${ALL_PROJECTS[*]}"
            return 1
            ;;
    esac

    echo ""
    info "========== Deploying: ${project} =========="
    info "Files: ${files[*]}"
    info "Target: ${SERVER}:${remote_dir}/"

    # Determine which files actually exist and will be synced
    local synced_files=()
    for f in "${files[@]}"; do
        if [[ -f "${local_dir}/${f}" ]]; then
            synced_files+=("$f")
        else
            error "File not found: ${local_dir}/${f} — skipping"
        fi
    done

    if [[ ${#synced_files[@]} -eq 0 ]]; then
        error "No files to deploy for ${project}"
        return 1
    fi

    # Ensure remote directory exists
    ssh "$SERVER" "mkdir -p ${remote_dir}"

    # Sync files
    for f in "${synced_files[@]}"; do
        info "Syncing ${f} → ${SERVER}:${remote_dir}/${f}"
        rsync -avz "${local_dir}/${f}" "${SERVER}:${remote_dir}/${f}"
    done

    # Always restart to refresh bind mounts (rsync creates new inodes)
    info "Restarting containers for ${project}..."
    ssh "$SERVER" "cd ${remote_dir} && docker compose up -d --force-recreate"

    success "Deploy complete: ${project}"
}

# --- Main ---

if [[ $# -lt 1 ]]; then
    usage
fi

target="$1"

if [[ "$target" == "all" ]]; then
    info "Deploying ALL projects..."
    for p in "${ALL_PROJECTS[@]}"; do
        deploy_project "$p" || error "Failed to deploy ${p}, continuing..."
    done
    echo ""
    success "All projects deployed."
else
    deploy_project "$target"
fi
