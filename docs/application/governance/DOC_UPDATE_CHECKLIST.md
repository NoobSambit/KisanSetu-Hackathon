# Documentation Update Checklist

Last Updated: 2026-02-10

Use this checklist for every non-trivial code/config/behavior change.
This is the mandatory depth gate referenced by `AGENTS.md`.

## 1) Scope Mapping

- [ ] Mapped change to day + phase PRD.
- [ ] Identified all impacted documentation modules under `docs/application/`.
- [ ] Confirmed whether root `README.md` also needs updates (setup/env/commands/structure changes).

## 2) Depth Requirements Per Updated Doc

For each updated application doc, confirm:

- [ ] Change summary is explicit (what changed, not just "updated docs").
- [ ] Current implemented behavior is documented.
- [ ] Concrete references are present (file paths, routes, collections, scripts, env keys as applicable).
- [ ] Interfaces/contracts are captured (request/response shapes, module boundaries, or data structure expectations).
- [ ] Runtime/ops implications are captured (dependencies, env impact, commands, fallback behavior).
- [ ] Known gaps/risks and next hardening steps are stated.

## 3) Detail Baseline by Doc Type

### Overview Docs
- [ ] Business context and user impact are documented.
- [ ] Implemented vs planned scope is explicit.
- [ ] Non-goals are listed when relevant.

### Architecture Docs
- [ ] End-to-end flow is described (not only component names).
- [ ] Module responsibilities and boundaries are clear.
- [ ] Cross-cutting concerns (reliability, fallback, trust) are included.

### Data Docs
- [ ] Collection/table inventory is updated.
- [ ] Ownership and temporal fields are covered where relevant.
- [ ] Fallback/degraded persistence paths are explicit.

### API Docs
- [ ] Endpoint methods and paths are correct.
- [ ] Input requirements and output behavior are documented.
- [ ] Error and edge-case behavior are noted.

### Operations Docs
- [ ] Required vs optional env/dependency keys are accurate.
- [ ] Validation/test commands are up to date.
- [ ] Release readiness criteria align with current phase maturity.

## 4) Mandatory Companion Updates

- [ ] `docs/prd/PRD_PROGRESS_TRACKER.md` updated (status/notes/evidence as relevant).
- [ ] `docs/prd/APPLICATION_WIDE_UPDATES.md` has timestamped log entry.
- [ ] `docs/application/CHANGELOG.md` updated for non-trivial docs changes.
- [ ] Active day log under `docs/hackathon/` updated when day-specific work changed.

## 5) Final Consistency Pass

- [ ] No contradiction between PRD tracker, app-wide updates, and application docs.
- [ ] Legacy compatibility pointers still valid (if path structure changed).
- [ ] Documentation is detailed enough for onboarding without git archeology.

## 6) UI-Backend Contract Sync Gate (Required When API-Touching)

- [ ] Changed endpoint contracts are listed (request fields, success payload, error payload).
- [ ] Impacted UI consumers are listed (page/component/hook/service paths).
- [ ] All known consumers are updated in the same session (or blocker + mitigation is logged).
- [ ] Evidence includes at least one success-path and one validation/error-path check per changed endpoint.
- [ ] API inventory and relevant module docs are updated to reflect final implemented contract.

## Quick Rule

If you cannot point a new contributor to docs that explain current behavior end-to-end for the changed area, documentation is not done yet.
