# KisanSetu Agent Operating Rules (PRD-Driven Workflow)

These rules are mandatory for all future Codex runs in this repository.

## 1) Workflow Model
- The workflow is PRD-driven, not `ACTIVE_DAY` driven.
- Always start by reading:
  - `docs/prd/PRD_PROGRESS_TRACKER.md`
  - relevant day PRD in `docs/prd/`
- Select the phase marked `in_progress`, else pick the next `planned` phase.

## 2) Mandatory Planning and Tracking Artifacts
- Daywise PRDs:
  - `docs/prd/DAY_01_CORE_PERSONALIZATION_PRD.md`
  - `docs/prd/DAY_02_POLICY_MATCHER_SATELLITE_SETUP_PRD.md`
  - `docs/prd/DAY_03_SATELLITE_VOICE_ASSISTANT_PRD.md`
  - `docs/prd/DAY_04_PREDICTIVE_AI_COMMUNITY_PRD.md`
  - `docs/prd/DAY_05_WHATSAPP_DOCUMENTS_WEATHER_PRD.md`
  - `docs/prd/DAY_06_INTEGRATION_DASHBOARD_DEMO_PRD.md`
- Progress matrix: `docs/prd/PRD_PROGRESS_TRACKER.md`
- App-wide updates log: `docs/prd/APPLICATION_WIDE_UPDATES.md`
- Application docs index: `docs/application/README.md`
- Application docs governance: `docs/application/governance/DOCUMENTATION_GOVERNANCE.md`
- Documentation update checklist: `docs/application/governance/DOC_UPDATE_CHECKLIST.md`
- Antigravity reusable profile: `ANTIGRAVITY.md`
- Legacy compatibility entrypoint: `docs/application/COMPREHENSIVE_APPLICATION_DOCUMENTATION.md`
- Daily execution logs under `docs/hackathon/` must be preserved.

## 3) Required Updates For Every Non-Trivial Change
For every meaningful code/config/behavior change:
1. Update the relevant phase status or notes in `docs/prd/PRD_PROGRESS_TRACKER.md`.
2. Append a timestamped entry in `docs/prd/APPLICATION_WIDE_UPDATES.md`.
3. Update the relevant modular application docs under `docs/application/` (starting from `docs/application/README.md`) if architecture, data, API, runtime, or module behavior changed.
4. Update `README.md` when setup, env, commands, or structure changed.
5. If the change belongs to an active day, update day progress log in `docs/hackathon/`.
6. Add/update `docs/application/CHANGELOG.md` for every non-trivial documentation update.

## 4) PRD Execution Discipline
- Do not start implementation before mapping work to day and phase.
- Use PRD acceptance criteria as definition of done.
- Record validation evidence (commands, test outcomes, benchmark snippets).
- If blocked, mark blocker and mitigation in both tracker and app-wide updates log.

## 5) Constraints
- Free services and open-source tools only, unless explicitly approved by project owner.
- Avoid hidden fallback behavior that changes product trust assumptions.

## 6) Collaboration Rules
- Keep docs and implementation synchronized in the same working session.
- Never delete daywise logs or activity records.
- Archive stale planning drafts into `docs/archive/` instead of deleting when uncertain.

## 7) Conflict Handling
- If direct user instruction conflicts with these rules, follow the user instruction.

## 8) Documentation Depth Standard (Non-Negotiable)
- For any non-trivial feature/process change, documentation must be detailed and implementation-grounded, not summary-only.
- Every relevant updated doc must include (where applicable):
  - what changed
  - current behavior (as implemented now)
  - interface/contracts (API, inputs/outputs, or module boundaries)
  - data impact (collections, schemas, persistence/fallback behavior)
  - runtime/ops impact (env, dependencies, commands, failure modes)
  - known gaps and next hardening steps
- Documentation quality must be high enough that a new contributor can execute or extend the feature without scanning full git history.
- Shallow one-liner updates for non-trivial changes are not acceptable.

## 9) Documentation Completion Gate
- Before closing a non-trivial task, agents must verify the checklist in:
  - `docs/application/governance/DOC_UPDATE_CHECKLIST.md`
- If a checklist section is intentionally not updated, record the reason in:
  - `docs/prd/APPLICATION_WIDE_UPDATES.md`

## 10) Cross-Agent Reuse
- `AGENTS.md` remains the canonical execution policy for all agents.
- For Antigravity runs, use `ANTIGRAVITY.md` as a lightweight reusable operating profile to reduce repetitive prompting.

## 11) UI-Backend Contract Sync Discipline (Non-Negotiable)
- Preventing frontend/backend drift is mandatory. Agents must treat API contract alignment as part of implementation, not polish.
- Before touching any UI that consumes backend data:
  - read the corresponding route handler(s) under `app/api/**/route.ts`
  - read shared type contracts in `types/index.ts` and related service/fetch helpers
  - list required inputs, optional inputs, success payload keys, and error payload keys
- For backend contract changes (request shape, response shape, validation, defaults, fallback behavior):
  - update all impacted UI consumers in the same session
  - remove stale client assumptions/mocked payload paths once real API wiring exists
  - if same-session sync is impossible, log explicit blocker + mitigation in:
    - `docs/prd/PRD_PROGRESS_TRACKER.md`
    - `docs/prd/APPLICATION_WIDE_UPDATES.md`
- For UI changes that depend on API data:
  - do not ship UI against assumed payloads; validate against implemented route behavior
  - keep empty/loading/error states aligned with real API failure modes
- Mandatory validation evidence for contract-touching changes:
  - `npx tsc --noEmit`
  - `npm run build`
  - at least one success-path check for each changed endpoint
  - at least one validation/error-path check for each changed endpoint
- Mandatory documentation sync for contract-touching changes:
  - `docs/application/api/API_INVENTORY.md`
  - relevant module docs in `docs/application/architecture/`
  - relevant data/fallback notes in `docs/application/data/` when persistence or shape changes
