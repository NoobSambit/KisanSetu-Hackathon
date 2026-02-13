# Day 2 Progress Log

Last Updated: February 9, 2026, 21:25 IST

## Environment Verification
- [x] CDSE OAuth credentials configured in local environment (`CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET`, `CDSE_TOKEN_URL`).
- [x] Live CDSE token + Sentinel catalog path validated during development.
- [x] Day 2 APIs compile and run in Next.js app runtime.

## Phase Status

### Phase 1 - Scheme Intelligence Engine
- [x] Added structured scheme catalog model with required fields + quality metadata.
- [x] Added explainable rule-based eligibility scoring with machine-readable reasons.
- [x] Added missing-input detection and profile completeness scoring.
- [x] Added duplicate overlap detection for central/state catalog entries.
- [x] Expanded Day 2 seed dataset to `34` detailed Indian schemes.
- [x] Seeded primary `schemeCatalog` Firestore collection successfully after rules update.

### Phase 2 - Scheme Recommendation UX
- [x] Added dedicated policy matcher page: `app/schemes/page.tsx`.
- [x] Added profile-aware recommendation cards with score, reasons, docs, deadlines, and official source links.
- [x] Added inline non-blocking missing-profile prompts.
- [x] Added save-for-later and checklist interactions.
- [x] Added recommendation API contracts and persistence snapshots.

### Phase 3 - Satellite Setup Baseline
- [x] Added CDSE/Sentinel ingest service with OAuth token flow.
- [x] Added cloud-filtered scene retrieval for sample AOI.
- [x] Added normalized Day 3 handoff metadata format (date, tile id, cloud cover, scene metadata).
- [x] Added API for ingest trigger + history retrieval (`/api/satellite/ingest`).
- [x] Persisted ingest metadata in primary `satelliteHealthSnapshots` collection.

## Blockers and Mitigation
- Previous blocker resolved: Firestore rules now allow writes for Day 2 collections.
- Fallback paths remain in code as resilience, but primary Day 2 collections are active.

## Validation Evidence
- Type-check:
  - Command: `npx tsc --noEmit`
  - Result: pass
- Build-check:
  - Command: `npm run build`
  - Result: pass
- Day 2 smoke:
  - Command: `bash scripts/day2_smoke_test.sh`
  - Result: pass
- Seed verification:
  - Command: `npm run seed:day2-schemes`
  - Result: `Seeded 34 Day 2 scheme records into Firestore collection 'schemeCatalog'.`
- Collection verification:
  - Command: runtime Firestore query script (`schemeCatalog`, `schemeRecommendations`, `schemeUserState`, `satelliteHealthSnapshots`)
  - Result: `34`, `2`, `2`, `2` docs respectively.
- Satellite ingest verification:
  - Command: `curl /api/satellite/ingest?...maxResults=2...`
  - Result: `2` scenes returned, `live_cdse` source, metadata persisted in `satelliteHealthSnapshots`.

## Immediate Next Actions
- [ ] Optional cleanup: remove stale fallback seed doc `farmProfiles/day2-catalog-seed` if no longer needed.
- [ ] Start Day 3 Phase 1 using Day 2 satellite snapshots as NDVI pipeline input.

## Scheme UX Readability Patch (21:19 IST)
- [x] Normalized checklist item labels in schemes UI from backend keys to readable text:
  - `identity_proof` -> `Identity Proof`
  - `project_proposal_dpr` -> `Project Proposal / DPR`
  - `land_or_lease_proof` -> `Land or Lease Proof`
  - `bank_kyc_documents` -> `Bank KYC Documents`
- [x] Replaced visually heavy native checkbox rows with compact touch-friendly checklist controls.
- [x] Added checklist readiness counter (`x/y ready`) for faster scanability.
- [x] Maintained existing save/checklist API behavior without contract changes.

## Validation Update (21:19 IST)
- Type-check:
  - Command: `npx tsc --noEmit`
  - Result: pass
- Build-check:
  - Command: `npm run build`
  - Result: pass

## Scheme Card Proportion Patch (21:25 IST)
- [x] Reduced checklist section visual weight inside scheme cards.
- [x] Applied responsive checklist grid (`1` column mobile, `2` columns larger viewport).
- [x] Tightened row spacing/padding for better balance with scheme summary content.
- [x] Replaced browser-native checkbox rendering with compact custom indicators for consistent sizing.
- [x] Preserved API behavior and persistence path (`/api/schemes/checklist` unchanged).

## Validation Update (21:25 IST)
- Type-check:
  - Command: `npx tsc --noEmit`
  - Result: pass
- Build-check:
  - Command: `npm run build`
  - Result: pass
