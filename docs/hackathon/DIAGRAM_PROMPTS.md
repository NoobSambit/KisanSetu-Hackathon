# 🎯 SYSTEM ARCHITECTURE DIAGRAM PROMPT FOR AI CHART GENERATOR

---

## PROMPT 1: HIGH-LEVEL SYSTEM ARCHITECTURE DIAGRAM

**Copy and paste this prompt into Gemini/ChatGPT/DALL-E to generate the diagram:**

---

"Generate a professional system architecture diagram for an AI-powered agricultural platform called 'KisanSetu 2.0'. Use a modern, clean design with clear color coding.

**The diagram should show 4 main layers from top to bottom:**

**LAYER 1 - USER INTERFACES (Top - Green Section)**
Show these 3 user touchpoints side-by-side with icons:
1. WhatsApp Bot (phone icon) - Farmers send text, voice notes, images
2. Web Dashboard (desktop/laptop icon) - Full-featured web application
3. Mobile PWA (smartphone icon) - Progressive web app for mobile

Draw arrows from these 3 components pointing DOWN to Layer 2.

**LAYER 2 - API GATEWAY (Blue Section)**
Show a single 'API Gateway' box that receives all requests from Layer 1.
Inside the API Gateway box, list these 6 API endpoints:
- /ai/query (handles AI chat)
- /satellite/health (fetches crop health)
- /weather/predict (weather predictions)
- /prices/forecast (price forecasts)
- /schemes/match (government scheme matching)
- /voice/transcribe & /voice/synthesize (voice processing)

Draw arrows from API Gateway box splitting into TWO directions - LEFT and RIGHT.

**LAYER 3 - LEFT BRANCH: LOCAL AI PROCESSING (Purple Section)**
Show these 4 AI components stacked vertically:
1. 'Local LLM (Llama 3.2)' - Main AI model that generates responses
2. 'Farm Memory Database' - Stores farmer profiles and learned patterns
3. 'Speech-to-Text (Whisper)' - Transcribes voice in 10+ Indian languages
4. 'Text-to-Speech (Coqui TTS)' - Generates voice responses in regional languages

Draw connecting lines between these 4 components showing they work together.
Add a label: 'Runs locally on RTX 4050 GPU - Works Offline'

**LAYER 3 - RIGHT BRANCH: EXTERNAL DATA SOURCES (Orange Section)**
Show these 4 external API boxes arranged horizontally:
1. 'Sentinel-2 Satellite' - Provides imagery every 5 days
2. 'OpenWeatherMap API' - Current weather + 7-day forecasts
3. 'Agmarknet & NABARD' - Historical + current market prices
4. 'Government Portals' - 500+ scheme data

Draw arrows from API Gateway (Layer 2) pointing TO each of these 4 boxes.
Draw RETURN arrows from these boxes pointing BACK to API Gateway.

**LAYER 4 - DATABASE LAYER (Bottom - Dark Blue Section)**
Show a single 'Firestore Database' box at the bottom.
Inside the database box, list these 7 collections as bullet points:
- farmProfiles
- farmHistory
- learnedPatterns
- satelliteHealth
- schemeRecommendations
- pricePredictions
- communityPosts

Draw arrows from API Gateway (Layer 2), Local AI components (Layer 3 left), and External APIs (Layer 3 right) all pointing DOWN to the Firestore Database.

**COLOR CODING:**
- User Interfaces: Light Green (#4ADE80)
- API Gateway: Light Blue (#60A5FA)
- Local AI: Purple (#8B5CF6)
- External APIs: Orange (#FFA500)
- Database: Dark Blue (#1E3A8A)

**LABELS & ICONS:**
- Add title at top: 'KisanSetu 2.0 - System Architecture'
- Add legend showing what each color represents
- Use simple icons: phone, desktop, cloud, database, AI chip
- Make the diagram flow clearly from TOP to BOTTOM

Style: Modern, professional, clean lines, minimal text inside boxes."

---

## PROMPT 2: DATA FLOW DIAGRAM FOR AI QUERY

**Copy and paste this prompt:**

---

"Generate a detailed data flow diagram showing how a farmer's question flows through KisanSetu 2.0's AI system. Use a left-to-right horizontal flow with decision points.

**Start on LEFT with:**
'Farmer on WhatsApp' with speech bubble icon showing: 'My wheat leaves are turning yellow'

**Arrow pointing RIGHT to:**
'Receive Message' box with label: 'Twilio WhatsApp API receives text/voice note'

**Decision Diamond (Branch):**
Label: 'Is Voice Input?'
- Branch YES (downwards): Go to 'Speech-to-Text Processing' step
- Branch NO (straight across): Skip to text extraction step

**For YES Branch - Voice Processing (Bottom Path):**
Box labeled: 'Whisper STT (Local on RTX 4050)'
- Subtext: 'Transcribes Hindi/Tamil/Telugu in 95%+ accuracy'
- Subtext: 'Takes 2-3 seconds'

**Arrow from Voice Processing box back UP to main flow**

**Box labeled: 'Extract Query Text'**
- Shows both original text (if no voice) OR transcribed text (if voice)

**Arrow pointing RIGHT to:**
Box labeled: 'Fetch Farm Memory'
- Subtext: 'Retrieve farmer profile, crop history, learned patterns from Firestore'
- Show database icon

**Arrow pointing RIGHT to:**
Box labeled: 'Context Injection'
- Subtext: 'Combine farmer profile + query + conversation history'
- Subtext: 'Example: "Farmer has loamy soil in Punjab + 2-acre wheat + past blight issues"'

**Arrow pointing RIGHT to:**
Large box labeled: 'LOCAL LLM PROCESSING (Llama 3.2 8B)'
- Make this box stand out with different color
- Subtext: 'Generates personalized response using farmer context'
- Subtext: 'Response time: <2 seconds'
- Subtext: 'Runs offline on RTX 4050 GPU'

**Arrow pointing RIGHT to:**
Box labeled: 'Log Interaction to Firestore'
- Subtext: 'Store query, response, farmer context for learning'
- Show database icon

**Decision Diamond:**
Label: 'Is Regional Language?'
- Branch NO (straight across): Send as text response
- Branch YES (downwards): Go to voice synthesis step

**For YES Branch - Voice Synthesis (Bottom Path):**
Box labeled: 'Coqui TTS (Text-to-Speech)'
- Subtext: 'Generates Hindi/Tamil/Telugu voice audio'
- Subtext: 'Natural-sounding voice quality'
- Subtext: 'Takes 1-2 seconds'

**Arrow from Voice Synthesis box back UP to main flow**

**Final Box on RIGHT:**
'Send Response to WhatsApp'
- Shows output: Text response OR Voice audio file
- Add happy farmer icon at the end

**COLOR CODING:**
- Farmer/User: Green
- API/Processing: Blue
- AI/ML: Purple (highlighted)
- Database: Dark Blue
- Decision Points: Orange
- Voice Processing Steps: Pink

**ARROWS:**
- Solid arrows for main flow
- Dashed arrows for secondary flows
- Arrowheads clearly showing direction

**STYLE:**
- Horizontal layout (left to right)
- Clear decision diamonds
- Text inside boxes: Keep to 10-15 words max
- Use icons: phone, speaker, database, AI chip
- Add title: 'AI Query Data Flow - KisanSetu 2.0'
- Add legend if needed"

---

## PROMPT 3: SATELLITE HEALTH MONITORING FLOWCHART

**Copy and paste this prompt:**

---

"Generate a detailed flowchart showing how KisanSetu 2.0 uses satellite imagery to monitor crop health. Use a top-down vertical flow.

**Start at TOP with:**
'Farmer Registers Land Coordinates' box
- Subtext: 'Enter GPS location or select on map'
- Show map pin icon

**Arrow pointing DOWN to:**
'Create Farm Profile in Firestore' box
- Subtext: 'Store: coordinates, land size, soil type, crops'

**Arrow pointing DOWN to:**
Decision Diamond labeled: 'Has New Satellite Imagery?'
- Branch NO (left): Loop back - check again in 5 days
- Branch YES (down): Continue to processing

**Main Processing Path (YES branch):**

Box labeled: 'Fetch Sentinel-2 Satellite Data'
- Subtext: 'Copernicus Open Access Hub API'
- Subtext: 'Most recent imagery for farm coordinates'
- Subtext: 'Resolution: 10 meters per pixel'
- Show satellite icon

**Arrow pointing DOWN to:**
Box labeled: 'Extract Spectral Bands'
- Subtext: 'Download 3 bands: Red, Near-Infrared, Short-wave Infrared'
- Show spectral analysis icon

**Arrow pointing DOWN to:**
Box labeled: 'Calculate NDVI (Vegetation Index)'
- Subtext: 'Formula: (NIR - Red) / (NIR + Red)'
- Subtext: 'Result: Health score 0.0 to 1.0'
- Show calculator icon

**Arrow pointing DOWN to:**
Box labeled: 'Generate Health Score (0-100)'
- Subtext: 'Map NDVI to 0-100 scale for farmers'
- Subtext: '0-30: Unhealthy | 31-60: Moderate | 61-100: Healthy'

**Arrow pointing DOWN to:**
Box labeled: 'Compare with Historical Data'
- Subtext: 'Fetch last 3 seasons of health scores'
- Subtext: 'Calculate: Current vs Previous, % change'
- Show chart icon

**Arrow pointing DOWN to:**
Large box labeled: 'AI ANALYSIS ENGINE'
- Make this box stand out with different color
- Inside, show 4 analysis types:
  1. 'Anomaly Detection: Water stress, nutrient deficiency'
  2. 'Pattern Recognition: Matches disease signatures'
  3. 'Growth Tracking: Ahead/behind expected curve'
  4. 'Regional Comparison: vs nearby farms'
- Show AI chip icon

**Arrow pointing DOWN to:**
Box labeled: 'Generate Insights & Recommendations'
- Subtext: 'Example: "Northern section shows 15% water stress - irrigate in 3 days"'
- Show lightbulb icon

**Arrow pointing DOWN to:**
Box labeled: 'Store Satellite Health Data in Firestore'
- Subtext: 'Health score, date, insights, anomalies'
- Show database icon

**Arrow pointing DOWN to:**
Decision Diamond labeled: 'Alert Required?'
- Branch NO (left): Store only, no notification
- Branch YES (down): Send alert

**Alert Path (YES branch):**

Box labeled: 'Send Alert via WhatsApp'
- Subtext: 'Push notification to farmer'
- Subtext: 'Priority: High for critical issues'
- Show WhatsApp icon

**Arrow pointing DOWN to:**
'Farmer Receives Alert + Takes Action' box
- Subtext: 'Example: Checks irrigation pump, applies fertilizer'
- Show happy farmer icon

**Arrow pointing DOWN to:**
Final box: 'Health Update Confirmed'
- Subtext: 'Wait for next satellite pass (5 days)'
- Loop back to top with dashed arrow labeled 'Every 5 Days'

**COLOR CODING:**
- User Actions: Green
- Satellite Processing: Blue
- AI Analysis: Purple (highlighted)
- Alerts/Notifications: Orange
- Database: Dark Blue
- Decision Points: Yellow

**ARROWS:**
- Solid lines for main flow
- Dashed line for the 5-day loop back
- Arrowheads clearly showing direction

**STYLE:**
- Vertical layout (top to bottom)
- Decision diamonds clearly marked
- Use icons: map pin, satellite, AI chip, WhatsApp, lightbulb
- Title at top: 'Satellite Crop Health Monitoring - KisanSetu 2.0'
- Make AI Analysis engine box 2x larger than others to highlight importance"

---

## PROMPT 4: GOVERNMENT SCHEME MATCHING FLOWCHART

**Copy and paste this prompt:**

---

"Generate a flowchart showing how KisanSetu 2.0 matches farmers to eligible government schemes. Use a split-flow design with parallel processing.

**Start at TOP with:**
'Farmer Creates Digital Farm Profile' box
- Subtext: 'Enter: location, land size, soil type, crops, income, irrigation'
- Show profile form icon

**Arrow pointing DOWN to:**
'Store Profile in Firestore' box
- Subtext: 'Collection: farmProfiles'
- Show database icon

**Arrow pointing DOWN to:**
Box labeled: 'Trigger AI Scheme Matching'
- Subtext: 'Analyze profile against 500+ government schemes'

**Split Flow:**
Draw arrow branching into TWO parallel paths:

**LEFT PATH: FETCH SCHEME DATA**

Box labeled: 'Query Scheme Database'
- Subtext: 'Fetch all relevant schemes from Firestore'
- Subtext: 'Filter by: state, crop type, land size, income level'

**Arrow pointing DOWN to:**
Box labeled: 'Load Scheme Metadata'
- Subtext: 'For each scheme: eligibility, benefits, application steps, documents'
- Show document icon

**RIGHT PATH: EXTRACT FARMER CRITERIA**

Box labeled: 'Extract Farmer Requirements'
- Subtext: 'From farm profile: state, crops, land, income, documents'
- Subtext: 'Normalize data for matching'

**Arrow pointing DOWN to:**
Box labeled: 'Prepare Match Algorithm'
- Subtext: 'Define matching rules and scoring weights'

**MERGE BOTH PATHS:**

Box labeled: 'AI MATCHING ENGINE' (Make this prominent)
- Inside, show matching criteria with scores:
  1. 'Land Size Match' - Weight: 25% (max points: 25)
  2. 'State Match' - Weight: 20% (max points: 20)
  3. 'Land Ownership' - Weight: 15% (max points: 15)
  4. 'Crop Match' - Weight: 15% (max points: 15)
  5. 'Document Availability' - Weight: 15% (max points: 15)
  6. 'Income Threshold' - Weight: 10% (max points: 10)
- Total Score Range: 0-100%
- Show AI chip icon

**Arrow pointing DOWN to:**
Box labeled: 'Generate Eligibility Scores'
- Subtext: 'For each eligible scheme: Calculate 0-100% score'
- Subtext: 'Example: PM-KISAN = 95%, KCC = 90%, PMFBY = 85%'
- Show score badge icon

**Arrow pointing DOWN to:**
Box labeled: 'Rank Schemes by Score'
- Subtext: 'Sort: Highest score first'
- Subtext: 'Show top 5-10 matches to farmer'

**Arrow pointing DOWN to:**
Box labeled: 'Store Recommendations in Firestore'
- Subtext: 'Collection: schemeRecommendations'
- Subtext: 'Include: schemeId, eligibilityScore, generatedAt'
- Show database icon

**Arrow pointing DOWN to:**
Box labeled: 'Send to Farmer via WhatsApp'
- Subtext: 'List of eligible schemes with scores'
- Subtext: 'Example: "You're 95% eligible for PM-KISAN"'
- Show WhatsApp icon

**Arrow pointing DOWN to:**
Decision Diamond labeled: 'Farmer Wants to Apply?'
- Branch NO (left): End flow
- Branch YES (down): Generate application

**Application Path (YES branch):**

Box labeled: 'Auto-Fill Application Form'
- Subtext: 'Use farm profile data to populate form fields'
- Subtext: 'PM-KISAN form with farmer's details pre-filled'
- Show form icon

**Arrow pointing DOWN to:**
Box labeled: 'Generate Application Document'
- Subtext: 'Create PDF ready for download/print'
- Show PDF icon

**Arrow pointing DOWN to:**
Final box: 'Farmer Downloads & Submits Application'
- Subtext: 'Farmer signs and submits to government portal'
- Show happy farmer icon with checkmark

**COLOR CODING:**
- Farmer Actions: Green
- Data Processing: Blue
- AI Matching Engine: Purple (highlighted)
- Results/Recommendations: Orange
- Database: Dark Blue
- Decision Points: Yellow

**ARROWS:**
- Solid lines for main flow
- Parallel paths clearly separated
- Merge point where left and right paths join
- Arrowheads showing direction clearly

**STYLE:**
- Split-flow design with parallel processing clearly shown
- Make AI Matching Engine box 2x larger
- Use icons: profile, document, AI chip, score badge, WhatsApp, form, PDF, checkmark
- Title: 'Government Scheme AI Matching - KisanSetu 2.0'
- Show percentages in AI Matching Engine to make it clear"

---

## PROMPT 5: COMPLETE END-TO-END USER JOURNEY DIAGRAM

**Copy and paste this prompt:**

---

"Generate a comprehensive user journey diagram showing a farmer's complete experience with KisanSetu 2.0. Use a left-to-right timeline flow with 5 major phases.

**PHASE 1: ONBOARDING (Green Section)**

Start box: 'Day 0 - Farmer Registers'
- Subtext: 'Creates farm profile via WhatsApp or Web'
- Icon: User + phone

Arrow pointing RIGHT to:
Box: 'Enter Farm Details'
- Inside bullet points:
  • Location: District, state, GPS
  • Land: Size, soil type, irrigation
  • Crops: Current season, varieties
  • Budget: Available funds

Arrow pointing RIGHT to:
Box: 'Profile Created & Stored'
- Subtext: 'Farm Memory initialized'
- Icon: Database + checkmark

**PHASE 2: DAILY INTELLIGENCE (Blue Section)**

Arrow pointing RIGHT to:
Box: 'Day 1-5 - Satellite Monitoring'
- Subtext: 'Sentinel-2 passes over farm'
- Icon: Satellite

Arrow pointing RIGHT to:
Box: 'Health Analysis Generated'
- Subtext: 'NDVI score + AI insights'
- Example: 'Health: 72/100 - 15% below last year'

Arrow pointing RIGHT to:
Box: 'WhatsApp Alert Received'
- Subtext: '⚠️ Water stress detected in northern section'
- Subtext: 'Action: Irrigate in 3 days'
- Icon: WhatsApp notification

**PHASE 3: INTERACTIVE PROBLEM SOLVING (Purple Section)**

Arrow pointing RIGHT to:
Box: 'Day 10 - Farmer Reports Issue'
- Subtext: 'WhatsApps: "My wheat leaves are turning yellow"'
- Icon: Speech bubble

Arrow pointing RIGHT to:
Box: 'AI Diagnoses with Context'
- Subtext: 'Uses Farm Memory: Loamy soil + Punjab + 2-acre wheat'
- Subtext: 'Analysis: Likely nitrogen deficiency'
- Icon: AI chip

Arrow pointing RIGHT to:
Box: 'Personalized Recommendation'
- Subtext: 'Apply 40kg/acre urea fertilizer immediately'
- Subtext: 'Monitor for 7 days, report back'
- Icon: Lightbulb

Arrow pointing RIGHT to:
Box: 'Farmer Applies Solution'
- Subtext: 'Applies fertilizer as recommended'
- Icon: Farmer + checkmark

**PHASE 4: GOVERNMENT BENEFITS (Orange Section)**

Arrow pointing RIGHT to:
Box: 'Day 15 - AI Suggests Schemes'
- Subtext: '92% eligible for PM Fasal Bima Yojana'
- Subtext: '90% eligible for Kisan Credit Card'
- Icon: Document badge

Arrow pointing RIGHT to:
Box: 'Auto-Generated Application Forms'
- Subtext: 'Forms pre-filled with farm data'
- Subtext: 'Download PMFBY & KCC forms ready to submit'
- Icon: PDF

Arrow pointing RIGHT to:
Box: 'Farmer Submits Applications'
- Subtext: 'Signs and uploads to government portals'
- Icon: Checkmark

Arrow pointing RIGHT to:
Box: 'Approval Received'
- Subtext: 'KCC approved - ₹2 lakh credit at 4% interest'
- Subtext: 'PMFBY active - Crop insured'
- Icon: Money bag

**PHASE 5: CONTINUOUS LEARNING (Dark Blue Section)**

Arrow pointing RIGHT to:
Box: 'Season Progresses'
- Subtext: 'Farmer updates outcomes: "Fertilizer worked"'
- Icon: Progress bar

Arrow pointing RIGHT to:
Box: 'AI Learns from Outcomes'
- Subtext: 'Pattern recorded: "Nitrogen deficiency fixed with urea"'
- Subtext: 'Farm Memory updated: Solution effective'
- Icon: AI learning

Arrow pointing RIGHT to:
Box: 'Next Season - Improved Predictions'
- Subtext: 'AI: "Based on last year, expect blight in October"'
- Subtext: 'Action: Apply preventive spray in September'
- Icon: Calendar

Arrow pointing RIGHT to:
Final box: 'Year-Over-Year Yield Increase'
- Subtext: 'Year 1: 8 quintals → Year 2: 12 quintals → Year 3: 14 quintals'
- Subtext: '50% yield increase over 2 seasons'
- Icon: Happy farmer + upward chart

**COLOR CODING:**
- Phase 1 (Onboarding): Light Green (#90EE90)
- Phase 2 (Daily Intelligence): Light Blue (#87CEEB)
- Phase 3 (Problem Solving): Purple (#9370DB)
- Phase 4 (Government Benefits): Orange (#FFA500)
- Phase 5 (Learning): Dark Blue (#1E3A8A)

**ARROWS:**
- Thick arrows showing progression from Phase 1 to 5
- Clear left-to-right timeline flow
- Arrowheads indicating direction

**STYLE:**
- Timeline format with phases clearly labeled
- Each phase in a different color
- Use appropriate icons for each phase
- Title at top: 'Complete Farmer Journey - KisanSetu 2.0'
- Make the final yield increase box stand out with trophy icon

**TIMELINE LABEL:**
Add a timeline axis at the bottom showing:
'Day 0 → Day 5 → Day 10 → Day 15 → End of Season'"

---

## INSTRUCTIONS FOR USING THESE PROMPTS:

1. **Choose which diagram you want** (I've provided 5 options)
2. **Copy the entire prompt** (from "Generate a professional..." to end)
3. **Paste into AI chart generator** (Gemini, ChatGPT with DALL-E, Midjourney, etc.)
4. **The AI will generate the visual diagram** based on your detailed description
5. **Download/save the generated image** and add to your PPT

**Tips:**
- These prompts are designed to be very specific and detailed
- Color codes are provided - the AI should use them
- Icons are specified - helps the AI understand visual elements
- Arrows and flow directions are clearly described
- Each prompt focuses on one specific aspect of the system

**Recommended Order for Presentation:**
1. Prompt 1: System Architecture (Main overview)
2. Prompt 5: User Journey (Farmer experience)
3. Prompt 3: Satellite Monitoring (Novel feature)
4. Prompt 2: AI Query Flow (Technical detail)
5. Prompt 4: Scheme Matching (Another novel feature)

---

*These prompts are optimized for AI image generators. Copy-paste directly and they will create professional diagrams for your hackathon presentation.*