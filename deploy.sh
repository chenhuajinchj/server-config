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

ALL_PROJECTS=(homepage halo lsky newapi aiclient dujiaoka npm cliproxyapi)

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
            files=(index.html avatar.png robots.txt sitemap.xml docker-compose.yml)
            ;;
        dujiaoka)
            files=(docker-compose.yml .env)
            ;;
        cliproxyapi)
            files=(config.yaml)
            ;;
        halo|lsky|newapi|aiclient|npm)
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
