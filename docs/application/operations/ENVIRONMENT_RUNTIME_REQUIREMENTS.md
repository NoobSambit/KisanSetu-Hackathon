# Environment and Runtime Requirements

Last Updated: 2026-02-13 (Dev/Build Artifact Isolation Hardening)

This file lists required setup, env vars, and runtime checks needed to run KisanSetu reliably.

## 1. Local Tooling Prerequisites

- Node.js: 18+
- npm: matching Node runtime
- Next.js dev server support (included via project dependencies)
- Ollama installed locally with model pulled:
  - `qwen2.5:7b`

Recommended preflight:

```bash
node -v
npm -v
ollama --version
ollama list
```

## 2. Mandatory External Services

### Firebase (Required)

Used for auth, profile, memory, and feature persistence.

Required env keys:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Commonly used additional Firebase public keys:

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Firebase Auth bring-up checklist (required for signup/login):
- In Firebase Console, open **Authentication** and click **Get started** (if not initialized).
- Enable **Email/Password** under Sign-in method.
- In **Authentication -> Settings -> Authorized domains**, include `localhost` and `127.0.0.1` for local development.
- Ensure `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` are from the same Firebase web app configuration block.

### Ollama (Required for Assistant)

- `OLLAMA_BASE_URL` (default fallback exists in code: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default fallback exists in code: `qwen2.5:7b`)

## 3. Optional Service Integrations

### Groq (Optional)

Used by assistant when Groq mode is selected and by crop planning paths.

- `GROQ_API_KEY`
- `GROQ_MODEL` (project default: `llama-3.3-70b-versatile`)

### Weather (Optional)

- `OPENWEATHER_API_KEY`

If missing, weather service returns mock data for development continuity.

### CDSE / Sentinel Hub (Optional for Day 2 satellite ingest live mode)

- `CDSE_CLIENT_ID`
- `CDSE_CLIENT_SECRET`
- `CDSE_TOKEN_URL`

Expected token URL for CDSE OAuth client-credentials flow:

- `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`

If keys are missing and `allowFallback=true`, ingest route can return fallback sample scenes.

### Voice Stack (Optional for Day 3 local-first STT/TTS)

- `VOICE_STT_PROVIDER` (recommended: `auto`)
- `WHISPER_CPP_BIN` (path to local `whisper-cli`)
- `WHISPER_CPP_MODEL` (path to whisper.cpp model file)
- `VOICE_TTS_PROVIDER` (recommended: `auto`)
- `VOICE_TTS_BIN` (default: `espeak-ng`)
- `VOICE_FFMPEG_BIN` (default: `ffmpeg`; used to convert browser-recorded containers for whisper runtime)
- `VOICE_MAX_AUDIO_BYTES` (default in code: `6291456`)
- `VOICE_MAX_AUDIO_SECONDS` (default in code: `45`)

If local binaries are not configured, voice routes stay functional via explicit browser fallback mode.
STT input validation now normalizes MIME variants (`audio/*;codecs=...`) and accepts additional mobile recording containers:
- `audio/m4a`
- `audio/x-m4a`
- `video/webm`
- `video/ogg`
- `video/mp4`

Current voice language coverage in implementation:
- `hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`

## 4. Environment Variable Matrix

| Variable | Required | Used By | Behavior If Missing |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase app init | Firestore/auth unavailable |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase app init | Firestore/auth unavailable |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase app init, scripts | Firestore/auth unavailable |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app init | Firestore/auth unavailable |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | Firebase init completeness | Some Firebase features may be limited |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase init completeness | Push-related paths limited |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Firebase init completeness | Analytics integrations limited |
| `OLLAMA_BASE_URL` | Yes for assistant runtime | `lib/ai/groq.ts` | Uses local default URL fallback |
| `OLLAMA_MODEL` | Yes for assistant runtime | `lib/ai/groq.ts` | Uses local default model fallback |
| `GROQ_API_KEY` | Optional (required when using Groq assistant toggle) | Assistant Groq mode + crop planning flow | Groq assistant mode/crop planner fail with explicit error |
| `GROQ_MODEL` | Optional | Groq model selection | Defaults to `llama-3.3-70b-versatile` |
| `OPENWEATHER_API_KEY` | Optional | Weather service | Mock weather data used |
| `CDSE_CLIENT_ID` | Optional for satellite live ingest | Satellite ingest service | Ingest fails or fallback sample used |
| `CDSE_CLIENT_SECRET` | Optional for satellite live ingest | Satellite ingest service | Ingest fails or fallback sample used |
| `CDSE_TOKEN_URL` | Optional for satellite live ingest | Satellite ingest service | Ingest fails or fallback sample used |
| `VOICE_STT_PROVIDER` | Optional | Voice STT/roundtrip services | Defaults to `auto`; browser fallback can activate |
| `WHISPER_CPP_BIN` | Optional for local STT | Voice STT/roundtrip services | STT falls back to browser transcript path |
| `WHISPER_CPP_MODEL` | Optional for local STT | Voice STT/roundtrip services | STT falls back to browser transcript path |
| `VOICE_TTS_PROVIDER` | Optional | Voice TTS/roundtrip services | Defaults to `auto`; browser synthesis fallback can activate |
| `VOICE_TTS_BIN` | Optional | Voice TTS/roundtrip services | Attempts `espeak-ng`/`espeak`; fallback used if unavailable |
| `VOICE_FFMPEG_BIN` | Optional | Voice STT/roundtrip services | Defaults to `ffmpeg`; required for local whisper transcription of browser containers like webm/mp4/m4a |
| `VOICE_MAX_AUDIO_BYTES` | Optional | Voice STT validation | Uses default guardrail if missing |
| `VOICE_MAX_AUDIO_SECONDS` | Optional | Voice STT validation | Uses default guardrail if missing |

## 5. Setup Workflow

1. Copy env template:

```bash
cp .env.local.example .env.local
```

2. Fill Firebase and Ollama values first.
3. Fill optional keys only for features you want to enable.
4. Start services:

```bash
npm install
npm run dev
```

## 5A. Next.js Build Artifact Isolation

To prevent `.next` manifest collisions between active development and production builds:

- `npm run dev` now runs with `NEXT_DIST_DIR=.next/dev`
- `npm run build` and `npm run start` now run with `NEXT_DIST_DIR=.next/build`

This avoids runtime `ENOENT` errors such as missing `routes-manifest.json` or `app-paths-manifest.json` when a build is triggered while a dev server is running.

If you still see stale-manifest errors from an older run:

1. Stop all running Next.js processes.
2. Start a fresh `npm run dev`.
3. Keep build/start commands in separate terminals as needed (artifact paths are now isolated).

## 6. Runtime Validation Commands

```bash
# Type safety
npx tsc --noEmit

# Production build viability
npm run build

# Assistant runtime check
curl -s http://127.0.0.1:3000/api/ai/health

# Day 2 scheme seed
npm run seed:day2-schemes

# Day 2 smoke
npm run smoke:day2

# Day 3 smoke
npm run smoke:day3

# Assistant page runtime sanity (dev-only)
# 1) start on an alternate port if 3000 is busy
PORT=3100 npm run dev
# 2) in another terminal, hit assistant route
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/assistant

# Direct local STT runtime check (expects whisper_cpp provider when configured)
curl -s -X POST http://127.0.0.1:3000/api/voice/stt \
  -F "language=hi-IN" \
  -F "audio=@/path/to/sample.wav;type=audio/wav"

# STT validation error-path check (expects 400)
curl -s -X POST http://127.0.0.1:3000/api/voice/stt \
  -F "language=hi-IN"
```

Firebase auth preflight (detects common setup failures before UI testing):

```bash
node - <<'NODE'
const fs = require('fs');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1).replace(/^"|"$/g, '')];
    })
);
const key = env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!key) throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY missing');
fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(key)}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: 'preflight@example.com', continueUri: 'http://localhost:3000' }),
}).then(async (res) => {
  const data = await res.json();
  console.log('status=', res.status, 'error=', data?.error?.message || 'none');
});
NODE
```

Expected outcome:
- `200` with sign-in methods -> auth service is reachable for this project.
- `400 CONFIGURATION_NOT_FOUND` -> Firebase Authentication is not initialized for this project or config values point to the wrong project.

## 7. Operational Expectations

- Dev server base URL: `http://127.0.0.1:3000` (scripts may also use `http://localhost:3000`).
- Satellite ingest defaults to a demo AOI and a recent date window if parameters are not provided.
- Voice routes enforce duration/size guardrails and publish fallback reasons when local binaries are unavailable.
- Voice STT now auto-converts non-native whisper containers (`webm`, `m4a`, `mp4`) to WAV when ffmpeg is available.
- Voice STT now emits actionable runtime diagnostics (not config-only text) when conversion/transcription fails without transcript fallback.
- Voice STT may apply script-normalization notes for configured Indic languages when transcript script drifts from selected language script.
- Assistant now supports explicit provider selection (`ollama` or `groq`) via `/api/ai/query` and `/api/voice/roundtrip` request payloads.
- Groq assistant mode returns explicit actionable errors for missing key, invalid key, model incompatibility, and rate limits (no silent local fallback).
- `/assistant` dev runtime keeps `experimental.devtoolSegmentExplorer=false` in `next.config.js` to avoid React Client Manifest instability (`SegmentViewNode`) observed in local development.
- Root metadata compatibility for Next 15 is maintained via `export const viewport` in `app/layout.tsx` (instead of `metadata.viewport` / `metadata.themeColor`).
- With local binaries configured, STT/TTS can run server-side without fallback (`whisper_cpp` + `espeak` providers).
- Firestore rules must permit active collections used in current phase; otherwise fallback paths may activate.
- Auth errors from Firebase config mismatch (`auth/configuration-not-found`, `auth/unauthorized-domain`, `auth/invalid-api-key`) are now surfaced with actionable guidance in UI error messages.

## 8. Secret Management Rules

- Never commit `.env.local`.
- Never paste secrets in docs, PR descriptions, or logs.
- Rotate external secrets if accidental exposure occurs.
- Keep `.env.local.example` current with key names only (no real values).

## 9. Cost and Dependency Guardrails

- Prefer free tiers and open-source services.
- Any paid dependency introduction requires explicit project-owner approval.
- Every optional integration must declare a fallback mode before adoption.
