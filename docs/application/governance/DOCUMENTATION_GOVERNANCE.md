# Documentation Governance

Last Updated: 2026-02-10

This policy defines how documentation is maintained as a first-class engineering artifact.

## Source-of-Truth Hierarchy

1. `docs/prd/PRD_PROGRESS_TRACKER.md`
2. Daywise PRDs under `docs/prd/`
3. `docs/prd/APPLICATION_WIDE_UPDATES.md`
4. Application docs index and modules under `docs/application/`
5. Legacy compatibility index `docs/application/COMPREHENSIVE_APPLICATION_DOCUMENTATION.md`

If documents disagree, higher-ranked sources take precedence.

## Mandatory Update Triggers

Update application documentation in the same session when any of the following change:

- architecture or module boundaries
- API contracts or route behavior
- data schemas or collection usage
- runtime dependencies, setup, or env requirements
- security posture, trust assumptions, or fallback behavior
- quality gates and release process

## Mandatory Depth Gate

For every non-trivial change, use:

- `docs/application/governance/DOC_UPDATE_CHECKLIST.md`

Documentation is considered incomplete unless the checklist sections are satisfied or explicitly waived with rationale in `docs/prd/APPLICATION_WIDE_UPDATES.md`.

## Required Companion Updates For Non-Trivial Changes

For meaningful implementation changes:

1. Update tracker notes/status in `docs/prd/PRD_PROGRESS_TRACKER.md`.
2. Append a timestamped entry in `docs/prd/APPLICATION_WIDE_UPDATES.md`.
3. Update relevant docs under `docs/application/`.
4. Update `README.md` if setup/env/commands/structure changed.
5. Update day progress log under `docs/hackathon/` when active day work is involved.

## UI-Backend Drift Prevention Policy

For every API-contract-touching change, documentation and validation must explicitly prove UI/backend alignment.

Required checks:

1. Enumerate changed endpoint contracts (request + response + error shapes).
2. Enumerate impacted UI consumers (pages/components/hooks/services).
3. Verify same-session synchronization of endpoint and UI consumers.
4. Capture both success-path and validation/error-path evidence for changed endpoints.
5. If any consumer is intentionally deferred, record blocker + mitigation in:
  - `docs/prd/PRD_PROGRESS_TRACKER.md`
  - `docs/prd/APPLICATION_WIDE_UPDATES.md`

## Documentation Quality Bar

Every updated doc should:

- include concrete file/route/collection references where relevant
- describe current behavior, not intended behavior only
- call out known gaps and temporary hacks explicitly
- avoid hiding fallback behavior in prose
- be readable without scanning full git history
- be detailed enough for a new contributor to implement follow-up work without repository archaeology

## Change Logging Policy

- Every non-trivial docs update must add an entry to:
  - `docs/application/CHANGELOG.md`
- Every cross-cutting implementation update must add an entry to:
  - `docs/prd/APPLICATION_WIDE_UPDATES.md`

## Archival and Backward Compatibility

- Do not delete historical planning/execution logs.
- Archive stale drafts under `docs/archive/` when uncertain.
- Keep compatibility pointers for legacy doc entrypoints when paths change.

## Review Cadence

Minimum cadence:

- At start of each active day phase
- After every phase marked done
- Before demo/release freeze

## Cross-Agent Note

- `AGENTS.md` is the primary policy file for all coding agents used in this repository.
- `ANTIGRAVITY.md` provides a lightweight reusable profile for Antigravity-oriented runs (especially UI-first sessions) and should be treated as supplementary guidance, not a replacement for `AGENTS.md`.
