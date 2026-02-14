# Application Modules

Last Updated: 2026-02-14 (Schemes Route Simplification + Agriculture Scheme Full-Catalog Pipeline)

This document defines module boundaries, responsibilities, dependencies, and key interfaces.

## Module Index

| Module | Primary Responsibility | Key API Surface | Data Stores |
|---|---|---|---|
| Assistant | Personalized agricultural Q/A via local LLM | `GET /api/ai/health`, `POST /api/ai/query` | `aiLogs`, `farmHistory`, `learnedPatterns`, `farmProfiles` |
| Farm Profile and Memory | Capture durable farm context and derive memory for personalization | `GET|POST|PATCH /api/farm-profile` | `farmProfiles`, `farmHistory`, `learnedPatterns` |
| Saved Advice | Bookmark assistant outputs for future reference | `POST /api/advice/save` | `savedAdvice` |
| Scheme Intelligence (Day 2) | Explainable scheme matching and user checklist state | `POST /api/schemes/seed`, `GET /api/schemes/recommendations`, `GET|POST /api/schemes/saved`, `POST /api/schemes/checklist` | `schemeCatalog`, `schemeRecommendations`, `schemeUserState` (+ fallbacks) |
| Agriculture Scheme Catalog (Day 2 expansion) | Exhaustive agriculture scheme corpus ingestion + browsing | `GET /api/schemes/agriculture` | `agricultureSchemeCatalog` (optional seed target), local dataset file fallback |
| Satellite Ingest (Day 2) | CDSE scene ingestion baseline for Day 3 | `GET|POST /api/satellite/ingest` | `satelliteHealthSnapshots` (+ fallback in `farmProfiles`) |
| Satellite Health (Day 3/6) | Convert ingest output into dashboard-ready crop health signals and high-accuracy map overlays | `GET|POST /api/satellite/health` | `satelliteHealthCache` (+ fallback in `farmProfiles`) + live ingest context |
| Voice Intelligence (Day 3) | STT/TTS and one-call voice roundtrip for assistant | `POST /api/voice/stt`, `POST /api/voice/tts`, `POST /api/voice/roundtrip` | Ephemeral temp files only (local runtime) |
| Weather Intelligence | Current weather + farming advice | `GET /api/weather` | in-memory cache, optional analytics writes |
| Market Prices | Agmarknet-backed taxonomy + series browsing and analytics detail | `GET /api/prices?action=filters|cards|series` | `marketTaxonomy`, `marketSeries`, `marketIngestRuns` |
| Disease Detection | Image-based disease prediction response | `POST /api/disease/detect` | optional `diseasePredictions`, analytics |
| Crop Planner | AI-driven crop planning recommendations | `POST /api/crop-plan` | `cropPlans`, `analyticsEvents` |
| Community | Posts, comments, replies, likes | community routes under `/api/community/*` | `communityPosts`, `communityComments`, `communityReplies` |
| Admin | Stats and moderation utilities | `GET /api/admin/stats` | `userRoles`, `users`, community + analytics collections |

## Assistant Module

Purpose:
- Deliver simple, safe, profile-aware agricultural responses in the farmer's language.

Key files:
- `app/api/ai/query/route.ts`
- `app/api/ai/health/route.ts`
- `lib/ai/groq.ts`
- `lib/services/assistantQueryService.ts`
- `lib/firebase/firestore.ts`

Flow:
- Validate input -> assemble context -> call selected provider (Ollama/Groq) -> return response -> async logging/memory refresh.
- Day 3 voice routes reuse the same service path (`runAssistantQuery`) to keep personalization behavior identical across text and voice.
- Assistant UI now resets backend conversation context correctly:
  - `app/assistant/page.tsx` regenerates a new `sessionId` on `New Session` so prior language context does not leak.
- Assistant now supports explicit provider selection from UI/API:
  - `ollama` (default local provider)
  - `groq` (cloud provider when key/runtime is available)
  - provider selection is passed through both text chat (`/api/ai/query`) and voice roundtrip (`/api/voice/roundtrip` via `assistantProvider`).
- Assistant prompt policy now enforces same-language response behavior:
  - infer language from query script/romanized tokens
  - infer English for Latin-script English phrasing when no explicit hint exists
  - accept explicit language hint (`language` code/name) when provided
  - disallow "please use English" style redirection for non-English farmer queries
  - enforce one correction retry if English-target output drifts into non-Latin script.

Failure handling:
- Input validation errors return `400`.
- Ollama/runtime failures return `500` with explicit error.
- Assistant generation now performs timeout-aware recovery:
  - first pass uses normal context and larger local-timeout budget
  - timeout triggers one lean-context retry before failing request.
- If model output still contains English-only redirection for a non-English target language, assistant generation retries once with a strict language-correction prompt.
- If language-correction retry itself times out, first successful answer is returned (non-fatal correction pass).
- If model output is likely truncated (length stop reason or incomplete trailing tail), assistant performs one continuation pass and merges the response before return.
- Groq-mode errors are normalized to actionable responses:
  - missing key
  - invalid/unauthorized key
  - unsupported model
  - quota exceeded.

## Farm Profile and Memory Module

Purpose:
- Store structured farmer profile data and maintain learned behavioral patterns.

Key files:
- `app/api/farm-profile/route.ts`
- `app/farm-profile/page.tsx`
- `lib/firebase/firestore.ts`

Flow:
- Upsert profile -> regenerate patterns -> expose memory context for AI prompt injection.
- UI now captures farm land area through mandatory map boundary selection (`location.landGeometry`) and persists map-derived center coordinates.

Design notes:
- Validation enforces required agronomic fields plus required map boundary geometry.
- Profile saves normalize land area to acres from `landGeometry.calculatedAreaAcres`; manual area entry is removed from UI flow.
- Parcel geometry persistence now serializes polygon coordinate arrays for Firestore compatibility and rehydrates them on read, while keeping API contract as GeoJSON-like `number[][][]`.
- Pattern extraction is deterministic keyword-assisted logic over recent interactions.
- Frontend contract is aligned with backend profile model, including operational fields that directly affect recommendation quality (`irrigationType`, `annualBudget`, `riskPreference`) and context richness (`preferredLanguage`, `waterSource`, `historicalChallenges`, `notes`, `location.village`).

## Scheme Intelligence Module (Day 2)

Purpose:
- Return explainable, profile-aware recommendations for government schemes.

Key files:
- `app/schemes/page.tsx`
- `app/api/schemes/*`
- `lib/services/schemeMatcherService.ts`
- `lib/firebase/day2.ts`
- `data/schemes/day2_seed_schemes.json`

Sub-capabilities:
- Rule scoring across location/farm-size/crop/irrigation/budget/risk
- Missing-input prompts and profile completeness scoring
- Duplicate candidate detection across central/state entries
- Save-for-later and checklist progress persistence
- Frontend now consumes recommendation metadata payload (`profileCompleteness`, `missingProfileInputs`, `catalogWarning`) and updates state via live `saved/checklist` APIs instead of local-only mock state.
- Checklist document keys are normalized to readable labels in UI and rendered with compact touch-friendly controls for low-clutter mobile usage.
- Checklist container proportions are balanced against scheme summary content via responsive checklist grid layout and custom-sized checkbox indicators.
- Dedicated recommendation page is removed; `/schemes` now consistently routes to full-catalog browsing while recommendation logic remains available via `/api/schemes/recommendations`.

Reliability behavior:
- Catalog and user-state fallbacks are implemented when Day 2 collections are permission-blocked.
- Response includes catalog source and warnings when fallback is active.

## Agriculture Scheme Catalog Module (Day 2 Expansion)

Purpose:
- Build and serve a complete agriculture-focused scheme corpus sourced from official listing + detail endpoints.

Key files:
- `scripts/scrape_agriculture_schemes.mjs`
- `scripts/seed_agriculture_schemes.mjs`
- `data/schemes/agriculture_schemes_catalog.json`
- `data/schemes/agriculture_schemes_scrape_report.json`
- `lib/services/agricultureSchemeCatalogService.ts`
- `app/api/schemes/agriculture/route.ts`
- `app/schemes/agriculture/page.tsx`

Sub-capabilities:
- Scrape all India.gov agriculture listing pages (`pagenumber=1..83`) and de-duplicate by slug.
- Fetch every linked MyScheme detail page payload (details, documents, FAQs, application channels).
- Normalize heterogeneous page sections into a shared schema while preserving raw endpoint payload snapshots per scheme.
- Persist full dataset as local JSON for deterministic UI/API fallback even before Firestore seeding.
- Optional Firestore seeding (`agricultureSchemeCatalog`) via dedicated script for production-like serving.
- Paginated searchable browse UI with expandable all-section display:
  - overview
  - eligibility
  - benefits
  - documents
  - process steps
  - FAQs
  - references
  - application channels.

Reliability behavior:
- API source mode supports `auto`, `firestore`, and `local`.
- Default route mode is `local` to avoid accidental high Firestore read consumption during browse-heavy usage.
- `auto` mode attempts Firestore first and emits explicit fallback warning on local-file fallback.
- Raw payload fields are excluded by default in API responses (`includeRaw=false`) to keep response size stable.

## Satellite Ingest Baseline Module (Day 2)

Purpose:
- Bootstrap free-source satellite metadata ingestion for Day 3 NDVI pipeline.

Key files:
- `app/api/satellite/ingest/route.ts`
- `lib/services/satelliteIngestService.ts`
- `lib/firebase/day2.ts`
- `lib/data/satelliteFallbackScenes.ts`

Sub-capabilities:
- CDSE OAuth client-credentials token retrieval (shared via `lib/services/cdseClient.ts`)
- STAC catalog search with AOI/date/cloud filters
- Scene normalization (scene id, tile id, cloud cover, capture date, bbox)
- Snapshot persistence + history retrieval
- Shared AOI source resolver path reused across ingest and health:
  - valid query `bbox`
  - profile parcel geometry bbox
  - demo fallback AOI.

Trust behavior:
- Data source is explicit (`live_cdse` or fallback sample).
- Fallback may be enabled per request (`allowFallback=true`).

## Satellite Health Module (Day 3)

Purpose:
- Convert satellite scene metadata into actionable crop-health signals without requiring NDVI expertise from the user.

Key files:
- `app/api/satellite/health/route.ts`
- `lib/services/satelliteHealthService.ts`
- `lib/services/satelliteNdviProcessService.ts`
- `lib/firebase/satelliteHealthCache.ts`
- `lib/services/cdseClient.ts`
- `lib/data/satelliteNdviReference.ts`
- `app/dashboard/page.tsx`

Sub-capabilities:
- Current vs baseline health comparison
- Normalized score + trend delta
- Zone-level health indicators
- Stress signal inference and recommendation generation
- Alert severity tagging + uncertainty notes
- Interactive map overlay contract generation:
  - farm boundary polygon payload
  - deterministic estimated zone polygons mapped to zone score/trend/status
  - optional NDVI raster (`imageDataUrl`) with AOI bbox for high-accuracy rendering
  - optional scene footprint bbox
  - legend + explicit non-raster disclaimer for trust-safe rendering.
- Day 6 cache-aware health response metadata:
  - `metadata.precisionMode`
  - `metadata.sourceScene` (`sceneId`, `capturedAt`)
  - `metadata.cache` (`hit`, `key`, `expiresAt`, `forced`, `staleFallbackUsed`).
- Deterministic cache-keyed persistence:
  - key shape: `userId + AOI bbox + precisionMode + maxCloudCover + maxResults`
  - TTL-aware read/write (`24h` default)
  - force-bypass path for explicit live recheck.

Reliability behavior:
- Uses explicit confidence score and uncertainty note for trust-safe interpretation.
- Falls back to demo/reference scenes when live ingest is unavailable and fallback is enabled.
- In `precisionMode=high_accuracy`, Process API failures are auto-degraded to estimated map overlay with explicit `highAccuracyUnavailableReason` (no silent downgrade).
- `/satellite` drilldown requests by `userId` and relies on shared server-side AOI resolution.
- Dashboard now links to satellite analysis instead of running full in-card analysis fetch by default.
- UI explicitly surfaces AOI source (`profile_land_geometry`, `query_bbox`, `demo_fallback`) so no fallback is silent.
- `/satellite` manual refresh flow is now explicit:
  - `Refresh Scan` uses cached high-accuracy mode (`useCache=true`, `forceRefresh=false`)
  - `Force Live Check` bypasses cache (`forceRefresh=true`)
  - `Refresh With Fallback` allows explicit degraded continuity mode
  - on live-refresh failure, UI preserves previous scan and shows a warning notice
  - source scene timestamp is rendered from satellite metadata (not client refresh time).
  - right panel includes explicit color labels for zone-score colors and NDVI raster colors for quick user interpretation.
  - raster-mode uncertainty text is normalized in route response, including cache-hit paths, to avoid metadata/raster wording drift.

## Voice Intelligence Module (Day 3)

Purpose:
- Enable multilingual voice interaction with privacy-aware local-first handling and explicit degraded-mode behavior.

Key files:
- `app/api/voice/stt/route.ts`
- `app/api/voice/tts/route.ts`
- `app/api/voice/roundtrip/route.ts`
- `lib/services/voiceService.ts`
- `app/assistant/page.tsx`

Sub-capabilities:
- Audio guardrails (size, duration, mime)
- STT transcription with whisper.cpp path and browser transcript fallback
- TTS synthesis with eSpeak path and browser synthesis fallback
- Roundtrip endpoint for one-flow voice interaction
- Assistant UI state machine: idle/recording/transcribing/review/sending
- Assistant browser fallback capture hardening:
  - recognizer stop is now graceful (final/interim transcript capture before STT send)
  - interim transcript is retained when final result arrives late
  - explicit UI warning appears if browser speech fallback cannot be used
- Whisper runtime hardening:
  - non-native whisper containers (`webm`, `m4a`, `mp4`) are auto-converted to WAV before transcription
  - unsupported whisper language codes now retry using `auto` language detection
  - script-normalization pass can transliterate Devanagari transcript output into requested Indic scripts (for example Bengali) when mismatch is detected
- Language coverage for voice flows:
  - `hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`

Trust and privacy behavior:
- Voice artifacts are processed in temporary local workspace and deleted after request completion.
- Fallback mode and reason are explicit in API payload and UI warnings; no hidden provider switching.
- STT validation normalizes MIME variants and accepts additional mobile recorder containers (`audio/m4a`, `audio/x-m4a`, `video/webm`, `video/ogg`, `video/mp4`) to reduce false-negative type rejections.
- Whisper runtime failures now return actionable diagnostics when conversion/transcription fails and transcript fallback is absent.
- Local runtime can operate without fallback when `WHISPER_CPP_BIN`, `WHISPER_CPP_MODEL`, and `espeak-ng` are available.

## Weather Module

Purpose:
- Expose weather snapshot and simple agronomic advisories.

Key files:
- `app/api/weather/route.ts`
- `lib/services/weatherService.ts`

Notes:
- Uses OpenWeather when key is present.
- Falls back to mock weather scenarios in development when key is absent.

## Market Prices Module

Purpose:
- Provide exhaustive 2025 Agmarknet market browsing across taxonomy + geo levels with card snapshots and detailed series analytics.

Key files:
- `app/api/prices/route.ts`
- `app/market-prices/page.tsx`
- `lib/firebase/market.ts`
- `scripts/ingest_agmarknet_2025.mjs`

Notes:
- Ingestion is offline/resumable and writes:
  - `marketTaxonomy/{versionId}`
  - `marketSeries/{seriesId}`
  - `marketIngestRuns/{runId}`
- `/api/prices` now exposes action-based reads:
  - `filters` for taxonomy
  - `cards` for paginated snapshot tiles
  - `series` for full price/quantity points
- `/market-prices` frontend now consumes live API data only (no mock path):
  - filter bar (category, commodity, state, district, granularity)
  - marketplace card grid
  - detail modal with line chart + table + freshness metadata.

## Disease Detection Module

Purpose:
- Accept image uploads and return disease prediction payloads.

Key files:
- `app/api/disease/detect/route.ts`
- `lib/services/diseaseService.ts`

Notes:
- Input validation enforces size/type constraints.
- Current predictor path is mock-based; integration-ready structure already present.

## Crop Planner Module

Purpose:
- Generate structured crop plans using optional Groq-based generation path.

Key files:
- `app/api/crop-plan/route.ts`
- `lib/services/cropPlanningService.ts`
- `lib/ai/groq.ts`

Notes:
- Requires `GROQ_API_KEY` for full functionality.
- Persists generated plans for user retrieval.

## Community and Admin Modules

Purpose:
- Provide community engagement features and admin visibility/moderation tools.

Key files:
- `app/api/community/*`
- `app/api/admin/stats/route.ts`
- `lib/services/communityService.ts`
- `lib/services/adminService.ts`

Notes:
- Community flows include post/comment/reply/like operations.
- Frontend contract sync patch now ensures post creation sends required `userEmail`, and likes/comments are persisted through API routes (no client-side no-op handlers).
- Admin gate checks user role document (`userRoles/{userId}`).

## Planned Extensions

- Day 4: Forecasting and community intelligence module enhancements.
- Day 5: WhatsApp/document/weather predictive modules.
- Day 6: Unified dashboard and offline reliability integration module.
