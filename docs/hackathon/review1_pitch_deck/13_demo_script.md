# Slide 13: Demo Script - Live Walkthrough

## "A Day in the Life with KisanSetu"

---

### Demo Flow (7-10 minutes):

**Opening Hook (30 seconds):**
"Meet Ramesh, a wheat farmer in Punjab with 2.5 acres. Like 146 million Indian farmers, he faces three daily challenges: What to plant? When to sell? Which schemes can he access? Today, I'll show you how KisanSetu 2.0 transforms his farming with AI that actually learns HIS farm - and we built this foundation in just Day 1 of our 3-day hackathon."

---

### Scene 1: Farm Profile Creation (2 minutes)

**Actor:** Demo farmer "Ramesh Singh"

**Actions:**
1. Navigate to `/farm-profile`
2. Fill profile:
   - Name: Ramesh Singh
   - Location: Ludhiana, Punjab
   - Land Size: Draw boundary on map (auto-calculates 2.5 acres)
   - Soil Type: Loamy
   - Irrigation: Canal water
   - Crops: Wheat (Rabi), Rice (Kharif)
   - Budget: ₹80,000/year
   - Language: Punjabi (pa-IN)
3. Save profile → Show success message
4. Show pattern extraction: "Learning your farm patterns..."

**Key Points:**
- "Notice the map-based land selection - no manual acreage entry needed"
- "Every field teaches our AI about Ramesh's specific context"
- "This data feeds into ALL our AI features"

---

### Scene 2: AI Assistant - Personalized Advice (2 minutes)

**Actions:**
1. Navigate to `/assistant`
2. Text query: "What fertilizer should I use?"
3. Show AI response referencing:
   - Ramesh's loamy soil
   - His wheat crop
   - Ludhiana climate patterns
   - "Based on your soil type..."
4. Voice mode demo:
   - Switch to Punjabi language
   - Tap microphone
   - Speak: "ਮੇਰੀ ਫਸਲ ਦਾ ਰੋਗ ਕਿਉਂ ਲੱਗ ਰਿਹਾ ਹੈ?" (Why is disease affecting my crop?)
   - Show transcript preview
   - Send and show personalized response in Punjabi
   - Play back TTS response

**Key Points:**
- "Same question, but now AI knows Ramesh's farm context"
- "Voice interface in regional language - no literacy required"
- "Works offline - AI runs on this laptop, not the cloud"

---

### Scene 3: Government Schemes - "Money You Didn't Know Existed" (2 minutes)

**Actions:**
1. Navigate to `/schemes`
2. Auto-loads Ramesh's profile
3. Show recommendation cards:
   - PM Fasal Bima Yojana: 87% match
   - Soil Health Card: 95% match
   - Kisan Credit Card: 72% match
4. Click PMFBY card:
   - Show eligibility reasons
   - Document checklist
   - Application steps
   - Official link
5. Click "Save for Later"
6. Show checklist interaction:
   - Check "Identity Proof" ✓
   - Check "Land Records" ✓
   - Mark "Bank KYC" as pending

**Key Points:**
- "Ramesh never knew he was eligible for crop insurance"
- "₹40,000/acre coverage - that's ₹100,000 protection he almost missed"
- "Explainable AI shows WHY he qualifies"

---

### Scene 4: Satellite Health - "Your Farm from Space" (2 minutes)

**Actions:**
1. Navigate to `/satellite`
2. Show live satellite analysis:
   - Health Score: 72/100
   - Baseline comparison: -8%
   - Stress signals detected
   - Zone map with color coding
3. Show AI recommendations:
   - "Inspect northern section for nitrogen deficiency"
   - "Consider light irrigation within 3 days"
4. Click "Refresh with Live Data"
5. Show loading → Updated analysis
6. Highlight map overlays: Green (healthy), Yellow (monitor), Red (action needed)

**Key Points:**
- "No sensors, no hardware - just free satellite data"
- "Detects problems before they're visible to the naked eye"
- "Individual farm-level analysis, not district averages"

---

### Scene 5: Dashboard - Unified Intelligence (1 minute)

**Actions:**
1. Navigate to `/dashboard`
2. Show unified view:
   - Weather card with microclimate
   - Satellite health summary
   - Top 3 scheme recommendations
   - Recent AI conversations
   - Market prices (if implemented)
3. One-click access to any feature
4. Mobile view: Show responsive design

**Key Points:**
- "Everything in one place - no more switching apps"
- "Works perfectly on mobile - designed for farmers"
- "This is the agricultural operating system of the future"

---

### Closing (30 seconds):

"In just Day 1 of our 3-day hackathon, we built an AI that learns individual farms, monitors crops from space, finds hidden government benefits, and speaks 13 Indian languages - all running offline on a laptop. This isn't just an app. It's the future of farming for 146 million Indians. Thank you."

---

### Backup Plan:

**If Live Demo Fails:**
1. Have screenshots ready for each scene
2. Show pre-recorded 2-minute demo video
3. Emphasize: "This is working code, not a mockup"
4. Point to validation evidence in documentation

**Technical Setup:**
- Local Ollama running on RTX 4050
- Dev server on port 3100
- Test account: demo@kisansetu.com
- Pre-loaded demo profile for fast loading

---

*Evidence: Demo preparation based on actual implemented features with routes tested and validated*
