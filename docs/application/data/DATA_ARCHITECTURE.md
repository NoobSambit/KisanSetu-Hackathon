# Data Architecture

Last Updated: 2026-02-14 (Agriculture Scheme Full Catalog Dataset Added)

This document captures the current Firestore data model, ownership rules, and fallback persistence behavior.

## Data Store

- Primary: Firebase Firestore
- Secondary (transient): in-memory cache for weather service
- Runtime-local ephemeral storage: OS temp workspace for Day 3 voice processing artifacts
- Seed data source: JSON files under `data/`

## Collection Catalog

| Collection | Purpose | Primary Writers | Primary Readers |
|---|---|---|---|
| `users` | Auth profile metadata | `lib/firebase/auth.ts` | auth context, admin services |
| `aiLogs` | AI query interaction history | `logAIInteraction` | context builder, admin stats |
| `savedAdvice` | Bookmarked assistant outputs | `/api/advice/save` | dashboard-like retrieval paths |
| `farmProfiles` | Core farm profile and fallback storage | `/api/farm-profile`, Day 2 fallback writes | profile and recommendation flows |
| `farmHistory` | Interaction-derived farm memory | `saveFarmInteractionMemory` | learned pattern refresh |
| `learnedPatterns` | Summarized pattern artifacts | `refreshLearnedPatterns` | AI context build, profile page |
| `schemeCatalog` | Day 2 normalized scheme dataset | seed API/script, `upsertSchemeCatalog` | recommendations API |
| `schemeRecommendations` | Snapshot of generated recommendation sets | recommendations API snapshot write | historical/debug reads |
| `schemeUserState` | Save/checklist state per user+scheme | `/api/schemes/saved`, `/api/schemes/checklist` | recommendations and saved-state APIs |
| `agricultureSchemeCatalog` | Full agriculture schemes corpus (83-page scrape normalized schema) | `scripts/seed_agriculture_schemes.mjs` | `/api/schemes/agriculture` (when seeded) |
| `satelliteHealthSnapshots` | Satellite ingest metadata snapshots | `/api/satellite/ingest` | ingest history API |
| `satelliteHealthCache` | Cached satellite health payloads and metadata for TTL-based reuse | `/api/satellite/health` cache writer | `/api/satellite/health` cache reader |
| `marketTaxonomy` | Versioned Agmarknet taxonomy snapshot for filters | `scripts/ingest_agmarknet_2025.mjs` | `/api/prices?action=filters` |
| `marketSeries` | Non-empty 2025 market series points (`price` + `quantity`) by geo/granularity combo | `scripts/ingest_agmarknet_2025.mjs` | `/api/prices?action=cards|series`, `/market-prices` |
| `marketIngestRuns` | Ingestion run config, totals, checkpoint cursor, and error trail | `scripts/ingest_agmarknet_2025.mjs` | ingestion monitoring and resume flow |
| `temp/kisansetu-voice-*` (ephemeral) | Voice STT/TTS temporary files (non-persistent) | `lib/services/voiceService.ts` | voice API routes during request lifecycle only |
| `priceChecks` | Legacy optional audit log from pre-Day4 mock price route | legacy `/api/prices` flow | analytics/admin (future) |
| `diseasePredictions` | Disease prediction logs | `/api/disease/detect` | analytics/admin (future) |
| `cropPlans` | Stored crop plan generations | crop planner service | crop planner/history views |
| `analyticsEvents` | Structured event telemetry | analytics service | analytics reporting |
| `errorLogs` | Structured error telemetry | analytics service | monitoring/admin |
| `sessionAnalytics` | Session-level behavior telemetry | enhanced analytics service | future analytics |
| `interactionHeatmaps` | UI interaction telemetry | enhanced analytics service | future analytics |
| `featureUsagePaths` | Feature path traces by session | enhanced analytics service | future analytics |
| `communityPosts` | Community feed posts | community service | community feed and admin |
| `communityComments` | Comments on posts | community service | community comments API |
| `communityReplies` | Replies to comments | community service | community replies API |
| `userRoles` | Role mapping for admin authorization | admin service | admin route guard |

## Core Document Shapes

### `farmProfiles/{userId}`

Representative fields:
- `userId`
- farmer details and agronomic context (`farmerName`, `preferredLanguage`, `landSize`, `landUnit`, `soilType`, `irrigationType`, `waterSource`, `location`, `primaryCrops`)
- optional economics and risk (`annualBudget`, `riskPreference`)
- historical context and operator notes (`historicalChallenges[]`, `notes`)
- `createdAt`, `lastUpdated`

Geospatial behavior:
- `location.landGeometry` stores farm parcel geometry (`bbox`, `centerPoint`, area metadata, selection timestamp).
- `location.coordinates` is now persisted from the selected map boundary center point for compatibility with existing consumers.
- For Firestore compatibility, parcel `coordinates` are serialized during write and rehydrated to GeoJSON-like array shape on read.
- Satellite AOI selection now uses server-side precedence shared by ingest and health APIs:
  - query `bbox` (valid override)
  - `location.landGeometry.bbox`
  - demo AOI fallback.
- UI surfaces explicit AOI source labels so fallback state is visible to the farmer.

Also used for fallback data (Day 2 resilience):
- `day2SchemeUserState`
- `day2SatelliteSnapshots`
- `day2SchemeCatalog` in `farmProfiles/day2-catalog-seed`

Also used for fallback data (Day 6 satellite cache resilience):
- `day6SatelliteHealthCache` (array of serialized cache records when `satelliteHealthCache` collection write is blocked)

### `schemeCatalog/{schemeId}`

Representative fields:
- identification and authority metadata
- eligibility inputs and rules
- benefits, deadlines, documents, action steps
- source and confidence metadata
- `createdAt`, `lastUpdated`

### `schemeUserState/{userId__schemeId}`

Representative fields:
- `userId`, `schemeId`
- `saved`
- `checklist` (document key -> boolean)
- optional `notes`
- `createdAt`, `updatedAt`

### `agricultureSchemeCatalog/{schemeDocId}`

Representative fields:
- identity and discovery:
  - `schemeDocId`, `slug`, `title`, `shortTitle`
  - listing metadata (`listing.title`, `listing.pageNumber`, `listing.positionOnPage`, `listing.searchUrl`)
- classification:
  - `categories[]`, `subCategories[]`, `tags[]`
  - `state`, `level`, `targetBeneficiaries[]`
- textual sections (normalized):
  - `content.briefDescription`
  - `content.detailedDescriptionText|Markdown`
  - `content.benefitsText|Markdown`
  - `eligibility.text|markdown`
  - `documents.text|markdown`
- structured sections:
  - `applicationProcess[]`
  - `faqs[]`
  - `content.references[]`
  - `applicationChannels[]`
- provenance and integrity:
  - `source.*` (listing/detail/doc/faq/channel source URLs, scrape timestamp, scrape run ID)
  - `integrity.*` (section coverage flags and fetch error list)
- optional raw snapshots:
  - `raw.detailResponse`
  - `raw.documentsResponse`
  - `raw.faqsResponse`
  - `raw.applicationChannelsResponse`.

Storage notes:
- Firestore per-document size remains under limit in current scrape (`max ~= 213KB` with raw snapshots).
- Seed script trims `raw` payload automatically if a record approaches Firestore size limits.
- API route omits raw by default unless `includeRaw=true`.

### `satelliteHealthSnapshots/{docId}`

Representative fields:
- optional `userId`
- AOI metadata (`aoiId`, name, bbox)
- source metadata (`provider`, `collection`, `dataSource`)
- scene array with cloud cover, capture timestamp, tile id
- requested range and cloud filter values
- `createdAt`

### `satelliteHealthCache/{docId}`

Representative fields:
- `cacheKey` (deterministic hash token from `userId + AOI bbox + precisionMode + maxCloudCover + maxResults`)
- optional `userId`
- AOI metadata (`aoiId`, name, bbox)
- `precisionMode` (`high_accuracy` or `estimated`)
- `dataSource` (`live_cdse` or `fallback_sample`)
- `sourceSceneId`, `sourceCapturedAt`
- `cachedAt`, `expiresAt`
- `healthPayload` (JSON-serialized `SatelliteHealthInsight`)
- `metadata` (JSON-serialized `SatelliteHealthResponseMetadata`)
- `createdAt`, `lastUpdated`

Storage notes:
- Cache payload is serialized as JSON strings to avoid Firestore nested-array write limitations from polygon/raster overlay structures.
- Reader rehydrates serialized payloads into typed objects before route response construction.
- If collection write fails with `permission-denied`, cache record is appended to `farmProfiles.{userId}.day6SatelliteHealthCache` as explicit fallback path.

### `marketTaxonomy/{versionId}`

Representative fields:
- `versionId` (current: `agmarknet_2025_v1`)
- `source` (`https://agmarknet.ceda.ashoka.edu.in`)
- `fetchedAt`
- `categories[]` (`categoryId`, `categoryName`)
- `commodities[]` (`commodityId`, `commodityName`, `categoryId`, `categoryName`)
- `states[]` (`stateId`, `stateName`)
- `districtsByState[]` (`stateId`, `stateName`, `districts[]`)
- `counts` (`categories`, `commodities`, `states`, `districts`)

Storage notes:
- `category_id=null` commodities are normalized under synthetic taxonomy category `Uncategorized`.
- Filters API reads this document directly; ingestion must refresh taxonomy before combo iteration.

### `marketSeries/{seriesId}`

Representative fields:
- `seriesId` (`y2025_{granularity}_{stateId}_{districtId}_{commodityId}`)
- `year`, `granularity`, `level`
- commodity/category/location dimensions (`categoryId`, `commodityId`, `stateId`, `districtId` + names)
- `pricePoints[]` (`t`, `p_min`, `p_max`, `p_modal`)
- `quantityPoints[]` (`t`, `qty`)
- `pricePointCount`, `quantityPointCount`
- `lastUpdated`
- `sourceMetadata` (`source`, `year`, `granularities`, endpoint names, `ingestRunId`)

Storage notes:
- Only non-empty combos are persisted to keep collection size bounded.
- Empty combinations are tracked in `marketIngestRuns.totals.empty` and checkpoint metadata.
- Upserts are idempotent by deterministic `seriesId` key.

### `marketIngestRuns/{runId}`

Representative fields:
- `runConfig` (`year`, `granularities`, `metrics`, `strictAllCombos`, `concurrency`, `maxCombos`)
- `totals` (`plannedCombos`, `attempted`, `stored`, `empty`, `failed`)
- `checkpoint` (`cursor`, `lastCommodityId`, `lastStateId`, `lastDistrictId`, `granularity`, `updatedAt`)
- `errors[]` (trimmed recent failures)
- `startedAt`, `endedAt`, `status`

Storage notes:
- Script persists checkpoint every fixed combo interval and on shutdown signals.
- Resume mode reads checkpoint cursor from this document and continues deterministic iteration.

## Data Design Rules

1. Include ownership context for user-scoped data (`userId` where applicable).
2. Include temporal metadata (`createdAt` and/or `updatedAt`).
3. Strip undefined fields before write operations.
4. Avoid hidden coercion; normalize server payloads into stable response objects.
5. Preserve fallback data source visibility for trust-sensitive modules.
6. Delete temporary voice artifacts after request completion; do not persist raw voice files.

## Day 2 Resilience Paths

When strict Firestore rules block Day 2 collections, fallback persistence is available:

- `farmProfiles/day2-catalog-seed` for catalog seed backup
- `farmProfiles.{userId}.day2SchemeUserState` for saved/checklist state
- `farmProfiles.{userId}.day2SatelliteSnapshots` for satellite snapshot history
- in-repo local catalog seed: `data/schemes/day2_seed_schemes.json`
- full agriculture catalog local fallback: `data/schemes/agriculture_schemes_catalog.json` (used by `/api/schemes/agriculture` in `source=auto/local` mode)

## Data Quality Controls

- Day 2 scheme seed requires source metadata (`sourceUrl`, `sourceLastCheckedAt`, confidence tag).
- Recommendation responses include missing-input prompts and confidence signals.
- Satellite responses preserve cloud-cover and requested time-range metadata for reproducibility.
- Day 3 satellite health responses include explicit confidence, uncertainty note, and alert severity.
- Day 6 satellite health responses include explicit cache/source metadata (`metadata.cache`, `metadata.sourceScene`, `metadata.precisionMode`) so quota usage and scene freshness are auditable.
- Day 3 voice responses include fallback metadata so degraded mode is auditable.
- Farm profile API validates map geometry ring, bbox, and center-point coordinate ranges before persistence.
- Market ingestion enforces explicit run accounting (`attempted/stored/empty/failed`) and checkpoint persistence for auditable exhaustive coverage.
- Market source-vs-db spot checks are tracked for all-India/state/district levels across all `d/m/y` granularities and both metrics.
- Agriculture full-catalog scrape report (`data/schemes/agriculture_schemes_scrape_report.json`) tracks:
  - listing page coverage
  - slug uniqueness
  - detail/document/FAQ/channel fetch success
  - discovered schema key frequencies for normalization assurance.

## Known Gaps

- Some collection schemas are implicit in service code and not yet versioned with migration scripts.
- Firestore indexes are not comprehensively documented yet for all query combinations.
- Retention/TTL strategy is not yet formalized for analytics-heavy collections.
- Market cards API currently uses bounded scan reads (`maxScanDocs`) and should be hardened with index-driven pagination for larger series volumes.
