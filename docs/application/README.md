# KisanSetu Application Documentation

Version: 2.2.20
Last Updated: 2026-02-13 (Satellite Right-Panel Consistency + Color Labels)
Status: Active Source of Truth

This directory is the canonical technical documentation for KisanSetu.
It is structured for fast navigation during hackathon execution and for handoff to new contributors.

## Recent Sync Highlights

- Added high-accuracy satellite map mode on `/api/satellite/health`:
  - default request mode is now `precisionMode=high_accuracy` with `useCache=true` and `cacheTtlHours=24`.
  - response can return `health.mapOverlay.strategy='ndvi_raster'` with Process API NDVI image overlay.
  - if NDVI Process API is unavailable, API returns `200` with estimated overlay and explicit `health.highAccuracyUnavailableReason`.
- Added persistent satellite health cache layer for quota control:
  - primary collection: `satelliteHealthCache`
  - fallback storage path: `farmProfiles.{userId}.day6SatelliteHealthCache` (when collection writes are blocked).
  - response metadata now includes cache diagnostics: `metadata.cache.hit`, `key`, `expiresAt`, `forced`, `staleFallbackUsed`.
- Added true scene timestamp metadata + UI surfacing:
  - API now includes `metadata.sourceScene.sceneId` and `metadata.sourceScene.capturedAt`.
  - `/satellite` now shows `Satellite Captured` and `Data Age` from scene metadata instead of client refresh time.
- Added satellite drilldown refresh control split:
  - `Refresh Scan` (cached high-accuracy)
  - `Force Live Check` (bypass cache)
  - `Refresh With Fallback` (forced refresh with explicit degraded-mode allowance).
- Fixed high-accuracy uncertainty-note consistency:
  - raster responses now show raster-accurate uncertainty text (live + cache-hit paths), avoiding stale metadata-estimation wording.
- Added clearer color interpretation support:
  - right-side `/satellite` panel now includes a dedicated `Color Labels` card
  - map legend moved to top-right with headings to avoid overlap/clipping against zoom controls.
- Fixed `/api/satellite/health` numeric query parsing bug where missing params were coerced to `0`, which caused unintended fallback/sample scenes.
- Moved satellite analysis UX to dedicated `/satellite` page as primary analysis surface.
- Added `/satellite` into top and bottom navigation for direct access.
- Dashboard satellite section is now a lightweight entry card linking to the dedicated satellite page instead of rendering full analysis inline.
- Farm Profile land capture is now map-boundary-only:
  - manual acreage entry removed from profile UI
  - map selection persists boundary + center point and drives saved land area (`acres`).
- Hardened Next.js runtime stability by isolating artifact directories:
  - `npm run dev` uses `.next/dev`
  - `npm run build` + `npm run start` use `.next/build`
  - prevents manifest-file collisions during concurrent dev/build workflows.
- Hardened `/satellite` refresh UX:
  - `Refresh Scan` now tries live scan first (`allowFallback=false`)
  - if live refresh fails, previous scan stays visible with a clear notice (no blank/error replacement)
  - added explicit `Refresh With Fallback` action when user wants sample continuity data.
- Added geometry-driven interactive satellite map delivery for Day 6 Phase 1:
  - `/satellite` drilldown page with color-coded zone polygons, legend, and trust disclaimer
  - server-side AOI source resolution + explicit source messaging retained after dashboard UX simplification.
- Added server-side shared AOI resolver (`query_bbox` -> `profile_land_geometry` -> `demo_fallback`) reused by:
  - `/api/satellite/health`
  - `/api/satellite/ingest`.
- Extended satellite health contract with map-ready overlay payload:
  - `health.mapOverlay` (farm boundary, zone polygons, optional scene footprint, legend, disclaimer)
  - `metadata.aoiSource`
  - `metadata.geometryUsed`.
- Hardened farm geometry persistence compatibility:
  - parcel coordinates are serialized for Firestore write compatibility and rehydrated on read to preserve API shape.
- Added assistant provider toggle support (`ollama` / `gemini`) in chat UI and API contract.
- Wired provider selection end-to-end:
  - text chat requests now send optional `provider` to `/api/ai/query`
  - voice roundtrip requests now send optional `assistantProvider` to `/api/voice/roundtrip`.
- Extended assistant generation runtime to support Gemini for chatbot flow in addition to local Ollama default.
- Added Gemini model compatibility fallback chain:
  - tries configured assistant model first, then fallback candidates when model is unavailable for API version/key.
- Added explicit provider error mapping for Gemini path:
  - missing key
  - invalid/unauthorized key
  - unsupported model
  - quota exhaustion.
- Hardened assistant local-runtime timeout handling for `/api/ai/query`:
  - timeout-aware lean-context retry is now used before failing
  - correction-pass timeout no longer drops an already successful first answer.
- Fixed assistant text-chat session isolation:
  - `New Session` now regenerates backend `sessionId` so prior language/context history does not leak into the next conversation.
- Hardened assistant text-language targeting for English inputs:
  - Latin-script English fallback inference now sets target language to English when no explicit language hint is provided
  - correction pass now also applies when English-target output drifts into non-Latin script.
- Added assistant completion guard to reduce cut-off replies:
  - if Ollama output is marked length-limited or ends with likely truncation tail, one continuation pass is merged into final answer.
- Fixed assistant language behavior drift where non-English farmer messages could trigger an English-only response.
- Updated assistant prompt policy to enforce same-language replies and block "please use English" redirection behavior.
- Added assistant-side language targeting support from:
  - script/romanized query inference in text chat
  - explicit language hints from `/api/ai/query` and `/api/voice/roundtrip`.
- Added assistant language-correction retry guard for non-English turns when model output contains language-switch instructions.
- Fixed `/assistant` dev-runtime React Client Manifest instability by disabling Next.js Segment Explorer (`experimental.devtoolSegmentExplorer=false`).
- Resolved Next 15 metadata warnings by moving root `viewport` and `themeColor` into `export const viewport` in `app/layout.tsx`.
- Added explicit multilingual regression sweep evidence across all configured voice languages for both `/api/voice/stt` and `/api/voice/roundtrip`.
- Fixed Day 3/Day 6 voice-input regression where browser fallback transcript could be lost when recording stopped quickly.
- Added server-side voice container compatibility hardening: browser-recorded `webm`/`m4a`/`mp4` inputs are converted to WAV before whisper transcription.
- Added whisper language compatibility hardening: unsupported runtime language codes now auto-retry with language detection (`auto`) and expose fallback reason in payload.
- Added transcript script normalization for Indic languages so language selections (for example Bengali) are rendered in expected script when model output drifts.
- STT service now normalizes MIME variants and supports additional mobile-recording container variants (`audio/m4a`, `audio/x-m4a`, `video/webm`, `video/ogg`, `video/mp4`) for validation compatibility.
- Whisper runtime failures now return actionable diagnostics instead of only configuration guidance.
- Added explicit UI-backend contract drift prevention policy in `AGENTS.md` with mandatory same-session consumer sync requirements.
- Added governance-level contract sync gate requiring endpoint/consumer mapping and success+error evidence for API-touching changes.
- Farm Profile now uses map-boundary selection as the required land-area source and persists map-derived center coordinates for satellite targeting.
- Dedicated `/satellite` page now handles full farm-specific AOI analysis and explicitly surfaces AOI source/fallback state.
- Dashboard now keeps a lightweight satellite entry card and routes users to `/satellite` for detailed analysis.
- Farm profile UI now exposes the full backend profile contract used by personalization and scheme ranking.
- Scheme recommendation UI now uses real save/checklist persistence and profile-completeness prompts from API payload.
- Scheme checklist document labels are now humanized and rendered with compact mobile-friendly controls.
- Scheme checklist section now uses proportion-balanced layout (responsive grid + compact control sizing) to avoid overwhelming card content.
- Community UI now sends required post payload fields (`userEmail`) and persists likes/comments via API.

## How To Use This Documentation

Read based on your task:

- Product direction and scope:
  - `docs/application/overview/PRODUCT_DEFINITION.md`
  - `docs/application/overview/SCOPE_BASELINE.md`
- System design and module boundaries:
  - `docs/application/architecture/ARCHITECTURE_OVERVIEW.md`
  - `docs/application/architecture/APPLICATION_MODULES.md`
- Data contracts and API behavior:
  - `docs/application/data/DATA_ARCHITECTURE.md`
  - `docs/application/api/API_INVENTORY.md`
- Runtime, operations, quality, and release:
  - `docs/application/operations/SECURITY_PRIVACY_COMPLIANCE.md`
  - `docs/application/operations/ENVIRONMENT_RUNTIME_REQUIREMENTS.md`
  - `docs/application/operations/QUALITY_TESTING_STRATEGY.md`
  - `docs/application/operations/RELEASE_READINESS.md`
- Documentation process and audit trail:
  - `docs/application/governance/DOCUMENTATION_GOVERNANCE.md`
  - `docs/application/governance/DOC_UPDATE_CHECKLIST.md`
  - `docs/application/CHANGELOG.md`

## Documentation Map

| Area | File | Purpose | Update Trigger |
|---|---|---|---|
| Product | `docs/application/overview/PRODUCT_DEFINITION.md` | Vision, personas, outcomes, and value proposition | User value proposition, persona, or strategic pivot changes |
| Product | `docs/application/overview/SCOPE_BASELINE.md` | Implemented vs planned scope by day/phase | Any feature delivery or scope de-scope |
| Architecture | `docs/application/architecture/ARCHITECTURE_OVERVIEW.md` | End-to-end architecture and cross-cutting principles | System boundaries, major integrations, runtime shifts |
| Architecture | `docs/application/architecture/APPLICATION_MODULES.md` | Module-level responsibilities and flows | Route/service ownership or module behavior changes |
| Data | `docs/application/data/DATA_ARCHITECTURE.md` | Firestore collections, ownership, and fallback data paths | New collections, schema changes, persistence strategy changes |
| API | `docs/application/api/API_INVENTORY.md` | Route-by-route contract and error behavior | New endpoint or response shape changes |
| Operations | `docs/application/operations/SECURITY_PRIVACY_COMPLIANCE.md` | Trust, security, privacy, and compliance baseline | Auth/rules/security posture changes |
| Operations | `docs/application/operations/ENVIRONMENT_RUNTIME_REQUIREMENTS.md` | Setup, env vars, prerequisites, and runtime expectations | Env key changes, setup changes, new external dependencies |
| Operations | `docs/application/operations/QUALITY_TESTING_STRATEGY.md` | Test strategy, smoke commands, and evidence standards | New test workflows, changed quality gates |
| Operations | `docs/application/operations/RELEASE_READINESS.md` | Demo and release go/no-go checklist | Release process or acceptance bar changes |
| Governance | `docs/application/governance/DOCUMENTATION_GOVERNANCE.md` | Documentation policies and quality controls | Process updates |
| Governance | `docs/application/governance/DOC_UPDATE_CHECKLIST.md` | Mandatory depth checklist for non-trivial updates | Every non-trivial code/config/behavior change |
| Changelog | `docs/application/CHANGELOG.md` | Human-readable documentation update history | Every non-trivial docs update |

## Relationship With PRD Workflow

Application docs complement, not replace, PRD execution docs.

- Day and phase plan/tracking remains in:
  - `docs/prd/PRD_PROGRESS_TRACKER.md`
  - daywise PRDs under `docs/prd/`
  - `docs/prd/APPLICATION_WIDE_UPDATES.md`
- Daily execution evidence remains in:
  - `docs/hackathon/`

## Compatibility

Legacy references remain supported:

- `docs/application/COMPREHENSIVE_APPLICATION_DOCUMENTATION.md`

That file now acts as a compatibility index pointing to this modular structure.
