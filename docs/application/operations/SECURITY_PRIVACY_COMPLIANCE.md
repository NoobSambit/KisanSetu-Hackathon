# Security, Privacy, and Compliance

Last Updated: 2026-02-09 (Profile GPS AOI Integration)

This document defines the minimum security and trust baseline for hackathon delivery.

## Security Principles

1. Least data necessary:
  - store only data required for personalization and feature value.
2. Explicit uncertainty:
  - confidence and fallback behavior must be visible in outputs.
3. No secret leakage:
  - credentials stay in env vars; never commit secrets.
4. Defense in depth:
  - client guards, server validation, and Firestore rules should all contribute.
5. Fail safe:
  - error on missing required config; avoid hidden unsafe defaults.

## Data Sensitivity Classification

| Data Type | Example | Sensitivity | Handling Requirement |
|---|---|---|---|
| Public/low sensitivity | Scheme metadata, generic resource text | Low | Can be cached and seeded in-repo with source attribution |
| User profile agronomic data | land size, crop mix, district, irrigation, farm GPS coordinates | Medium | Restrict write/read by user ownership through rules and app logic |
| Interaction logs | AI queries and responses | Medium | Avoid exposing raw logs in user-facing flows |
| Voice artifacts | Temporary audio files during STT/TTS processing | Medium | Process locally and delete immediately after request completion |
| Credentials and secrets | API keys, client secrets, tokens | High | Env-only, never in source control or browser bundles |

## Current Controls

- Input validation in route handlers for critical fields and payload shape.
- File upload checks on disease endpoint (type and size limits).
- Optional fallback handling is explicit in Day 2 API payloads.
- Day 3 voice routes enforce audio size/duration guardrails and expose fallback reasons in payloads.
- Day 3 voice service stores request artifacts in temporary local workspace and removes them post-processing.
- Farm profile API validates coordinate ranges before persisting optional GPS values.
- Firebase initialization fails gracefully when mandatory env is missing.

## Firestore Rules Posture

- Firestore rules are a hard dependency for protecting user-scoped collections.
- Day 2 introduced dedicated collections (`schemeCatalog`, `schemeRecommendations`, `schemeUserState`, `satelliteHealthSnapshots`) that must be explicitly covered by rules in restrictive mode.
- Temporary permissive rules may be used during hackathon iteration, but must be revisited before production deployment.

## Known Security Gaps

- Several server APIs accept `userId` from request body/query without strong server-side identity verification.
- Authorization checks are uneven across modules (admin route checks role; most others rely on client guard + Firestore policy).
- No centralized rate limiting yet for expensive endpoints.
- Voice route misuse/abuse controls are guardrail-based today (size/duration), not full rate-limited.

## Required Operational Checks

Run before major demos or merges:

1. Verify `.env.local` is present and secrets are not committed.
2. Verify Firestore rules cover all active collections.
3. Verify API error responses do not leak stack traces.
4. Verify fallback mode visibility for trust-sensitive outputs.
5. Verify only free/open-source approved dependencies are active.

## Privacy Guardrails

- Avoid storing raw personal identifiers beyond what feature flow requires.
- Keep logs focused on product diagnostics and avoid unnecessary sensitive payloads.
- Provide clear source/confidence indicators for recommendation-heavy outputs.
- Keep voice fallback behavior explicit in UI/API to avoid hidden trust assumption changes.

## Incident Handling (Hackathon-Scale)

If sensitive data exposure or severe auth misconfiguration is detected:

1. Pause affected endpoint usage.
2. Revert to safe fallback or temporary disable route.
3. Patch rules and route validation.
4. Record blocker and mitigation in:
  - `docs/prd/PRD_PROGRESS_TRACKER.md`
  - `docs/prd/APPLICATION_WIDE_UPDATES.md`
5. Re-run smoke checks before re-enabling flow.
