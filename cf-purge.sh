#!/usr/bin/env bash
# Cloudflare 缓存清除脚本
# 用法: bash cf-purge.sh [url]
#   无参数: 清除所有缓存
#   有参数: 清除指定 URL 的缓存
set -euo pipefail

source ~/.cloudflare.env

if [[ $# -eq 0 ]]; then
    echo "Purging ALL cache for zone ${CF_ZONE_ID}..."
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
else
    FILES=$(printf '"%s",' "$@")
    FILES="[${FILES%,}]"
    echo "Purging: $@"
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{\"files\":${FILES}}"
fi

echo ""
echo "Done."
