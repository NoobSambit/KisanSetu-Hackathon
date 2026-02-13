# Day 1 PRD: Core Personalization Foundation

## 1. Mission
Build a local-first personalized AI foundation where KisanSetu understands each farm context and generates tailored guidance.

## 2. Day Outcome
By end of Day 1, the product must deliver:
- Local LLM assistant on Ollama (`qwen2.5:7b`)
- Persistent farm profile and memory system
- Context-aware responses that reference farmer-specific details
- Repeatable validation for health/profile/query flows

## 3. Scope
### In Scope
- Local inference pipeline through Ollama
- Farm profile CRUD and storage
- Interaction memory capture and pattern extraction
- Prompt context injection from profile + learned patterns
- Base benchmark and smoke validation workflow

### Out of Scope
- Scheme intelligence depth
- Satellite analytics
- Voice pipeline
- External channel integrations (WhatsApp)

## 4. Feature Requirements

### Phase 1: Local LLM Infrastructure (Morning)
#### Product Intent
Assistant must run in low-connectivity environments without paid cloud dependence.

#### Functional Requirements
- FR1.1: Assistant responses are generated from local Ollama runtime.
- FR1.2: Model is configurable through environment values.
- FR1.3: A health endpoint returns model identity + latency for demo reliability.
- FR1.4: Error messages must be operator-friendly (not stack traces).

#### Operational Requirements
- OR1.1: Health latency should be logged and trendable.
- OR1.2: Timeouts should fail gracefully.
- OR1.3: System should tolerate missing non-critical cloud keys.

#### Acceptance Criteria
- `/api/ai/health` returns `success=true`, provider `ollama`, and latency.
- `/api/ai/query` returns valid answer + metadata.

#### Suggested Enhancements
- Add response quality rubric check (simple 3-point internal scale: relevance, clarity, safety).
- Add benchmark summary export for presentation use.

---

### Phase 2: Farm Memory System (Afternoon)
#### Product Intent
Create a memory layer that tracks what matters for each farm and improves advice quality over time.

#### Functional Requirements
- FR2.1: Farm profile includes land, soil, irrigation, location, crops, constraints.
- FR2.2: Profile supports create, read, and update without data loss.
- FR2.3: Every AI interaction writes memory signals (crops, concerns, tags).
- FR2.4: Pattern extraction summarizes high-frequency needs.

#### Data Requirements
- DR2.1: Use collections for profile, interaction history, and learned patterns.
- DR2.2: Avoid storing undefined fields in Firestore payloads.
- DR2.3: Include timestamps and user ownership in each record.

#### UX Requirements
- UX2.1: Profile page must be understandable by non-technical users.
- UX2.2: Primary inputs should include helper labels and examples.
- UX2.3: Profile save feedback must show clear success/failure state.

#### Acceptance Criteria
- `/api/farm-profile` save/get succeeds.
- Learned pattern summary appears after interactions.

#### Suggested Enhancements
- Add seasonal profile mode (Kharif/Rabi/Zaid presets).
- Add lightweight “data completeness score” for farmer profile readiness.

---

### Phase 3: Context-Aware Responses (Evening)
#### Product Intent
Assistant should not behave like a generic chatbot once farm context is available.

#### Functional Requirements
- FR3.1: Prompt injection includes profile summary and learned patterns.
- FR3.2: Assistant references at least one known farm detail where applicable.
- FR3.3: Session context is preserved for short-turn coherence.
- FR3.4: AI query metadata includes model and latency for observability.

#### Safety Requirements
- SR3.1: Preserve existing safe-agriculture guardrails.
- SR3.2: High-risk cases should recommend local officer/veterinary validation.

#### Acceptance Criteria
- Same query should produce farm-specific answers after profile setup.
- Smoke test validates full flow (health -> profile -> query -> memory).

#### Suggested Enhancements
- Add “why this advice” explanation paragraph sourced from memory inputs.
- Add optional confidence hints (`high/medium/low`) based on context richness.

## 5. Validation Protocol
- Run smoke script: `./scripts/day1_smoke_test.sh`
- Run type-check: `npx tsc --noEmit`
- Run build-check: `npm run build`
- Capture 5-run latency baseline from `/api/ai/health`

## 6. Day 1 Deliverables
- Working local assistant
- Working profile and memory pipeline
- Personalized response behavior
- Smoke test automation and benchmark snapshot

## 7. Constraints and Cost Guardrails
- Free/open-source only
- No paid API dependency for core assistant path
- Cloud keys optional for non-Day-1 modules only

## 8. Risks and Mitigation
- Risk: Model latency exceeds demo comfort.
  - Mitigation: prompt-size discipline, pre-demo warm-up requests.
- Risk: Firestore rules block server writes.
  - Mitigation: verify rules early; keep query design index-light for hackathon speed.

## 9. Exit Checklist
- [ ] Health endpoint stable
- [ ] Profile save/fetch stable
- [ ] Memory extraction stable
- [ ] Personalized response verified
- [ ] Benchmark recorded
- [ ] Day log + app-wide updates log updated
