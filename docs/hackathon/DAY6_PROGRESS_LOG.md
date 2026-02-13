# Day 6 Progress Log

Last Updated: February 13, 2026, 15:26 IST

## Environment Verification
- [x] Day 3 satellite health API available (`/api/satellite/health`).
- [x] Farm profile API available (`/api/farm-profile`).
- [x] Dashboard and profile pages compile in Next.js runtime.

## Phase Status

### Phase 1 - Unified Dashboard
- [x] Started dashboard integration hardening for farmer-specific satellite targeting.
- [x] Switched Farm Profile land capture to map-boundary-only flow in `app/farm-profile/page.tsx`.
- [x] Removed manual acreage entry path from profile UI; land area now always comes from map geometry.
- [x] Added coordinate validation guardrails in `app/api/farm-profile/route.ts`.
- [x] Added shared AOI resolution service (`lib/services/satelliteAoiResolver.ts`) for both ingest + health APIs:
  - valid query `bbox`
  - saved parcel geometry bbox
  - demo fallback AOI.
- [x] Added explicit satellite-page source messaging:
  - profile parcel-geometry AOI mode
  - demo fallback mode when profile geometry is missing.
- [x] Moved full satellite analysis to dedicated `/satellite` page and simplified dashboard to a navigation entry card.
- [x] Added `/satellite` to top and bottom navbar navigation (`components/layout/Navigation.tsx`) and footer tools links (`components/layout/Footer.tsx`).
- [x] Added new `/satellite` drilldown page with:
  - full interactive map (farm boundary + zone polygons + scene footprint)
  - recommendations/alerts/uncertainty side panel
  - explicit fallback transparency + manual refresh.
- [x] Added `health.mapOverlay` response contract with legend and disclaimer for honest non-raster visualization.
- [x] Added `metadata.aoiSource` + `metadata.geometryUsed` in `/api/satellite/health` response.
- [x] Fixed Firestore farm parcel persistence compatibility by serializing land-geometry coordinates on write and rehydrating on read.
- [x] Added cross-agent governance hardening to prevent UI-backend drift:
  - `AGENTS.md` now enforces endpoint-consumer contract sync rules
  - governance checklist now includes explicit contract sync gate
- [x] Executed voice-input regression bug-check after Hindi transcription failure report.
- [x] Fixed assistant voice fallback race in `app/assistant/page.tsx` (graceful recognizer stop + interim transcript retention before STT request).
- [x] Hardened STT service validation/diagnostics in `lib/services/voiceService.ts` (MIME normalization, expanded m4a/mp4 compatibility, actionable whisper runtime errors).
- [x] Added local whisper container preprocessing in `lib/services/voiceService.ts` (auto-convert `webm`/`m4a`/`mp4` to WAV via ffmpeg).
- [x] Added whisper language fallback retry (`language=auto`) for unsupported local runtime language codes (example: `or-IN`).
- [x] Reordered recording MIME preference in `app/assistant/page.tsx` to prefer OGG when browser supports it.
- [x] Extended Day 3 smoke automation (`scripts/day3_smoke_test.sh`) to cover WebM STT runtime and multilingual fallback behavior.
- [x] Added script-normalization post-processing so Bengali and other Indic selections do not display Devanagari transcripts when script mismatch occurs.
- [x] Removed noisy UI warning for expected locale normalization (`bn-IN` -> `bn`) and converted script normalization warning to explicit `STT note`.
- [x] Fixed long-answer TTS failure mode: server TTS length overflow now falls back to browser speech instead of blocking voice interaction.
- [x] Fixed `/assistant` dev-runtime instability by disabling Next Segment Explorer (`experimental.devtoolSegmentExplorer=false`) in `next.config.js`.
- [x] Resolved Next 15 metadata warnings by moving `viewport` + `themeColor` to `viewport` export in `app/layout.tsx`.
- [x] Fixed assistant multilingual behavior so non-English user messages no longer trigger English-only redirection.
- [x] Added assistant language targeting path:
  - script/romanized query inference in `lib/ai/gemini.ts`
  - optional language hint pass-through in `/api/ai/query`
  - voice-selected language hint propagation in `/api/voice/roundtrip`.
- [x] Added one-shot assistant language-correction retry when model draft asks user to switch to English.
- [x] Hardened assistant Ollama timeout path in `lib/ai/gemini.ts`:
  - extended first-pass timeout budget
  - added lean-context retry on timeout
  - prevented correction-pass timeout from dropping an already successful first answer.
- [x] Fixed assistant session carryover in `app/assistant/page.tsx`:
  - `New Session` now generates a new backend `sessionId` instead of only clearing visible UI messages.
- [x] Hardened text-assistant response stability in `lib/ai/gemini.ts`:
  - added English fallback detection for Latin-script English questions when explicit language hint is absent
  - added English-target correction retry when output drifts into non-Latin script
  - added truncation continuation merge for cut-off responses and concise-response prompt guard.
- [x] Added assistant provider toggle support (`ollama` / `gemini`) in `app/assistant/page.tsx`.
- [x] Added assistant provider contract wiring across API/service path:
  - `/api/ai/query` now accepts `provider`
  - `/api/voice/roundtrip` now accepts `assistantProvider`
  - `runAssistantQuery` now validates provider and rejects unknown values with `400`.
- [x] Added Gemini assistant runtime path in `lib/ai/gemini.ts`:
  - Gemini model-candidate fallback support (`GEMINI_ASSISTANT_MODEL`, `GEMINI_MODEL`, defaults)
  - normalized actionable Gemini error messages (missing key, auth/key issues, model mismatch, quota).
- [x] Fixed build validation blocker in `app/farm-profile/page.tsx` by loading `FarmAreaSelector` via dynamic import with `ssr:false` (Leaflet/browser globals no longer break prerender).
- [x] Hardened Next runtime artifact stability:
  - `package.json` scripts now isolate output dirs (`.next/dev` for dev, `.next/build` for build/start).
  - `next.config.js` now reads `NEXT_DIST_DIR` to keep dev/build manifests isolated.
  - `tsconfig.json` includes isolated type-gen paths (`.next/dev/types`, `.next/build/types`).
- [x] Hardened `/satellite` refresh behavior for trust-safe UX:
  - default `Refresh Scan` now requests live-only (`allowFallback=false`)
  - live-refresh failure preserves previous scan and shows non-blocking notice
  - explicit `Refresh With Fallback` action added for user-controlled sample fallback.
- [x] Fixed `/satellite` refresh stale-state regression:
  - replaced closure-dependent previous-scan check with ref-backed latest state tracking
  - prevents full error-card fallback when a refresh fails after data was already loaded.
- [x] Fixed `/api/satellite/health` default-parameter regression causing unintended fallback scenes:
  - missing numeric query params were being coerced to `0` in route parsing (`Number(null)` behavior)
  - parser now treats missing/blank params as defaults, restoring intended cloud/date windows.
- [x] Implemented high-accuracy satellite health mode with 24h DB cache + true satellite capture timestamp:
  - `/api/satellite/health` now supports `precisionMode`, `useCache`, `forceRefresh`, and `cacheTtlHours`.
  - default mode is `precisionMode=high_accuracy` with cache enabled (`24h` TTL) for quota-friendly refresh behavior.
  - metadata now returns `sourceScene` (`sceneId`, `capturedAt`) and `cache` (`hit`, `key`, `expiresAt`, `forced`, `staleFallbackUsed`).
  - high-accuracy NDVI raster enrichment is generated via CDSE Process API (`mapOverlay.strategy=ndvi_raster`).
  - high-accuracy failures now auto-degrade to estimated overlay with explicit `highAccuracyUnavailableReason` (no silent trust shift).
  - added persistent cache service (`satelliteHealthCache`) with Firestore-permission fallback storage in `farmProfiles.{userId}.day6SatelliteHealthCache`.
- [x] Updated satellite drilldown UI for cache-aware controls and true scene freshness:
  - `Refresh Scan` uses cached high-accuracy fetch.
  - `Force Live Check` bypasses cache by design.
  - `Refresh With Fallback` remains explicit degraded-mode action.
  - UI now shows `Satellite Captured` and `Data Age` sourced from scene metadata.
- [x] Fixed right-panel consistency and color comprehension for satellite map:
  - high-accuracy raster responses now force raster-accurate uncertainty note text (live + cached payloads).
  - added right-panel `Color Labels` card with zone score colors and NDVI raster color meanings.
  - moved map legend to top-right and added legend headings to avoid overlap with map zoom controls.

### Phase 2 - Offline Reliability
- [ ] Not started.

### Phase 3 - Demo Readiness
- [ ] Not started.

## Validation Evidence
- Type-check:
  - Command: `npx tsc --noEmit`
  - Result: pass
- Build-check:
  - Command: `npm run build`
  - Result: pass
- Voice API contract checks:
  - `POST /api/voice/stt` with Hindi `browserTranscript` -> `200` (`provider=browser_fallback`)
  - `POST /api/voice/stt` with WAV audio and no fallback transcript -> `200` (`provider=whisper_cpp`)
  - `POST /api/voice/stt` with WebM audio (`video/webm`) and no fallback transcript -> `200` (`provider=whisper_cpp`)
  - Multilingual WebM STT sweep (`hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`) -> all `200`; `or-IN` uses `languageUsed=auto`.
  - `POST /api/voice/stt` with `language=bn-IN` and Devanagari fallback transcript -> output normalized to Bengali script with explicit STT note.
  - `POST /api/voice/stt` with `language=hi-IN` and Devanagari fallback transcript -> output remains Devanagari (expected, no unintended conversion).
  - `POST /api/voice/tts` with text length `1705` -> `200`, `provider=browser_speech_fallback`, explicit fallback reason (no hard error).
  - `POST /api/voice/roundtrip` with WebM audio + `or-IN` -> `200` with explicit STT fallback warning
  - `POST /api/voice/stt` missing audio+transcript -> `400` validation error
  - `POST /api/voice/roundtrip` with transcript -> `200` (transcript + answer + TTS payload)
  - `POST /api/voice/roundtrip` missing audio+transcript -> `400` validation error
  - `PORT=3100 npm run dev` + `GET /assistant` -> `200`; no `SegmentViewNode` React Client Manifest errors and no metadata `viewport/themeColor` warnings.
  - STT fallback sweep across all configured language codes (`hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`) -> all `200` (`provider=browser_fallback`, `languageUsed` normalized per language).
  - Voice roundtrip sweep across all configured language codes (`language=ttsLanguage`, transcript fallback) -> all `200` (`sttProvider=browser_fallback`, `tts.provider=espeak`, warnings present).
  - `POST /api/ai/query` with Bengali-script input -> `200`, Bengali response (no English-only redirect text).
  - `POST /api/ai/query` with romanized Bengali input (`ami dhanchas korte chai`) -> `200`, non-English response (no English-only redirect text).
  - `POST /api/ai/query` with explicit `language=bn-IN` and English question -> `200`, Bengali response.
  - `POST /api/ai/query` with input `ami dhan chas korte chai , help korun plz` -> `200`, answer returned; no timeout/AbortError in dev log.
  - `POST /api/voice/roundtrip` with `language=bn-IN` + transcript fallback -> `200`, assistant output returned without English-switch instruction.
  - `POST /api/ai/query` with input `i need to farm wheat help me` -> `200`, response in English script (`NON_LATIN=no`).
  - `POST /api/ai/query` with same input -> response ends with complete sentence (`ENDS_CLEAN=yes`), no visible cut-off tail.
  - `POST /api/ai/query` with `{}` -> `400`, `Question is required and must be a string`.
  - `POST /api/ai/query` with `provider=ollama` -> `200`, `meta.provider=ollama`.
  - `POST /api/ai/query` with `provider=abc` -> `400`, `Unsupported provider. Use 'ollama' or 'gemini'.`
  - `POST /api/ai/query` with `provider=gemini` in key-enabled runtime -> `500`, actionable quota message (`Gemini request quota exceeded...`).
  - `POST /api/voice/roundtrip` with `assistantProvider=ollama` + transcript fallback -> `200`, `answerMeta.provider=ollama`.
  - `POST /api/voice/roundtrip` with `assistantProvider=abc` + transcript fallback -> `400`, `Unsupported provider. Use 'ollama' or 'gemini'.`
  - `POST /api/voice/roundtrip` with `assistantProvider=gemini` in key-enabled runtime -> `500`, actionable quota message (`Gemini request quota exceeded...`).
  - `POST /api/farm-profile` with `landGeometry` payload -> `200` (serialized coordinate write compatibility path active).
  - `GET /api/satellite/health?userId=sat-geo-user&allowFallback=true&maxResults=2` -> `200`, `metadata.aoiSource=profile_land_geometry`, `health.mapOverlay.strategy=estimated_zones`.
  - `GET /api/satellite/ingest?userId=sat-geo-user&allowFallback=true&maxResults=2` -> `200`, AOI bbox aligned to parcel geometry (`[85.2,20.1,85.23,20.13]`).
  - `POST /api/farm-profile` without `location.landGeometry` -> `400`, `Farm boundary map selection is required.`.
  - `GET /api/satellite/health?userId=sat-coord-user&allowFallback=true&maxResults=2` -> `200`, `metadata.aoiSource=demo_fallback`.
  - `GET /api/satellite/health?userId=sat-geo-user&allowFallback=false&maxCloudCover=0` -> `500`, explicit no-fallback error.
  - `GET /api/satellite/health?userId=sat-geo-user&bbox=1,2,3&allowFallback=true` -> `200`, invalid bbox ignored and AOI source stays `profile_land_geometry`.
  - `GET /dashboard` -> `200`, dashboard now shows satellite entry card and does not inline full analysis block.
  - `GET /satellite` on active dev runtime -> `200`.
  - Navigation presence check (`rg '/satellite' components/layout/Navigation.tsx components/layout/Footer.tsx`) confirms route is wired in navbar + footer.
  - Concurrent stability check: while `npm run dev -p 3104` served `/satellite`, parallel `npm run build` completed and repeated `/satellite` + `/api/satellite/health` requests stayed `200` (no `routes-manifest`/`app-paths-manifest` ENOENT).
  - Satellite refresh mode check (`app/satellite/page.tsx`): manual refresh path now uses `allowFallback=false`; separate fallback action uses `allowFallback=true`.
  - Satellite stale-state regression check (`app/satellite/page.tsx`): failed manual refresh after prior success retains map and insight panels instead of clearing to error state.
  - Satellite default-param regression check (`GET /api/satellite/health?userId=ivjHbhwZHmUvaZB1o2eS42oaagl1&allowFallback=false&maxResults=3`) -> `200`, `dataSource=live_cdse`, `currentRequestedRange=2026-01-09..2026-02-13`.
  - Satellite high-accuracy first call (`precisionMode=high_accuracy`, cache enabled) -> `200`, `cache.hit=false`, `mapOverlay.strategy=ndvi_raster`.
  - Satellite high-accuracy second identical call -> `200`, `cache.hit=true` (live ingest/process skipped).
  - Satellite force-live check (`forceRefresh=true`) -> `200`, `cache.forced=true`, `cache.hit=false`.
  - High-accuracy degrade simulation (`simulateNdviFailure=true`) -> `200`, `mapOverlay.strategy=estimated_zones`, `highAccuracyUnavailableReason` present.
  - High-accuracy raster uncertainty-note consistency check (`GET /api/satellite/health?...precisionMode=high_accuracy&useCache=false&forceRefresh=true`) -> `200`, `mapOverlay.strategy=ndvi_raster`, uncertainty note explicitly references Sentinel-2 raster basis (no metadata-estimation wording).
  - Strict no-fallback path (`allowFallback=false&maxCloudCover=0`) -> `500`, explicit no-scene failure.
  - Invalid bbox resilience (`bbox=1,2,3`) -> `200`, request continues with profile AOI resolution.
- Smoke regression script:
  - `bash scripts/day3_smoke_test.sh` -> pass (includes new WebM + multilingual fallback step)

## Known Gaps / Hardening Backlog
- Satellite color zones are currently deterministic estimated bands (metadata/reference driven), not true per-pixel B08/B04 NDVI raster overlays yet.
- Offline caching/sync behavior for dashboard modules has not started yet.
- Browser transcript fallback still depends on Web Speech API support per browser/device; unsupported devices rely on server-side STT only.
- Server-side STT for browser containers now depends on ffmpeg availability; if missing, users must rely on browser transcript fallback or upload whisper-native formats.

## Immediate Next Actions
- [ ] Upgrade from estimated zone overlays to true band-derived NDVI raster mapping.
- [ ] Add freshness timestamps on dashboard intelligence cards as per Day 6 FR1.2.
- [ ] Start offline reliability implementation for critical read paths.
