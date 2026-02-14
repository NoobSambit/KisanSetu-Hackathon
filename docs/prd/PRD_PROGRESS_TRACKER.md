# PRD Progress Tracker

Last Updated: 2026-02-14 04:48 IST

Status values: `done`, `in_progress`, `planned`, `blocked`

## Day-Phase Matrix

| Day | Phase | Objective | Status | Owner | Evidence |
|---|---|---|---|---|---|
| Day 1 | Phase 1 - Local LLM Infra | Local Ollama assistant with Qwen 2.5 7B | done | Team | `/api/ai/health`, benchmark logs |
| Day 1 | Phase 2 - Farm Memory | Profile + memory + pattern extraction | done | Team | `/api/farm-profile`, smoke tests |
| Day 1 | Phase 3 - Context-Aware AI | Personalized responses from farm memory | done | Team | `/api/ai/query` personalization |
| Day 2 | Phase 1 - Scheme Intelligence Engine | Eligibility scoring + scheme dataset | done | Team | `data/schemes/day2_seed_schemes.json` (34), `data/schemes/agriculture_schemes_catalog.json` (825), `npm run seed:day2-schemes`, `npm run scrape:agriculture-schemes` |
| Day 2 | Phase 2 - Scheme Recommendation UX | Explainable recommendations + actions | done | Team | `/api/schemes/recommendations`, `/api/schemes/checklist`, `scripts/day2_smoke_test.sh` |
| Day 2 | Phase 3 - Satellite Setup | Sentinel data pipeline bootstrap | done | Team | `/api/satellite/ingest`, `/api/satellite/ingest?action=history` |
| Day 3 | Phase 1 - Satellite Health AI | NDVI-based health insights | done | Team | `/api/satellite/health`, `lib/services/satelliteHealthService.ts`, dashboard health card |
| Day 3 | Phase 2 - Voice AI Backend | STT/TTS pipeline | done | Team | `/api/voice/stt`, `/api/voice/tts`, `/api/voice/roundtrip`, `lib/services/voiceService.ts` |
| Day 3 | Phase 3 - Voice Frontend | Voice-first assistant UX | done | Team | `app/assistant/page.tsx`, transcript review + playback controls, `scripts/day3_smoke_test.sh` |
| Day 4 | Phase 1 - Price Forecasting | 7/30/90-day predictions | in_progress | Team | `scripts/ingest_agmarknet_2025.mjs`, `marketTaxonomy/marketSeries/marketIngestRuns` seeding, `node scripts/ingest_agmarknet_2025.mjs --year=2025 --max-combos=50`, resume checkpoint evidence (`runId=agmarknet_y2025_1771016530612`) |
| Day 4 | Phase 2 - Forecast UX | Visual forecast + sell timing | in_progress | Team | `/api/prices?action=filters|cards|series`, `app/market-prices/page.tsx` replacement, `npx tsc --noEmit`, `npm run build`, API success/error checks |
| Day 4 | Phase 3 - Community Intelligence | Knowledge extraction from posts | planned | Team | Day 4 PRD checklist |
| Day 5 | Phase 1 - WhatsApp Layer | Conversational channel integration | planned | Team | Day 5 PRD checklist |
| Day 5 | Phase 2 - Document Assistant | OCR + assisted form filling | planned | Team | Day 5 PRD checklist |
| Day 5 | Phase 3 - Predictive Weather | Hyperlocal advisories | planned | Team | Day 5 PRD checklist |
| Day 6 | Phase 1 - Unified Dashboard | Single-pane intelligence view | in_progress | Team | `app/dashboard/page.tsx`, `app/satellite/page.tsx`, `components/layout/Navigation.tsx`, `components/SatelliteHealthMap.tsx`, `lib/services/satelliteAoiResolver.ts`, `app/api/satellite/health/route.ts`, `app/api/satellite/ingest/route.ts`, `lib/services/satelliteHealthService.ts`, `npx tsc --noEmit`, `npm run build` |
| Day 6 | Phase 2 - Offline Reliability | Offline read + sync strategy | planned | Team | Day 6 PRD checklist |
| Day 6 | Phase 3 - Demo Readiness | End-to-end rehearsal and QA | planned | Team | Day 6 PRD checklist |
| Review 1 | Pitch Deck Creation | Complete presentation materials for judging panel | done | Team | `docs/hackathon/review1_pitch_deck/` (19 slides), README with usage guide |

## Update Rules
- Any change to day/phase status must include an evidence link or command output reference.
- If a phase is blocked, add blocker details and mitigation in `APPLICATION_WIDE_UPDATES.md`.
- Do not mark a phase `done` without validation evidence.

## Day 1 Evidence Snapshot
- Smoke command: `./scripts/day1_smoke_test.sh`
- Type-check: `npx tsc --noEmit`
- Build-check: `npm run build`

## Day 2 Evidence Snapshot
- Seed command: `npm run seed:day2-schemes` (primary `schemeCatalog` write succeeded with 34 records)
- Full-catalog scrape command: `npm run scrape:agriculture-schemes` -> listing pages `83/83`, unique slugs `825`, detail success `825`, detail failures `0`, output at `data/schemes/agriculture_schemes_catalog.json`
- Full-catalog report: `data/schemes/agriculture_schemes_scrape_report.json` (`recordsWithFaqs=825`, `recordsWithDocuments=825`, `recordsWithEligibility=825`, `recordsWithApplicationProcess=825`)
- Smoke command: `bash scripts/day2_smoke_test.sh`
- Type-check: `npx tsc --noEmit`
- Build-check: `npm run build`
- Satellite validation: `/api/satellite/ingest?userId=day2-smoke-user&maxResults=2&maxCloudCover=35&allowFallback=true`

## Day 3 Evidence Snapshot
- Smoke command: `bash scripts/day3_smoke_test.sh`
- Type-check: `npx tsc --noEmit`
- Build-check: `npm run build`
- Smoke coverage hardening (2026-02-13): `scripts/day3_smoke_test.sh` now validates WebM STT runtime path and multilingual fallback compatibility (`or-IN` -> `languageUsed=auto` when local whisper language code is unavailable).
- Satellite health validation: `GET /api/satellite/health?allowFallback=true&maxResults=2&maxCloudCover=35` -> score + summary + recommendations + alerts.
- Voice STT validation (regional language): `POST /api/voice/stt` with `language=mr-IN` + transcript fallback -> success.
- Voice roundtrip validation: `POST /api/voice/roundtrip` -> transcript + personalized answer + TTS metadata in one API flow.
- Voice local runtime validation: `POST /api/voice/stt` with WAV input and no transcript fallback -> `provider=whisper_cpp`.
- Multilingual validation: STT API accepted `13` configured languages (`hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`).

## Day 4 Evidence Snapshot (Phase 1/2 In Progress)
- Type-check: `npx tsc --noEmit`
- Build-check: `npm run build`
- Ingest smoke run: `node scripts/ingest_agmarknet_2025.mjs --year=2025 --max-combos=50 --concurrency=4 --granularities=d,m,y` -> attempted `50`, stored `3`, empty `47`, failed `0`.
- Resume checkpoint run: interrupted run `agmarknet_y2025_1771016530612` resumed via `--resume --run-id=agmarknet_y2025_1771016530612` with cursor recovery (`30 -> 1450`) and no deterministic-id duplication drift (`y2025_{granularity}_0_0_451` remains exactly 3 docs).
- Data correctness spot checks (source vs DB, all levels, both metrics, `d/m/y`):
  - all-India: `state_id=0,district_id=0,commodity_id=451`
  - state: `state_id=23,district_id=0,commodity_id=451`
  - district: `state_id=23,district_id=432,commodity_id=451`
  - result: `price=OK`, `quantity=OK` for all 9 combinations (tolerance-aware float comparison).
- Prices API contract checks (`next dev -p 3110`):
  - `action=filters` -> `200`
  - `action=cards` pagination -> `200`
  - `action=cards` with `stateId=23&districtId=432` shrank results (`4 -> 1`)
  - `action=series` success (`commodityId=451,stateId=0,districtId=0`) -> `200`
  - `action=series` empty (`commodityId=451,stateId=1,districtId=1`) -> `200` with `empty=true`
  - invalid granularity -> `400`
  - missing required IDs -> `400`

## Day 6 Evidence Snapshot (Phase 1 In Progress)
- Type-check: `npx tsc --noEmit`
- Build-check: `npm run build`
- Satellite high-accuracy path hardening (2026-02-13):
  - Added `precisionMode`, `useCache`, `forceRefresh`, and `cacheTtlHours` support in `GET /api/satellite/health` (defaults: `high_accuracy`, `true`, `false`, `24`).
  - Added response metadata contracts:
    - `metadata.sourceScene` (`sceneId`, `capturedAt`) for true satellite capture timestamp.
    - `metadata.cache` (`hit`, `key`, `expiresAt`, `forced`, `staleFallbackUsed`) for quota-transparent refresh behavior.
  - Added high-accuracy NDVI raster rendering path (`mapOverlay.strategy=ndvi_raster`) with explicit degraded fallback (`highAccuracyUnavailableReason`) when Process API is unavailable.
  - Added persistent 24h cache layer (`satelliteHealthCache` + profile fallback `day6SatelliteHealthCache`) with deterministic cache-keying.
- Dev runtime stability check: `GET /assistant` (dev server on port `3100`) -> `200` with no `SegmentViewNode` React Client Manifest error and no metadata `viewport/themeColor` warnings.
- Integration evidence:
  - `app/farm-profile/page.tsx`: map-only land boundary flow now owns persisted land area; manual acreage entry removed.
  - `lib/services/satelliteAoiResolver.ts`: shared AOI resolution path for ingest + health (`query_bbox` -> `profile_land_geometry` -> `demo_fallback`).
  - `app/api/satellite/health/route.ts`: now resolves AOI server-side and forwards `aoiSource` + geometry context to health service.
  - `app/api/satellite/ingest/route.ts`: now reuses the same AOI resolver to keep ingest and health contracts aligned.
  - `lib/services/satelliteHealthService.ts`: now returns `mapOverlay` payload and metadata source flags (`aoiSource`, `geometryUsed`).
  - `components/SatelliteHealthMap.tsx`: reusable interactive map overlay component added for dashboard + drilldown use.
  - `app/dashboard/page.tsx`: satellite block is now a lightweight navigation entry card that routes to dedicated `/satellite` analysis page.
  - `app/satellite/page.tsx`: new full drilldown page with map overlays, recommendations, alerts, and manual refresh.
  - `app/satellite/page.tsx`: right-side metadata panel now shows explicit scan mode and color labels so score cards align with map colors.
  - `app/api/satellite/health/route.ts`: high-accuracy raster responses now use raster-accurate uncertainty text (no stale "metadata-driven estimation" note).
  - `components/SatelliteHealthMap.tsx`: map legend moved to top-right and labeled to avoid overlap with Leaflet zoom controls.
  - `app/satellite/page.tsx`: manual refresh now defaults to live-only attempt, preserves previous scan on failure, and provides explicit fallback-refresh action.
  - `app/satellite/page.tsx`: fixed stale-state refresh regression by tracking latest scan via ref so failure handling reliably retains previous data.
  - `app/api/satellite/health/route.ts`: fixed numeric query default parsing so missing values no longer coerce to `0` (`maxCloudCover/currentWindowDays/baselineOffsetDays/baselineWindowDays` now use intended defaults).
  - `components/layout/Navigation.tsx`: `/satellite` added to top and bottom navigation menus.
  - `components/layout/Footer.tsx`: satellite analysis link added under Tools for secondary discoverability.
  - `app/api/farm-profile/route.ts`: Coordinate range validation enforced during profile save.
  - `lib/firebase/firestore.ts`: land parcel coordinates are serialized for Firestore write compatibility and rehydrated on profile read.
  - `next.config.js`: disabled `experimental.devtoolSegmentExplorer` to avoid Next dev-only manifest instability path.
  - `next.config.js` + `package.json`: isolated Next artifact directories (`.next/dev` for dev, `.next/build` for build/start) to prevent manifest collisions during concurrent workflows.
  - `tsconfig.json`: included `.next/dev/types` and `.next/build/types` for type-check compatibility with isolated dist directories.
  - `app/layout.tsx`: moved `viewport` + `themeColor` from `metadata` export to `viewport` export for Next 15 compatibility.
  - `lib/ai/gemini.ts`: replaced English-only assistant prompt behavior with same-language response policy + transliterated-language inference + one-shot language-correction retry for English-redirection drafts.
  - `lib/ai/gemini.ts`: added Ollama timeout hardening (extended request budget, lean-context retry on timeout, and non-fatal correction-pass timeout handling).
  - `lib/ai/gemini.ts`: added English fallback inference for Latin-script queries, strict English-target correction when model drifts into non-Latin script output, and truncation continuation merge for incomplete answers.
  - `lib/services/assistantQueryService.ts`: assistant pipeline now accepts optional `responseLanguageHint`.
  - `app/api/ai/query/route.ts`: optional `language` request hint now forwarded to assistant pipeline.
  - `app/api/voice/roundtrip/route.ts`: selected voice `language` now forwarded as assistant response-language hint.
  - `app/api/ai/query/route.ts`: optional `provider` request field (`ollama`/`gemini`) now forwarded to assistant pipeline.
  - `app/api/voice/roundtrip/route.ts`: optional `assistantProvider` form field (`ollama`/`gemini`) now forwarded to assistant pipeline.
  - `app/assistant/page.tsx`: added assistant model toggle (Local LLM / Gemini API) and provider pass-through for text + voice requests.
  - `app/assistant/page.tsx`: `New Session` now regenerates backend `sessionId` to prevent old conversation language/context bleed into new chats.
  - `lib/services/assistantQueryService.ts`: added strict provider validation (`ollama`/`gemini`), returning `400` for invalid provider values.
  - `lib/ai/gemini.ts`: assistant provider routing now supports both Ollama and Gemini with consistent language/correction/truncation guards.
  - `lib/ai/gemini.ts`: Gemini assistant path now uses model candidate fallback (`GEMINI_ASSISTANT_MODEL`, `GEMINI_MODEL`, defaults) and actionable error mapping for missing key, auth, model mismatch, and quota failures.
  - `app/farm-profile/page.tsx`: switched `FarmAreaSelector` to `next/dynamic` (`ssr:false`) to prevent Leaflet/browser-global prerender crash during build validation.
  - `app/assistant/page.tsx`: Browser recognizer finalization now waits for final/interim transcript before STT submission (prevents Hindi fallback transcript loss during stop).
  - `lib/services/voiceService.ts`: STT MIME normalization + actionable whisper runtime diagnostics added to avoid misleading config-only failures.
- Voice regression validation evidence (2026-02-13):
  - `POST /api/voice/stt` success path: Hindi transcript fallback (`language=hi-IN`, `browserTranscript=...`) -> `200`, `provider=browser_fallback`.
  - `POST /api/voice/stt` server path: WAV audio (`audio/wav`) with no transcript fallback -> `200`, `provider=whisper_cpp`.
  - `POST /api/voice/stt` server path: WebM audio (`video/webm`) with no transcript fallback -> `200`, `provider=whisper_cpp` (container auto-converted to WAV before whisper runtime).
  - Multilingual whisper path check across all configured language codes (`hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`) -> all `200`; `or-IN` returned `languageUsed=auto` with explicit fallback reason.
  - Bengali script-normalization check: `POST /api/voice/stt` with `language=bn-IN` and Devanagari transcript fallback now returns Bengali-script transcript with explicit STT note.
  - TTS long-response hardening: `POST /api/voice/tts` with text length `1705` now returns `200` with `provider=browser_speech_fallback` and explicit fallback reason (no hard failure).
  - `POST /api/voice/stt` error path: missing both audio and transcript -> `400` validation error.
  - `POST /api/voice/roundtrip` success path: transcript -> personalized answer -> TTS metadata -> `200`.
  - `POST /api/voice/roundtrip` success path with `language=or-IN` + WebM audio -> `200`, warning includes unsupported-language auto fallback note.
  - `POST /api/voice/roundtrip` error path: missing both audio and transcript -> `400` validation error.
  - Multilingual STT fallback sweep across all configured language codes (`hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`) with `browserTranscript` payload -> all `200`, `provider=browser_fallback`, `languageUsed` normalized per language.
  - Multilingual voice roundtrip sweep across same language set (`language=ttsLanguage`) with transcript fallback -> all `200`, `sttProvider=browser_fallback`, `tts.provider=espeak`, warnings present (`1`) per request.
  - Multilingual text-assistant check (`POST /api/ai/query`) with Bengali-script query (`আমি ধানচাষ করতে চাই। এখন কী করব?`) -> `200`, Bengali response.
  - Multilingual text-assistant check (`POST /api/ai/query`) with romanized Bengali query (`ami dhanchas korte chai, ekhon ki korbo?`) -> `200`, non-English response (no English-only redirect instruction).
  - Assistant explicit-language hint check (`POST /api/ai/query`, `language=bn-IN`) with English question -> `200`, Bengali response.
  - Voice-language hint propagation check (`POST /api/voice/roundtrip`, `language=bn-IN`, `browserTranscript=ami dhanchas korte chai`) -> `200`, assistant answer returned without English-switch instruction.
  - Timeout regression check (`POST /api/ai/query`, input: `ami dhan chas korte chai , help korun plz`) -> `200`, answer returned, no `AbortError`/timeout in server log.
  - English-language drift check (`POST /api/ai/query`, input: `i need to farm wheat help me`) -> `200`, response returned in English script (`NON_LATIN=no`).
  - Assistant completion check (`POST /api/ai/query`, same English input) -> response ends with complete sentence (`ENDS_CLEAN=yes`).
  - Assistant validation error check (`POST /api/ai/query`, body `{}`) -> `400`, `Question is required and must be a string`.
  - Assistant provider success check (`POST /api/ai/query`, `provider=ollama`) -> `200`, `meta.provider=ollama`.
  - Assistant provider validation check (`POST /api/ai/query`, `provider=abc`) -> `400`, `Unsupported provider. Use 'ollama' or 'gemini'.`.
  - Assistant Gemini quota/error-path check (`POST /api/ai/query`, `provider=gemini`, key-enabled runtime) -> `500`, `Gemini request quota exceeded...` actionable error.
  - Voice roundtrip provider success check (`POST /api/voice/roundtrip`, `assistantProvider=ollama`) -> `200`, `answerMeta.provider=ollama`.
  - Voice roundtrip provider validation check (`POST /api/voice/roundtrip`, `assistantProvider=abc`) -> `400`, `Unsupported provider. Use 'ollama' or 'gemini'.`.
  - Voice roundtrip Gemini quota/error-path check (`POST /api/voice/roundtrip`, `assistantProvider=gemini`, key-enabled runtime) -> `500`, `Gemini request quota exceeded...` actionable error.
  - Farm geometry persistence check (`POST /api/farm-profile` with `landGeometry`) -> `200` after Firestore coordinate serialization hardening.
  - Satellite health success check (`GET /api/satellite/health?userId=sat-geo-user&allowFallback=true&maxResults=2`) -> `200`, `metadata.aoiSource=profile_land_geometry`, `health.mapOverlay.strategy=estimated_zones`.
  - Satellite ingest AOI sync check (`GET /api/satellite/ingest?userId=sat-geo-user&allowFallback=true&maxResults=2`) -> `200`, AOI bbox aligned to saved parcel geometry (`[85.2,20.1,85.23,20.13]`).
  - Farm profile validation check (`POST /api/farm-profile` without `location.landGeometry`) -> `400`, `Farm boundary map selection is required.`.
  - Satellite non-geometry user AOI check (`GET /api/satellite/health?userId=sat-coord-user&allowFallback=true&maxResults=2`) -> `200`, `metadata.aoiSource=demo_fallback`.
  - Satellite explicit error-path check (`GET /api/satellite/health?userId=sat-geo-user&allowFallback=false&maxCloudCover=0`) -> `500`, `No scenes found under cloud threshold 0%.`
  - Satellite invalid-bbox resilience check (`GET /api/satellite/health?userId=sat-geo-user&bbox=1,2,3&allowFallback=true`) -> `200`, invalid bbox ignored and resolver path remains `metadata.aoiSource=profile_land_geometry`.
  - Dashboard route sanity check (`GET /dashboard`) -> `200` with satellite entry card rendered and `/satellite` nav link visible in response markup.
  - Satellite page route check (`GET /satellite`) on active dev runtime -> `200`.
  - Navigation wiring check (`components/layout/Navigation.tsx`, `components/layout/Footer.tsx`) -> `/satellite` route present in top/bottom nav and footer tools links.
  - Concurrent runtime stability check: while `npm run dev -p 3104` served `/satellite`, parallel `npm run build` completed and repeated `/satellite` + `/api/satellite/health` requests stayed `200` (no `.next` manifest ENOENT).
  - Satellite refresh UX check: `/satellite` manual refresh now sends live-only request (`allowFallback=false`), preserves existing scan on failure, and exposes separate fallback refresh action.
  - Satellite refresh regression check: when live refresh fails after a successful load, existing map/insight remains visible (no full error-card takeover).
  - Satellite health default-parameter regression check (`GET /api/satellite/health?userId=...&allowFallback=false&maxResults=3`) -> `200`, `dataSource=live_cdse`, expected non-zero date windows applied.
  - Satellite cache behavior checks:
    - first call (`precisionMode=high_accuracy`, `useCache=true`) -> `200`, `metadata.cache.hit=false`, `mapOverlay.strategy=ndvi_raster`
    - second identical call -> `200`, `metadata.cache.hit=true`
    - forced refresh (`forceRefresh=true`) -> `200`, `metadata.cache.forced=true`, `metadata.cache.hit=false`
  - High-accuracy degraded fallback simulation (`simulateNdviFailure=true`) -> `200`, `health.highAccuracyUnavailableReason` present, `mapOverlay.strategy=estimated_zones`.
  - Strict no-fallback error path (`allowFallback=false&maxCloudCover=0`) -> `500`, explicit actionable failure.
  - Invalid bbox resilience check (`bbox=1,2,3`) -> `200`, invalid bbox ignored and AOI source remains `profile_land_geometry`.

## Cross-Day Notes
- 2026-02-14: Simplified schemes UX routing so `/schemes` now redirects to `/schemes/agriculture` as the only active schemes page; dedicated recommendation page removed.
- 2026-02-14: Expanded Day 2 scheme intelligence with full agriculture corpus ingestion (`83` listing pages, `825` schemes) and added browse API/UI (`/api/schemes/agriculture`, `/schemes/agriculture`) plus optional Firestore seed path (`agricultureSchemeCatalog`).
- 2026-02-14: Implemented Agmarknet 2025 exhaustive market ingestion + `/market-prices` replacement baseline (new ingestion script, new Firestore market collections, new `/api/prices` contract, and marketplace-style UI with analytics detail panel) to progress Day 4 Phase 1/2.
- 2026-02-13: Hardened `/satellite` refresh trust behavior by defaulting refresh to live-only and preserving previously loaded results if live refresh fails; fallback sampling now requires explicit user action (`Refresh With Fallback`).
- 2026-02-13: Fixed intermittent Next.js dev/runtime manifest ENOENT failures by isolating dev/build output directories (`NEXT_DIST_DIR=.next/dev` for dev and `.next/build` for build/start), preventing `.next` artifact collisions under parallel workflows.
- 2026-02-13: Fixed land-geometry persistence path by making farm profile map-boundary the single source of truth (no manual acreage input), normalizing saved area/center from geometry, and enforcing geometry-required profile saves before satellite analysis.
- 2026-02-13: Moved satellite analysis UI out of dashboard into dedicated `/satellite` page and added direct top/bottom navigation access to reduce dashboard load and improve discoverability.
- 2026-02-13: Delivered geometry-driven interactive satellite mapping for Day 6 Phase 1 (dashboard mini-map + `/satellite` drilldown) with explicit AOI-source transparency and manual refresh controls.
- 2026-02-13: Added shared server-side AOI resolver for `/api/satellite/health` and `/api/satellite/ingest`, preventing route-level AOI drift and enforcing deterministic source precedence.
- 2026-02-13: Fixed farm parcel persistence blocker by serializing polygon coordinates for Firestore writes and rehydrating them on profile reads while preserving API contract shape.
- 2026-02-13: Fixed dev-runtime `/assistant` instability by disabling Next.js experimental Segment Explorer (`experimental.devtoolSegmentExplorer=false`) and resolved Next metadata warnings by moving `viewport`/`themeColor` into the `viewport` export in `app/layout.tsx`.
- 2026-02-13: Fixed assistant multilingual regression where non-English farmer questions could trigger English-only redirection; assistant now follows same-language response policy, supports language hints (`/api/ai/query` + voice roundtrip), and retries once with strict correction if output asks user to switch to English.
- 2026-02-13: Hardened assistant query reliability for hackathon load by adding timeout-aware Ollama retry with lean context prompt and safer correction-pass timeout handling (prevents avoidable `/api/ai/query` 500 on first-attempt timeout).
- 2026-02-13: Fixed assistant context/language carryover by regenerating chat `sessionId` on `New Session`, added English fallback inference + English-target correction to prevent unintended Bengali/Hindi drift for English text queries, and added truncation continuation guard for cut-off answers.
- 2026-02-13: Added assistant provider toggle support (Local Ollama / Gemini) across text and voice paths with strict provider validation, explicit no-silent-fallback behavior, Gemini model-candidate fallback handling, and actionable Gemini failure messages.
- 2026-02-13: Fixed local whisper runtime compatibility gap for browser-recorded containers by auto-converting non-native whisper formats (`webm`/`m4a`/`mp4`) to WAV before transcription, and added unsupported-language auto-detect retry (`languageUsed=auto`) to prevent hard failures for configured language codes like `or-IN`.
- 2026-02-13: Added transcript script-normalization guard for Indic languages (example: Devanagari output auto-rendered to Bengali for `bn-IN`) and removed noisy UI warning for expected locale normalization (`bn-IN` -> `bn`).
- 2026-02-13: Fixed voice roundtrip failure mode for long AI answers by converting server TTS length-limit errors (`>1600`) into explicit browser-speech fallback instead of blocking the interaction.
- 2026-02-13: Completed voice input bug-check and hardening pass after Hindi voice failure report; fixed frontend fallback transcript race (recognizer aborted before transcript finalization), improved STT MIME compatibility handling, and replaced misleading whisper failure message with actionable runtime diagnostics.
- 2026-02-10: Added mandatory UI-backend contract synchronization discipline in `AGENTS.md` and governance checklists to prevent future API/UI drift (endpoint-consumer mapping, same-session sync requirement, and success/error validation evidence gate).
- 2026-02-09: Started Day 6 Phase 1 integration hardening by wiring satellite dashboard requests to farmer-specific AOI from farm profile context and surfacing explicit demo-area fallback messaging when parcel geometry is missing.
- 2026-02-09: Reduced Day 2 scheme card checklist visual dominance by compacting checklist rows, switching to two-column layout on wider screens, and using custom-sized checkbox indicators.
- 2026-02-09: Polished Day 2 scheme checklist UX by converting raw document keys to readable labels and replacing oversized native checkbox rows with compact, mobile-friendly checklist controls.
- 2026-02-09: Completed UI-backend contract sync for profile/schemes/community pages by exposing full farm profile fields, wiring real Day 2 save/checklist interactions, and fixing community post/like/comment payload integration.
- 2026-02-09: Hardened Firebase auth error handling for signup/signin by mapping `auth/configuration-not-found`, `auth/unauthorized-domain`, `auth/invalid-api-key`, and `auth/app-not-authorized` to actionable remediation guidance.
- 2026-02-09: Application documentation refactored to modular structure under `docs/application/` with `docs/application/README.md` as entrypoint.
- 2026-02-09: Modular application docs expanded with detailed scope, architecture, data, API, environment, quality, release, and governance content.
- 2026-02-09: Documentation depth enforcement added via `AGENTS.md` rules and governance checklist (`docs/application/governance/DOC_UPDATE_CHECKLIST.md`).
- 2026-02-09: Added reusable `ANTIGRAVITY.md` profile for shorter future prompts, while keeping `AGENTS.md` as canonical policy.
- 2026-02-09: Executed full mobile-first UI revamp (Stone/Emerald theme, bottom nav, minimal MVP pages) for Day 2 hackathon polish.
- 2026-02-09: Completed Day 3 implementation (satellite health intelligence, voice backend, and voice-first assistant UX) with smoke validation and documentation sync.
- 2026-02-09: Day 3 voice hardening pass completed with local whisper.cpp runtime activation and major Indian language expansion in STT/TTS/UI selection.
- 2026-02-09: Completed Day 3 UI consistency polish (semantic tokens adoption).
