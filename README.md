# 🌾 KisanSetu - AI-Powered Farming Assistant

**Empowering Farmers with AI-Driven Knowledge and Support**

KisanSetu is a modern web application that helps farmers get instant answers to agricultural questions, understand government schemes, and access farming best practices through an intuitive, AI-powered interface.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Ollama installed locally with `qwen2.5:7b` pulled
- Optional (recommended for local voice STT with browser-recorded audio): `ffmpeg`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KisanSetu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your credentials:
   - Firebase configuration values
   - Ollama config values
   - Optional feature keys (Gemini/weather/CDSE satellite) only if using those modules
   - In Firebase Console, open **Authentication** and ensure:
     - Email/Password sign-in is enabled
     - Authorized domains include `localhost` and `127.0.0.1`

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Note: dev and production build artifacts are isolated by script (`.next/dev` for `dev`, `.next/build` for `build/start`) to avoid manifest collisions.

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Day 2 Utility Commands

```bash
# Seed Day 2 scheme catalog (writes to `schemeCatalog`; fallback path is retained as resilience)
npm run seed:day2-schemes

# Run Day 2 API smoke validation (requires dev server)
npm run smoke:day2

# Run Day 3 satellite + voice smoke validation (requires dev server)
npm run smoke:day3
```

---

## 🎯 Features

### ✅ Current Features (MVP)

- **🤖 AI Assistant**: Chat with an AI-powered farming advisor
  - Ask questions about crops, soil, irrigation, pests
  - Get explanations of government schemes
  - Receive advice in simple, easy-to-understand language based on your query (Bengali/Hindi/English and other configured Indian languages)
  - Toggle assistant provider between Local LLM (`ollama`) and Gemini API from the chat UI

- **📚 Knowledge Resources**: Browse categorized farming information
  - Crop basics and selection
  - Soil management and fertilizers
  - Government schemes and subsidies
  - Safety and best practices

- **🏛️ Day 2 Policy Matcher**: Profile-aware government scheme recommendations
  - Explainable eligibility scoring with match reasons
  - Inline prompts for missing profile fields
  - Save-for-later + application checklist flow
  - One-click official source links

- **🛰️ Day 2 Satellite Baseline**: CDSE/Sentinel-2 ingest bootstrap
  - Cloud-filtered scene retrieval for demo AOI
  - Normalized metadata for Day 3 NDVI handoff
  - Live/fallback source visibility for trust-safe operation

- **🛰️ Day 3 Satellite Health Intelligence**
  - `/api/satellite/health` returns health score, baseline trend, stress signals, and recommendations
  - Satellite analysis moved to dedicated `/satellite` page with full map, zone popups, alerts, and manual refresh
  - Dashboard now provides a clean entry card and CTA to the satellite page
  - Satellite page is now available from top/bottom navbar for faster access
  - Explicit uncertainty note and confidence score for trust-safe interpretation
  - Explicit AOI source transparency (`profile_land_geometry`, `query_bbox`, `demo_fallback`)

- **🎙️ Day 3 Voice Assistant**
  - Backend STT/TTS APIs with local-first open-source providers
  - One-call voice roundtrip endpoint (`/api/voice/roundtrip`)
  - Assistant voice UX with recording states, transcript preview, and audio playback controls
  - Supports major Indian languages: Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Odia, Assamese (plus English)
  - Indic transcript script normalization for language-consistent rendering (for example Bengali selection rendered in Bengali script)
  - Explicit fallback warnings when local voice binaries are unavailable

- **📱 Responsive Design**: Works seamlessly on mobile, tablet, and desktop

- **🔒 Secure & Private**: All AI processing happens server-side with secure API keys

### 🚧 Coming Soon

- Automated multilingual voice quality benchmark script across all configured languages
- Mobile app

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **AI/LLM (Assistant)**: Local Ollama (`qwen2.5:7b`) with optional Gemini toggle
- **AI/LLM (Optional Feature Paths)**: Google Gemini (assistant optional + crop planner)
- **Deployment**: Vercel-ready

---

## 📁 Project Structure

```
KisanSetu/
├── app/                    # Next.js pages and routes
│   ├── api/               # API endpoints
│   ├── assistant/         # AI chat interface
│   ├── satellite/         # Interactive satellite drilldown page
│   ├── schemes/           # Day 2 policy matcher UX
│   ├── resources/         # Knowledge base
│   └── page.tsx           # Home page
├── data/                  # Seed datasets (e.g., Day 2 schemes)
├── components/            # Reusable UI components
├── lib/                   # Business logic & services
│   ├── ai/               # LLM abstraction layer
│   ├── services/         # Daywise business services
│   └── firebase/         # Firebase services
├── scripts/               # Smoke tests and seed scripts
├── types/                 # TypeScript definitions
├── docs/
│   ├── application/      # Comprehensive app documentation
│   ├── prd/              # Day + phase PRD sheets and progress tracker
│   ├── hackathon/        # Daywise execution and activity logs
│   └── archive/          # Archived drafts
└── PROJECT_DOCUMENTATION.md  # Legacy documentation (historical)
```

---

## 📖 Documentation

For comprehensive documentation including:
- Architecture details
- Data flow diagrams
- Development guidelines
- API documentation
- Future roadmap

Please start with **[docs/application/README.md](./docs/application/README.md)** (modular docs index).

Legacy compatibility entrypoint:
- **[docs/application/COMPREHENSIVE_APPLICATION_DOCUMENTATION.md](./docs/application/COMPREHENSIVE_APPLICATION_DOCUMENTATION.md)**

For hackathon planning and daywise tracking docs, see:
- **[docs/hackathon/README.md](./docs/hackathon/README.md)**
- **[docs/prd/README.md](./docs/prd/README.md)**

---

## 🤝 Contributing

We welcome contributions! Please:

1. Read the [application docs index](./docs/application/README.md)
2. Read the [PRD system docs](./docs/prd/README.md)
3. Follow the development guidelines
4. Submit PRs with clear descriptions
5. Update documentation as needed

---

## 🔐 Environment Variables

Required environment variables (see `.env.local.example`):

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Local Ollama (Day 1 assistant)
OLLAMA_BASE_URL=
OLLAMA_MODEL=

# Optional Gemini (used by assistant Gemini toggle and crop planner)
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_ASSISTANT_MODEL=

# Optional weather
OPENWEATHER_API_KEY=

# Optional satellite ingest (Day 2+)
CDSE_CLIENT_ID=
CDSE_CLIENT_SECRET=
CDSE_TOKEN_URL=

# Optional Day 3 voice pipeline (open-source)
VOICE_STT_PROVIDER=auto
WHISPER_CPP_BIN=
WHISPER_CPP_MODEL=
VOICE_TTS_PROVIDER=auto
VOICE_TTS_BIN=espeak-ng
VOICE_FFMPEG_BIN=ffmpeg
VOICE_MAX_AUDIO_BYTES=6291456
VOICE_MAX_AUDIO_SECONDS=45
```

Firebase auth preflight checklist:
- Firebase web app config in `.env.local` must belong to the same Firebase project.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` should be your project domain (for example `your-project.firebaseapp.com`) without protocol.
- If signup/login returns `auth/configuration-not-found`, initialize Firebase Authentication in console and enable Email/Password provider.

---

## 🙏 Acknowledgments

Built with the goal of making agricultural knowledge accessible to farmers everywhere.

---

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Built with ❤️ for farmers**
