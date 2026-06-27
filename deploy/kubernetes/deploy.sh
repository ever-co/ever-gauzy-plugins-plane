#!/usr/bin/env bash
#
# Render the Plane UI manifests with values from .env and apply them.
# Mirrors the Gauzy house pattern: envsubst over $PLACEHOLDERs, then kubectl apply.
#
# Usage:  ./deploy.sh            # apply
#         ./deploy.sh --dry-run  # render to stdout, do not apply
#
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
[ -f .env ] && set -a && . ./.env && set +a

: "${GAUZY_API_URL:?}"; : "${TENANT_ID:?}"; : "${IMAGE_REGISTRY:?}"; : "${IMAGE_TAG:?}"
: "${PLANE_HOST:?}"; : "${PLANE_NAMESPACE:?}"
TOPOLOGY="${TOPOLOGY:-single}"
DRY_RUN="${1:-}"

export VITE_API_BASE_URL="${GAUZY_API_URL%/}/api/plane/${TENANT_ID}"
export IMAGE_WEB="${IMAGE_REGISTRY%/}/plane-web:${IMAGE_TAG}"
export IMAGE_SPACE="${IMAGE_REGISTRY%/}/plane-space:${IMAGE_TAG}"
export IMAGE_ADMIN="${IMAGE_REGISTRY%/}/plane-admin:${IMAGE_TAG}"
export IMAGE_LIVE="${IMAGE_REGISTRY%/}/plane-live:${IMAGE_TAG}"
export INGRESS_CLASS="${INGRESS_CLASS:-nginx}"
export REPLICAS="${REPLICAS:-2}"
export CPU_REQUEST="${CPU_REQUEST:-50m}"
export MEM_REQUEST="${MEM_REQUEST:-128Mi}"
export PLANE_NAMESPACE PLANE_HOST PLANE_ADMIN_HOST PLANE_SPACE_HOST PLANE_LIVE_HOST
export TLS_SECRET_WEB TLS_SECRET_ADMIN TLS_SECRET_SPACE
export LIVE_SERVER_SECRET_KEY GAUZY_API_URL TENANT_ID

# Optional cert-manager annotation (blank → rely on pre-created <host>-tls secret)
if [ -n "${CERT_MANAGER_ISSUER:-}" ]; then
  export CERT_ANNOTATION="cert-manager.io/cluster-issuer: \"${CERT_MANAGER_ISSUER}\""
else
  export CERT_ANNOTATION="# (no cert-manager; pre-create the <host>-tls secret)"
fi

# Assemble the manifest set for the chosen topology / options.
files=(manifests/00-namespace.yaml manifests/10-web.yaml manifests/20-space.yaml)
[ "${DEPLOY_ADMIN:-false}" = "true" ] && files+=(manifests/30-admin.yaml)
[ "${DEPLOY_LIVE:-false}" = "true" ]  && files+=(manifests/40-live.yaml)
if [ "$TOPOLOGY" = "subdomains" ]; then
  files+=(manifests/51-ingress-subdomains.yaml)
else
  files+=(manifests/50-ingress.yaml)
fi

# envsubst only the variables we explicitly export (so stray $ in the YAML is safe).
VARS='$VITE_API_BASE_URL $IMAGE_WEB $IMAGE_SPACE $IMAGE_ADMIN $IMAGE_LIVE
$INGRESS_CLASS $REPLICAS $CPU_REQUEST $MEM_REQUEST $PLANE_NAMESPACE $PLANE_HOST
$PLANE_ADMIN_HOST $PLANE_SPACE_HOST $PLANE_LIVE_HOST $TLS_SECRET_WEB $TLS_SECRET_ADMIN
$TLS_SECRET_SPACE $LIVE_SERVER_SECRET_KEY $GAUZY_API_URL $TENANT_ID $CERT_ANNOTATION'

render() { for f in "${files[@]}"; do echo "---"; envsubst "$VARS" < "$f"; done; }

if [ "$DRY_RUN" = "--dry-run" ]; then
  render
  exit 0
fi

echo "▶ applying to ns/${PLANE_NAMESPACE} (context ${KUBE_CONTEXT:-current}), topology=${TOPOLOGY}"
render | kubectl ${KUBE_CONTEXT:+--context "$KUBE_CONTEXT"} apply -f -

# Pull freshly-pushed images even if the spec is unchanged (house pattern).
for d in plane-web plane-space $([ "${DEPLOY_ADMIN:-false}" = "true" ] && echo plane-admin) \
         $([ "${DEPLOY_LIVE:-false}" = "true" ] && echo plane-live); do
  kubectl ${KUBE_CONTEXT:+--context "$KUBE_CONTEXT"} -n "$PLANE_NAMESPACE" \
    rollout restart "deployment/$d" 2>/dev/null || true
done

echo "✓ applied. Check: kubectl -n ${PLANE_NAMESPACE} get pods,svc,ingress"
