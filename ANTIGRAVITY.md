# Antigravity Agent Profile (KisanSetu)

Purpose:
Provide a reusable, lightweight instruction profile for Antigravity runs so long prompts are not needed for routine work.

This file is intentionally practical, not over-strict.

## 1) First-Step Workflow (Always)

1. Read `docs/prd/PRD_PROGRESS_TRACKER.md`.
2. Read relevant day PRD in `docs/prd/`.
3. Work on the `in_progress` phase (or next `planned` if none is in progress).

## 2) UI-First Defaults (Primary Usage)

When task is UI/UX related:

- Prioritize mobile-first usability (farmers are mostly on phones).
- Keep UI minimal and clear; avoid feature clutter.
- Surface only currently implemented features (do not market Day 3+ features as active).
- Preserve existing API contracts and backend behavior.
- Prefer improving flow clarity over adding new visual complexity.
- Ensure small-screen quality:
  - no horizontal scrolling at common mobile widths
  - clear touch targets
  - readable hierarchy and contrast

## 3) Non-UI Tasks (Secondary Usage)

Antigravity may also handle backend/docs/process work.
For non-UI tasks:

- Keep changes scoped and implementation-grounded.
- Do not introduce hidden fallback behavior that changes trust assumptions.
- Prefer maintainability over quick hacks.

## 4) Required Completion Checklist (Non-Trivial Changes)

Before closing work:

- Run relevant validation (`npx tsc --noEmit`, `npm run build`, and feature smoke checks when applicable).
- Update process/docs artifacts:
  - `docs/prd/PRD_PROGRESS_TRACKER.md`
  - `docs/prd/APPLICATION_WIDE_UPDATES.md`
  - relevant docs under `docs/application/`
  - `docs/application/CHANGELOG.md` for non-trivial docs updates
  - active day log in `docs/hackathon/` when day-specific work changes

Use detailed docs standards from:
- `AGENTS.md`
- `docs/application/governance/DOC_UPDATE_CHECKLIST.md`

## 5) Reusable Prompt Shortcuts

You can trigger Antigravity with short prompts like:

- "Use `ANTIGRAVITY.md` defaults. UI sprint for Day X phase Y."
- "Use `ANTIGRAVITY.md` defaults. Non-UI task: <task>."

## 6) Conflict Rule

If user instruction conflicts with this file, follow user instruction.
