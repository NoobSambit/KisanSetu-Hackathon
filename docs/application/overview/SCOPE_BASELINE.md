# Scope Baseline

Last Updated: 2026-02-14 (Schemes Route Simplification + Day 2 Agriculture Full Catalog Expansion)

This file defines what is implemented now, what is planned next, and what is explicitly out of scope for the current hackathon cycle.

## Baseline Snapshot

- Current execution state:
  - Day 1 phases: done
  - Day 2 phases: done
  - Day 3 phases: done
  - Day 4 Phase 1/2: in progress
  - Day 5 phases: planned
  - Day 6 Phase 1: in progress
- Canonical progress source:
  - `docs/prd/PRD_PROGRESS_TRACKER.md`

## Implemented Scope (As Of Today)

### Day 1: Core Personalization

- Local assistant runtime with Ollama (`qwen2.5:7b`)
- AI health benchmarking endpoint
- AI query endpoint with:
  - input validation
  - conversation context retrieval
  - farm memory context injection
  - async logging and memory updates
- Farm profile API and UI
- Learned pattern extraction and prompt context generation
- Day 1 smoke script

### Day 2: Policy Matcher + Satellite Setup

- Scheme intelligence engine:
  - normalized scheme catalog model
  - explainable rule-based eligibility scoring
  - missing-input detection and profile completeness scoring
  - central/state duplicate overlap detection
- Policy matcher engine + APIs:
  - top-priority recommendation cards
  - save-for-later
  - document checklist and readiness score
  - official source links
- Scheme data pipeline:
  - seeded Day 2 catalog (34 detailed schemes)
  - API route and script-based seed paths
  - full agriculture corpus scrape pipeline:
    - `83` listing pages (`pagenumber=1..83`)
    - `825` unique scheme slugs captured
    - per-scheme MyScheme detail/document/FAQ/application-channel payload ingestion
    - normalized common schema output at `data/schemes/agriculture_schemes_catalog.json`
- full-catalog browse API + UI:
  - `GET /api/schemes/agriculture`
  - `/schemes/agriculture` paginated search/filter view with expandable all-section content
  - `/schemes` route now redirects to full catalog by default; dedicated recommendation page removed
- Satellite setup baseline:
  - CDSE OAuth token flow
  - cloud-filtered Sentinel-2 scene retrieval
  - normalized scene metadata persistence
  - ingest history retrieval

### Existing Parallel Feature Tracks (Pre-Day-3 Roadmap, Already Present In Code)

- Weather intelligence API and page (OpenWeather key optional, mock fallback available)
- Market price intelligence API and page (Agmarknet-backed 2025 ingestion + live Firestore reads)
- Disease detection API and page (mock predictor + validation guards)
- Crop planner API and page (Groq optional)
- Community and admin APIs/pages (foundation present)

### Day 4: Market Data Foundation + Prediction UX Baseline (In Progress)

- Agmarknet 2025 ingestion pipeline:
  - exhaustive taxonomy ingestion (categories/commodities/states/districts)
  - exhaustive combo traversal (`all_india`, `state`, `district` x `d/m/y` x `price/quantity`)
  - resumable checkpointed ingestion with run metadata in Firestore.
- Data collections added:
  - `marketTaxonomy`
  - `marketSeries`
  - `marketIngestRuns`
- `/api/prices` contract replaced with:
  - `action=filters`
  - `action=cards`
  - `action=series`
- `/market-prices` UI replaced with:
  - marketplace card grid
  - category/commodity/state/district filters
  - metric + granularity toggles
  - analytics detail modal (timeseries + table + freshness).

### Day 3: Satellite Intelligence + Voice Assistant

- Satellite health interpretation pipeline:
  - current vs baseline health comparison
  - normalized health score + confidence
  - stress signal classification + recommendations
  - dashboard summary, zone indicators, and alerts
- Voice backend pipeline:
  - `POST /api/voice/stt`
  - `POST /api/voice/tts`
  - `POST /api/voice/roundtrip`
  - explicit guardrails and fallback metadata
- Voice-first assistant UX:
  - recording states (idle/recording/transcribing/review/sending)
  - transcript preview/edit before send
  - response audio playback controls
  - quick voice presets + slow speech mode

### Day 6: Unified Dashboard (Phase 1 In Progress)

- `/satellite` drilldown now uses server-side AOI resolution through `userId`:
  - valid query `bbox` override when explicitly provided
  - saved parcel geometry bbox (`location.landGeometry.bbox`)
  - GPS + land-size derived bbox fallback
  - demo AOI fallback.
- Interactive satellite map overlay is now available:
  - farm boundary stroke
  - color-coded estimated health zones
  - legend + explicit non-raster disclaimer
  - zone popup details for score/trend context.
- Satellite page includes manual `Refresh Scan` and clear AOI source messaging so fallback state is never silent.
- Dashboard now serves as a lightweight entry point to the dedicated satellite analysis page instead of hosting the full analysis module.

## Planned Scope (Remaining Work)

### Day 4

- Forecast model training/inference (7/30/90 day windows) on top of seeded market series
- Forecast-specific recommendation logic (`best sell window`)
- Community intelligence extraction and summarization

### Day 5

- WhatsApp integration layer
- Document assistant (OCR + form support)
- Hyperlocal predictive weather advisories

### Day 6

- Unified dashboard integration completion
- Offline reliability and sync behavior
- Demo hardening, narrative stabilization, and full rehearsal

## Out Of Scope (Current Window)

- Enterprise-grade policy ingestion automation for all India.gov categories (agriculture corpus is implemented; non-agriculture categories remain out of current scope)
- High-scale historical satellite warehouse
- Production-grade multi-tenant security model for all modules
- Paid-only data providers or paid-only AI providers

## Scope Boundaries and Constraints

- Free/open-source-first dependency policy remains mandatory.
- Any fallback mode must be explicit in output payload or UI state.
- PRD acceptance criteria define done; feature presence alone is insufficient.

## Known Gaps and Technical Debt

- Limited route-level authorization on several server APIs; current protection relies heavily on client-side guarded pages plus Firestore rules.
- Unit and integration tests are still script-heavy; deeper automated test suites are pending.
- Some feature tracks (disease/community) still use mock-heavy data paths.

## Immediate Next-Scope Focus

1. Implement Day 4 forecast model service (`7/30/90`) using seeded `marketSeries` corpus.
2. Add index-optimized `cards` query path for larger market-series volumes.
3. Introduce stronger API-level auth checks for sensitive write routes as reliability and trust hardening.
