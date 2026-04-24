#!/usr/bin/env bash
# setup-vercel-env.sh
# ─────────────────────────────────────────────────────────────────────────────
# One-shot script that pushes all required production environment variables to
# your Vercel project via the Vercel REST API.
#
# Usage:
#   VERCEL_TOKEN=<your-token> bash scripts/setup-vercel-env.sh
#
# Get your token at: https://vercel.com/account/tokens
# Find your project ID at: https://vercel.com/<team>/<project>/settings
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Required inputs ──────────────────────────────────────────────────────────
VERCEL_TOKEN="${VERCEL_TOKEN:?ERROR: Set VERCEL_TOKEN before running this script}"
PROJECT_ID="${VERCEL_PROJECT_ID:?ERROR: Set VERCEL_PROJECT_ID (found in Vercel project settings)}"
TEAM_ID="${VERCEL_TEAM_ID:-}"  # empty for personal accounts

# ── Read values from .env.local ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env.local not found at $ENV_FILE"
  exit 1
fi

load_env_var() {
  grep -E "^$1=" "$ENV_FILE" | sed "s/^$1=//" | tr -d '"' || true
}

RESEND_API_KEY="$(load_env_var RESEND_API_KEY)"
ENCRYPTION_KEY="$(load_env_var ENCRYPTION_KEY)"
AUTH_SECRET="$(load_env_var AUTH_SECRET)"

# ── Vercel API helper ─────────────────────────────────────────────────────────
add_env() {
  local key="$1"
  local value="$2"
  local targets="${3:-production}"  # comma-separated: production,preview,development

  if [[ -z "$value" ]]; then
    echo "  SKIP  $key (empty value — set it in .env.local first)"
    return
  fi

  TEAM_PARAM=""
  [[ -n "$TEAM_ID" ]] && TEAM_PARAM="?teamId=$TEAM_ID"

  TARGET_JSON=$(echo "$targets" | tr ',' '\n' | jq -R . | jq -s .)

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env${TEAM_PARAM}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"${key}\",\"value\":$(echo "$value" | jq -Rs .),\"type\":\"encrypted\",\"target\":${TARGET_JSON}}")

  if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "201" ]]; then
    echo "  SET   $key → production"
  elif [[ "$HTTP_STATUS" == "409" ]]; then
    echo "  SKIP  $key (already exists — update manually in Vercel dashboard if needed)"
  else
    echo "  FAIL  $key (HTTP $HTTP_STATUS)"
  fi
}

echo ""
echo "OneBank TMS — Vercel Production Env Setup"
echo "Project: $PROJECT_ID"
echo "─────────────────────────────────────────"

# ── Core secrets ─────────────────────────────────────────────────────────────
add_env "AUTH_SECRET"      "$AUTH_SECRET"
add_env "RESEND_API_KEY"   "$RESEND_API_KEY"
add_env "ENCRYPTION_KEY"   "$ENCRYPTION_KEY"

# ── Email sender ──────────────────────────────────────────────────────────────
# Change this to your verified Resend sender once onebank.co.za is verified
add_env "RESEND_FROM" "OneBank TMS <onboarding@resend.dev>"

# ── App URL (update to your real domain) ─────────────────────────────────────
add_env "NEXTAUTH_URL" "https://onebank-sa-iota.vercel.app"

echo "─────────────────────────────────────────"
echo "Done. Redeploy the project for changes to take effect:"
echo "  npx vercel --prod"
echo ""
