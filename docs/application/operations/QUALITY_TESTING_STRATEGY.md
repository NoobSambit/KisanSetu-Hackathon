# Quality and Testing Strategy

Last Updated: 2026-02-13 (Satellite Right-Panel Consistency + Color Labels)

This document defines how KisanSetu validates correctness and release confidence during hackathon delivery.

## Quality Goals

1. Critical user paths must remain functional after each non-trivial change.
2. API error handling must be deterministic and readable.
3. Day-phase acceptance criteria must be backed by evidence artifacts.
4. Trust-sensitive modules must expose confidence and fallback behavior clearly.

## Testing Layers

### Layer 1: Static and Build Checks

- Type safety:
  - `npx tsc --noEmit`
- Build viability:
  - `npm run build`

These are mandatory before marking any phase as done.

### Layer 2: Scripted Smoke Tests

- Day 1 smoke:
  - `bash scripts/day1_smoke_test.sh`
- Day 2 seed:
  - `npm run seed:day2-schemes`
- Day 2 smoke:
  - `bash scripts/day2_smoke_test.sh`
- Day 3 smoke:
  - `bash scripts/day3_smoke_test.sh`
  - includes WebM STT runtime and multilingual fallback check when `ffmpeg` + `espeak/espeak-ng` are available
- Voice multilingual regression sweep (manual loop):
  - `POST /api/voice/stt` across all configured language codes with transcript fallback
  - `POST /api/voice/roundtrip` across same language set (`language=ttsLanguage`)

### Layer 3: Route-Level Manual Checks

Focus on:

- success and error response shapes
- validation edge cases
- fallback and degraded-mode behavior

Examples:

- missing `userId` on user-scoped routes
- invalid payload for checklist or profile updates
- satellite ingest with missing CDSE keys plus `allowFallback` permutations

## Daywise Validation Model

For each day/phase:

1. Entry criteria:
  - dependencies configured
  - baseline scripts pass
2. Exit checklist:
  - PRD acceptance criteria met
  - route and UI smoke validated
3. Evidence artifact:
  - command output, route response sample, and/or metric snippet
4. Traceability:
  - update tracker and app-wide update logs in same session

## Current Command Baseline

```bash
npx tsc --noEmit
npm run build
bash scripts/day1_smoke_test.sh
npm run seed:day2-schemes
bash scripts/day2_smoke_test.sh
bash scripts/day3_smoke_test.sh
```

## Functional Scenario Matrix

| Area | Scenario | Expected Result |
|---|---|---|
| Assistant (Dev Runtime) | Load `/assistant` in `next dev` | `200` and no `SegmentViewNode` React Client Manifest errors in dev logs |
| Assistant | Ask query with valid question | `success=true`, non-empty answer, meta present |
| Assistant | Ask query in Bengali script | assistant returns Bengali response; no "use English" instruction |
| Assistant | Ask query in Bengali transliteration (`ami dhanchas korte chai`) | assistant keeps non-English language behavior; no "use English" instruction |
| Assistant | `/api/ai/query` with explicit `language=bn-IN` | response language follows Bengali target behavior |
| Assistant | `/api/ai/query` with `provider=ollama` | `200` with `meta.provider=ollama` |
| Assistant | `/api/ai/query` with `provider=groq` and valid key | `200` with `meta.provider=groq` |
| Assistant | `/api/ai/query` with invalid provider value | `400` validation error (`Unsupported provider`) |
| Assistant | `/api/ai/query` with `provider=groq` and missing/invalid/rate-limited key | explicit actionable `500` error (no silent fallback) |
| Assistant | `/api/ai/query` timeout repro input (`ami dhan chas korte chai , help korun plz`) | returns `200` answer under normal local runtime; no immediate AbortError fail |
| Assistant | `/api/ai/query` with English text (`i need to farm wheat help me`) | `200` response in English script (no unintended Bengali/Hindi script drift) |
| Assistant | `New Session` in `/assistant` after prior-language conversation | new turn uses new backend `sessionId`; prior session context does not bleed into language/output |
| Assistant | `/api/ai/query` completion check on long practical answer | response ends with complete sentence (no cut-off tail) |
| Assistant | Ask empty query | `400` with validation error |
| Farm Profile | Save valid profile | `success=true`, patterns refreshed |
| Farm Profile | Save profile with invalid map-geometry coordinates | `400` validation error with clear geometry coordinate message |
| Farm Profile | Save profile without `location.landGeometry` | `400` validation error (`Farm boundary map selection is required.`) |
| Schemes | Fetch recommendations with profile | scored list with reasons and status labels |
| Schemes | Toggle save/checklist | persisted state and updated readiness score |
| Satellite | Ingest with valid CDSE config | scenes persisted with metadata |
| Satellite | Ingest with missing CDSE config and fallback enabled | explicit fallback source returned |
| Satellite | Health insight generation (`/api/satellite/health`) | score + summary + zone indicators + recommendations + alerts |
| Satellite | Health insight with `userId` + saved parcel geometry | `aoiSource=profile_land_geometry` and `health.mapOverlay` returned |
| Satellite | Health insight with user lacking saved map geometry | `aoiSource=demo_fallback` with explicit fallback messaging |
| Satellite | High-accuracy first call (`precisionMode=high_accuracy`, cache enabled) | `200`, `cache.hit=false`, overlay strategy `ndvi_raster` |
| Satellite | High-accuracy second identical call within TTL | `200`, `cache.hit=true` (no live ingest/process expected) |
| Satellite | High-accuracy force refresh (`forceRefresh=true`) | `200`, `cache.forced=true`, `cache.hit=false` |
| Satellite | Simulated Process API failure (`simulateNdviFailure=true`) | `200`, estimated overlay + explicit `highAccuracyUnavailableReason` |
| Satellite | High-accuracy raster uncertainty note check | `mapOverlay.strategy=ndvi_raster` and `uncertaintyNote` references raster basis (not metadata-estimation text) |
| Runtime Stability | Run `npm run build` while `npm run dev` serves `/satellite` + `/api/satellite/health` | No `.next` manifest ENOENT; routes keep returning `200` |
| Satellite | Health insight with invalid `bbox` query (`bbox=1,2,3`) + `userId` | request succeeds using normal AOI resolution fallback (no crash) |
| Satellite | Health insight without optional numeric query params (`/api/satellite/health?userId=...&allowFallback=false&maxResults=3`) | server applies defaults (`maxCloudCover=35`, non-zero date windows) and does not coerce missing params to `0` |
| Satellite | Health insight with `allowFallback=false&maxCloudCover=0` | explicit `500` failure with actionable message |
| Dashboard + Satellite | Open dashboard after satellite split | dashboard shows entry card and CTA to `/satellite` without heavy satellite analysis rendering |
| Navigation + Satellite | Open navbar on desktop/mobile | `/satellite` is visible and navigable from top/bottom nav |
| Satellite Drilldown | Open `/satellite` and click `Refresh Scan` | map + side panels update without navigation break |
| Satellite Drilldown | Live refresh failure on `/satellite` (`allowFallback=false`) | previous scan remains visible and UI shows warning notice (no blank/error card replacement) |
| Satellite Drilldown | Live refresh failure after prior successful load (stale-state regression check) | previous scan still remains visible; no full error card takeover |
| Satellite Drilldown | Click `Refresh With Fallback` on `/satellite` | fallback sample loads explicitly with trust-warning banner |
| Satellite Drilldown | `Satellite Captured` and `Data Age` render on `/satellite` | timestamp is sourced from `metadata.sourceScene.capturedAt` (scene time), not client refresh time |
| Satellite Drilldown | Right-side color labels card is visible | zone score colors and NDVI raster colors are explicitly labeled for user interpretation |
| Voice | STT request with Bengali fallback transcript | transcript returned with provider + guardrails metadata |
| Voice | TTS request with Tamil input | provider is `espeak` or explicit browser fallback |
| Voice | Roundtrip request (`/api/voice/roundtrip`) | transcript + personalized answer + TTS payload + warnings |
| Voice | Roundtrip request with `assistantProvider=ollama` | `200` and `answerMeta.provider=ollama` |
| Voice | Roundtrip request with invalid `assistantProvider` | `400` validation error from assistant provider contract |
| Voice | Roundtrip request with `assistantProvider=groq` and rate-limited key | `500` with actionable Groq rate limit error |
| Voice | STT request with WAV audio and no transcript fallback | provider `whisper_cpp` when local runtime is configured |
| Voice | STT request with WebM audio and no transcript fallback | succeeds via whisper path after container conversion |
| Voice | STT request with `or-IN` language and local whisper runtime | success; unsupported language auto-retried with `languageUsed=auto` + explicit fallback reason |
| Voice | STT request with `bn-IN` and Devanagari transcript fallback | output transcript is normalized to Bengali script with explicit note |
| Voice | STT request missing both audio and `browserTranscript` | `400` with explicit validation error |
| Voice | Roundtrip request missing both audio and `browserTranscript` | `400` with explicit validation error |
| Voice | STT multilingual sweep across all configured language codes | all requests return `200` with explicit provider metadata |
| Voice | Roundtrip multilingual sweep across all configured language codes | all requests return `200` with transcript + answer + TTS payload |
| Weather | Query by city | weather payload with advice |
| Prices | Query by crop | price list payload |
| Disease | Upload invalid file type | `400` validation error |

## Non-Functional Quality Targets

- API responses should remain consistently parseable by frontend.
- Core pages should remain mobile-usable (form controls and card flows).
- Writes should avoid undefined fields to prevent Firestore payload drift.
- Fallback activation should be explicit in outputs for trust preservation.
- Voice degraded-mode behavior should remain explicit and user-visible (API + UI warnings).
- Multilingual voice contracts should stay stable across all configured language codes.

## Evidence Recording Standard

Each non-trivial phase update should include:

- command executed
- pass/fail result
- any notable warnings
- fallback source used (if applicable)

Evidence destinations:

- `docs/prd/PRD_PROGRESS_TRACKER.md`
- `docs/prd/APPLICATION_WIDE_UPDATES.md`
- relevant `docs/hackathon/*_PROGRESS_LOG.md`

## Known Testing Gaps

- Limited automated unit tests for rule engines and service utilities.
- No consolidated end-to-end browser test suite yet.
- Authorization and rules hardening tests are mostly manual.

## Planned Testing Improvements

1. Add unit tests for scheme scoring and duplicate detection logic.
2. Add integration tests for satellite ingest success/fallback/error paths.
3. Introduce contract tests for high-use API responses.
4. Add regression checks for auth-sensitive write endpoints.
