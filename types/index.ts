/**
 * Shared Type Definitions for KisanSetu
 *
 * This file contains all shared TypeScript interfaces and types
 * used throughout the application.
 */

/**
 * Represents a single message in the chat interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Request payload for the AI query API
 */
export type AssistantModelProvider = 'ollama' | 'groq';

export interface AIQueryRequest {
  question: string;
  userId?: string | null;
  sessionId?: string;
  language?: string;
  provider?: AssistantModelProvider;
}

/**
 * Response from the AI query API
 */
export interface AIQueryResponse {
  success: boolean;
  answer: string | null;
  error: string | null;
  meta?: {
    provider: AssistantModelProvider;
    model: string;
    latencyMs: number;
  };
}

/**
 * Structure for logging chat interactions to Firestore
 */
export interface ChatLogDocument {
  userMessage: string;
  aiMessage: string;
  timestamp: Date;
  userId: string | null; // Will be null until auth is implemented
  sessionId?: string; // Optional session tracking
}

/**
 * Structure for knowledge/resource items
 * (Future: will be fetched from Firestore)
 */
export interface ResourceItem {
  id: string;
  category: ResourceCategory;
  title: string;
  description: string;
  content: string;
  icon?: string;
  lastUpdated: Date;
}

/**
 * Categories for resources
 */
export type ResourceCategory =
  | 'crop-basics'
  | 'soil-fertilizers'
  | 'government-schemes'
  | 'safety-practices'
  | 'irrigation'
  | 'pest-management';

/**
 * Feature card data for the home page
 */
export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  link?: string;
}

/**
 * User data structure (Phase 2)
 * Represents an authenticated user in the system
 */
export interface User {
  uid: string;
  email: string;
  name?: string;
  createdAt: Date;
  lastLogin?: Date;
}

/**
 * Saved advice document structure (Phase 2)
 * Stores AI responses that users have bookmarked
 */
export interface SavedAdviceDocument {
  id?: string;
  userId: string;
  question: string;
  answer: string;
  savedAt: Date;
  category?: string;
}

/**
 * AI log document structure (Phase 2 - Enhanced)
 * Tracks all AI interactions with full user context
 */
export interface AILogDocument {
  id?: string;
  userId: string;
  userMessage: string;
  aiMessage: string;
  timestamp: Date;
  sessionId?: string;
  conversationContext?: string[]; // Previous messages for context
}

/**
 * Dashboard statistics (Phase 2)
 */
export interface DashboardStats {
  totalQuestions: number;
  totalInteractions: number;
  savedAdviceCount: number;
  lastActivityTime: Date | null;
}

/**
 * Recent activity item for dashboard (Phase 2)
 */
export interface RecentActivity {
  id: string;
  type: 'query' | 'saved';
  message: string;
  timestamp: Date;
  preview?: string;
}

/**
 * ==========================================
 * DAY 1: Farm Profile and Memory Types
 * ==========================================
 */

export type LandUnit = 'acres' | 'hectares' | 'bigha';

export type IrrigationType =
  | 'rainfed'
  | 'drip'
  | 'sprinkler'
  | 'canal'
  | 'mixed'
  | 'none';

export type RiskPreference = 'low' | 'medium' | 'high';

export interface FarmLocation {
  state: string;
  district: string;
  village?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  landGeometry?: {
    type: 'Polygon';
    coordinates: number[][][];
    bbox: [number, number, number, number];
    centerPoint: {
      lat: number;
      lon: number;
    };
    calculatedAreaAcres: number;
    selectedAt: string;
  };
}

export interface FarmProfile {
  userId: string;
  farmerName?: string;
  preferredLanguage?: string;
  landSize: number;
  landUnit: LandUnit;
  soilType: string;
  irrigationType: IrrigationType;
  waterSource?: string;
  location: FarmLocation;
  primaryCrops: string[];
  annualBudget?: number;
  riskPreference?: RiskPreference;
  historicalChallenges?: string[];
  notes?: string;
  createdAt?: Date;
  lastUpdated: Date;
}

export interface FarmInteractionMemory {
  id?: string;
  userId: string;
  question: string;
  answer: string;
  tags: string[];
  detectedCrops: string[];
  detectedConcerns: string[];
  sessionId?: string;
  timestamp: Date;
}

export interface LearnedPattern {
  summary: string;
  category: 'crop' | 'disease' | 'irrigation' | 'market' | 'weather' | 'scheme' | 'general';
  frequency: number;
  confidence: number;
  lastObserved: Date;
}

export interface LearnedPatternDocument {
  userId: string;
  patterns: LearnedPattern[];
  sourceSampleSize: number;
  updatedAt: Date;
}

export interface FarmMemoryContext {
  profileSummary: string[];
  patternSummary: string[];
  promptContext: string[];
}

/**
 * ==========================================
 * DAY 2: Scheme Matcher + Satellite Baseline
 * ==========================================
 */

export type SchemeAuthority = 'central' | 'state' | 'hybrid';
export type SchemeConfidenceTag = 'high' | 'medium' | 'low';
export type SchemeEffortLevel = 'low' | 'medium' | 'high';
export type SchemeCashImpactWindow = 'immediate' | 'seasonal' | 'annual';

export type SchemeEligibilityInputKey =
  | 'location'
  | 'farm_size'
  | 'crop_type'
  | 'irrigation'
  | 'budget'
  | 'risk_preference';

export interface SchemeEligibilityRuleSet {
  states?: string[];
  districts?: string[];
  minLandSizeAcres?: number;
  maxLandSizeAcres?: number;
  cropIncludes?: string[];
  cropExcludes?: string[];
  irrigationIncludes?: IrrigationType[];
  irrigationExcludes?: IrrigationType[];
  budgetCeilingINR?: number;
  budgetFloorINR?: number;
  preferredRiskProfiles?: RiskPreference[];
}

export interface SchemeCatalogEntry {
  schemeId: string;
  schemeName: string;
  authority: SchemeAuthority;
  authorityLabel: string;
  stateScope: string[];
  eligibilityInputs: SchemeEligibilityInputKey[];
  eligibilityRules: SchemeEligibilityRuleSet;
  benefits: string[];
  deadlines: string;
  documentsRequired: string[];
  actionSteps: string[];
  officialLink: string;
  sourceUrl: string;
  sourceLastCheckedAt: string;
  confidenceTag: SchemeConfidenceTag;
  estimatedEffort: SchemeEffortLevel;
  cashImpactWindow: SchemeCashImpactWindow;
  tags: string[];
}

export type SchemeReasonType = 'match' | 'mismatch' | 'unknown' | 'info';

export interface SchemeEligibilityReason {
  code: string;
  type: SchemeReasonType;
  message: string;
  field?: SchemeEligibilityInputKey | 'documents' | 'deadline' | 'general';
  weight?: number;
}

export interface MissingEligibilityInput {
  key: SchemeEligibilityInputKey;
  prompt: string;
  priority: 'high' | 'medium' | 'low';
}

export interface EligibilityDelta {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export type SchemeRecommendationStatus =
  | 'eligible'
  | 'partially_eligible'
  | 'insufficient_data'
  | 'not_eligible';

export interface SchemeRecommendation {
  schemeId: string;
  schemeName: string;
  authorityLabel: string;
  officialLink: string;
  score: number;
  status: SchemeRecommendationStatus;
  confidenceTag: SchemeConfidenceTag;
  reasons: SchemeEligibilityReason[];
  missingInputs: MissingEligibilityInput[];
  eligibilityDelta: EligibilityDelta[];
  documentsRequired: string[];
  actionSteps: string[];
  benefits: string[];
  deadlines: string;
  estimatedEffort: SchemeEffortLevel;
  cashImpactWindow: SchemeCashImpactWindow;
  matchedFields: SchemeEligibilityInputKey[];
  unmetFields: SchemeEligibilityInputKey[];
}

export interface SchemeRecommendationSnapshot {
  id?: string;
  userId: string;
  profileCompleteness: number;
  generatedAt: Date;
  recommendations: SchemeRecommendation[];
}

export interface SchemeUserState {
  id?: string;
  userId: string;
  schemeId: string;
  saved: boolean;
  checklist: Record<string, boolean>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemeDuplicatePair {
  schemeAId: string;
  schemeBId: string;
  overlapScore: number;
  reason: string;
}

export interface SatelliteAOI {
  aoiId: string;
  name: string;
  bbox: [number, number, number, number];
}

export type SatelliteAoiSource =
  | 'profile_land_geometry'
  | 'query_bbox'
  | 'demo_fallback';

export type SatellitePrecisionMode = 'high_accuracy' | 'estimated';

export interface SatelliteSceneMetadata {
  sceneId: string;
  capturedAt: string;
  cloudCover: number;
  tileId: string;
  collection: string;
  bbox: [number, number, number, number] | null;
  quicklookUrl?: string;
}

export interface SatelliteIngestRequest {
  aoi: SatelliteAOI;
  startDate: string;
  endDate: string;
  maxCloudCover: number;
  maxResults: number;
}

export interface SatelliteIngestResult {
  success: boolean;
  dataSource: 'live_cdse' | 'fallback_sample';
  scenes: SatelliteSceneMetadata[];
  metadata: {
    provider: string;
    collection: string;
    ingestedAt: string;
    aoi: SatelliteAOI;
    maxCloudCover: number;
    requestedRange: {
      startDate: string;
      endDate: string;
    };
  };
  error?: string | null;
}

export interface SatelliteIngestSnapshot {
  id?: string;
  userId?: string;
  aoi: SatelliteAOI;
  provider: string;
  collection: string;
  dataSource: 'live_cdse' | 'fallback_sample';
  sceneCount: number;
  scenes: SatelliteSceneMetadata[];
  maxCloudCover: number;
  requestedRange: {
    startDate: string;
    endDate: string;
  };
  createdAt: Date;
}

export type SatelliteStressType =
  | 'water_stress'
  | 'nutrient_stress'
  | 'pest_or_disease_risk'
  | 'cloud_uncertainty'
  | 'growth_recovery';

export interface SatelliteStressSignal {
  type: SatelliteStressType;
  confidence: number;
  message: string;
}

export interface SatelliteActionRecommendation {
  id: string;
  title: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface SatelliteZoneHealth {
  zoneId: string;
  zoneLabel: string;
  normalizedHealthScore: number;
  ndviEstimate: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'watch' | 'critical';
}

export interface SatelliteHealthAlert {
  severity: 'info' | 'warning' | 'critical';
  code: string;
  title: string;
  message: string;
}

export interface SatelliteHealthZonePolygon {
  zoneId: string;
  zoneLabel: string;
  status: SatelliteZoneHealth['status'];
  normalizedHealthScore: number;
  trend: SatelliteZoneHealth['trend'];
  coordinates: number[][][];
}

export interface SatelliteHealthMapLegendItem {
  key: 'healthy' | 'watch' | 'critical';
  label: string;
  scoreMin: number;
  scoreMax: number;
  color: string;
}

export interface SatelliteHealthMapOverlay {
  strategy: 'estimated_zones' | 'ndvi_raster';
  aoiSource: SatelliteAoiSource;
  farmBoundary: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  zonePolygons: SatelliteHealthZonePolygon[];
  sceneFootprintBbox?: [number, number, number, number];
  imageDataUrl?: string;
  imageBbox?: [number, number, number, number];
  legend: SatelliteHealthMapLegendItem[];
  disclaimer: string;
}

export interface SatelliteHealthCacheStatus {
  hit: boolean;
  key: string;
  expiresAt: string | null;
  forced: boolean;
  staleFallbackUsed: boolean;
}

export interface SatelliteHealthSourceScene {
  sceneId: string | null;
  capturedAt: string | null;
}

export interface SatelliteHealthResponseMetadata {
  aoi: SatelliteAOI;
  aoiSource: SatelliteAoiSource;
  geometryUsed: boolean;
  currentRequestedRange: {
    startDate: string;
    endDate: string;
  };
  baselineRequestedRange: {
    startDate: string;
    endDate: string;
  };
  currentSceneCount: number;
  baselineSceneCount: number;
  precisionMode: SatellitePrecisionMode;
  sourceScene: SatelliteHealthSourceScene;
  cache: SatelliteHealthCacheStatus;
}

export interface SatelliteHealthInsight {
  generatedAt: string;
  dataSource: 'live_cdse' | 'fallback_sample';
  confidence: number;
  scoreLabel: 'excellent' | 'good' | 'watch' | 'critical';
  normalizedHealthScore: number;
  baselineScore: number;
  scoreDelta: number;
  trend: 'up' | 'down' | 'stable';
  ndviEstimate: number;
  baselineNdviEstimate: number;
  summaryCardText: string;
  uncertaintyNote?: string;
  currentScene: SatelliteSceneMetadata | null;
  baselineSceneCount: number;
  zones: SatelliteZoneHealth[];
  stressSignals: SatelliteStressSignal[];
  recommendations: SatelliteActionRecommendation[];
  alerts: SatelliteHealthAlert[];
  mapOverlay?: SatelliteHealthMapOverlay;
  highAccuracyUnavailableReason?: string;
}

export interface SatelliteHealthCacheEntry {
  id?: string;
  cacheKey: string;
  userId?: string;
  aoi: SatelliteAOI;
  precisionMode: SatellitePrecisionMode;
  dataSource: 'live_cdse' | 'fallback_sample';
  sourceSceneId?: string | null;
  sourceCapturedAt?: string | null;
  cachedAt: string;
  expiresAt: string;
  healthPayload: SatelliteHealthInsight;
  metadata: SatelliteHealthResponseMetadata;
}

/**
 * ==========================================
 * PHASE 3: Advanced Features Type Definitions
 * ==========================================
 */

/**
 * Disease Detection Types
 */
export interface DiseasePrediction {
  prediction: string;
  confidence: number;
  treatment: string;
  scientificName?: string;
  severity?: 'low' | 'medium' | 'high';
  preventionTips?: string[];
}

export interface DiseaseDetectionRequest {
  imageData: string; // Base64 encoded image
  userId?: string;
}

export interface DiseaseDetectionResponse {
  success: boolean;
  prediction?: string;
  confidence?: number;
  treatment?: string;
  error?: string | null;
}

export interface DiseaseLog {
  id?: string;
  userId?: string;
  prediction: string;
  confidence: number;
  timestamp: Date;
  imageMetadata?: {
    size: number;
    type: string;
  };
}

/**
 * Weather Intelligence Types
 */
export interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  description: string;
  icon: string;
  alerts?: WeatherAlert[];
  forecast?: DailyForecast[];
  farmingAdvice?: string;
}

export interface WeatherAlert {
  type: 'extreme-heat' | 'heavy-rain' | 'frost' | 'wind' | 'general';
  severity: 'low' | 'medium' | 'high';
  message: string;
  advice: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  description: string;
  icon: string;
}

export interface WeatherRequest {
  city?: string;
  lat?: number;
  lon?: number;
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: string | null;
}

/**
 * Market/Mandi Price Types
 */
export interface CropPrice {
  cropName: string;
  variety?: string;
  market: string;
  state: string;
  district?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  previousPrice?: number;
}

export interface MarketData {
  market: string;
  state: string;
  district?: string;
  prices: CropPrice[];
  lastUpdated: string;
}

export interface PriceComparison {
  crop: string;
  markets: {
    name: string;
    price: number;
    distance?: string;
  }[];
  bestMarket: string;
  priceDifference: number;
}

export interface PriceRequest {
  crop?: string;
  market?: string;
  state?: string;
}

export interface PriceResponse {
  success: boolean;
  data?: CropPrice[] | MarketData;
  error?: string | null;
}

/**
 * Analytics Types
 */
export type EventType =
  | 'page_view'
  | 'feature_usage'
  | 'error'
  | 'ai_query'
  | 'disease_detection'
  | 'weather_check'
  | 'price_check'
  | 'advice_saved'
  | 'user_signup'
  | 'user_login';

export interface AnalyticsEvent {
  eventType: EventType;
  userId?: string;
  sessionId?: string;
  page?: string;
  feature?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface ErrorEvent {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  userId?: string;
  page?: string;
  metadata?: Record<string, any>;
}

/**
 * Firestore Collections (Phase 3 additions)
 */
export interface DiseasePredictionLog {
  id?: string;
  userId?: string;
  prediction: string;
  confidence: number;
  treatment: string;
  timestamp: Date;
  imageMetadata?: {
    size: number;
    type: string;
    name: string;
  };
}

export interface PriceCheckLog {
  id?: string;
  userId: string;
  crop: string;
  market?: string;
  state?: string;
  timestamp: Date;
}

/**
 * ==========================================
 * PHASE 4: Community & Advanced Features
 * ==========================================
 */

/**
 * Community Forum Types
 */
export interface CommunityPost {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  category?: 'question' | 'experience' | 'advice' | 'general';
  tags?: string[];
  likes: number;
  likedBy: string[]; // Array of user IDs who liked
  commentCount: number;
  createdAt: Date;
  updatedAt?: Date;
  moderationFlag?: boolean;
  moderationReason?: string;
}

export interface CommunityComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  likes: number;
  likedBy: string[];
  replyCount: number;
  createdAt: Date;
  updatedAt?: Date;
  moderationFlag?: boolean;
}

export interface CommunityReply {
  id?: string;
  commentId: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: Date;
  moderationFlag?: boolean;
}

/**
 * Voice AI Types
 */
export interface VoiceRecording {
  audioBlob: Blob;
  duration: number;
  timestamp: Date;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  language: string;
}

export interface VoiceSttApiResponse {
  success: boolean;
  data?: {
    transcript: string;
    confidence: number;
    provider: 'whisper_cpp' | 'browser_fallback';
    languageRequested: string;
    languageUsed: string;
    fallbackApplied: boolean;
    fallbackReason: string | null;
    guardrails: {
      maxAudioBytes: number;
      maxAudioSeconds: number;
      supportedMimeTypes: string[];
    };
  };
  error?: string | null;
}

export interface VoiceTtsApiResponse {
  success: boolean;
  data?: {
    provider: 'espeak' | 'browser_speech_fallback';
    languageRequested: string;
    languageUsed: string;
    fallbackApplied: boolean;
    fallbackReason: string | null;
    mimeType: string | null;
    audioBase64: string | null;
    text: string;
  };
  error?: string | null;
}

export interface VoiceRoundtripApiResponse {
  success: boolean;
  data?: {
    transcript: string;
    transcriptConfidence: number;
    sttProvider: 'whisper_cpp' | 'browser_fallback';
    answer: string;
    answerMeta?: AIQueryResponse['meta'];
    tts: {
      provider: 'espeak' | 'browser_speech_fallback';
      languageRequested: string;
      languageUsed: string;
      fallbackApplied: boolean;
      fallbackReason: string | null;
      mimeType: string | null;
      audioBase64: string | null;
      text: string;
    };
    warnings: string[];
  };
  error?: string | null;
}

/**
 * Crop Planning Types
 */
export interface CropPlanInputs {
  landSize: number;
  landUnit: 'acres' | 'hectares' | 'bigha';
  soilType: 'clay' | 'loamy' | 'sandy' | 'silt' | 'peaty' | 'chalky';
  season: 'kharif' | 'rabi' | 'zaid';
  location: string;
  state: string;
  irrigationAvailable: boolean;
  budget?: number;
}

export interface CropRecommendation {
  cropName: string;
  suitabilityScore: number; // 0-100
  expectedYield: string;
  investmentRequired: string;
  duration: string;
  profitPotential: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings?: string[];
}

export interface CropPlan {
  id?: string;
  userId: string;
  inputs: CropPlanInputs;
  recommendations: CropRecommendation[];
  schedule: CropSchedule;
  resourcePlan: ResourcePlan;
  aiAdvice: string;
  createdAt: Date;
  savedAt?: Date;
}

export interface CropSchedule {
  sowingPeriod: string;
  growthStages: {
    stage: string;
    duration: string;
    activities: string[];
  }[];
  harvestPeriod: string;
  totalDuration: string;
}

export interface ResourcePlan {
  seeds: { type: string; quantity: string; cost?: string }[];
  fertilizers: { type: string; quantity: string; timing: string }[];
  pesticides?: { type: string; usage: string }[];
  laborRequirement: string;
  waterRequirement: string;
  equipmentNeeded: string[];
}

/**
 * Admin Panel Types
 */
export interface UserRole {
  uid: string;
  role: 'user' | 'admin';
  permissions?: string[];
  assignedAt?: Date;
  assignedBy?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalAIQueries: number;
  flaggedContent: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

export interface ContentModeration {
  id: string;
  contentType: 'post' | 'comment' | 'reply';
  contentId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string;
  moderatedAt?: Date;
}

/**
 * Enhanced Analytics Types (Phase 4)
 */
export interface SessionAnalytics {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  interactions: number;
  featuresUsed: string[];
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
}

export interface InteractionHeatmap {
  page: string;
  element: string;
  clicks: number;
  timestamp: Date;
  userId?: string;
}

export interface FeatureUsagePath {
  userId?: string;
  sessionId: string;
  path: string[]; // Array of feature names in order
  timestamp: Date;
  conversionGoal?: string;
  goalAchieved?: boolean;
}

/**
 * Performance Optimization Types
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface DebounceConfig {
  delay: number;
  maxWait?: number;
}

/**
 * Request Types for Phase 4
 */
export interface CreatePostRequest {
  userId: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export interface CreateCommentRequest {
  postId: string;
  userId: string;
  content: string;
}

export interface CreateReplyRequest {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
}

export interface LikeRequest {
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'reply';
}

export interface CropPlanRequest {
  userId: string;
  inputs: CropPlanInputs;
}
