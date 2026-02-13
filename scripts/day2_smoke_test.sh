#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SMOKE_USER_ID="${SMOKE_USER_ID:-day2-smoke-user}"

assert_json_expr() {
  local json="$1"
  local expr="$2"
  JSON_INPUT="$json" node -e "const data=JSON.parse(process.env.JSON_INPUT||'{}'); if(!(${expr})) { process.exit(1); }"
}

extract_json_expr() {
  local json="$1"
  local expr="$2"
  JSON_INPUT="$json" node -e "const data=JSON.parse(process.env.JSON_INPUT||'{}'); const value=(${expr}); if(typeof value==='object') console.log(JSON.stringify(value)); else console.log(String(value));"
}

if ! curl -sf "$BASE_URL/api/ai/health" >/dev/null; then
  echo "Dev server is not reachable at $BASE_URL. Start it with npm run dev."
  exit 1
fi

echo "[1/4] Seeding Day 2 schemes via API"
SEED_RESPONSE="$(curl -s -X POST "$BASE_URL/api/schemes/seed")"
if JSON_INPUT="$SEED_RESPONSE" node -e "const data=JSON.parse(process.env.JSON_INPUT||'{}'); process.exit(data.success ? 0 : 1);" >/dev/null 2>&1; then
  COUNT="$(extract_json_expr "$SEED_RESPONSE" "data.count")"
  echo "Seeded records: $COUNT"
else
  ERR="$(extract_json_expr "$SEED_RESPONSE" "data.error || 'unknown seed error'")"
  echo "Seed step could not write Firestore catalog (expected under restricted rules): $ERR"
fi

echo "[2/4] Ensuring profile fixture exists for scoring"
PROFILE_RESPONSE="$(curl -s -X POST "$BASE_URL/api/farm-profile" -H 'Content-Type: application/json' -d "{\"userId\":\"$SMOKE_USER_ID\",\"profile\":{\"farmerName\":\"Day2 Smoke\",\"preferredLanguage\":\"English\",\"landSize\":2,\"landUnit\":\"acres\",\"soilType\":\"loamy\",\"irrigationType\":\"drip\",\"location\":{\"state\":\"Odisha\",\"district\":\"Khordha\"},\"primaryCrops\":[\"rice\",\"paddy\"],\"annualBudget\":150000,\"riskPreference\":\"medium\",\"historicalChallenges\":[],\"notes\":\"smoke\"}}")"
assert_json_expr "$PROFILE_RESPONSE" "data.success === true"

echo "[3/4] Fetching recommendations"
RECO_RESPONSE="$(curl -s "$BASE_URL/api/schemes/recommendations?userId=$SMOKE_USER_ID&limit=8")"
assert_json_expr "$RECO_RESPONSE" "data.success === true"
assert_json_expr "$RECO_RESPONSE" "Array.isArray(data.data.recommendations) && data.data.recommendations.length >= 5"
assert_json_expr "$RECO_RESPONSE" "['firestore','local_seed_fallback'].includes(data.data.catalogSource)"
TOP_SCORE="$(extract_json_expr "$RECO_RESPONSE" "data.data.recommendations[0].score")"
echo "Top recommendation score: $TOP_SCORE"

echo "[4/4] Toggling save-for-later + satellite ingest"
TOP_SCHEME_ID="$(extract_json_expr "$RECO_RESPONSE" "data.data.recommendations[0].schemeId")"
SAVE_RESPONSE="$(curl -s -X POST "$BASE_URL/api/schemes/saved" -H 'Content-Type: application/json' -d "{\"userId\":\"$SMOKE_USER_ID\",\"schemeId\":\"$TOP_SCHEME_ID\",\"saved\":true}")"
assert_json_expr "$SAVE_RESPONSE" "data.success === true"
echo "Saved scheme: $TOP_SCHEME_ID"

SAT_RESPONSE="$(curl -s "$BASE_URL/api/satellite/ingest?userId=$SMOKE_USER_ID&maxResults=2&maxCloudCover=35&allowFallback=true")"
assert_json_expr "$SAT_RESPONSE" "Array.isArray(data.data.ingest.scenes) && data.data.ingest.scenes.length >= 2"
SOURCE="$(extract_json_expr "$SAT_RESPONSE" "data.data.ingest.dataSource")"
echo "Satellite data source: $SOURCE"

echo "Day 2 smoke test completed successfully."
