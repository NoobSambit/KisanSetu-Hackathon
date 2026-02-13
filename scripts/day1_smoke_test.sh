#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
USER_ID="${USER_ID:-day1-smoke-user}"
SESSION_ID="${SESSION_ID:-day1-smoke-session}"

json_get() {
  local json="$1"
  local expr="$2"
  JSON_INPUT="$json" node -e "const data = JSON.parse(process.env.JSON_INPUT || '{}'); const value = (function(){ return ${expr}; })(); if (value === undefined || value === null) process.exit(2); if (typeof value === 'object') console.log(JSON.stringify(value)); else console.log(String(value));"
}

json_assert_true() {
  local json="$1"
  local expr="$2"
  JSON_INPUT="$json" node -e "const data = JSON.parse(process.env.JSON_INPUT || '{}'); const ok = !!(${expr}); if (!ok) { console.error('Assertion failed'); process.exit(1); }"
}

echo "[1/5] Checking local AI health"
HEALTH_RESPONSE="$(curl -sS "$BASE_URL/api/ai/health")"
json_assert_true "$HEALTH_RESPONSE" "data.success === true"
json_assert_true "$HEALTH_RESPONSE" "data.provider === 'ollama'"
json_assert_true "$HEALTH_RESPONSE" "data.model.includes('qwen2.5:7b')"
HEALTH_LATENCY="$(json_get "$HEALTH_RESPONSE" "data.latencyMs")"
echo "Health latency: ${HEALTH_LATENCY}ms"

echo "[2/5] Saving farm profile"
SAVE_PAYLOAD='{"userId":"'"$USER_ID"'","profile":{"farmerName":"Day1 Tester","preferredLanguage":"English","landSize":3.5,"landUnit":"acres","soilType":"black","irrigationType":"drip","waterSource":"borewell","location":{"state":"Maharashtra","district":"Nashik","village":"Pimpalgaon"},"primaryCrops":["onion","tomato"],"annualBudget":150000,"riskPreference":"medium","historicalChallenges":["leaf blight"],"notes":"Focus on market timing"}}'
SAVE_RESPONSE="$(curl -sS -X POST "$BASE_URL/api/farm-profile" -H 'Content-Type: application/json' -d "$SAVE_PAYLOAD")"
json_assert_true "$SAVE_RESPONSE" "data.success === true"

echo "[3/5] Fetching farm profile"
GET_RESPONSE="$(curl -sS "$BASE_URL/api/farm-profile?userId=$USER_ID")"
json_assert_true "$GET_RESPONSE" "data.success === true"
json_assert_true "$GET_RESPONSE" "data.profile && data.profile.location && data.profile.location.district === 'Nashik'"
json_assert_true "$GET_RESPONSE" "Array.isArray(data.memoryContext.promptContext)"

echo "[4/5] Querying AI with profile context"
QUERY_RESPONSE="$(curl -sS -X POST "$BASE_URL/api/ai/query" -H 'Content-Type: application/json' -d '{"question":"Give 3 practical tips for my current tomato and onion setup.","userId":"'"$USER_ID"'","sessionId":"'"$SESSION_ID"'"}')"
json_assert_true "$QUERY_RESPONSE" "data.success === true"
json_assert_true "$QUERY_RESPONSE" "data.meta && data.meta.provider === 'ollama'"
json_assert_true "$QUERY_RESPONSE" "typeof data.answer === 'string' && data.answer.length > 50"
json_assert_true "$QUERY_RESPONSE" "(/nashik|tomato|onion|maharashtra/i).test(data.answer)"
AI_LATENCY="$(json_get "$QUERY_RESPONSE" "data.meta.latencyMs")"
echo "AI query latency: ${AI_LATENCY}ms"

echo "[5/5] Re-fetching profile memory snapshot"
GET_AFTER_RESPONSE="$(curl -sS "$BASE_URL/api/farm-profile?userId=$USER_ID")"
json_assert_true "$GET_AFTER_RESPONSE" "data.success === true"
json_assert_true "$GET_AFTER_RESPONSE" "Array.isArray(data.memoryContext.promptContext) && data.memoryContext.promptContext.length > 0"

echo "Day 1 smoke tests passed."
