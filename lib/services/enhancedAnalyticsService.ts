/**
 * Enhanced Analytics Service (Phase 4)
 *
 * Advanced analytics for:
 * - Session tracking
 * - Interaction heatmaps
 * - Feature usage paths
 * - User journey mapping
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
import { db } from '@/lib/firebase/config';

/**
 * Track session analytics
 */
export async function trackSession(sessionData: {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  pageViews: number;
  interactions: number;
  featuresUsed: string[];
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
}): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'sessionAnalytics'), {
      ...sessionData,
      startTime: serverTimestamp(),
      endTime: sessionData.endTime ? serverTimestamp() : null,
    });
  } catch (error) {
    console.error('Error tracking session:', error);
  }
}

/**
 * Track interaction heatmap
 */
export async function trackInteraction(
  page: string,
  element: string,
  userId?: string
): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'interactionHeatmaps'), {
      page,
      element,
      userId: userId || null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
}

/**
 * Track feature usage path
 */
export async function trackFeaturePath(
  sessionId: string,
  userId: string | undefined,
  featureName: string
): Promise<void> {
  if (!db) return;

  try {
    // Get existing path for session
    const pathQuery = query(
      collection(db, 'featureUsagePaths'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const pathSnapshot = await getDocs(pathQuery);

    if (pathSnapshot.empty) {
      // Create new path
      await addDoc(collection(db, 'featureUsagePaths'), {
        sessionId,
        userId: userId || null,
        path: [featureName],
        timestamp: serverTimestamp(),
      });
    } else {
      // Update existing path (would need to implement update logic)
      // For simplicity, we'll create a new entry
      await addDoc(collection(db, 'featureUsagePaths'), {
        sessionId,
        userId: userId || null,
        feature: featureName,
        timestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error tracking feature path:', error);
  }
}

/**
 * Get device type from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Get browser name
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  if (ua.indexOf('Trident') > -1) return 'IE';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';

  return 'unknown';
}

/**
 * Session manager class for client-side usage
 */
export class SessionManager {
  private sessionId: string;
  private startTime: Date;
  private pageViews: number = 0;
  private interactions: number = 0;
  private featuresUsed: Set<string> = new Set();

  constructor(userId?: string) {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = new Date();

    // Track session start
    if (typeof window !== 'undefined') {
      this.trackPageView();
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  trackPageView(): void {
    this.pageViews++;
  }

  trackInteraction(element: string): void {
    this.interactions++;

    if (typeof window !== 'undefined') {
      trackInteraction(window.location.pathname, element);
    }
  }

  trackFeature(featureName: string, userId?: string): void {
    this.featuresUsed.add(featureName);

    trackFeaturePath(this.sessionId, userId, featureName);
  }

  async endSession(userId?: string): Promise<void> {
    await trackSession({
      sessionId: this.sessionId,
      userId,
      startTime: this.startTime,
      endTime: new Date(),
      pageViews: this.pageViews,
      interactions: this.interactions,
      featuresUsed: Array.from(this.featuresUsed),
      deviceType: getDeviceType(),
      browser: getBrowserName(),
    });
  }
}
