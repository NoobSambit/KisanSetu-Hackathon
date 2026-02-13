# Release Readiness (Hackathon)

Last Updated: 2026-02-09 (Day 6 Phase 1 AOI Integration)

This checklist defines go/no-go criteria for demo readiness and near-term release confidence.

## 1. Go/No-Go Gates

A release/demo is ready only when all sections pass.

### Product Flow Gates

- [ ] Personalized assistant flow works end-to-end.
- [ ] Farm profile save/read and memory refresh are stable.
- [ ] Policy matcher page returns actionable recommendations.
- [ ] Satellite ingest demo path returns reproducible metadata.
- [ ] Satellite health insight card shows score + zones + alerts.
- [ ] Satellite card indicates real farm AOI mode vs demo fallback mode clearly.
- [ ] Voice roundtrip works end-to-end in assistant with transcript review.

### Quality Gates

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] `bash scripts/day1_smoke_test.sh` passes.
- [ ] `bash scripts/day2_smoke_test.sh` passes.
- [ ] `bash scripts/day3_smoke_test.sh` passes.

### Data and Trust Gates

- [ ] Day 2 scheme catalog seed is available and consistent.
- [ ] Confidence/fallback indicators are visible in trust-sensitive outputs.
- [ ] Official source links are available for recommendation cards.

### Documentation and Traceability Gates

- [ ] PRD tracker reflects true phase status.
- [ ] Application-wide update log has latest changes.
- [ ] Application docs are synchronized with actual implementation.
- [ ] Relevant day progress logs include validation evidence.

## 2. Demo Runbook Readiness

Prepare before final presentation:

1. Warm up environment:
  - run dev server
  - verify Ollama health endpoint
2. Validate Day 2 data availability:
  - run scheme seed command if needed
3. Keep fallback-safe narrative prepared:
  - if external API fails, explain explicit fallback mode
4. Sequence demo around user value:
  - profile -> assistant (text + voice) -> schemes -> satellite health card

## 3. Fallback Drill Requirements

Run at least once before final demo:

- simulate missing optional keys and verify graceful outputs
- verify scheme recommendations still load via fallback catalog path if needed
- verify satellite ingest can return fallback sample with explicit source tag
- verify voice STT/TTS fallback warnings remain explicit when local binaries are missing

## 4. Release Risks To Watch

- Firestore rules mismatch with active collections
- Missing runtime env vars on demo machine
- Inconsistent API response shapes across modules
- Over-reliance on mock data in externally visible flows
- Voice latency spikes when local models/binaries are not tuned

## 5. Day-4 Onward Readiness Dependencies

To start Day 4 cleanly:

- Day 2 satellite snapshot persistence must remain queryable
- Day 2 recommendation flows should stay regression-free
- Day 3 voice flow should stay regression-free (`npm run smoke:day3`)
- documentation baseline must stay modular and current

## 6. Decision Log Template

Use this template in release notes or progress logs:

- Decision Date:
- Build Commit/Workspace State:
- Go/No-Go: `Go` or `No-Go`
- Blocking Issues:
- Mitigations Applied:
- Evidence Commands:
- Owner:
