/**
 * Firestore Service Layer
 *
 * Handles all Firestore database operations for:
 * - AI interaction logs
 * - Saved advice
 * - Dashboard statistics
 * - Farm profile and memory (Day 1)
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
  SavedAdviceDocument,
  DashboardStats,
  RecentActivity,
  FarmProfile,
  FarmInteractionMemory,
  FarmMemoryContext,
  LearnedPattern,
  AssistantModelProvider,
} from '@/types';

const AI_LOGS_COLLECTION = 'aiLogs';
const SAVED_ADVICE_COLLECTION = 'savedAdvice';
const FARM_PROFILES_COLLECTION = 'farmProfiles';
const FARM_HISTORY_COLLECTION = 'farmHistory';
const LEARNED_PATTERNS_COLLECTION = 'learnedPatterns';

const CROP_KEYWORDS = [
  'wheat',
  'rice',
  'paddy',
  'cotton',
  'tomato',
  'onion',
  'potato',
  'maize',
  'sugarcane',
  'soybean',
  'mustard',
  'chilli',
  'bajra',
  'groundnut',
  'millet',
];

const CONCERN_KEYWORDS: Record<string, string[]> = {
  disease: ['disease', 'blight', 'fungus', 'infect', 'leaf spot', 'rot'],
  pest: ['pest', 'insect', 'aphid', 'borer', 'worm'],
  irrigation: ['irrigation', 'water', 'drip', 'sprinkler', 'canal', 'drought'],
  weather: ['weather', 'rain', 'monsoon', 'heat', 'temperature', 'humidity'],
  market: ['price', 'market', 'mandi', 'sell', 'rate'],
  scheme: ['scheme', 'subsidy', 'insurance', 'loan', 'pm-kisan', 'pmfby'],
  fertilizer: ['fertilizer', 'urea', 'dap', 'npk', 'nutrient'],
};

interface AIInteractionLLMMetadata {
  provider: AssistantModelProvider;
  model: string;
  latencyMs: number;
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function extractMentions(text: string, keywords: string[]): string[] {
  const normalized = normalizeText(text);
  return keywords.filter((keyword) => normalized.includes(keyword));
}

function extractConcernTags(text: string): string[] {
  const normalized = normalizeText(text);
  const matched: string[] = [];

  Object.entries(CONCERN_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      matched.push(tag);
    }
  });

  return matched;
}

function summarizeFarmProfile(profile: FarmProfile | null): string[] {
  if (!profile) return [];

  const summary: string[] = [
    `Farmer location: ${profile.location.district}, ${profile.location.state}`,
    `Land: ${profile.landSize} ${profile.landUnit}, soil type: ${profile.soilType}`,
    `Irrigation: ${profile.irrigationType}${profile.waterSource ? ` (${profile.waterSource})` : ''}`,
  ];

  if (profile.primaryCrops.length > 0) {
    summary.push(`Primary crops: ${profile.primaryCrops.join(', ')}`);
  }

  if (profile.riskPreference) {
    summary.push(`Risk preference: ${profile.riskPreference}`);
  }

  if (profile.historicalChallenges && profile.historicalChallenges.length > 0) {
    summary.push(`Past challenges: ${profile.historicalChallenges.join(', ')}`);
  }

  return summary;
}

function confidenceFromFrequency(frequency: number): number {
  return Math.min(0.95, Number((0.45 + frequency * 0.1).toFixed(2)));
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, itemValue]) => {
      if (itemValue !== undefined) {
        output[key] = stripUndefined(itemValue);
      }
    });

    return output as T;
  }

  return value;
}

function encodePolygonCoordinates(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function decodePolygonCoordinates(value: unknown): number[][][] | undefined {
  if (Array.isArray(value)) {
    return value as number[][][];
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as number[][][];
    }
  } catch (error) {
    console.error('Failed to decode landGeometry coordinates:', error);
  }

  return undefined;
}

function buildPatterns(
  profile: FarmProfile | null,
  memories: FarmInteractionMemory[]
): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];
  const now = new Date();

  if (profile && profile.primaryCrops.length > 0) {
    patterns.push({
      summary: `Farmer mainly focuses on ${profile.primaryCrops.slice(0, 3).join(', ')} crops.`,
      category: 'crop',
      frequency: profile.primaryCrops.length,
      confidence: 0.85,
      lastObserved: now,
    });
  }

  const cropCounts = new Map<string, number>();
  const concernCounts = new Map<string, number>();

  memories.forEach((memory) => {
    memory.detectedCrops.forEach((crop) => {
      cropCounts.set(crop, (cropCounts.get(crop) || 0) + 1);
    });

    memory.detectedConcerns.forEach((concern) => {
      concernCounts.set(concern, (concernCounts.get(concern) || 0) + 1);
    });
  });

  const topCrop = [...cropCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCrop && topCrop[1] >= 2) {
    patterns.push({
      summary: `Most frequent crop discussed is ${topCrop[0]} (${topCrop[1]} recent interactions).`,
      category: 'crop',
      frequency: topCrop[1],
      confidence: confidenceFromFrequency(topCrop[1]),
      lastObserved: now,
    });
  }

  const topConcern = [...concernCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topConcern && topConcern[1] >= 2) {
    const mappedCategory =
      topConcern[0] === 'disease' || topConcern[0] === 'pest'
        ? 'disease'
        : topConcern[0] === 'irrigation'
          ? 'irrigation'
          : topConcern[0] === 'market'
            ? 'market'
            : topConcern[0] === 'weather'
              ? 'weather'
              : topConcern[0] === 'scheme'
                ? 'scheme'
                : 'general';

    patterns.push({
      summary: `Frequent concern area: ${topConcern[0]} (${topConcern[1]} recent interactions).`,
      category: mappedCategory,
      frequency: topConcern[1],
      confidence: confidenceFromFrequency(topConcern[1]),
      lastObserved: now,
    });
  }

  return patterns.slice(0, 5);
}

/**
 * Log an AI interaction to Firestore
 */
export async function logAIInteraction(
  userId: string,
  userMessage: string,
  aiMessage: string,
  sessionId?: string,
  conversationContext?: string[],
  llmMeta?: AIInteractionLLMMetadata
): Promise<void> {
  try {
    if (!db) return;

    await addDoc(collection(db, AI_LOGS_COLLECTION), {
      userId,
      userMessage,
      aiMessage,
      timestamp: serverTimestamp(),
      sessionId: sessionId || null,
      conversationContext: conversationContext || [],
      llmProvider: llmMeta?.provider || null,
      llmModel: llmMeta?.model || null,
      responseLatencyMs: llmMeta?.latencyMs ?? null,
    });
  } catch (error) {
    console.error('Error logging AI interaction:', error);
  }
}

/**
 * Save an AI response for later reference
 */
export async function saveAdvice(
  userId: string,
  question: string,
  answer: string,
  category?: string
): Promise<{ success: boolean; error: string | null; id?: string }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    const docRef = await addDoc(collection(db, SAVED_ADVICE_COLLECTION), {
      userId,
      question,
      answer,
      savedAt: serverTimestamp(),
      category: category || null,
    });

    return { success: true, error: null, id: docRef.id };
  } catch (error) {
    console.error('Error saving advice:', error);
    return { success: false, error: 'Failed to save advice. Please try again.' };
  }
}

/**
 * Get all saved advice for a user
 */
export async function getSavedAdvice(userId: string): Promise<SavedAdviceDocument[]> {
  try {
    if (!db) return [];

    const q = query(
      collection(db, SAVED_ADVICE_COLLECTION),
      where('userId', '==', userId),
      limit(250)
    );

    const querySnapshot = await getDocs(q);
    const savedAdvice: SavedAdviceDocument[] = [];

    querySnapshot.forEach((savedDoc) => {
      const data = savedDoc.data();
      savedAdvice.push({
        id: savedDoc.id,
        userId: data.userId,
        question: data.question,
        answer: data.answer,
        savedAt: toDate(data.savedAt),
        category: data.category,
      });
    });

    savedAdvice.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
    return savedAdvice;
  } catch (error) {
    console.error('Error fetching saved advice:', error);
    return [];
  }
}

/**
 * Delete a saved advice item
 */
export async function deleteSavedAdvice(
  adviceId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    await deleteDoc(doc(db, SAVED_ADVICE_COLLECTION, adviceId));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting saved advice:', error);
    return { success: false, error: 'Failed to delete advice. Please try again.' };
  }
}

/**
 * Get recent AI interactions for a user
 */
export async function getRecentActivities(
  userId: string,
  limitCount: number = 10
): Promise<RecentActivity[]> {
  try {
    if (!db) return [];

    const q = query(
      collection(db, AI_LOGS_COLLECTION),
      where('userId', '==', userId),
      limit(Math.max(25, limitCount * 4))
    );

    const querySnapshot = await getDocs(q);
    const activities: RecentActivity[] = [];

    querySnapshot.forEach((activityDoc) => {
      const data = activityDoc.data();
      activities.push({
        id: activityDoc.id,
        type: 'query',
        message: data.userMessage,
        timestamp: toDate(data.timestamp),
        preview: `${(data.aiMessage || '').substring(0, 100)}...`,
      });
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    if (!db) {
      return {
        totalQuestions: 0,
        totalInteractions: 0,
        savedAdviceCount: 0,
        lastActivityTime: null,
      };
    }

    const aiLogsQuery = query(collection(db, AI_LOGS_COLLECTION), where('userId', '==', userId));
    const aiLogsSnapshot = await getDocs(aiLogsQuery);
    const totalInteractions = aiLogsSnapshot.size;

    const savedAdviceQuery = query(
      collection(db, SAVED_ADVICE_COLLECTION),
      where('userId', '==', userId)
    );
    const savedAdviceSnapshot = await getDocs(savedAdviceQuery);
    const savedAdviceCount = savedAdviceSnapshot.size;

    let lastActivityTime: Date | null = null;
    aiLogsSnapshot.forEach((logDoc) => {
      const logDate = toDate(logDoc.data().timestamp);
      if (!lastActivityTime || logDate.getTime() > lastActivityTime.getTime()) {
        lastActivityTime = logDate;
      }
    });

    return {
      totalQuestions: totalInteractions,
      totalInteractions,
      savedAdviceCount,
      lastActivityTime,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalQuestions: 0,
      totalInteractions: 0,
      savedAdviceCount: 0,
      lastActivityTime: null,
    };
  }
}

/**
 * Get conversation context for AI (last N messages)
 */
export async function getConversationContext(
  userId: string,
  sessionId: string,
  contextLimit: number = 5
): Promise<string[]> {
  try {
    if (!db) return [];

    const q = query(
      collection(db, AI_LOGS_COLLECTION),
      where('userId', '==', userId),
      limit(120)
    );

    const querySnapshot = await getDocs(q);
    const context: string[] = [];

    const sessionDocs = querySnapshot.docs
      .filter((contextDoc) => contextDoc.data().sessionId === sessionId)
      .sort((a, b) => toDate(a.data().timestamp).getTime() - toDate(b.data().timestamp).getTime())
      .slice(-contextLimit);

    sessionDocs.forEach((contextDoc) => {
      const data = contextDoc.data();
      context.push(`User: ${data.userMessage}`);
      context.push(`Assistant: ${data.aiMessage}`);
    });

    return context;
  } catch (error) {
    console.error('Error fetching conversation context:', error);
    return [];
  }
}

/**
 * Create or update farm profile for a user
 */
export async function saveFarmProfile(
  userId: string,
  profile: Omit<FarmProfile, 'userId' | 'createdAt' | 'lastUpdated'>
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    const farmProfileRef = doc(db, FARM_PROFILES_COLLECTION, userId);

    const payload = stripUndefined({
      ...profile,
      location: {
        state: profile.location.state,
        district: profile.location.district,
        village: profile.location.village,
        coordinates:
          profile.location.coordinates &&
          profile.location.coordinates.lat !== undefined &&
          profile.location.coordinates.lon !== undefined
            ? {
                lat: profile.location.coordinates.lat,
                lon: profile.location.coordinates.lon,
              }
            : undefined,
        landGeometry: profile.location.landGeometry
          ? {
              type: profile.location.landGeometry.type,
              coordinatesEncoded: encodePolygonCoordinates(profile.location.landGeometry.coordinates),
              bbox: profile.location.landGeometry.bbox,
              centerPoint: profile.location.landGeometry.centerPoint,
              calculatedAreaAcres: profile.location.landGeometry.calculatedAreaAcres,
              selectedAt: profile.location.landGeometry.selectedAt,
            }
          : undefined,
      },
      userId,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    await setDoc(farmProfileRef, payload, { merge: true });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving farm profile:', error);
    return { success: false, error: 'Failed to save farm profile' };
  }
}

/**
 * Get farm profile for a user
 */
export async function getFarmProfile(userId: string): Promise<FarmProfile | null> {
  try {
    if (!db) return null;

    const farmProfileRef = doc(db, FARM_PROFILES_COLLECTION, userId);
    const profileDoc = await getDoc(farmProfileRef);

    if (!profileDoc.exists()) return null;

    const data = profileDoc.data();
    const rawGeometry = data.location?.landGeometry;
    const decodedCoordinates = decodePolygonCoordinates(
      rawGeometry?.coordinatesEncoded ?? rawGeometry?.coordinates
    );
    const normalizedGeometry =
      rawGeometry &&
      Array.isArray(rawGeometry.bbox) &&
      rawGeometry.bbox.length === 4 &&
      rawGeometry.centerPoint &&
      Number.isFinite(rawGeometry.centerPoint.lat) &&
      Number.isFinite(rawGeometry.centerPoint.lon) &&
      Number.isFinite(rawGeometry.calculatedAreaAcres)
        ? {
            type: 'Polygon' as const,
            coordinates: decodedCoordinates || [],
            bbox: rawGeometry.bbox as [number, number, number, number],
            centerPoint: {
              lat: Number(rawGeometry.centerPoint.lat),
              lon: Number(rawGeometry.centerPoint.lon),
            },
            calculatedAreaAcres: Number(rawGeometry.calculatedAreaAcres),
            selectedAt:
              typeof rawGeometry.selectedAt === 'string'
                ? rawGeometry.selectedAt
                : new Date().toISOString(),
          }
        : undefined;

    return {
      userId: data.userId,
      farmerName: data.farmerName,
      preferredLanguage: data.preferredLanguage,
      landSize: data.landSize,
      landUnit: data.landUnit,
      soilType: data.soilType,
      irrigationType: data.irrigationType,
      waterSource: data.waterSource,
      location: {
        state: data.location?.state || '',
        district: data.location?.district || '',
        village: data.location?.village,
        coordinates: data.location?.coordinates,
        landGeometry: normalizedGeometry,
      },
      primaryCrops: Array.isArray(data.primaryCrops) ? data.primaryCrops : [],
      annualBudget: data.annualBudget,
      riskPreference: data.riskPreference,
      historicalChallenges: Array.isArray(data.historicalChallenges)
        ? data.historicalChallenges
        : [],
      notes: data.notes,
      createdAt: toDate(data.createdAt),
      lastUpdated: toDate(data.lastUpdated),
    };
  } catch (error) {
    console.error('Error fetching farm profile:', error);
    return null;
  }
}

/**
 * Save memory from an AI interaction
 */
export async function saveFarmInteractionMemory(
  userId: string,
  question: string,
  answer: string,
  sessionId?: string
): Promise<void> {
  try {
    if (!db) return;

    const mergedText = `${question} ${answer}`;
    const detectedCrops = extractMentions(mergedText, CROP_KEYWORDS);
    const detectedConcerns = extractConcernTags(mergedText);

    const tags = [...new Set([...detectedCrops, ...detectedConcerns])];

    await addDoc(collection(db, FARM_HISTORY_COLLECTION), {
      userId,
      question,
      answer,
      tags,
      detectedCrops,
      detectedConcerns,
      sessionId: sessionId || null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving farm interaction memory:', error);
  }
}

/**
 * Refresh pattern extraction from profile + recent interactions
 */
export async function refreshLearnedPatterns(userId: string): Promise<LearnedPattern[]> {
  try {
    if (!db) return [];

    const profile = await getFarmProfile(userId);

    const historyQuery = query(
      collection(db, FARM_HISTORY_COLLECTION),
      where('userId', '==', userId),
      limit(120)
    );

    const historySnapshot = await getDocs(historyQuery);
    const memories: FarmInteractionMemory[] = historySnapshot.docs
      .map((memoryDoc) => {
        const data = memoryDoc.data();
        return {
          id: memoryDoc.id,
          userId: data.userId,
          question: data.question || '',
          answer: data.answer || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          detectedCrops: Array.isArray(data.detectedCrops) ? data.detectedCrops : [],
          detectedConcerns: Array.isArray(data.detectedConcerns) ? data.detectedConcerns : [],
          sessionId: data.sessionId || undefined,
          timestamp: toDate(data.timestamp),
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 40);

    const patterns = buildPatterns(profile, memories);

    await setDoc(doc(db, LEARNED_PATTERNS_COLLECTION, userId), {
      userId,
      patterns: patterns.map((pattern) => ({
        ...pattern,
        lastObserved: pattern.lastObserved,
      })),
      sourceSampleSize: memories.length,
      updatedAt: serverTimestamp(),
    });

    return patterns;
  } catch (error) {
    console.error('Error refreshing learned patterns:', error);
    return [];
  }
}

/**
 * Get learned patterns for a user
 */
export async function getLearnedPatterns(
  userId: string,
  limitCount: number = 5
): Promise<LearnedPattern[]> {
  try {
    if (!db) return [];

    const patternDocRef = doc(db, LEARNED_PATTERNS_COLLECTION, userId);
    const patternDoc = await getDoc(patternDocRef);

    if (!patternDoc.exists()) {
      const generatedPatterns = await refreshLearnedPatterns(userId);
      return generatedPatterns.slice(0, limitCount);
    }

    const data = patternDoc.data();
    const patterns = Array.isArray(data.patterns) ? data.patterns : [];

    return patterns.slice(0, limitCount).map((pattern: any) => ({
      summary: pattern.summary,
      category: pattern.category || 'general',
      frequency: pattern.frequency || 1,
      confidence: pattern.confidence || 0.5,
      lastObserved: toDate(pattern.lastObserved),
    }));
  } catch (error) {
    console.error('Error fetching learned patterns:', error);
    return [];
  }
}

/**
 * Build prompt context from farm profile + learned patterns
 */
export async function buildFarmMemoryContext(userId: string): Promise<FarmMemoryContext> {
  try {
    const [profile, patterns] = await Promise.all([
      getFarmProfile(userId),
      getLearnedPatterns(userId, 5),
    ]);

    const profileSummary = summarizeFarmProfile(profile);
    const patternSummary = patterns.map(
      (pattern) => `${pattern.summary} (confidence ${Math.round(pattern.confidence * 100)}%)`
    );

    const promptContext: string[] = [];

    if (profileSummary.length > 0) {
      promptContext.push('Farm profile:');
      profileSummary.forEach((line) => promptContext.push(`- ${line}`));
    }

    if (patternSummary.length > 0) {
      promptContext.push('Learned patterns:');
      patternSummary.forEach((line) => promptContext.push(`- ${line}`));
    }

    return {
      profileSummary,
      patternSummary,
      promptContext,
    };
  } catch (error) {
    console.error('Error building farm memory context:', error);
    return {
      profileSummary: [],
      patternSummary: [],
      promptContext: [],
    };
  }
}
