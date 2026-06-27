#!/usr/bin/env bash
#
# Build & push the Plane front-end images wired to the Gauzy proxy.
#
# VITE_API_BASE_URL is baked in at BUILD TIME — Plane's Vite apps have no runtime
# env injection. So the build is per-environment:
#   MODE=custom  → .../api/plane/{tenantId}   (one image per tenant; tenant from the path)
#   MODE=shared  → .../api/plane              (one image for all; tenant from the session)
#
# Usage:  cp .env.example .env && $EDITOR .env && ./build-images.sh [web|space|admin|live ...]
#
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
[ -f .env ] && set -a && . ./.env && set +a

: "${GAUZY_API_URL:?set GAUZY_API_URL}"
: "${PLANE_SRC:?set PLANE_SRC (path to a Plane checkout)}"
: "${IMAGE_REGISTRY:?set IMAGE_REGISTRY}"
: "${IMAGE_TAG:?set IMAGE_TAG}"
MODE="${MODE:-custom}"
TOPOLOGY="${TOPOLOGY:-single}"
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"

# The one value that matters most: the proxy base URL baked into every front-end.
if [ "$MODE" = "shared" ]; then
  VITE_API_BASE_URL="${GAUZY_API_URL%/}/api/plane"
else
  : "${TENANT_ID:?set TENANT_ID for MODE=custom (the Gauzy tenant UUID)}"
  VITE_API_BASE_URL="${GAUZY_API_URL%/}/api/plane/${TENANT_ID}"
fi
echo "▶ MODE              = ${MODE}"
echo "▶ VITE_API_BASE_URL = ${VITE_API_BASE_URL}"
echo "▶ topology          = ${TOPOLOGY}"

# Cross-app URLs. In `single` topology everything is same-origin → leave *_BASE_URL
# empty (relative) and keep Plane's default *_BASE_PATH (/god-mode, /spaces, /live).
# In `subdomains` topology the web app must link out to the sibling hosts.
if [ "$TOPOLOGY" = "subdomains" ]; then
  ADMIN_BASE_URL="https://${PLANE_ADMIN_HOST}"
  SPACE_BASE_URL="https://${PLANE_SPACE_HOST}"
  LIVE_BASE_URL="https://${PLANE_LIVE_HOST}"
else
  ADMIN_BASE_URL=""; SPACE_BASE_URL=""; LIVE_BASE_URL=""
fi

reg() { echo "${IMAGE_REGISTRY%/}/plane-$1:${IMAGE_TAG}"; }

build_web() {
  local img; img="$(reg web)"
  echo "▶ build web → ${img}"
  docker build -f "${PLANE_SRC}/apps/web/Dockerfile.web" "${PLANE_SRC}" -t "${img}" \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    --build-arg VITE_ADMIN_BASE_URL="${ADMIN_BASE_URL}" \
    --build-arg VITE_ADMIN_BASE_PATH="/god-mode" \
    --build-arg VITE_SPACE_BASE_URL="${SPACE_BASE_URL}" \
    --build-arg VITE_SPACE_BASE_PATH="/spaces" \
    --build-arg VITE_LIVE_BASE_URL="${LIVE_BASE_URL}" \
    --build-arg VITE_LIVE_BASE_PATH="/live"
  docker push "${img}"
}

build_space() {
  local img; img="$(reg space)"
  echo "▶ build space → ${img}"
  docker build -f "${PLANE_SRC}/apps/space/Dockerfile.space" "${PLANE_SRC}" -t "${img}" \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    --build-arg VITE_SPACE_BASE_PATH="/spaces"
  docker push "${img}"
}

build_admin() {
  local img; img="$(reg admin)"
  echo "▶ build admin → ${img}"
  docker build -f "${PLANE_SRC}/apps/admin/Dockerfile.admin" "${PLANE_SRC}" -t "${img}" \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    --build-arg VITE_ADMIN_BASE_PATH="/god-mode"
  docker push "${img}"
}

build_live() {
  local img; img="$(reg live)"
  echo "▶ build live → ${img}"
  docker build -f "${PLANE_SRC}/apps/live/Dockerfile.live" "${PLANE_SRC}" -t "${img}"
  docker push "${img}"
}

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  targets=(web space)
  [ "${DEPLOY_ADMIN:-false}" = "true" ] && targets+=(admin)
  [ "${DEPLOY_LIVE:-false}" = "true" ]  && targets+=(live)
fi

for t in "${targets[@]}"; do
  case "$t" in
    web) build_web ;;
    space) build_space ;;
    admin) build_admin ;;
    live) build_live ;;
    *) echo "unknown target: $t" >&2; exit 1 ;;
  esac
done

echo "✓ done. Images tagged ${IMAGE_TAG} in ${IMAGE_REGISTRY}."
