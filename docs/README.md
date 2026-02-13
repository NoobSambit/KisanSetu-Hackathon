# KisanSetu Documentation Hub

This directory contains all project documentation organized by purpose.

## Structure
- `docs/prd/`: day+phase PRD sheets, tracker, and app-wide updates log (primary execution workflow)
- `docs/application/`: modular application-wide technical documentation
- `docs/hackathon/`: historical daywise execution logs and planning artifacts
- `docs/archive/`: archived drafts and deprecated planning files

## Source-of-Truth Order
1. `docs/prd/PRD_PROGRESS_TRACKER.md`
2. Daywise PRD sheet in `docs/prd/`
3. `docs/prd/APPLICATION_WIDE_UPDATES.md`
4. `docs/application/README.md` and linked module docs

## Maintenance Rule
Whenever implementation changes:
- update PRD tracker status
- append app-wide update log entry
- refresh application documentation if architecture/data/API changed
