# Architecture Overview

Last Updated: 2026-02-13 (Satellite Right-Panel Consistency + Color Labels)

## System Topology

KisanSetu uses a Next.js App Router monolith with clear internal layers:

- Presentation layer:
  - React pages in `app/`
  - Reusable components in `components/`
- API layer:
  - Route handlers in `app/api/**/route.ts`
- Domain/service layer:
  - Business logic in `lib/services/`
  - AI abstraction in `lib/ai/`
- Data access layer:
  - Firebase helpers in `lib/firebase/`
  - Shared types in `types/index.ts`
- Operational scripts:
  - smoke and seed scripts in `scripts/`

## Runtime Architecture

### Frontend Runtime

- Next.js 15 (App Router)
- React 19 client and server components
- Tailwind CSS styling
- Firebase Auth state consumed by `AuthProvider`

### Backend Runtime

- Next.js route handlers run server-side
- Firestore read/write via Firebase web SDK
- External calls:
  - Local Ollama HTTP API
  - CDSE OAuth + catalog API
  - Optional local voice binaries (`whisper-cli`, `espeak-ng`)
  - Optional OpenWeather API
  - Optional Groq API

## Core Request Flows

### Personalized Assistant Flow

1. Client sends `POST /api/ai/query` with `question`, optional `userId`, optional `sessionId`, optional `language`, optional `provider`.
2. Route fetches conversation context and farm memory context when user context exists.
3. Route calls selected assistant provider through `lib/ai/groq.ts`:
  - default local Ollama path (`provider=ollama`)
  - optional Groq path (`provider=groq`)
  - invalid provider values are rejected with `400` (no silent fallback)
  - Groq path applies model configuration and actionable error mapping (key/auth/model/rate limits)
  - multilingual response policy remains enforced:
  - respond in same language as farmer query
  - use explicit language hint when provided
  - avoid English-only redirection for non-English queries
  - on timeout, retry once with leaner prompt context before returning error.
4. Route returns answer with provider/model/latency metadata.
5. Logging and memory update run asynchronously (non-blocking for response latency).

### Scheme Recommendation Flow

1. Client requests `GET /api/schemes/recommendations?userId=...`.
2. Catalog loads from `schemeCatalog`; if unavailable, fallback is used.
3. Farm profile + saved/checklist state are loaded.
4. Rule engine scores each scheme and returns explainable recommendation objects.
5. Snapshot persistence is attempted for audit/history.

### Satellite Ingest Flow

1. Client triggers `GET /api/satellite/ingest` with AOI/date/cloud parameters.
2. Service attempts CDSE token + STAC search path.
3. Scene list is cloud-filtered and normalized.
4. Snapshot is persisted; if primary collection blocked, profile fallback path is used.
5. Response includes data source (`live_cdse` or fallback) and metadata for downstream NDVI use.

### Satellite Health Insight Flow (Day 3/6)

1. User opens `/satellite` (via navbar or dashboard entry card), which requests `GET /api/satellite/health?userId=...`.
2. Shared AOI resolver (`lib/services/satelliteAoiResolver.ts`) resolves AOI with strict precedence:
  - query `bbox` (when valid)
  - saved farm parcel geometry bbox (`location.landGeometry.bbox`)
  - demo fallback AOI.
3. Route computes deterministic cache key from `userId + AOI bbox + precisionMode + maxCloudCover + maxResults`.
4. If `useCache=true` and non-expired cache exists, response is served from `satelliteHealthCache` (`cache.hit=true`), skipping live ingest/process calls.
5. On cache miss or `forceRefresh=true`, service fetches current and baseline ingest windows (live or fallback) and derives health insight.
6. In high-accuracy mode (`precisionMode=high_accuracy`), route attempts NDVI Process API rendering and upgrades overlay to `mapOverlay.strategy='ndvi_raster'`.
7. If Process API fails, route returns `200` with estimated overlay and explicit `health.highAccuracyUnavailableReason`.
8. Response metadata includes:
  - AOI context (`aoiSource`, `geometryUsed`)
  - source scene context (`sourceScene.sceneId`, `sourceScene.capturedAt`)
  - cache diagnostics (`cache.hit`, `cache.key`, `cache.expiresAt`, `cache.forced`, `cache.staleFallbackUsed`).
9. `/satellite` UI uses this metadata for `Satellite Captured`, `Data Age`, cache-hit UX messages, and explicit degraded-mode warning banners.

### Voice Roundtrip Flow (Day 3)

1. Client records audio, finalizes browser recognizer state, and sends multipart request to `POST /api/voice/roundtrip`.
2. STT stage:
  - prefer local whisper.cpp when configured
  - convert non-native whisper audio containers to WAV (ffmpeg path) before local STT
  - fallback to browser transcript when local STT is unavailable or fails for the given audio
  - retry with whisper `language=auto` when selected language code is unsupported in local runtime
  - normalize transcript script to requested Indic script when output script mismatches selection
3. Assistant stage:
  - query uses shared `runAssistantQuery` pipeline (same as `/api/ai/query`)
  - voice payload can pass `assistantProvider` (`ollama`/`groq`) so text and voice stay contract-aligned.
4. TTS stage:
  - prefer local eSpeak when available
  - fallback to browser synthesis metadata when unavailable
5. Response returns transcript, answer, TTS payload, and explicit warnings for any fallback.

## Architectural Principles

1. Thin routes, thick services:
  - route handlers handle transport and validation
  - business logic remains in service/firebase layers
2. Shared type contracts:
  - API and persistence shapes should align with `types/index.ts`
3. Explicit trust behavior:
  - fallback usage is visible in response payloads where relevant
4. Progressive hardening:
  - hackathon speed first, but with extensible module boundaries
5. Free-tier discipline:
  - avoid mandatory paid dependencies

## Reliability and Fallback Strategy

- Missing optional API keys should degrade to explicit mock/fallback paths where implemented.
- Day 2 persistence includes collection-level fallbacks for restricted Firestore environments.
- Day 3 voice stack includes explicit fallback contracts in API responses (`fallbackApplied`, `fallbackReason`).
- Day 3 voice STT validation now normalizes MIME variants and accepts common mobile recorder containers (`audio/m4a`, `audio/x-m4a`, `video/webm`, `video/ogg`, `video/mp4`).
- Day 3 voice STT local runtime now converts non-native whisper containers to WAV before transcription (ffmpeg path).
- Day 3 voice runtime failures now return actionable diagnostics instead of config-only guidance when transcript fallback is missing.
- Day 3 satellite health includes confidence + uncertainty note to prevent overconfident interpretation.
- Day 6 satellite health adds quota-aware DB cache and explicit cache metadata so repeated refreshes within TTL avoid live satellite calls.
- Day 6 high-accuracy rendering uses explicit auto-degrade semantics: Process API failure does not crash the route and is surfaced as `highAccuracyUnavailableReason`.
- Day 6 health-route presentation normalization ensures raster-mode uncertainty text stays consistent with `mapOverlay.strategy='ndvi_raster'`, including cache-hit responses.
- Satellite page explicitly indicates AOI source (`profile_land_geometry`, `query_bbox`, `demo_fallback`).
- Dashboard keeps satellite navigation discoverable while avoiding heavy in-card map-analysis rendering.
- Errors are returned in structured JSON (typically with `success: false` and `error`).

## Current Known Architecture Constraints

- Several APIs rely on user-provided `userId` without strict server-side auth verification.
- Firestore indexing and query optimization are functional but not yet production-tuned.
- End-to-end automated tests are not yet comprehensive; smoke scripts are the primary regression net.

## Forward Compatibility Intent

- Day 4 to Day 6 features should continue using explicit contracts and module-level separation.
- Documentation and tracker evidence remain mandatory for any cross-cutting architectural change.
