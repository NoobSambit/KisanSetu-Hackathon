# Day 5 PRD: WhatsApp + Document Assistant + Predictive Weather

## 1. Mission
Expand accessibility beyond the web app with WhatsApp interaction, reduce bureaucracy friction with document intelligence, and strengthen decision timing through predictive weather advisories.

## 2. Day Outcome
- WhatsApp assistant channel operational (sandbox-ready)
- Document assistant with OCR-assisted workflows
- Predictive weather advisory module integrated

## 3. Scope
### In Scope
- WhatsApp message integration (text-first, media-aware)
- OCR extraction + form guidance
- Weather prediction and advisory generation

### Out of Scope
- Production WhatsApp scale infra
- Complex legal automation for all government forms

## 4. Feature Requirements

### Phase 1: WhatsApp Integration (Morning)
#### Functional Requirements
- FR1.1: Receive farmer questions via WhatsApp webhook.
- FR1.2: Route question through same personalized assistant core.
- FR1.3: Return concise, readable responses for chat format.
- FR1.4: Handle simple media routing hooks for future diagnosis flow.

#### UX Requirements
- UX1.1: Responses must be short, actionable, and stepwise.
- UX1.2: Provide fallback text when media is unsupported.

#### Acceptance Criteria
- End-to-end WhatsApp text conversation works in sandbox.
- Profile-aware answers can be triggered for known user mapping.

#### Enhancement Ideas
- Add quick-command menu (`1 Weather`, `2 Price`, `3 Scheme`, `4 Disease`).

---

### Phase 2: Smart Document Assistant (Afternoon)
#### Functional Requirements
- FR2.1: Upload document image/PDF.
- FR2.2: OCR extraction of key form fields.
- FR2.3: Explain required data in plain language.
- FR2.4: Prefill possible fields from farm profile.

#### Output Requirements
- OR2.1: Field completeness checklist.
- OR2.2: Downloadable structured summary (not legal submission guarantee).

#### Safety/Legal Requirements
- LR2.1: Clearly state this is assistance, not legal certification.
- LR2.2: Avoid fabricated values when OCR confidence is low.

#### Acceptance Criteria
- At least one target form type can be parsed and assisted reliably.
- User sees confidence/error indicators for uncertain extracted fields.

#### Enhancement Ideas
- Add “missing documents needed” card before form filling begins.

---

### Phase 3: Hyperlocal Predictive Weather (Evening)
#### Functional Requirements
- FR3.1: Show short-term and near-term weather projections.
- FR3.2: Convert forecasts into farming advisories by crop/stage.
- FR3.3: Trigger alerts for high-risk events (heatwave, heavy rain, etc.).
- FR3.4: Integrate advice into assistant and dashboard widgets.

#### Data Requirements
- DR3.1: Track source timestamp and locality.
- DR3.2: Provide confidence/uncertainty indicator for prediction.

#### Acceptance Criteria
- Weather module returns actionable advisories for selected farm location.
- Alerts are understandable and include next-step recommendation.

#### Enhancement Ideas
- Add irrigation planner hint for next 3 days.

## 5. Validation Protocol
- WhatsApp sandbox send/receive test for 3 scenario prompts.
- OCR test with at least 3 representative documents.
- Weather advisory sanity-check against actual forecast snapshots.

## 6. Constraints and Cost Guardrails
- Free sandbox/developer tiers only.
- Free OCR and weather options only.

## 7. Risks and Mitigation
- Risk: WhatsApp webhook reliability during demo.
  - Mitigation: pre-record fallback demo and web assistant fallback path.
- Risk: OCR errors on low-quality scans.
  - Mitigation: confidence prompts and manual correction UX.

## 8. Exit Checklist
- [ ] WhatsApp sandbox conversation stable
- [ ] Document assistant usable for target form set
- [ ] Predictive weather advice integrated
- [ ] Validation evidence captured
- [ ] Tracker + logs + app-wide docs updated
