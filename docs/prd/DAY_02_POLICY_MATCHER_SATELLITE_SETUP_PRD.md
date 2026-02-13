# Day 2 PRD: Policy Matcher + Satellite Setup

## 1. Mission
Enable farmers to discover relevant government schemes with explainable eligibility scoring, while establishing satellite data ingestion groundwork for crop health intelligence.

## 2. Day Outcome
- Structured scheme knowledge base with eligibility logic
- Farmer-specific scheme recommendation interface
- Working satellite ingestion baseline for demo geography

## 3. Scope
### In Scope
- Scheme dataset curation and normalization
- Rule-based + LLM-assisted eligibility scoring design
- Explainable recommendation UX
- Sentinel data retrieval proof-of-life

### Out of Scope
- Full automation for all Indian schemes
- Production-grade geospatial analytics
- End-to-end NDVI insight cards (Day 3)

## 4. Feature Requirements

### Phase 1: Scheme Intelligence Engine (Morning)
#### Functional Requirements
- FR1.1: Build a scheme catalog model with mandatory fields:
  - scheme_name, authority, eligibility_inputs, benefits, deadlines, documents_required, official_link
- FR1.2: Create scoring logic from profile attributes:
  - location, farm size, crop type, irrigation, budget/risk indicators
- FR1.3: Generate machine-readable eligibility reasons.
- FR1.4: Mark unknown data fields and request minimal missing inputs.

#### Data Quality Requirements
- DQ1.1: Every scheme entry must include source URL and update date.
- DQ1.2: Use confidence tags (`high`, `medium`, `low`) for incomplete rule mappings.
- DQ1.3: Duplicate scheme detection for state+central overlaps.

#### Acceptance Criteria
- At least 30 high-quality seed schemes available for demo.
- Recommendation engine returns top results with score + reasons.

#### Enhancement Ideas
- Add “estimated effort to apply” metric (low/medium/high).
- Add “cash impact window” metric (immediate/seasonal/annual).

---

### Phase 2: Scheme Recommendation UX (Afternoon)
#### Functional Requirements
- FR2.1: Dedicated page with profile-aware recommendations.
- FR2.2: Each card shows:
  - score, why matched, required documents, deadline, and action steps
- FR2.3: Missing profile info prompt is inline, not blocking.
- FR2.4: “Save for later” and “application checklist” interaction.

#### UX Requirements
- UX2.1: Use plain language and concise cards for low-literacy friendliness.
- UX2.2: Highlight top 3 schemes first with clear priority labels.
- UX2.3: One-click link to official scheme source.

#### Acceptance Criteria
- Farmer can open one recommendation and see full actionable checklist.
- Page remains useful even with partial profile data.

#### Enhancement Ideas
- Add “eligibility delta” view: what to improve to qualify.
- Add “document readiness score”.

---

### Phase 3: Satellite Setup Baseline (Evening)
#### Functional Requirements
- FR3.1: Validate free-source satellite ingestion path for selected region.
- FR3.2: Retrieve recent cloud-filtered imagery for one or more sample AOIs.
- FR3.3: Define normalized ingest format for Day 3 NDVI pipeline.

#### Technical Requirements
- TR3.1: Keep ingestion toolchain free/open-source.
- TR3.2: Avoid long-running jobs in UI request path.
- TR3.3: Store metadata required for reproducibility (date, tile id, cloud cover).

#### Acceptance Criteria
- Satellite fetch test succeeds for demo region.
- Metadata and sample output are persisted for Day 3 handoff.

#### Enhancement Ideas
- Add fallback sample imagery bundle for offline demo mode.

## 5. Validation Protocol
- Unit-test scoring logic with profile fixtures.
- Verify recommendation cards with edge-case profiles.
- Verify satellite ingest with at least 2 timestamps for same AOI.

## 6. Constraints and Cost Guardrails
- Free datasets and free-tier services only.
- No paid GIS or commercial scheme APIs.

## 7. Risks and Mitigation
- Risk: Scheme policy text ambiguity.
  - Mitigation: mark uncertain rules and surface confidence.
- Risk: Satellite API throttling.
  - Mitigation: cache metadata and prefetch demo assets.

## 8. Exit Checklist
- [x] Seed scheme dataset complete (`34` detailed seed schemes available)
- [x] Eligibility scoring explainable
- [x] Recommendation UX usable
- [x] Satellite ingest baseline validated
- [x] Tracker + logs + app-wide docs updated
