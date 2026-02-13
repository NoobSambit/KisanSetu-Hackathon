# API Inventory

Last Updated: 2026-02-13 (Satellite Right-Panel Consistency + Color Labels)

This file documents currently implemented HTTP routes under `app/api/`.

## Shared API Conventions

- Most routes return JSON with `success` boolean.
- Failure responses generally include `error` string.
- Status codes are used for validation (`400`), auth (`401/403`), and server failures (`500`).
- Some legacy routes return module-specific shapes; standardization is ongoing.

## Endpoint Catalog

| Method | Path | Purpose | Key Inputs | Success Shape (Summary) | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/ai/health` | Check local model availability and latency | Optional `prompt` query | `{ success, provider, model, latencyMs, preview }` | Provider expected: `ollama` |
| `POST` | `/api/ai/query` | Generate personalized farming answer | `{ question, userId?, sessionId?, language?, provider? }` | `{ success, answer, meta }` | `provider` supports `ollama` or `groq`; uses conversation + farm memory context when user data available |
| `GET` | `/api/farm-profile` | Fetch profile + memory context + patterns | `userId` query required | `{ success, profile, memoryContext, patterns }` | Returns `400` if `userId` missing |
| `POST`/`PATCH` | `/api/farm-profile` | Create/update farm profile | `{ userId, profile }` | `{ success, message, patterns }` | Requires `location.landGeometry` map boundary; stores map-derived `landSize` in acres and center coordinates |
| `POST` | `/api/advice/save` | Save assistant response | `{ userId, question, answer, category? }` | `{ success, id }` | Auth expected from UI context |
| `POST` | `/api/schemes/seed` | Seed Day 2 scheme catalog | none | `{ success, count, duplicateCandidates }` | Uses Day 2 seed dataset |
| `GET` | `/api/schemes/recommendations` | Get scheme recommendations | `userId` query required, `limit?` | `{ success, data: { recommendations, profileCompleteness, ... } }` | Returns catalog source and warnings when fallback is used |
| `GET` | `/api/schemes/saved` | Get saved scheme state | `userId` query required | `{ success, data: { savedSchemeIds, stateMap } }` | Reads Day 2 user state map |
| `POST` | `/api/schemes/saved` | Toggle save-for-later state | `{ userId, schemeId, saved? }` | `{ success, data: { userId, schemeId, saved } }` | Defaults `saved=true` when omitted |
| `POST` | `/api/schemes/checklist` | Update application checklist | `{ userId, schemeId, checklist, notes? }` | `{ success, data: { checklist, checklistProgress, ... } }` | Checklist is document key -> boolean map |
| `GET`/`POST` | `/api/satellite/ingest` | Run ingest or fetch history | query params for ingest, `action=history` for history | ingest: `{ success, data: { ingest, persistedSnapshotId } }`; history: `{ success, data: { history } }` | Supports `allowFallback` query flag + shared AOI source resolution (`query_bbox` -> `profile_land_geometry` -> `demo_fallback`) |
| `GET`/`POST` | `/api/satellite/health` | Generate satellite health insight (Day 3/6) | AOI/date/cloud query params + `precisionMode?`, `useCache?`, `forceRefresh?`, `cacheTtlHours?` | `{ success, data: { health, metadata, dataSource } }` | Returns normalized score, baseline delta, zones, stress signals, recommendations, alerts, map overlay contract, source scene timestamp, and cache status |
| `POST` | `/api/voice/stt` | Transcribe speech to text (Day 3) | multipart form: `audio?`, `language?`, `durationSeconds?`, `browserTranscript?` | `{ success, data: { transcript, provider, confidence, guardrails, fallback* } }` | Enforces size/duration/type guardrails with MIME normalization; auto-converts non-native whisper containers to WAV when ffmpeg is available; supports explicit fallback |
| `POST` | `/api/voice/tts` | Synthesize text to speech (Day 3) | `{ text, language?, slow? }` | `{ success, data: { provider, audioBase64?, mimeType?, fallback* } }` | Local eSpeak path + browser synthesis fallback |
| `POST` | `/api/voice/roundtrip` | Voice roundtrip in one API flow (Day 3) | multipart form: `audio?`, `browserTranscript?`, `language`, `ttsLanguage`, `assistantProvider?`, `userId?`, `sessionId?`, `slowSpeech?` | `{ success, data: { transcript, answer, answerMeta, tts, warnings } }` | `assistantProvider` supports `ollama` or `groq`; routes through same personalization service as text chat |
| `GET` | `/api/weather` | Fetch weather intelligence | `city` OR `lat`+`lon`, optional `userId` | `{ success, data }` | Uses OpenWeather key when available, mock fallback otherwise |
| `GET` | `/api/prices` | Fetch crop or market prices | `crop` OR `market`+`state`; optional `action=crops|markets`, `userId` | `{ success, data }` | Mock-first data currently |
| `POST` | `/api/crop-plan` | Generate crop plan | `{ userId, inputs }` | `{ success, plan }` | Requires valid `inputs`; Groq path optional |
| `POST` | `/api/disease/detect` | Predict disease from image | multipart form: `image`, optional `userId` | `{ success, prediction, confidence, treatment, ... }` | Enforces file type and 10MB limit |
| `GET` | `/api/community/posts` | List community posts | optional `limit` | `{ success, posts, count }` | Ordered by recency |
| `POST` | `/api/community/posts` | Create post | `{ userId, userName, userEmail, title, content, category?, tags? }` | `{ success, postId, message }` | Title/content length validation |
| `GET` | `/api/community/comments` | Fetch comments or replies | `postId` OR `commentId` | `{ success, comments|replies, count }` | `postId` and `commentId` are mutually exclusive usage paths |
| `POST` | `/api/community/comments` | Create comment or reply | comment: `{ type?, postId, userId, userName, content }`; reply: `{ type:'reply', postId, commentId, ... }` | `{ success, commentId|replyId, message }` | Content length validation |
| `POST` | `/api/community/likes` | Toggle like on post/comment/reply | `{ targetType, targetId, userId, isLiked }` | `{ success, message, action }` | `isLiked=true` means unlike |
| `GET` | `/api/admin/stats` | Admin dashboard stats | `userId` query required | `{ success, stats }` | Returns `401` when missing userId, `403` when not admin |

## Route Behavior Notes

### Scheme Recommendations

- The recommendations endpoint attempts to seed and read Firestore catalog automatically when empty.
- If Firestore catalog is unavailable, it uses local seed fallback and sets `catalogSource` accordingly.
- Response includes UI-driving metadata (`profileCompleteness`, `missingProfileInputs`, `catalogWarning`) in addition to recommendation cards.
- Each recommendation item includes persisted user-state fields (`saved`, `checklist`, `documentReadinessScore`) used by `/api/schemes/saved` and `/api/schemes/checklist` writes.

### Satellite Ingest

- `GET /api/satellite/ingest?action=history` returns persisted history.
- Standard ingest query supports:
  - `userId`, `aoiId`, `aoiName`, `bbox`
  - `startDate`, `endDate`
  - `maxCloudCover`, `maxResults`
  - `allowFallback`
- AOI is resolved through a shared precedence path:
  - valid query `bbox` override
  - saved profile parcel geometry bbox (`location.landGeometry.bbox`)
  - demo AOI fallback.
- Invalid query `bbox` values are ignored (no crash), and normal AOI resolution continues.

### Satellite Health (Day 3)

- `GET /api/satellite/health` derives crop-health insight from current and baseline windows.
- Query contract additions (Day 6 high-accuracy mode):
  - `precisionMode`: `high_accuracy` (default) or `estimated`
  - `useCache`: default `true`
  - `forceRefresh`: default `false`
  - `cacheTtlHours`: default `24` (clamped to `1..168`)
- Response includes:
  - `summaryCardText` for dashboard consumption
  - `zones[]` with zone-wise health status
  - `alerts[]` for anomaly thresholds
  - `uncertaintyNote` when cloud/metadata confidence is low
  - `mapOverlay` for interactive maps:
    - `strategy='estimated_zones'` or `strategy='ndvi_raster'`
    - `aoiSource`
    - `farmBoundary` polygon
    - `zonePolygons[]` (score/trend/status + polygon)
    - `sceneFootprintBbox` (when available)
    - `imageDataUrl` + `imageBbox` for high-accuracy NDVI raster overlay
    - `legend[]` and explicit trust disclaimer.
  - `highAccuracyUnavailableReason` when high-accuracy NDVI generation fails and route degrades to estimated overlay.
  - strategy-aligned `uncertaintyNote`:
    - raster mode uses Sentinel-2 raster wording
    - estimated mode keeps metadata-estimation wording.
- `metadata` now also includes:
  - `aoiSource`
  - `geometryUsed` (true when profile parcel geometry path is used)
  - `precisionMode`
  - `sourceScene` (`sceneId`, `capturedAt`) from the selected satellite scene
  - `cache` (`hit`, `key`, `expiresAt`, `forced`, `staleFallbackUsed`).
- Baseline defaults are applied server-side when date windows are not provided.
- Numeric query parsing now treats missing/blank values as defaults (instead of `0` coercion):
  - `maxCloudCover` default `35`
  - `maxResults` default `3`
  - `currentWindowDays` default `35`
  - `baselineOffsetDays` default `90`
  - `baselineWindowDays` default `35`.
- Cache behavior:
  - first request in TTL window runs live analysis and writes cache (`cache.hit=false`)
  - repeated equivalent request returns cached payload (`cache.hit=true`)
  - `forceRefresh=true` bypasses cache and returns `cache.forced=true`
  - if live analysis fails and cached value exists with `allowFallback=true`, stale cache may be returned with `cache.staleFallbackUsed=true`.
- Presentation-alignment behavior:
  - cache-hit payloads are normalized so raster-mode uncertainty text remains consistent with `mapOverlay.strategy='ndvi_raster'`.
- Dashboard and `/satellite` drilldown now call health API with `userId` and rely on server-side AOI resolution; UI shows explicit source messaging for fallback transparency.
- With current map-only profile flow, coordinate-derived AOI is no longer used for health/ingest resolution.

### Voice APIs (Day 3)

- STT and roundtrip routes accept multipart payloads to support audio + fallback transcript.
- Guardrails are explicit in STT response:
  - `maxAudioBytes`
  - `maxAudioSeconds`
  - `supportedMimeTypes`
- STT MIME validation now normalizes codec-parameter variants and accepts mobile-recorder containers (`audio/m4a`, `audio/x-m4a`, `video/webm`, `video/ogg`, `video/mp4`) in addition to prior audio types.
- STT local runtime now auto-converts non-native whisper containers (for example `webm`/`m4a`/`mp4`) to WAV before invoking `whisper-cli`.
- If requested whisper language code is unavailable in local runtime, STT retries with `language=auto` and surfaces this via `fallbackApplied=true` + `fallbackReason`.
- For configured Indic languages, STT may normalize script rendering to the requested language script when output script drifts (for example Devanagari output normalized to Bengali for `bn-IN`); this is surfaced in `fallbackReason`.
- Fallback behavior is explicit in response payload (`fallbackApplied`, `fallbackReason`).
- Validation errors (missing audio+transcript, oversized payload, unsupported type, duration breach) return `400` with actionable `error` strings.
- Whisper runtime failures without transcript fallback return `400` with runtime-specific diagnostics, instead of generic config-only text.
- `POST /api/voice/roundtrip` uses shared assistant query service (`lib/services/assistantQueryService.ts`), ensuring voice uses the same personalization and memory flow as `/api/ai/query`.
- `POST /api/voice/roundtrip` now forwards language hint (`language`) to the assistant query layer so response language aligns with selected voice language for that turn.
- `POST /api/voice/roundtrip` accepts `assistantProvider` (`ollama`/`groq`) so voice interactions use the same provider toggle as text chat.
- Configured language set (current implementation):
  - `hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`.

### Assistant Provider and Language Behavior

- `/api/ai/query` now accepts optional `language` hint for response targeting.
- `/api/ai/query` now accepts optional `provider` with supported values:
  - `ollama` (default local path)
  - `groq` (cloud path when `GROQ_API_KEY` is configured)
- Invalid provider values return `400` with explicit validation error.
- Assistant prompt policy now enforces same-language responses:
  - replies in the farmer's query language when script/language is detectable
  - rejects English-only redirection behavior by policy
  - handles transliterated Indic input (for example: `ami dhanchas korte chai`) with non-English response preference.
- Assistant language detection now includes English fallback inference for Latin-script English queries when no explicit `language` hint is sent.
- For English-targeted turns, assistant now performs one correction retry if model output drifts into non-Latin script.
- `/assistant` UI now regenerates a fresh `sessionId` on `New Session`, preventing old conversation language context from influencing new chats.
- Assistant timeout reliability hardening:
  - Ollama query now uses a larger primary timeout budget in local runtime.
  - If primary attempt times out, assistant retries once with lean context prompt (reduced memory/conversation payload).
  - If optional language-correction pass times out, previously generated valid response is kept instead of failing the request.
- Assistant completion reliability hardening:
  - if generation is flagged as length-limited or ends with a likely cut-off tail, assistant performs one continuation pass and merges the result.
- Groq provider hardening:
  - assistant uses configured `GROQ_MODEL` (default: `llama-3.3-70b-versatile`)
  - common Groq failures are surfaced with actionable errors (missing key, invalid key, model not found, rate limits)
  - no silent provider fallback is applied when Groq is explicitly selected.

### Weather and Prices

- These modules are intentionally resilient during development through mock-support paths.
- They still return `success` and `error` conventions for stable frontend handling.

### Community APIs

- `POST /api/community/posts` requires `userEmail` in addition to `userId`, `userName`, `title`, and `content`.
- `POST /api/community/likes` expects current like state via `isLiked` (`true` means unlike, `false` means like).
- `POST /api/community/comments` supports both comment and reply creation:
  - comment path: `postId`, `userId`, `userName`, `content`
  - reply path: `type='reply'`, `postId`, `commentId`, `userId`, `userName`, `content`

## Known Contract Inconsistencies (To Be Standardized)

- Some routes return `data` wrappers while others return top-level payload keys (for example `plan`, `posts`, `stats`).
- Auth is not uniformly enforced server-side for all user-scoped writes; several flows rely on client-side access gating and Firestore rules.
- Error code taxonomy is not yet centralized across all routes.
