import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  QueryConstraint,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  SatelliteIngestSnapshot,
  SchemeCatalogEntry,
  SchemeRecommendation,
  SchemeRecommendationSnapshot,
  SchemeUserState,
} from '@/types';

export const SCHEME_CATALOG_COLLECTION = 'schemeCatalog';
export const SCHEME_RECOMMENDATIONS_COLLECTION = 'schemeRecommendations';
export const SCHEME_USER_STATE_COLLECTION = 'schemeUserState';
export const SATELLITE_SNAPSHOTS_COLLECTION = 'satelliteHealthSnapshots';
const FARM_PROFILES_COLLECTION = 'farmProfiles';
const SCHEME_CATALOG_FALLBACK_DOC_ID = 'day2-catalog-seed';

let canWriteSchemeCatalog = true;
let canWriteRecommendationSnapshots = true;
let canWriteSchemeUserStateCollection = true;
let canWriteSatelliteSnapshots = true;

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
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

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  return code.toLowerCase() === 'permission-denied';
}

function readSchemeStateMapFromProfile(
  userId: string,
  rawStateMap: unknown
): Record<string, SchemeUserState> {
  if (!rawStateMap || typeof rawStateMap !== 'object' || Array.isArray(rawStateMap)) return {};

  const map: Record<string, SchemeUserState> = {};

  Object.entries(rawStateMap as Record<string, unknown>).forEach(([schemeId, rawValue]) => {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) return;

    const value = rawValue as Record<string, unknown>;

    map[schemeId] = {
      id: `${userId}__${schemeId}`,
      userId,
      schemeId,
      saved: Boolean(value.saved),
      checklist:
        value.checklist && typeof value.checklist === 'object' && !Array.isArray(value.checklist)
          ? (value.checklist as Record<string, boolean>)
          : {},
      notes: typeof value.notes === 'string' ? value.notes : undefined,
      createdAt: toDate(value.createdAt),
      updatedAt: toDate(value.updatedAt),
    };
  });

  return map;
}

async function readSatelliteHistoryFromProfile(params?: {
  userId?: string;
  aoiId?: string;
  limitCount?: number;
}): Promise<SatelliteIngestSnapshot[]> {
  if (!db || !params?.userId) return [];

  const profileDoc = await getDoc(doc(db, FARM_PROFILES_COLLECTION, params.userId));
  if (!profileDoc.exists()) return [];

  const rawSnapshots = profileDoc.data().day2SatelliteSnapshots;
  if (!Array.isArray(rawSnapshots)) return [];

  const normalized = rawSnapshots
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const data = item as Record<string, unknown>;
      return {
        id: typeof data.id === 'string' ? data.id : `profile-fallback-${index}`,
        userId: typeof data.userId === 'string' ? data.userId : params.userId,
        aoi: data.aoi as SatelliteIngestSnapshot['aoi'],
        provider: String(data.provider || ''),
        collection: String(data.collection || ''),
        dataSource:
          data.dataSource === 'live_cdse' || data.dataSource === 'fallback_sample'
            ? data.dataSource
            : 'fallback_sample',
        sceneCount: Number(data.sceneCount || 0),
        scenes: Array.isArray(data.scenes) ? data.scenes : [],
        maxCloudCover: Number(data.maxCloudCover || 0),
        requestedRange: (data.requestedRange || {
          startDate: '',
          endDate: '',
        }) as SatelliteIngestSnapshot['requestedRange'],
        createdAt: toDate(data.createdAt),
      } as SatelliteIngestSnapshot;
    })
    .filter((item) => (params?.aoiId ? item.aoi?.aoiId === params.aoiId : true))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return normalized.slice(0, params.limitCount || 10);
}

async function readFallbackCatalogFromProfileDoc(): Promise<SchemeCatalogEntry[]> {
  if (!db) return [];

  const fallbackDoc = await getDoc(doc(db, FARM_PROFILES_COLLECTION, SCHEME_CATALOG_FALLBACK_DOC_ID));
  if (!fallbackDoc.exists()) return [];

  const rawCatalog = fallbackDoc.data().day2SchemeCatalog;
  if (!Array.isArray(rawCatalog)) return [];

  const entries = rawCatalog
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const data = item as Record<string, unknown>;

      return {
        schemeId: String(data.schemeId || `fallback-scheme-${index + 1}`),
        schemeName: String(data.schemeName || 'Unknown Scheme'),
        authority:
          data.authority === 'state' || data.authority === 'hybrid' ? data.authority : 'central',
        authorityLabel: String(data.authorityLabel || 'Unknown Authority'),
        stateScope: Array.isArray(data.stateScope) ? data.stateScope.map((state) => String(state)) : ['all'],
        eligibilityInputs: Array.isArray(data.eligibilityInputs)
          ? data.eligibilityInputs
          : [],
        eligibilityRules:
          data.eligibilityRules && typeof data.eligibilityRules === 'object'
            ? data.eligibilityRules
            : {},
        benefits: Array.isArray(data.benefits) ? data.benefits.map((itemValue) => String(itemValue)) : [],
        deadlines: String(data.deadlines || 'Check official source for latest deadline'),
        documentsRequired: Array.isArray(data.documentsRequired)
          ? data.documentsRequired.map((itemValue) => String(itemValue))
          : [],
        actionSteps: Array.isArray(data.actionSteps)
          ? data.actionSteps.map((itemValue) => String(itemValue))
          : [],
        officialLink: String(data.officialLink || ''),
        sourceUrl: String(data.sourceUrl || data.officialLink || ''),
        sourceLastCheckedAt: String(data.sourceLastCheckedAt || new Date().toISOString().slice(0, 10)),
        confidenceTag:
          data.confidenceTag === 'high' || data.confidenceTag === 'medium' ? data.confidenceTag : 'low',
        estimatedEffort:
          data.estimatedEffort === 'low' || data.estimatedEffort === 'high'
            ? data.estimatedEffort
            : 'medium',
        cashImpactWindow:
          data.cashImpactWindow === 'immediate' ||
          data.cashImpactWindow === 'annual'
            ? data.cashImpactWindow
            : 'seasonal',
        tags: Array.isArray(data.tags) ? data.tags.map((itemValue) => String(itemValue)) : [],
      } as SchemeCatalogEntry;
    });

  return entries.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
}

export async function upsertSchemeCatalog(
  entries: SchemeCatalogEntry[]
): Promise<{ success: boolean; count: number; error: string | null }> {
  try {
    const firestore = db;
    if (!firestore) return { success: false, count: 0, error: 'Firestore is not configured' };
    const nowIso = new Date().toISOString();

    if (!canWriteSchemeCatalog) {
      await setDoc(
        doc(firestore, FARM_PROFILES_COLLECTION, SCHEME_CATALOG_FALLBACK_DOC_ID),
        {
          day2SchemeCatalog: entries,
          day2CatalogSeededAt: nowIso,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      return { success: true, count: entries.length, error: null };
    }

    await Promise.all(
      entries.map((entry) =>
        setDoc(
          doc(firestore, SCHEME_CATALOG_COLLECTION, entry.schemeId),
          {
            ...entry,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        )
      )
    );

    return { success: true, count: entries.length, error: null };
  } catch (error) {
    if (isPermissionDenied(error) && db) {
      canWriteSchemeCatalog = false;
      try {
        await setDoc(
          doc(db, FARM_PROFILES_COLLECTION, SCHEME_CATALOG_FALLBACK_DOC_ID),
          {
            day2SchemeCatalog: entries,
            day2CatalogSeededAt: new Date().toISOString(),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        );
        return { success: true, count: entries.length, error: null };
      } catch (fallbackError) {
        console.error('Fallback scheme catalog seed failed:', fallbackError);
      }
    }
    console.error('Error upserting scheme catalog:', error);
    return { success: false, count: 0, error: 'Failed to upsert scheme catalog' };
  }
}

export async function getSchemeCatalog(): Promise<SchemeCatalogEntry[]> {
  try {
    if (!db) return [];

    try {
      if (!canWriteSchemeCatalog) {
        throw { code: 'permission-denied' };
      }

      const catalogQuery = query(collection(db, SCHEME_CATALOG_COLLECTION), limit(600));
      const snapshot = await getDocs(catalogQuery);

      const entries: SchemeCatalogEntry[] = snapshot.docs.map((schemeDoc) => {
        const data = schemeDoc.data();

        return {
          schemeId: data.schemeId || schemeDoc.id,
          schemeName: data.schemeName || 'Unknown Scheme',
          authority: data.authority || 'central',
          authorityLabel: data.authorityLabel || 'Unknown Authority',
          stateScope: Array.isArray(data.stateScope) ? data.stateScope : ['all'],
          eligibilityInputs: Array.isArray(data.eligibilityInputs) ? data.eligibilityInputs : [],
          eligibilityRules:
            data.eligibilityRules && typeof data.eligibilityRules === 'object'
              ? data.eligibilityRules
              : {},
          benefits: Array.isArray(data.benefits) ? data.benefits : [],
          deadlines: data.deadlines || 'Check official source for latest deadline',
          documentsRequired: Array.isArray(data.documentsRequired) ? data.documentsRequired : [],
          actionSteps: Array.isArray(data.actionSteps) ? data.actionSteps : [],
          officialLink: data.officialLink || '',
          sourceUrl: data.sourceUrl || data.officialLink || '',
          sourceLastCheckedAt: data.sourceLastCheckedAt || new Date().toISOString().slice(0, 10),
          confidenceTag: data.confidenceTag || 'low',
          estimatedEffort: data.estimatedEffort || 'medium',
          cashImpactWindow: data.cashImpactWindow || 'seasonal',
          tags: Array.isArray(data.tags) ? data.tags : [],
        } as SchemeCatalogEntry;
      });

      if (entries.length > 0) {
        return entries.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
      }
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSchemeCatalog = false;
    }

    return readFallbackCatalogFromProfileDoc();
  } catch (error) {
    console.error('Error fetching scheme catalog:', error);
    return [];
  }
}

export async function saveSchemeRecommendationSnapshot(
  userId: string,
  profileCompleteness: number,
  recommendations: SchemeRecommendation[]
): Promise<{ success: boolean; error: string | null; id?: string }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };
    if (!canWriteRecommendationSnapshots) {
      return { success: false, error: 'Recommendation snapshot writes are disabled by permissions.' };
    }

    const payload = stripUndefined({
      userId,
      profileCompleteness,
      recommendations,
      generatedAt: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, SCHEME_RECOMMENDATIONS_COLLECTION), payload);

    return { success: true, error: null, id: docRef.id };
  } catch (error) {
    if (isPermissionDenied(error)) {
      canWriteRecommendationSnapshots = false;
    }
    console.error('Error saving scheme recommendation snapshot:', error);
    return { success: false, error: 'Failed to save recommendation snapshot' };
  }
}

export async function getLatestSchemeRecommendationSnapshot(
  userId: string
): Promise<SchemeRecommendationSnapshot | null> {
  try {
    if (!db) return null;

    const snapshotQuery = query(
      collection(db, SCHEME_RECOMMENDATIONS_COLLECTION),
      where('userId', '==', userId),
      limit(30)
    );

    const snapshot = await getDocs(snapshotQuery);
    if (snapshot.empty) return null;

    const latestDoc = snapshot.docs
      .map((docItem) => ({ id: docItem.id, data: docItem.data() }))
      .sort((a, b) => toDate(b.data.generatedAt).getTime() - toDate(a.data.generatedAt).getTime())[0];

    const latest = latestDoc.data;

    return {
      id: latestDoc.id,
      userId: latest.userId,
      profileCompleteness: Number(latest.profileCompleteness || 0),
      generatedAt: toDate(latest.generatedAt),
      recommendations: Array.isArray(latest.recommendations) ? latest.recommendations : [],
    };
  } catch (error) {
    console.error('Error fetching latest scheme recommendation snapshot:', error);
    return null;
  }
}

export async function upsertSchemeUserState(
  userId: string,
  schemeId: string,
  updates: {
    saved?: boolean;
    checklist?: Record<string, boolean>;
    notes?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    const payload = stripUndefined({
      userId,
      schemeId,
      saved: updates.saved,
      checklist: updates.checklist,
      notes: updates.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      if (canWriteSchemeUserStateCollection) {
        const stateRef = doc(db, SCHEME_USER_STATE_COLLECTION, `${userId}__${schemeId}`);
        await setDoc(stateRef, payload, { merge: true });
        return { success: true, error: null };
      }
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSchemeUserStateCollection = false;

      const nowIso = new Date().toISOString();
      await setDoc(
        doc(db, FARM_PROFILES_COLLECTION, userId),
        {
          day2SchemeUserState: {
            [schemeId]: stripUndefined({
              saved: updates.saved,
              checklist: updates.checklist,
              notes: updates.notes,
              createdAt: nowIso,
              updatedAt: nowIso,
            }),
          },
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (!canWriteSchemeUserStateCollection) {
      const nowIso = new Date().toISOString();
      await setDoc(
        doc(db, FARM_PROFILES_COLLECTION, userId),
        {
          day2SchemeUserState: {
            [schemeId]: stripUndefined({
              saved: updates.saved,
              checklist: updates.checklist,
              notes: updates.notes,
              createdAt: nowIso,
              updatedAt: nowIso,
            }),
          },
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error upserting scheme user state:', error);
    return { success: false, error: 'Failed to update scheme user state' };
  }
}

export async function getSchemeUserStateMap(userId: string): Promise<Record<string, SchemeUserState>> {
  try {
    if (!db) return {};

    try {
      if (!canWriteSchemeUserStateCollection) {
        throw { code: 'permission-denied' };
      }

      const stateQuery = query(
        collection(db, SCHEME_USER_STATE_COLLECTION),
        where('userId', '==', userId),
        limit(400)
      );

      const snapshot = await getDocs(stateQuery);

      const map: Record<string, SchemeUserState> = {};

      snapshot.forEach((stateDoc) => {
        const data = stateDoc.data();

        map[data.schemeId] = {
          id: stateDoc.id,
          userId: data.userId,
          schemeId: data.schemeId,
          saved: Boolean(data.saved),
          checklist:
            data.checklist && typeof data.checklist === 'object' && !Array.isArray(data.checklist)
              ? data.checklist
              : {},
          notes: data.notes,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      });

      if (Object.keys(map).length > 0) {
        return map;
      }
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSchemeUserStateCollection = false;
    }

    const profileDoc = await getDoc(doc(db, FARM_PROFILES_COLLECTION, userId));
    if (!profileDoc.exists()) return {};

    return readSchemeStateMapFromProfile(userId, profileDoc.data().day2SchemeUserState);
  } catch (error) {
    console.error('Error fetching scheme user state map:', error);
    return {};
  }
}

export async function saveSatelliteIngestSnapshot(
  snapshot: Omit<SatelliteIngestSnapshot, 'createdAt'>
): Promise<{ success: boolean; error: string | null; id?: string }> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    const payload = stripUndefined({
      ...snapshot,
      createdAt: serverTimestamp(),
    });

    try {
      if (!canWriteSatelliteSnapshots) {
        throw { code: 'permission-denied' };
      }

      const docRef = await addDoc(collection(db, SATELLITE_SNAPSHOTS_COLLECTION), payload);
      return { success: true, error: null, id: docRef.id };
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSatelliteSnapshots = false;
      if (!snapshot.userId) throw collectionError;

      const fallbackId = `profile-fallback-${Date.now()}`;
      const fallbackPayload = stripUndefined({
        ...snapshot,
        id: fallbackId,
        createdAt: new Date().toISOString(),
      });

      await setDoc(
        doc(db, FARM_PROFILES_COLLECTION, snapshot.userId),
        {
          day2SatelliteSnapshots: arrayUnion(fallbackPayload),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      return { success: true, error: null, id: fallbackId };
    }
  } catch (error) {
    console.error('Error saving satellite ingest snapshot:', error);
    return { success: false, error: 'Failed to save satellite ingest snapshot' };
  }
}

export async function getSatelliteIngestHistory(params?: {
  userId?: string;
  aoiId?: string;
  limitCount?: number;
}): Promise<SatelliteIngestSnapshot[]> {
  try {
    if (!db) return [];

    const constraints: QueryConstraint[] = [limit(200)];

    if (params?.userId) {
      constraints.push(where('userId', '==', params.userId));
    }

    if (params?.aoiId) {
      constraints.push(where('aoi.aoiId', '==', params.aoiId));
    }

    const historyQuery = query(collection(db, SATELLITE_SNAPSHOTS_COLLECTION), ...constraints);

    try {
      if (!canWriteSatelliteSnapshots) {
        throw { code: 'permission-denied' };
      }

      const snapshot = await getDocs(historyQuery);

      const history = snapshot.docs
        .map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            userId: data.userId,
            aoi: data.aoi,
            provider: data.provider,
            collection: data.collection,
            dataSource: data.dataSource,
            sceneCount: Number(data.sceneCount || 0),
            scenes: Array.isArray(data.scenes) ? data.scenes : [],
            maxCloudCover: Number(data.maxCloudCover || 0),
            requestedRange: data.requestedRange || {
              startDate: '',
              endDate: '',
            },
            createdAt: toDate(data.createdAt),
          } as SatelliteIngestSnapshot;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (history.length > 0) {
        return history.slice(0, params?.limitCount || 10);
      }
    } catch (collectionError) {
      if (!isPermissionDenied(collectionError)) throw collectionError;
      canWriteSatelliteSnapshots = false;
    }

    return readSatelliteHistoryFromProfile(params);
  } catch (error) {
    console.error('Error fetching satellite ingest history:', error);
    return [];
  }
}
