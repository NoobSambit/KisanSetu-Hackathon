# KisanSetu Architecture Diagram - AI Image Generation Prompt

## Prompt to Use with Nano Banana / Gemini / DALL-E / Midjourney

---

### MAIN PROMPT (Copy-Paste Ready):

```
Create a professional, modern, and visually stunning architecture diagram for "KisanSetu" - an AI-powered Indian agricultural assistance platform for smallholder farmers.

STYLE & LAYOUT:
- Clean, modern tech architecture diagram style with isometric or flat design
- Use a central hub-and-spoke or layered architecture layout
- Color palette: Primary - Deep Green (#22c55e), Secondary - Earthy Brown (#8B4513), Accent - Sky Blue (#3B82F6), Background - Light gradient (white to soft green)
- Include subtle agricultural/farming motifs (wheat stalks, leaves, soil textures) as decorative accents
- Font: Modern sans-serif, highly legible
- Aspect ratio: 16:9 landscape
- Include small Indian flag element to signify localization

TOP-LEVEL COMPONENTS (Label each clearly):

1. PRESENTATION LAYER (Top)
   - React 19 + Next.js 15 App Router (App Router badge)
   - Tailwind CSS styling (CSS badge)
   - Client Components + Server Components icons
   - Firebase Auth State (shield icon)
   - Key pages labeled: Dashboard, Assistant, Farm Profile, Schemes, Satellite, Community

2. API ROUTE LAYER (Middle-Top)
   Show these API endpoints with REST/globe icons:
   - /api/ai/query & /api/ai/health (AI Assistant)
   - /api/farm-profile (Profile Management)
   - /api/schemes/* (Scheme Intelligence)
   - /api/satellite/ingest & /api/satellite/health (Satellite Monitoring)
   - /api/voice/stt, /api/voice/tts, /api/voice/roundtrip (Voice AI)
   - /api/weather, /api/prices, /api/disease/detect, /api/crop-plan (Utility Services)
   - /api/community/* (Social Platform)
   - /api/admin/stats (Admin Tools)

3. SERVICE LAYER (Middle)
   Show service modules with gear/cog icons:
   - assistantQueryService (AI orchestration)
   - schemeMatcherService (Recommendation engine)
   - satelliteIngestService & satelliteHealthService (Sentinel-2 satellite)
   - satelliteNdviProcessService (NDVI processing)
   - voiceService (Speech processing)
   - cropPlanningService, weatherService, priceService, diseaseService, communityService, adminService

4. AI/ML LAYER (Left Side)
   Show as a connected brain/AI module:
   - Ollama (Local LLM - primary)
   - Groq API (Cloud LLM - fallback)
   - whisper.cpp (Local STT)
   - eSpeak-ng (Local TTS)
   - Connect to /lib/ai/groq.ts

5. SATELLITE/GEOSPATIAL LAYER (Right Side)
   Show with satellite/earth icons:
   - Copernicus Data Space (CDSE)
   - STAC Catalog Search
   - Sentinel-2 Imagery
   - NDVI Processing Pipeline
   - Map Overlays with Leaflet
   - AOI Resolver (Area of Interest)

6. DATA LAYER (Bottom)
   Show as database cylinder icons:
   Primary: Firebase Firestore
   Collections labeled:
   - users, farmProfiles, aiLogs, savedAdvice
   - schemeCatalog, schemeRecommendations, schemeUserState
   - satelliteHealthSnapshots, satelliteHealthCache
   - communityPosts, communityComments, communityReplies
   - cropPlans, diseasePredictions, analyticsEvents
   
   Secondary:
   - In-memory caches (weather, prices)
   - Ephemeral temp storage (voice artifacts)

7. EXTERNAL INTEGRATIONS (Surrounding)
   Show with cloud/external icons:
   - OpenWeather API
   - Market Price Feeds
   - Government Scheme Portals
   - WhatsApp (planned extension)

8. SECURITY & TRUST (Decorative but prominent)
   Show with shield/lock icons:
   - Firebase Auth
   - User Roles (admin/user)
   - Explicit Fallback Contracts (visible in responses)
   - Cache TTL indicators
   - Data Source Labels (live_cdse vs fallback)

DATA FLOWS (Show with arrows):
- Solid green arrows: Primary data flow
- Dashed orange arrows: Fallback/degraded mode
- Blue arrows: External API calls
- Purple arrows: AI/ML interactions

KEY FEATURES TO HIGHLIGHT:
- Multilingual Support (13 Indian languages badge)
- Voice-First Interaction (microphone icon)
- Satellite Crop Health Monitoring (satellite icon)
- Government Scheme Matching (document icon)
- Community Platform (users icon)
- Offline-First Capability (cloud with checkmark)

LEGEND/CAPTION AREA (Bottom):
Include a small legend showing:
- Technology Stack: Next.js 15 | React 19 | TypeScript | Firebase | Tailwind
- Free/Open Source Philosophy badge
- "Built for Indian Farmers" tagline in Hindi and English
```

---

### ALTERNATIVE CONDENSED PROMPT (For character-limited tools):

```
Modern architecture diagram for KisanSetu - AI agricultural platform for Indian farmers. Clean tech style with green/brown/blue palette. 

Structure:
TOP: React 19 + Next.js 15 frontend with Firebase Auth
MIDDLE: API routes - AI Assistant, Farm Profile, Schemes, Satellite, Voice, Weather, Prices, Disease, Community
CENTER: Service layer with Ollama/Groq AI, satellite processing (CDSE/Sentinel-2), voice (whisper/eSpeak)
BOTTOM: Firebase Firestore with collections for users, profiles, schemes, satellite data, community
EXTERNAL: OpenWeather, market feeds, government APIs

Highlight: 13 Indian languages, voice-first, satellite NDVI, scheme matching, offline-first. Include hub-spoke layout with data flow arrows. "KisanSetu: Building Trust Through Technology" caption.
```

---

### KEY ARCHITECTURAL DETAILS TO EMPHASIZE:

**For the AI Image Generator - make sure to include:**

1. **The "Thin Routes, Thick Services" Pattern**
   - Route handlers should look lightweight
   - Service layer should appear substantial

2. **Multi-Modal AI Stack**
   - Visual distinction between local (Ollama, whisper.cpp, eSpeak) and cloud (Groq) components
   - Show fallback paths explicitly

3. **Satellite Intelligence Pipeline**
   - CDSE -> STAC Search -> Scene Ingest -> NDVI Processing -> Health Insights -> Map Overlay
   - Show both high-accuracy and estimated modes

4. **Trust & Transparency Features**
   - Cache indicators (TTL, hit/miss)
   - Data source labels
   - Fallback reason displays
   - Confidence scores

5. **Localization Emphasis**
   - Multiple language indicators (hi-IN, bn-IN, ta-IN, etc.)
   - Indian agricultural context (crops, soil types, irrigation)

6. **Progressive Enhancement**
   - Show layers of capability from basic (text) to advanced (voice, satellite)

---

### RECOMMENDED TOOLS & SETTINGS:

**For Nano Banana:**
- Model: SDXL or higher
- Aspect Ratio: 16:9
- Style: Technical/Infographic
- Guidance Scale: 7-8
- Steps: 30-50

**For Gemini/Imagen:**
- Version: Latest available
- Style: Technical diagram, clean, professional

**For DALL-E 3:**
- Be very specific about layout and text placement
- Request "professional technical architecture diagram"

**For Midjourney:**
```
/imagine professional technical architecture diagram for agricultural AI platform, hub-and-spoke layout, Next.js React frontend, Firebase backend, Ollama Groq AI, satellite imagery pipeline, multilingual voice interface, clean modern design, green and brown color scheme, isometric style, highly detailed, 8k --ar 16:9 --v 6
```

---

### ADDITIONAL CONTEXT (Share with AI if needed):

This is a 6-day hackathon project built with:
- 100% free/open-source stack where possible
- Privacy-first (local AI processing)
- Designed for low-connectivity rural India
- 13 Indian language support
- Voice-first interface for literacy accessibility
- Satellite crop health using free Copernicus data
- Government scheme matching with explainable AI

The architecture prioritizes trust through transparency - every recommendation shows confidence scores, data sources, and fallback reasons.

---

Generated by KisanSetu Team | 2026
