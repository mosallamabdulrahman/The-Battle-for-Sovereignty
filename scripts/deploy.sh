#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_CONTAINER_NAME="${APP_CONTAINER_NAME:-the-battle-for-sovereignty}"
DEPLOY_HEALTH_TIMEOUT="${DEPLOY_HEALTH_TIMEOUT:-180}"

cd "$ROOT_DIR"

docker compose up -d --build --no-deps app

start_time="$(date +%s)"

while true; do
  status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$APP_CONTAINER_NAME" 2>/dev/null || true)"

  if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
    echo "Deployment succeeded: $APP_CONTAINER_NAME is $status."
    exit 0
  fi

  if [ -z "$status" ]; then
    echo "Deployment failed: container $APP_CONTAINER_NAME was not found."
    exit 1
  fi

  if [ $(( $(date +%s) - start_time )) -ge "$DEPLOY_HEALTH_TIMEOUT" ]; then
    echo "Deployment failed: $APP_CONTAINER_NAME did not become healthy within ${DEPLOY_HEALTH_TIMEOUT}s."
    docker logs --tail 100 "$APP_CONTAINER_NAME" || true
    exit 1
  fi

  sleep 5
done
