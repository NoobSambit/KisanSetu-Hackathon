# Day 3 PRD: Satellite Intelligence + Voice Assistant

## 1. Mission
Convert baseline satellite ingestion into meaningful crop health insights and launch multilingual voice interaction as a first-class assistant experience.

## 2. Day Outcome
- NDVI-driven crop health interpretation pipeline
- Voice STT/TTS service pipeline
- Frontend voice conversation integration

## 3. Scope
### In Scope
- NDVI calculation and insight generation
- Voice transcription and speech synthesis
- Voice-first UI path in assistant

### Out of Scope
- Large-scale geospatial history warehouse
- Full language pack coverage for all dialects

## 4. Feature Requirements

### Phase 1: Satellite Crop Health Analysis (Morning)
#### Functional Requirements
- FR1.1: Convert satellite inputs into NDVI and normalized health score.
- FR1.2: Compare current health against baseline period.
- FR1.3: Detect likely stress patterns (water/nutrient/pest signals).
- FR1.4: Produce actionable recommendations with confidence level.

#### Output Requirements
- OR1.1: Summary card text for dashboard.
- OR1.2: Visual heatmap or simplified zone indicator.
- OR1.3: Alerts when anomaly threshold breached.

#### Acceptance Criteria
- For demo farm, pipeline returns score + insight + recommendation.
- Output is understandable without technical NDVI knowledge.

#### Enhancement Ideas
- Add “change since last scan” trend arrow.
- Add explicit uncertainty note if cloud coverage is high.

---

### Phase 2: Voice AI Backend (Afternoon)
#### Functional Requirements
- FR2.1: Speech-to-text endpoint for Hindi-first input.
- FR2.2: Text-to-speech endpoint for assistant output.
- FR2.3: Keep voice artifacts local-first and privacy-aware.
- FR2.4: Route voice text through same personalization pipeline as text chat.

#### Reliability Requirements
- RR2.1: Define max audio duration and file-size guardrails.
- RR2.2: Graceful error responses for noisy/invalid audio.
- RR2.3: Language fallback strategy should be explicit in UX.

#### Acceptance Criteria
- User can speak query and receive spoken answer in one flow.
- At least one regional language beyond English/Hindi is validated.

#### Enhancement Ideas
- Add quick voice presets: “Weather”, “Price”, “Disease”, “Scheme”.

---

### Phase 3: Voice Frontend Integration (Evening)
#### Functional Requirements
- FR3.1: Recording controls with clear state (idle/recording/processing).
- FR3.2: Transcript preview before send.
- FR3.3: Audio playback controls for AI response.
- FR3.4: Preserve accessibility in low-end mobile devices.

#### UX Requirements
- UX3.1: Error state must suggest corrective action.
- UX3.2: Keep visual complexity low and touch-targets large.
- UX3.3: Avoid hidden controls for core voice interactions.

#### Acceptance Criteria
- Voice roundtrip works inside assistant page.
- Voice + profile context generate personalized spoken advice.

#### Enhancement Ideas
- Add “slow speech mode” for better comprehension.

## 5. Validation Protocol
- Satellite sample runs across at least 2 dates.
- Voice roundtrip tested with 3 representative user utterances.
- Mobile responsiveness check for voice UI components.

## 6. Constraints and Cost Guardrails
- Open-source voice stack only.
- No paid speech APIs.

## 7. Risks and Mitigation
- Risk: Voice model latency too high.
  - Mitigation: smaller model variant and cached synthesis for repeated phrases.
- Risk: Satellite insight overconfidence.
  - Mitigation: confidence label + recommendation to verify physically.

## 8. Exit Checklist
- [x] NDVI insight pipeline usable
- [x] Voice API pipeline stable
- [x] Frontend voice UX complete
- [x] End-to-end validation documented
- [x] Tracker + logs + app-wide docs updated

## 9. Implementation Notes (2026-02-09)

### Delivered Artifacts
- Phase 1:
  - Added satellite health analysis service with NDVI estimation, baseline comparison, stress signal detection, recommendation generation, and confidence/uncertainty output.
  - Added `GET|POST /api/satellite/health` and dashboard health card with summary text, zone indicators, and alerts.
- Phase 2:
  - Added open-source/local-first voice services for STT/TTS with explicit fallback strategy.
  - Added routes:
    - `POST /api/voice/stt`
    - `POST /api/voice/tts`
    - `POST /api/voice/roundtrip`
  - Added guardrails for audio size/duration and explicit fallback metadata in responses.
  - Refactored assistant query pipeline into shared service (`lib/services/assistantQueryService.ts`) used by both text and voice.
- Phase 3:
  - Rebuilt `/assistant` voice UX with clear recording states, transcript preview-before-send, quick voice presets, and assistant playback controls.
  - Added slow speech mode toggle and visible warning banner for fallback/language normalization.

### Validation Evidence
- `npx tsc --noEmit` -> pass
- `npm run build` -> pass
- `npm run smoke:day3` -> pass
- `npm run smoke:day2` -> pass (regression validation)

### Known Gaps / Hardening Backlog
- Local Whisper and eSpeak binaries are optional and environment-dependent; fallback mode currently uses browser transcript/synthesis when binaries are unavailable.
- Satellite NDVI is currently metadata-driven for MVP speed; integrating true band-level NDVI (B08/B04) is the next hardening step.

## 10. Multilingual Hardening Update (2026-02-09 11:46 IST)

- Completed local voice runtime setup on development machine:
  - `whisper-cli` configured at `/home/noobsambit/tools/whisper.cpp/build/bin/whisper-cli`
  - model configured at `/home/noobsambit/tools/whisper.cpp/models/ggml-small.bin`
  - `espeak-ng` available for server-side synthesis
- Expanded configured voice language set from 3 to 13:
  - `hi-IN`, `en-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `ur-IN`, `or-IN`, `as-IN`
- Validation added:
  - STT with real WAV input (no browser transcript) now returns `provider=whisper_cpp`
  - Day 3 smoke script updated to include Bengali STT and Tamil TTS checks

## 11. Regression Hardening Update (2026-02-13 10:09 IST)

- Reported issue:
  - Hindi voice input intermittently failed with `Speech transcription failed...` when browser transcript fallback was expected.
- Root cause:
  - Assistant UI force-aborted browser recognizer immediately on stop, causing transcript loss before STT request serialization.
  - Backend STT error text was too config-centric even for runtime decode/processing failures.
- Fix implemented:
  - Frontend now finalizes recognizer gracefully and preserves interim transcript before posting to `/api/voice/stt`.
  - STT service now normalizes MIME variants and supports additional mobile recorder containers (`audio/m4a`, `audio/x-m4a`, `video/mp4`).
  - Whisper failures now return actionable runtime diagnostics when fallback transcript is unavailable.
- Validation:
  - `POST /api/voice/stt` with Hindi transcript fallback -> `200`, `provider=browser_fallback`
  - `POST /api/voice/stt` with WAV audio -> `200`, `provider=whisper_cpp`
  - `POST /api/voice/stt` missing both audio and transcript -> `400`
  - `POST /api/voice/roundtrip` success + validation error paths confirmed

## 12. Container + Multilingual Runtime Compatibility Update (2026-02-13 10:23 IST)

- Reported issue:
  - STT still failed after previous hardening when recording format was WebM/M4A, with whisper runtime returning no transcript output file.
- Root cause:
  - Local `whisper-cli` runtime only supports native input formats `wav/ogg/mp3/flac`; browser recordings can arrive as `webm` or `m4a`.
  - For unsupported language code `or`, local whisper runtime raised `unknown language 'or'`.
- Fix implemented:
  - Added server-side audio container conversion to WAV before whisper transcription for non-native formats (`webm`, `m4a`, `mp4`) using ffmpeg.
  - Added language fallback retry: if whisper rejects requested language code, STT retries with `language=auto` and surfaces fallback metadata.
  - Added MIME acceptance for `video/webm` and `video/ogg`.
  - Reordered frontend recorder MIME preference to use OGG first when available.
  - Extended `scripts/day3_smoke_test.sh` with a WebM STT runtime + multilingual fallback validation step.
- Validation:
  - `POST /api/voice/stt` with WebM audio -> `200`, `provider=whisper_cpp`.
  - `POST /api/voice/stt` with M4A audio -> `200`, `provider=whisper_cpp`.
  - STT sweep across all configured languages with WebM audio -> all `200`; `or-IN` -> `languageUsed=auto`, `fallbackApplied=true`.
  - `POST /api/voice/roundtrip` with WebM audio + `language=or-IN` -> `200` with explicit fallback warning.

## 13. Script Normalization Update (2026-02-13 10:38 IST)

- Reported issue:
  - Bengali voice selections sometimes returned Devanagari-script transcript text.
- Root cause:
  - Local whisper output script can drift for acoustically similar Indic languages under noisy/short utterances.
- Fix implemented:
  - Added transcript script normalization for requested Indic scripts in STT success path.
  - When script mismatch is detected (example: Devanagari-heavy text for `bn-IN`), transcript is transliterated to the requested script and explicitly noted.
  - UI warning behavior updated to avoid confusing locale normalization warning noise (`bn-IN` -> `bn`).
- Validation:
  - `POST /api/voice/stt` with `language=bn-IN` + Devanagari fallback transcript -> Bengali-script output with note.
  - `POST /api/voice/stt` with `language=hi-IN` + Devanagari fallback transcript -> unchanged Devanagari output.

## 14. TTS Length-Fallback Update (2026-02-13 10:46 IST)

- Reported issue:
  - Users saw `Text is too long for speech synthesis (max 1600 characters)` for short spoken prompts.
- Root cause:
  - TTS limit applies to generated assistant answer length, not recorded question length; this previously returned a hard failure.
- Fix implemented:
  - Server TTS now returns explicit browser fallback for long generated answers instead of failing voice roundtrip.
  - Updated script-adjustment note wording to clarify display normalization and avoid implying user spoke another script.
- Validation:
  - `POST /api/voice/tts` with >1600 chars -> `200`, `provider=browser_speech_fallback`, explicit fallback reason.
