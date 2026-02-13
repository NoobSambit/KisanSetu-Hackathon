# Day 4 PRD: Predictive AI + Community Intelligence

## 1. Mission
Deliver forward-looking decisions with price forecasting and community-derived local intelligence to improve farmer timing and resilience.

## 2. Day Outcome
- Forecasting service for key crops (7/30/90 day)
- Forecast visualization and recommendation UI
- Community knowledge extraction and regional insights

## 3. Scope
### In Scope
- Time-series prediction for prioritized crops
- Forecast confidence and recommendation logic
- Community post mining for best-practice patterns

### Out of Scope
- National-scale forecasting coverage
- Deep NLP research-grade graph engine

## 4. Feature Requirements

### Phase 1: Price Prediction Engine (Morning)
#### Functional Requirements
- FR1.1: Ingest historical mandi prices for selected crops.
- FR1.2: Train and serve 7/30/90-day predictions.
- FR1.3: Output forecast bounds or confidence indicator.
- FR1.4: Include “best sell window” suggestion.

#### Data and Model Requirements
- MR1.1: Version model artifacts and training period metadata.
- MR1.2: Handle sparse/missing historical points.
- MR1.3: Keep explainability simple (trend up/down/stable + rationale).

#### Acceptance Criteria
- Forecast API returns valid output for demo crops.
- Recommendation text includes timing rationale.

#### Enhancement Ideas
- Add weather-adjusted risk modifier for short-term forecast caution.

---

### Phase 2: Prediction UX (Afternoon)
#### Functional Requirements
- FR2.1: Chart historical + forecast values in one view.
- FR2.2: Show recommendation card with profit delta estimate.
- FR2.3: Allow quick crop switching with retained filters.
- FR2.4: Show “data freshness” timestamp to build trust.

#### UX Requirements
- UX2.1: Explain confidence in plain language.
- UX2.2: Distinguish prediction from guaranteed outcomes.
- UX2.3: Keep charts readable on mobile screens.

#### Acceptance Criteria
- Users can compare current vs forecast and understand action.
- UI remains understandable for first-time users.

#### Enhancement Ideas
- Add “if sold today vs recommended date” simulation card.

---

### Phase 3: Community Knowledge Extraction (Evening)
#### Functional Requirements
- FR3.1: Process community posts/comments for recurring practices.
- FR3.2: Tag extracted insights by crop, issue, region.
- FR3.3: Generate regional recommendations from aggregated signals.
- FR3.4: Surface top practical insights in farmer dashboard.

#### Trust and Safety Requirements
- TSR3.1: Flag low-confidence or conflicting advice.
- TSR3.2: Distinguish anecdotal tips from broadly validated patterns.

#### Acceptance Criteria
- At least 5 meaningful structured insights from existing community content.
- Insights are display-ready with confidence labels.

#### Enhancement Ideas
- Add peer-validated badge if multiple users report same successful outcome.

## 5. Validation Protocol
- Backtest forecast quality on holdout period.
- Verify recommendation logic under volatile price scenarios.
- Validate community extraction with manual review sample.

## 6. Constraints and Cost Guardrails
- Free data sources only.
- No paid forecasting APIs.

## 7. Risks and Mitigation
- Risk: Forecast instability with limited data.
  - Mitigation: conservative confidence and narrower crop scope.
- Risk: Community noise.
  - Mitigation: confidence thresholds and moderation filters.

## 8. Exit Checklist
- [ ] Forecast model outputs stable
- [ ] Forecast UX usable and clear
- [ ] Community extraction visible in product
- [ ] Validation metrics documented
- [ ] Tracker + logs + app-wide docs updated
