# Day 1 Execution Plan (Core Personalization)

Date: February 8, 2026
Primary Local Model: `qwen2.5:7b` via Ollama (`http://127.0.0.1:11434`)

## Phase 1 - Local LLM Infrastructure
Goals:
- Route assistant inference through local Ollama first.
- Use `qwen2.5:7b` as default model.
- Keep assistant runtime strict local (no fallback for Day 1).

Build Items:
- Local-first LLM abstraction in `lib/ai/gemini.ts`.
- Strict local Ollama inference for assistant endpoints.
- Add local health benchmark API route (`/api/ai/health`).
- Expose model/provider/latency metadata in assistant responses.

Acceptance Criteria:
- AI query works locally with Ollama running.
- API response includes provider and model metadata.
- Health check route returns latency and response preview.

## Phase 2 - Farm Profile and Memory Data Layer
Goals:
- Create persistent farm profile schema.
- Start interaction memory capture and pattern extraction.

Build Items:
- Add `FarmProfile`, `FarmInteractionMemory`, `LearnedPattern` types.
- Implement Firestore services for profile CRUD.
- Store memory signals from every AI interaction.
- Build pattern extraction from recent interactions.

Acceptance Criteria:
- User profile can be saved and fetched.
- Pattern list updates from profile + interaction history.
- Farm memory context can be generated for prompt injection.

## Phase 3 - Context-Aware AI Responses
Goals:
- Make responses aware of profile + memory.

Build Items:
- Inject farm memory context in AI prompt.
- Keep session conversation context.
- Log LLM metadata for audit and demo evidence.

Acceptance Criteria:
- Same query yields user-specific response after profile setup.
- Interaction logs include provider/model/latency metadata.

## Phase 4 - User Interface for Farm Profile
Goals:
- Provide a practical profile wizard page for Day 1 demo.

Build Items:
- Add authenticated page `/farm-profile`.
- Form sections: farmer basics, land/location, crops/history.
- Save profile and show memory snapshot + learned patterns.
- Add navigation link for quick access.

Acceptance Criteria:
- Authenticated user can create/update profile end-to-end.
- Saved profile influences assistant context.

## Phase 5 - Day 1 Documentation and Tracking
Goals:
- Keep planning and progress transparent.

Build Items:
- Maintain this Day 1 plan file.
- Maintain `DAY1_PROGRESS_LOG.md` with done/left checklist.
- Update `HACKATHON_PLAN.md` with Qwen + localhost strategy.

Acceptance Criteria:
- Team can see what is completed and what remains without scanning code.
