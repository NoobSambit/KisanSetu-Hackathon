import {
  collection,
  DocumentData,
  doc,
  getDoc,
  getDocs,
  limit,
  QueryConstraint,
  QueryDocumentSnapshot,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  MarketCardItem,
  MarketGranularity,
  MarketSeriesDoc,
  MarketSeriesPointPrice,
  MarketSeriesPointQuantity,
  MarketTaxonomyDoc,
} from '@/types';

export const MARKET_TAXONOMY_COLLECTION = 'marketTaxonomy';
export const MARKET_SERIES_COLLECTION = 'marketSeries';
export const MARKET_INGEST_RUNS_COLLECTION = 'marketIngestRuns';
export const MARKET_TAXONOMY_VERSION_ID = 'agmarknet_2025_v1';

interface MarketCardsQuery {
  year: number;
  granularity: MarketGranularity;
  categoryId?: number;
  commodityId?: number;
  stateId?: number;
  districtId?: number;
  page: number;
  limit: number;
}

interface MarketCardsResult {
  cards: MarketCardItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface FirestoreSeriesScanConfig {
  maxScanDocs: number;
  batchSize: number;
}

const DEFAULT_SCAN_CONFIG: FirestoreSeriesScanConfig = {
  maxScanDocs: 12000,
  batchSize: 800,
};

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizePricePoint(value: unknown): MarketSeriesPointPrice | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.t !== 'string' || row.t.length === 0) return null;
  return {
    t: row.t,
    p_min: normalizeNumber(row.p_min),
    p_max: normalizeNumber(row.p_max),
    p_modal: normalizeNumber(row.p_modal),
  };
}

function normalizeQuantityPoint(value: unknown): MarketSeriesPointQuantity | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.t !== 'string' || row.t.length === 0) return null;
  return {
    t: row.t,
    qty: normalizeNumber(row.qty),
  };
}

function normalizeSeriesDoc(id: string, value: Record<string, unknown>): MarketSeriesDoc {
  const rawPricePoints = Array.isArray(value.pricePoints) ? value.pricePoints : [];
  const rawQuantityPoints = Array.isArray(value.quantityPoints) ? value.quantityPoints : [];
  const pricePoints = rawPricePoints
    .map((point) => normalizePricePoint(point))
    .filter((point): point is MarketSeriesPointPrice => point !== null);
  const quantityPoints = rawQuantityPoints
    .map((point) => normalizeQuantityPoint(point))
    .filter((point): point is MarketSeriesPointQuantity => point !== null);

  const granularity =
    value.granularity === 'd' || value.granularity === 'm' || value.granularity === 'y'
      ? value.granularity
      : 'm';
  const level =
    value.level === 'all_india' || value.level === 'state' || value.level === 'district'
      ? value.level
      : 'all_india';

  return {
    seriesId: typeof value.seriesId === 'string' ? value.seriesId : id,
    year: typeof value.year === 'number' ? value.year : Number(value.year || 2025),
    granularity,
    level,
    categoryId:
      value.categoryId === null ||
      typeof value.categoryId === 'number' ||
      typeof value.categoryId === 'string'
        ? value.categoryId === null
          ? null
          : Number(value.categoryId)
        : null,
    categoryName: typeof value.categoryName === 'string' ? value.categoryName : 'Uncategorized',
    commodityId: Number(value.commodityId || 0),
    commodityName: typeof value.commodityName === 'string' ? value.commodityName : 'Unknown Commodity',
    stateId: Number(value.stateId || 0),
    stateName: typeof value.stateName === 'string' ? value.stateName : 'All India',
    districtId: Number(value.districtId || 0),
    districtName: typeof value.districtName === 'string' ? value.districtName : 'All Districts',
    pricePoints,
    quantityPoints,
    pricePointCount:
      typeof value.pricePointCount === 'number' ? value.pricePointCount : pricePoints.length,
    quantityPointCount:
      typeof value.quantityPointCount === 'number'
        ? value.quantityPointCount
        : quantityPoints.length,
    lastUpdated: toIsoString(value.lastUpdated),
    sourceMetadata: {
      source:
        value.sourceMetadata && typeof value.sourceMetadata === 'object'
          ? String((value.sourceMetadata as Record<string, unknown>).source || 'agmarknet.ceda.ashoka.edu.in')
          : 'agmarknet.ceda.ashoka.edu.in',
      year:
        value.sourceMetadata && typeof value.sourceMetadata === 'object'
          ? Number((value.sourceMetadata as Record<string, unknown>).year || 2025)
          : 2025,
      granularities:
        value.sourceMetadata &&
        typeof value.sourceMetadata === 'object' &&
        Array.isArray((value.sourceMetadata as Record<string, unknown>).granularities)
          ? ((value.sourceMetadata as Record<string, unknown>).granularities as unknown[]).filter(
              (item): item is MarketGranularity => item === 'd' || item === 'm' || item === 'y'
            )
          : ['d', 'm', 'y'],
      endpoints:
        value.sourceMetadata &&
        typeof value.sourceMetadata === 'object' &&
        (value.sourceMetadata as Record<string, unknown>).endpoints &&
        typeof (value.sourceMetadata as Record<string, unknown>).endpoints === 'object'
          ? {
              prices: String(
                ((value.sourceMetadata as Record<string, unknown>).endpoints as Record<
                  string,
                  unknown
                >).prices || '/api/prices'
              ),
              quantities: String(
                ((value.sourceMetadata as Record<string, unknown>).endpoints as Record<
                  string,
                  unknown
                >).quantities || '/api/quantities'
              ),
            }
          : {
              prices: '/api/prices',
              quantities: '/api/quantities',
            },
      ingestRunId:
        value.sourceMetadata && typeof value.sourceMetadata === 'object'
          ? ((value.sourceMetadata as Record<string, unknown>).ingestRunId as string | undefined)
          : undefined,
    },
  };
}

function calculatePercentageDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function buildCard(series: MarketSeriesDoc): MarketCardItem {
  const latestPricePoint = series.pricePoints[series.pricePoints.length - 1] || null;
  const previousPricePoint = series.pricePoints[series.pricePoints.length - 2] || null;
  const latestQuantityPoint = series.quantityPoints[series.quantityPoints.length - 1] || null;
  const previousQuantityPoint = series.quantityPoints[series.quantityPoints.length - 2] || null;

  const latestModalPrice = latestPricePoint?.p_modal ?? null;
  const previousModalPrice = previousPricePoint?.p_modal ?? null;
  const latestQuantity = latestQuantityPoint?.qty ?? null;
  const previousQuantity = previousQuantityPoint?.qty ?? null;

  const modalDeltaAbs =
    latestModalPrice !== null && previousModalPrice !== null
      ? latestModalPrice - previousModalPrice
      : null;
  const quantityDeltaAbs =
    latestQuantity !== null && previousQuantity !== null ? latestQuantity - previousQuantity : null;

  return {
    seriesId: series.seriesId,
    year: series.year,
    granularity: series.granularity,
    level: series.level,
    categoryId: series.categoryId,
    categoryName: series.categoryName,
    commodityId: series.commodityId,
    commodityName: series.commodityName,
    stateId: series.stateId,
    stateName: series.stateName,
    districtId: series.districtId,
    districtName: series.districtName,
    latestPointLabel: latestPricePoint?.t || latestQuantityPoint?.t || null,
    latestModalPrice,
    latestMinPrice: latestPricePoint?.p_min ?? null,
    latestMaxPrice: latestPricePoint?.p_max ?? null,
    latestQuantity,
    previousModalPrice,
    previousQuantity,
    modalDeltaAbs,
    modalDeltaPct: calculatePercentageDelta(latestModalPrice, previousModalPrice),
    quantityDeltaAbs,
    quantityDeltaPct: calculatePercentageDelta(latestQuantity, previousQuantity),
    pricePointCount: series.pricePointCount,
    quantityPointCount: series.quantityPointCount,
    lastUpdated: series.lastUpdated,
  };
}

function matchesFilters(series: MarketSeriesDoc, filters: MarketCardsQuery): boolean {
  if (series.year !== filters.year) return false;
  if (series.granularity !== filters.granularity) return false;
  if (filters.categoryId !== undefined && series.categoryId !== filters.categoryId) return false;
  if (filters.commodityId !== undefined && series.commodityId !== filters.commodityId) return false;
  if (filters.stateId !== undefined && series.stateId !== filters.stateId) return false;
  if (filters.districtId !== undefined && series.districtId !== filters.districtId) return false;
  return true;
}

function getPrimaryQueryKey(filters: MarketCardsQuery): {
  key: 'commodityId' | 'districtId' | 'stateId' | 'categoryId' | 'year';
  value: number;
} {
  if (filters.commodityId !== undefined) return { key: 'commodityId', value: filters.commodityId };
  if (filters.districtId !== undefined) return { key: 'districtId', value: filters.districtId };
  if (filters.stateId !== undefined) return { key: 'stateId', value: filters.stateId };
  if (filters.categoryId !== undefined) return { key: 'categoryId', value: filters.categoryId };
  return { key: 'year', value: filters.year };
}

export async function upsertMarketTaxonomy(docData: MarketTaxonomyDoc): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!db) return { success: false, error: 'Firestore is not configured' };

    await setDoc(
      doc(db, MARKET_TAXONOMY_COLLECTION, docData.versionId),
      {
        ...docData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to upsert market taxonomy:', error);
    return { success: false, error: 'Failed to upsert market taxonomy' };
  }
}

export async function getMarketTaxonomy(
  versionId: string = MARKET_TAXONOMY_VERSION_ID
): Promise<MarketTaxonomyDoc | null> {
  try {
    if (!db) return null;
    const ref = doc(db, MARKET_TAXONOMY_COLLECTION, versionId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as Record<string, unknown>;
    return {
      versionId: typeof data.versionId === 'string' ? data.versionId : versionId,
      source: typeof data.source === 'string' ? data.source : 'https://agmarknet.ceda.ashoka.edu.in',
      fetchedAt: toIsoString(data.fetchedAt),
      categories: Array.isArray(data.categories) ? (data.categories as MarketTaxonomyDoc['categories']) : [],
      commodities: Array.isArray(data.commodities)
        ? (data.commodities as MarketTaxonomyDoc['commodities'])
        : [],
      states: Array.isArray(data.states) ? (data.states as MarketTaxonomyDoc['states']) : [],
      districtsByState: Array.isArray(data.districtsByState)
        ? (data.districtsByState as MarketTaxonomyDoc['districtsByState'])
        : [],
      counts:
        data.counts && typeof data.counts === 'object'
          ? {
              categories: Number((data.counts as Record<string, unknown>).categories || 0),
              commodities: Number((data.counts as Record<string, unknown>).commodities || 0),
              states: Number((data.counts as Record<string, unknown>).states || 0),
              districts: Number((data.counts as Record<string, unknown>).districts || 0),
            }
          : { categories: 0, commodities: 0, states: 0, districts: 0 },
    };
  } catch (error) {
    console.error('Failed to read market taxonomy:', error);
    return null;
  }
}

export async function getMarketSeriesById(seriesId: string): Promise<MarketSeriesDoc | null> {
  try {
    if (!db) return null;
    const snapshot = await getDoc(doc(db, MARKET_SERIES_COLLECTION, seriesId));
    if (!snapshot.exists()) return null;
    return normalizeSeriesDoc(snapshot.id, snapshot.data() as Record<string, unknown>);
  } catch (error) {
    console.error('Failed to read market series doc:', error);
    return null;
  }
}

export async function listMarketCards(
  filters: MarketCardsQuery,
  scanConfig: FirestoreSeriesScanConfig = DEFAULT_SCAN_CONFIG
): Promise<MarketCardsResult> {
  if (!db) {
    return {
      cards: [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const { key, value } = getPrimaryQueryKey(filters);
  const matched: MarketSeriesDoc[] = [];
  let scanned = 0;
  let lastDocCursor: QueryDocumentSnapshot<DocumentData> | null = null;
  let hasMore = true;

  while (hasMore && scanned < scanConfig.maxScanDocs) {
    const constraints: QueryConstraint[] = [
      where(key, '==', value),
      limit(scanConfig.batchSize),
    ];
    if (lastDocCursor) {
      constraints.push(startAfter(lastDocCursor));
    }

    const snapshot = await getDocs(query(collection(db, MARKET_SERIES_COLLECTION), ...constraints));
    if (snapshot.empty) break;

    for (const seriesDoc of snapshot.docs) {
      const normalized = normalizeSeriesDoc(seriesDoc.id, seriesDoc.data() as Record<string, unknown>);
      if (matchesFilters(normalized, filters)) {
        matched.push(normalized);
      }
    }

    scanned += snapshot.docs.length;
    lastDocCursor = snapshot.docs[snapshot.docs.length - 1];
    hasMore = snapshot.docs.length === scanConfig.batchSize;
  }

  const sorted = matched
    .map((series) => buildCard(series))
    .sort((a, b) => {
      const aDate = new Date(a.lastUpdated).getTime();
      const bDate = new Date(b.lastUpdated).getTime();
      if (bDate !== aDate) return bDate - aDate;
      return a.commodityName.localeCompare(b.commodityName);
    });

  const totalItems = sorted.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / filters.limit);
  const offset = (filters.page - 1) * filters.limit;
  const cards = sorted.slice(offset, offset + filters.limit);

  return {
    cards,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      totalItems,
      totalPages,
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1 && totalPages > 0,
    },
  };
}
