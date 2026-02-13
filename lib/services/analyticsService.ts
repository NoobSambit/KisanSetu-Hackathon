/**
 * Analytics Service (Phase 3)
 *
 * Tracks user events, page views, feature usage, and errors
 * Foundation for product analytics and insights
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';

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
 * Log an analytics event to Firestore
 */
export async function logEvent(event: AnalyticsEvent): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'analyticsEvents'), {
      ...event,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.error('Analytics logging error:', error);
  }
}

// Alias for backward compatibility
export const trackEvent = logEvent;

/**
 * Log page view
 */
export async function logPageView(
  page: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  await logEvent({
    eventType: 'page_view',
    page,
    userId,
    sessionId,
  });
}

/**
 * Log feature usage
 */
export async function logFeatureUsage(
  feature: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logEvent({
    eventType: 'feature_usage',
    feature,
    userId,
    metadata,
  });
}

/**
 * Log error
 */
export async function logError(event: ErrorEvent): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'errorLogs'), {
      ...event,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging failed:', error);
  }
}

/**
 * Log AI query
 */
export async function logAIQuery(
  userId: string,
  question: string,
  responseTime?: number
): Promise<void> {
  await logEvent({
    eventType: 'ai_query',
    userId,
    metadata: {
      questionLength: question.length,
      responseTime,
    },
  });
}

/**
 * Log disease detection usage
 */
export async function logDiseaseDetection(
  userId?: string,
  prediction?: string,
  confidence?: number
): Promise<void> {
  await logEvent({
    eventType: 'disease_detection',
    userId,
    metadata: {
      prediction,
      confidence,
    },
  });
}

/**
 * Log weather check
 */
export async function logWeatherCheck(
  userId?: string,
  location?: string
): Promise<void> {
  await logEvent({
    eventType: 'weather_check',
    userId,
    metadata: {
      location,
    },
  });
}

/**
 * Log price check
 */
export async function logPriceCheck(
  userId?: string,
  crop?: string,
  market?: string
): Promise<void> {
  await logEvent({
    eventType: 'price_check',
    userId,
    metadata: {
      crop,
      market,
    },
  });
}

/**
 * Get event counts by type (for admin dashboard in future)
 */
export async function getEventCounts(
  eventType: EventType,
  userId?: string
): Promise<number> {
  if (!db) return 0;

  try {
    const constraints = [where('eventType', '==', eventType)];

    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    const q = query(collection(db, 'analyticsEvents'), ...constraints);

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching event counts:', error);
    return 0;
  }
}

/**
 * Get recent events for a user
 */
export async function getUserRecentEvents(
  userId: string,
  limitCount: number = 20
): Promise<AnalyticsEvent[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'analyticsEvents'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const events: AnalyticsEvent[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        eventType: data.eventType,
        userId: data.userId,
        page: data.page,
        feature: data.feature,
        metadata: data.metadata,
        timestamp: data.timestamp?.toDate(),
      });
    });

    return events;
  } catch (error) {
    console.error('Error fetching user events:', error);
    return [];
  }
}

/**
 * Get error summary (for monitoring)
 */
export async function getRecentErrors(
  limitCount: number = 50
): Promise<ErrorEvent[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'errorLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const errors: ErrorEvent[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      errors.push({
        errorType: data.errorType,
        errorMessage: data.errorMessage,
        errorStack: data.errorStack,
        userId: data.userId,
        page: data.page,
        metadata: data.metadata,
      });
    });

    return errors;
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return [];
  }
}

/**
 * Client-side analytics helper (to be imported in pages)
 */
export class Analytics {
  private userId?: string;
  private sessionId: string;

  constructor(userId?: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async trackPageView(page: string): Promise<void> {
    await logPageView(page, this.userId, this.sessionId);
  }

  async trackFeature(feature: string, metadata?: Record<string, any>): Promise<void> {
    await logFeatureUsage(feature, this.userId, metadata);
  }

  async trackError(errorType: string, errorMessage: string, page?: string): Promise<void> {
    await logError({
      errorType,
      errorMessage,
      userId: this.userId,
      page,
    });
  }
}
