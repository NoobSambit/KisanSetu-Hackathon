# Day 6 PRD: Unified Integration + Offline Readiness + Demo Excellence

## 1. Mission
Package all capabilities into a coherent, demo-ready intelligence product with offline resilience and compelling storytelling for judges.

## 2. Day Outcome
- Unified intelligence dashboard consolidating all major modules
- Offline-capable behavior for critical workflows
- End-to-end polished demo with backup plans

## 3. Scope
### In Scope
- Dashboard integration and cross-module UX consistency
- Offline caching/sync strategy for critical paths
- Demo script, narrative, and QA rehearsal

### Out of Scope
- Enterprise production hardening beyond hackathon needs

## 4. Feature Requirements

### Phase 1: Unified Dashboard (Morning)
#### Functional Requirements
- FR1.1: Single page aggregates:
  - farm memory insights
  - price predictions
  - scheme recommendations
  - weather advisories
  - satellite status indicators
  - quick-access voice and assistant entry points
- FR1.2: Dashboard cards show freshness timestamp.
- FR1.3: Prioritize “action this week” section.

#### UX Requirements
- UX1.1: Dashboard should be scannable in under 30 seconds.
- UX1.2: Emphasize high-impact alerts first.
- UX1.3: Keep mobile layout functional for demo realism.

#### Acceptance Criteria
- Dashboard successfully shows all connected modules with stable loading states.

#### Enhancement Ideas
- Add “Farm Health Score” composite metric for judge storytelling.

---

### Phase 2: Offline Reliability (Late Morning)
#### Functional Requirements
- FR2.1: Cache critical assets and recent personalized context.
- FR2.2: Support read access to key farmer insights when offline.
- FR2.3: Queue specific user actions for later sync.
- FR2.4: Show clear online/offline status in UI.

#### Reliability Requirements
- RR2.1: Sync conflicts must be deterministic and predictable.
- RR2.2: Offline fallback must not silently drop user actions.

#### Acceptance Criteria
- Simulated offline mode still allows essential advisory access.
- Reconnect sync completes without user confusion.

#### Enhancement Ideas
- Add “offline kit ready” indicator before field use.

---

### Phase 3: Demo and Judge Readiness (Afternoon)
#### Functional Requirements
- FR3.1: Prepare a complete demo farmer persona and scenario chain.
- FR3.2: Script includes problem -> intelligence -> action -> impact flow.
- FR3.3: Keep fallback demo artifacts for network/model failure.
- FR3.4: Prepare concise Q&A bank for likely judge questions.

#### Storytelling Requirements
- SR3.1: Highlight personalization novelty first.
- SR3.2: Demonstrate free-service viability and scalability path.
- SR3.3: Show measurable outcomes with at least 3 metrics.

#### Acceptance Criteria
- Team can execute full live demo under time limit.
- Backup mode can be triggered in under 30 seconds.

#### Enhancement Ideas
- Add one “unexpected question” stress rehearsal round before final submission.

## 5. Validation Protocol
- Full regression pass on critical flows.
- Offline simulation pass for key pages.
- Timed demo rehearsal (at least 2 full runs).

## 6. Constraints and Cost Guardrails
- Keep stack aligned with free/open-source resources.
- Any paid-service proposal must include free alternative in documentation.

## 7. Risks and Mitigation
- Risk: Last-day integration regressions.
  - Mitigation: lock scope early; only fix critical bugs.
- Risk: Demo time overrun.
  - Mitigation: strict script timings and backup sequence.

## 8. Exit Checklist
- [ ] Unified dashboard stable
- [ ] Offline behavior validated
- [ ] Demo runbook final
- [ ] Q&A preparation complete
- [ ] Tracker + logs + app-wide docs updated

## 9. Implementation Notes (2026-02-09 22:03 IST)

### Phase 1 Progress Update
- Started Day 6 Phase 1 integration hardening focused on profile-to-satellite reliability in dashboard flow.
- Implemented farmer geospatial capture in profile UI:
  - Added latitude/longitude input controls in `app/farm-profile/page.tsx`.
  - Added browser geolocation autofill action (`Use Current Location`).
  - Added coordinate range validation in profile API (`app/api/farm-profile/route.ts`).
- Implemented satellite AOI derivation in dashboard:
  - Dashboard now fetches farmer profile and derives `bbox` from profile center coordinates + farm land size.
  - `bbox` is sent to `/api/satellite/health` so the crop health card targets farmer-specific area when GPS is available.
  - Added explicit UI messaging to indicate when demo fallback AOI is being used due to missing GPS/profile lookup failure.

### Validation Evidence
- `npx tsc --noEmit` -> pass
- `npm run build` -> pass

### Known Gaps / Next Hardening
- Current AOI generation is an area-derived square around farm center (not manually drawn parcel polygon yet).
- Polygon/boundary map drawing remains a future enhancement for higher geospatial precision.
