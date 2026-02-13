import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SatelliteHealthCacheEntry } from '@/types';

const SATELLITE_HEALTH_CACHE_COLLECTION = 'satelliteHealthCache';
const FARM_PROFILES_COLLECTION = 'farmProfiles';
const PROFILE_FALLBACK_FIELD = 'day6SatelliteHealthCache';

let canWriteSatelliteHealthCacheCollection = true;

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  return code.toLowerCase() === 'permission-denied';
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

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(0);
}

function normalizeCacheEntry(raw: Record<string, unknown>, id?: string): SatelliteHealthCacheEntry | null {
  if (!raw.cacheKey || typeof raw.cacheKey !== 'string') return null;
  if (!raw.aoi || typeof raw.aoi !== 'object') return null;
  if (!raw.healthPayload) return null;
  if (!raw.metadata) return null;

  let healthPayload: SatelliteHealthCacheEntry['healthPayload'] | null = null;
  if (typeof raw.healthPayload === 'string') {
    try {
      healthPayload = JSON.parse(raw.healthPayload) as SatelliteHealthCacheEntry['healthPayload'];
    } catch (error) {
      console.error('Failed to parse cached healthPayload JSON:', error);
      return null;
    }
  } else if (typeof raw.healthPayload === 'object') {
    healthPayload = raw.healthPayload as SatelliteHealthCacheEntry['healthPayload'];
  }

  let metadata: SatelliteHealthCacheEntry['metadata'] | null = null;
  if (typeof raw.metadata === 'string') {
    try {
      metadata = JSON.parse(raw.metadata) as SatelliteHealthCacheEntry['metadata'];
    } catch (error) {
      console.error('Failed to parse cached metadata JSON:', error);
      return null;
    }
  } else if (typeof raw.metadata === 'object') {
    metadata = raw.metadata as SatelliteHealthCacheEntry['metadata'];
  }

  if (!healthPayload || !metadata) return null;

  return {
    id,
    cacheKey: raw.cacheKey,
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    aoi: raw.aoi as SatelliteHealthCacheEntry['aoi'],
    precisionMode: raw.precisionMode === 'estimated' ? 'estimated' : 'high_accuracy',
    dataSource: raw.dataSource === 'fallback_sample' ? 'fallback_sample' : 'live_cdse',
    sourceSceneId: typeof raw.sourceSceneId === 'string' ? raw.sourceSceneId : null,
    sourceCapturedAt: typeof raw.sourceCapturedAt === 'string' ? raw.sourceCapturedAt : null,
    cachedAt: toDate(raw.cachedAt).toISOString(),
    expiresAt: toDate(raw.expiresAt).toISOString(),
    healthPayload,
    metadata,
  };
}

function serializeCacheEntryForWrite(entry: Omit<SatelliteHealthCacheEntry, 'id'>): Record<string, unknown> {
  return {
    cacheKey: entry.cacheKey,
    userId: entry.userId,
    aoi: entry.aoi,
    precisionMode: entry.precisionMode,
    dataSource: entry.dataSource,
    sourceSceneId: entry.sourceSceneId,
    sourceCapturedAt: entry.sourceCapturedAt,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
    // Firestore rejects nested arrays in objects (e.g. polygon coordinates), so store JSON strings.
    healthPayload: JSON.stringify(entry.healthPayload),
    metadata: JSON.stringify(entry.metadata),
  };
}

async function readProfileFallbackEntry(params: {
  userId?: string;
  cacheKey: string;
}): Promise<SatelliteHealthCacheEntry | null> {
  if (!db || !params.userId) return null;

  const profileDoc = await getDoc(doc(db, FARM_PROFILES_COLLECTION, params.userId));
  if (!profileDoc.exists()) return null;

  const cacheEntries = profileDoc.data()[PROFILE_FALLBACK_FIELD];
  if (!Array.isArray(cacheEntries)) return null;

  const normalized = cacheEntries
    .filter((item) => item && typeof item === 'object')
    .map((item) => normalizeCacheEntry(item as Record<string, unknown>))
    .filter((item): item is SatelliteHealthCacheEntry => item !== null)
    .filter((item) => item.cacheKey === params.cacheKey)
    .sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime());

  return normalized[0] || null;
}

export async function getSatelliteHealthCacheEntry(params: {
  userId?: string;
  cacheKey: string;
}): Promise<SatelliteHealthCacheEntry | null> {
  try {
    if (!db) return null;

    try {
      if (!canWriteSatelliteHealthCacheCollection) {
        throw { code: 'permission-denied' };
      }

      const cacheQuery = query(
        collection(db, SATELLITE_HEALTH_CACHE_COLLECTION),
        where('cacheKey', '==', params.cacheKey),
        limit(30)
      );
      const snapshot = await getDocs(cacheQuery);

      const entries = snapshot.docs
        .map((item) => normalizeCacheEntry(item.data() as Record<string, unknown>, item.id))
        .filter((item): item is SatelliteHealthCacheEntry => item !== null)
        .filter((item) => (params.userId ? item.userId === params.userId : true))
        .sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime());

      if (entries.length > 0) {
        return entries[0];
      }
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSatelliteHealthCacheCollection = false;
    }

    return readProfileFallbackEntry(params);
  } catch (error) {
    console.error('Error reading satellite health cache:', error);
    return null;
  }
}

export async function saveSatelliteHealthCacheEntry(
  entry: Omit<SatelliteHealthCacheEntry, 'id'>
): Promise<{ success: boolean; id?: string; error: string | null }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    const payload = stripUndefined({
      ...serializeCacheEntryForWrite(entry),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    try {
      if (!canWriteSatelliteHealthCacheCollection) {
        throw { code: 'permission-denied' };
      }

      const docRef = await addDoc(collection(db, SATELLITE_HEALTH_CACHE_COLLECTION), payload);
      return { success: true, id: docRef.id, error: null };
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSatelliteHealthCacheCollection = false;

      if (!entry.userId) {
        throw collectionError;
      }

      const fallbackId = `sat-health-cache-${Date.now()}`;
      await setDoc(
        doc(db, FARM_PROFILES_COLLECTION, entry.userId),
        {
          [PROFILE_FALLBACK_FIELD]: arrayUnion(
            stripUndefined({
              ...serializeCacheEntryForWrite(entry),
              id: fallbackId,
              createdAt: new Date().toISOString(),
            })
          ),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      return { success: true, id: fallbackId, error: null };
    }
  } catch (error) {
    console.error('Error saving satellite health cache entry:', error);
    return { success: false, error: 'Failed to save satellite health cache entry' };
  }
}
