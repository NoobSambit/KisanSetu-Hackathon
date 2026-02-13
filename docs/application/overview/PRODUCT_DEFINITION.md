# Product Definition

Last Updated: 2026-02-09 (Day 3)

## Vision

KisanSetu is a practical agricultural intelligence platform that helps Indian farmers make better day-to-day decisions with personalized AI, reliable operational guidance, and low-friction access channels.

The product is designed to move beyond generic chatbot output by grounding recommendations in farmer profile, farm memory, and explainable decision logic.

## Problem Statement

Small and medium farmers regularly lose time and money because guidance is fragmented, generic, or hard to operationalize. Typical pain points include:

- receiving non-contextual advice that ignores local farm conditions
- difficulty discovering and applying for relevant government schemes
- delayed response to weather, disease, and market shifts
- low trust in black-box recommendations without clear reasoning

## Core Value Promise

KisanSetu provides:

- Personalized guidance: advice references actual farm context (location, crops, irrigation, budget, risk profile).
- Actionable outputs: recommendations include steps, documents, deadlines, and next actions.
- Trust-aware behavior: uncertainty and fallback sources are explicitly surfaced to users.
- Affordable architecture: local-first and free-tier-first service strategy for hackathon and early rollout.

## Primary User Segments

| Segment | Profile | Primary Need | Current Product Support |
|---|---|---|---|
| Small and medium farmers | Individual growers with varied digital literacy | Fast and understandable guidance that reflects their farm reality | Day 1 to Day 3 modules are active |
| Field support workers | Advisors helping multiple farmers | Quick reference recommendations and scheme explainability | Partially supported through scheme and profile flows |
| Community contributors | Users sharing local experiences | Knowledge exchange and feedback loops | Community APIs and UI available, hardening pending |

## Jobs To Be Done

1. When a farmer asks a question, they should get a simple and context-aware answer that references their actual farm details.
2. When a farmer needs financial support, they should quickly identify relevant schemes with clear eligibility reasoning.
3. When a farmer prepares an application, they should know which documents are missing and what to do next.
4. When the product cannot provide full confidence, it should explicitly disclose uncertainty and suggest verification steps.

## Product Pillars

1. Personalization: profile, history, and learned patterns are part of the core decision path.
2. Explainability: recommendation outputs include score, reasons, confidence, and missing inputs.
3. Accessibility: plain language and mobile-friendly experiences are baseline requirements.
4. Reliability: fallback modes exist, and fallback usage is visible to preserve user trust.
5. Extensibility: daywise modular roadmap supports fast feature expansion without rewrites.

## Differentiators In Current Baseline

- Local LLM assistant path (`ollama + qwen2.5:7b`) with profile-context prompt injection.
- Day 2 policy matcher with explainable scoring and application checklist workflow.
- Day 3 satellite health intelligence with score, zone indicators, alerts, and confidence.
- Day 3 voice-first assistant flow with transcript preview, multilingual input, and spoken responses.

## Non-Goals (Current Hackathon Window)

- Full national automation of all government schemes.
- Production-grade geospatial analytics warehouse.
- Finalized multilingual coverage across all Indian dialects.
- Enterprise-grade role/permission model across all APIs.

## Success Metrics

### Hackathon Execution Metrics

- PRD phase completion with evidence in `docs/prd/PRD_PROGRESS_TRACKER.md`.
- Deterministic smoke checks passing for Day 1, Day 2, and Day 3.
- End-to-end demo narrative works with both normal and fallback paths.

### Product Quality Metrics

- Response usefulness: assistant answers include profile-grounded detail where available.
- Recommendation clarity: each top scheme card has score + reasons + checklist + official link.
- Reliability: critical flows fail gracefully and return structured error responses.
- Documentation quality: architecture, API, and operational docs stay synchronized with implementation.

## Design and Trust Principles

- Do not silently change trust assumptions through hidden fallback behavior.
- Keep confidence and data source visible in recommendation-heavy features.
- Keep user-facing language simple and practical.
- Prefer explicit tradeoffs over implicit behavior.
