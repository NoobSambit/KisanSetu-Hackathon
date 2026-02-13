#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SMOKE_USER_ID="${SMOKE_USER_ID:-day3-smoke-user}"

assert_json_expr() {
  local json="$1"
  local expr="$2"
  printf '%s' "$json" | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')||'{}'); if(!(${expr})) process.exit(1);"
}

extract_json_expr() {
  local json="$1"
  local expr="$2"
  printf '%s' "$json" | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')||'{}'); const value=(${expr}); if(typeof value==='object') console.log(JSON.stringify(value)); else console.log(String(value));"
}

if ! curl -sf "$BASE_URL/api/ai/health" >/dev/null; then
  echo "Dev server is not reachable at $BASE_URL. Start it with npm run dev."
  exit 1
fi

echo "[1/6] Validating Day 3 satellite health pipeline"
SAT_HEALTH_RESPONSE="$(curl -s "$BASE_URL/api/satellite/health?allowFallback=true&maxResults=2&maxCloudCover=35")"
assert_json_expr "$SAT_HEALTH_RESPONSE" "data.success === true"
assert_json_expr "$SAT_HEALTH_RESPONSE" "typeof data.data.health.normalizedHealthScore === 'number'"
assert_json_expr "$SAT_HEALTH_RESPONSE" "Array.isArray(data.data.health.recommendations) && data.data.health.recommendations.length >= 1"
SAT_SCORE="$(extract_json_expr "$SAT_HEALTH_RESPONSE" "data.data.health.normalizedHealthScore")"
echo "Satellite health score: $SAT_SCORE"

echo "[2/6] Validating STT endpoint (browser transcript fallback mode, Bengali)"
STT_RESPONSE="$(curl -s -X POST "$BASE_URL/api/voice/stt" \
  -F "language=bn-IN" \
  -F "browserTranscript=ধান ক্ষেতে পানি কখন দেব")"
assert_json_expr "$STT_RESPONSE" "data.success === true"
assert_json_expr "$STT_RESPONSE" "typeof data.data.transcript === 'string' && data.data.transcript.length > 5"
STT_PROVIDER="$(extract_json_expr "$STT_RESPONSE" "data.data.provider")"
echo "STT provider: $STT_PROVIDER"
assert_json_expr "$STT_RESPONSE" "data.data.languageRequested === 'bn-IN'"

echo "[3/6] Validating TTS endpoint (Tamil)"
TTS_RESPONSE="$(curl -s -X POST "$BASE_URL/api/voice/tts" \
  -H 'Content-Type: application/json' \
  -d '{"text":"நீர்ப்பாசனத்தை அதிகாலை திட்டமிடுங்கள்.","language":"ta-IN","slow":true}')"
assert_json_expr "$TTS_RESPONSE" "data.success === true"
assert_json_expr "$TTS_RESPONSE" "['espeak','browser_speech_fallback'].includes(data.data.provider)"
assert_json_expr "$TTS_RESPONSE" "data.data.languageRequested === 'ta-IN'"
TTS_PROVIDER="$(extract_json_expr "$TTS_RESPONSE" "data.data.provider")"
echo "TTS provider: $TTS_PROVIDER"

echo "[4/6] Validating multilingual STT runtime with browser-container audio (WebM -> Whisper path)"
if command -v ffmpeg >/dev/null 2>&1 && { command -v espeak-ng >/dev/null 2>&1 || command -v espeak >/dev/null 2>&1; }; then
  TMP_DIR="$(mktemp -d /tmp/kisansetu-day3-smoke-XXXXXX)"
  trap 'rm -rf "$TMP_DIR"' EXIT

  if command -v espeak-ng >/dev/null 2>&1; then
    espeak-ng -v hi -w "$TMP_DIR/sample.wav" "mera kheth sookha hai"
  else
    espeak -v hi -w "$TMP_DIR/sample.wav" "mera kheth sookha hai"
  fi

  ffmpeg -y -loglevel error -i "$TMP_DIR/sample.wav" "$TMP_DIR/sample.webm"

  STT_WEBM_RESPONSE="$(curl -s -X POST "$BASE_URL/api/voice/stt" \
    -F "language=or-IN" \
    -F "audio=@$TMP_DIR/sample.webm;type=video/webm")"
  assert_json_expr "$STT_WEBM_RESPONSE" "data.success === true"
  assert_json_expr "$STT_WEBM_RESPONSE" "data.data.provider === 'whisper_cpp'"
  assert_json_expr "$STT_WEBM_RESPONSE" "typeof data.data.transcript === 'string' && data.data.transcript.length > 0"
  STT_WEBM_LANGUAGE_USED="$(extract_json_expr "$STT_WEBM_RESPONSE" "data.data.languageUsed")"
  echo "STT WebM language used: $STT_WEBM_LANGUAGE_USED"
else
  echo "Skipping WebM STT runtime check (ffmpeg + espeak/espeak-ng not available)."
fi

echo "[5/6] Validating voice roundtrip (STT -> assistant -> TTS)"
ROUNDTRIP_RESPONSE="$(curl -s -X POST "$BASE_URL/api/voice/roundtrip" \
  -F "language=hi-IN" \
  -F "ttsLanguage=hi-IN" \
  -F "browserTranscript=मेरी धान की फसल में पत्ते पीले हो रहे हैं क्या करूं" \
  -F "userId=$SMOKE_USER_ID" \
  -F "sessionId=day3-smoke-session")"
assert_json_expr "$ROUNDTRIP_RESPONSE" "data.success === true"
assert_json_expr "$ROUNDTRIP_RESPONSE" "typeof data.data.answer === 'string' && data.data.answer.length > 20"
assert_json_expr "$ROUNDTRIP_RESPONSE" "['espeak','browser_speech_fallback'].includes(data.data.tts.provider)"
ROUNDTRIP_TTS_PROVIDER="$(extract_json_expr "$ROUNDTRIP_RESPONSE" "data.data.tts.provider")"
ROUNDTRIP_WARNINGS="$(extract_json_expr "$ROUNDTRIP_RESPONSE" "data.data.warnings")"
echo "Roundtrip TTS provider: $ROUNDTRIP_TTS_PROVIDER"
echo "Roundtrip warnings: $ROUNDTRIP_WARNINGS"

echo "[6/6] Sanity check text assistant path still functional"
AI_RESPONSE="$(curl -s -X POST "$BASE_URL/api/ai/query" -H 'Content-Type: application/json' -d '{"question":"What should I do first if crop leaves turn yellow?","userId":"day3-smoke-user"}')"
assert_json_expr "$AI_RESPONSE" "data.success === true"
assert_json_expr "$AI_RESPONSE" "typeof data.answer === 'string' && data.answer.length > 20"


echo "Day 3 smoke test completed successfully."
