# Slide 7: Technical Architecture & Implementation

## How We Built It: 3-Day Hackathon Breakdown

---

### Tech Stack Overview

**Local AI (RTX 4050 Laptop):**
- Ollama runtime for local LLM inference
- Qwen 2.5 7B model (4.7GB, optimized for agricultural Q&A)
- Whisper.cpp for STT (Speech-to-Text)
- eSpeak-ng for TTS (Text-to-Speech)

**Cloud Services (Free Tier Only):**
- Firebase: Authentication + Firestore database
- Copernicus CDSE: Free Sentinel-2 satellite data
- OpenWeatherMap: Weather data (1M calls/day free)

**Framework:**
- Next.js 15 with TypeScript
- Tailwind CSS for mobile-first UI
- Leaflet maps for interactive farm boundaries

---

### Implementation Timeline (What We Delivered in Day 1):

**Day 1: Complete AI Foundation ✅**

**Morning - Core Personalization:**
- ✅ Local LLM infrastructure (Ollama + Qwen 2.5)
- ✅ Farm profile CRUD with Firestore persistence
- ✅ Interaction memory and pattern extraction
- ✅ Context-aware personalized responses

**Afternoon - Schemes Intelligence:**
- ✅ 34 government schemes in structured database
- ✅ Eligibility scoring with explainable AI
- ✅ Document checklist interactions
- ✅ Recommendation cards with match scores

**Evening - Satellite + Voice:**
- ✅ Satellite data ingestion from CDSE
- ✅ NDVI-based crop health analysis
- ✅ Voice STT/TTS APIs (13 Indian languages)
- ✅ Voice-first assistant UX with playback controls

---

### Key Technical Achievements:

**1. Local-First Architecture**
- Core AI runs on RTX 4050, no cloud dependency
- Offline capability for critical features
- Complete data privacy (farm data stays local)

**2. Multi-Modal AI Integration**
- Text + Voice + Satellite + Profile data
- All modalities feed into personalization engine
- Unified dashboard showing cross-modal insights

**3. Free-Resource Strategy**
- Zero paid APIs for core functionality
- Copernicus for satellite (free)
- Open-source ML models (Whisper, Qwen, etc.)
- Firebase free tier for database

**4. UI-Backend Contract Sync**
- Mandatory API contract reading before UI changes
- Same-session synchronization for API changes
- Validation evidence: type-check + build + smoke tests

---

### Performance Metrics:

**Local LLM Latency (5-run average):**
- Health endpoint: 6,018ms average
- Query response: 5-8 seconds for complex answers

**Satellite Data:**
- Scene retrieval: 2-5 seconds with cloud filtering
- Health analysis: Real-time NDVI calculation
- Map rendering: Interactive overlay with zoom/pan

**Voice Pipeline:**
- STT: 1-3 seconds (Whisper.cpp)
- TTS: 0.5-2 seconds (eSpeak-ng)
- Roundtrip: 8-12 seconds (including AI processing)

---

*Evidence: PRD Progress Tracker shows Day 1 complete with extensive validation evidence*
