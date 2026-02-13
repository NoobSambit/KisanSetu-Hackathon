import { NextRequest, NextResponse } from 'next/server';
import { getSatelliteHealthCacheEntry, saveSatelliteHealthCacheEntry } from '@/lib/firebase/satelliteHealthCache';
import { runSatelliteHealthAnalysis } from '@/lib/services/satelliteHealthService';
import { resolveSatelliteAoi } from '@/lib/services/satelliteAoiResolver';
import { generateNdviRaster } from '@/lib/services/satelliteNdviProcessService';
import {
  SatelliteHealthCacheEntry,
  SatelliteHealthInsight,
  SatelliteHealthResponseMetadata,
  SatellitePrecisionMode,
} from '@/types';

const DEFAULT_PRECISION_MODE: SatellitePrecisionMode = 'high_accuracy';
const DEFAULT_CACHE_TTL_HOURS = 24;

function parseNumber(value: string | null, fallback: number): number {
  if (value === null) return fallback;

  const normalized = value.trim();
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parsePrecisionMode(value: string | null): SatellitePrecisionMode {
  if (!value) return DEFAULT_PRECISION_MODE;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'estimated') return 'estimated';
  if (normalized === 'high_accuracy') return 'high_accuracy';
  return DEFAULT_PRECISION_MODE;
}

function normalizeCacheTtlHours(value: string | null): number {
  const parsed = Math.round(parseNumber(value, DEFAULT_CACHE_TTL_HOURS));
  return clamp(parsed, 1, 168);
}

function buildCacheKey(params: {
  userId?: string;
  bbox: [number, number, number, number];
  precisionMode: SatellitePrecisionMode;
  maxCloudCover: number;
  maxResults: number;
}): string {
  const bboxToken = params.bbox.map((item) => item.toFixed(6)).join(':');
  return [
    'sat-health',
    params.userId || 'anonymous',
    bboxToken,
    params.precisionMode,
    `cc${params.maxCloudCover}`,
    `mr${params.maxResults}`,
  ].join('|');
}

function buildCacheStatus(params: {
  hit: boolean;
  key: string;
  expiresAt: string | null;
  forced: boolean;
  staleFallbackUsed: boolean;
}): SatelliteHealthResponseMetadata['cache'] {
  return {
    hit: params.hit,
    key: params.key,
    expiresAt: params.expiresAt,
    forced: params.forced,
    staleFallbackUsed: params.staleFallbackUsed,
  };
}

function attachResponseMetadata(params: {
  baseMetadata: Omit<SatelliteHealthResponseMetadata, 'precisionMode' | 'sourceScene' | 'cache'>;
  precisionMode: SatellitePrecisionMode;
  sourceScene: SatelliteHealthResponseMetadata['sourceScene'];
  cache: SatelliteHealthResponseMetadata['cache'];
}): SatelliteHealthResponseMetadata {
  return {
    ...params.baseMetadata,
    precisionMode: params.precisionMode,
    sourceScene: params.sourceScene,
    cache: params.cache,
  };
}

function buildSourceScene(health: SatelliteHealthInsight): SatelliteHealthResponseMetadata['sourceScene'] {
  return {
    sceneId: health.currentScene?.sceneId || null,
    capturedAt: health.currentScene?.capturedAt || null,
  };
}

function buildRasterUncertaintyNote(cloudCover?: number): string {
  const cloudCoverText =
    Number.isFinite(cloudCover) && cloudCover !== undefined
      ? ` Scene cloud cover was ${Math.round(cloudCover)}%.`
      : '';

  return (
    `High-accuracy NDVI raster is generated from Sentinel-2 B08/B04 for this captured scene.` +
    cloudCoverText +
    ' Validate major interventions with a quick field check.'
  );
}

function normalizeHealthPresentation(health: SatelliteHealthInsight): SatelliteHealthInsight {
  if (health.mapOverlay?.strategy === 'ndvi_raster') {
    return {
      ...health,
      uncertaintyNote: buildRasterUncertaintyNote(health.currentScene?.cloudCover),
    };
  }

  return health;
}

function buildCachedMetadata(params: {
  entry: SatelliteHealthCacheEntry;
  precisionMode: SatellitePrecisionMode;
  cacheStatus: SatelliteHealthResponseMetadata['cache'];
}): SatelliteHealthResponseMetadata {
  return {
    ...params.entry.metadata,
    precisionMode: params.precisionMode,
    sourceScene: params.entry.metadata.sourceScene || {
      sceneId: params.entry.sourceSceneId || null,
      capturedAt: params.entry.sourceCapturedAt || null,
    },
    cache: params.cacheStatus,
  };
}

async function runHealth(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || undefined;
  const allowFallback = parseBoolean(request.nextUrl.searchParams.get('allowFallback'), true);
  const maxCloudCover = parseNumber(request.nextUrl.searchParams.get('maxCloudCover'), 35);
  const maxResults = parseNumber(request.nextUrl.searchParams.get('maxResults'), 3);
  const currentWindowDays = parseNumber(request.nextUrl.searchParams.get('currentWindowDays'), 35);
  const baselineOffsetDays = parseNumber(request.nextUrl.searchParams.get('baselineOffsetDays'), 90);
  const baselineWindowDays = parseNumber(request.nextUrl.searchParams.get('baselineWindowDays'), 35);
  const precisionMode = parsePrecisionMode(request.nextUrl.searchParams.get('precisionMode'));
  const useCache = parseBoolean(request.nextUrl.searchParams.get('useCache'), true);
  const forceRefresh = parseBoolean(request.nextUrl.searchParams.get('forceRefresh'), false);
  const simulateNdviFailure = parseBoolean(request.nextUrl.searchParams.get('simulateNdviFailure'), false);
  const cacheTtlHours = normalizeCacheTtlHours(request.nextUrl.searchParams.get('cacheTtlHours'));
  const now = new Date();

  const resolvedAoi = await resolveSatelliteAoi({
    userId,
    queryBbox: request.nextUrl.searchParams.get('bbox'),
    queryAoiId: request.nextUrl.searchParams.get('aoiId'),
    queryAoiName: request.nextUrl.searchParams.get('aoiName'),
  });

  const cacheKey = buildCacheKey({
    userId,
    bbox: resolvedAoi.aoi.bbox,
    precisionMode,
    maxCloudCover,
    maxResults,
  });

  let latestCacheEntry: SatelliteHealthCacheEntry | null = null;
  if (useCache) {
    latestCacheEntry = await getSatelliteHealthCacheEntry({ userId, cacheKey });
    if (latestCacheEntry && !forceRefresh) {
      const entryExpiresAt = new Date(latestCacheEntry.expiresAt);
      if (!Number.isNaN(entryExpiresAt.getTime()) && entryExpiresAt.getTime() > now.getTime()) {
        const cachedHealth = normalizeHealthPresentation(latestCacheEntry.healthPayload);
        const cachedMetadata = buildCachedMetadata({
          entry: latestCacheEntry,
          precisionMode,
          cacheStatus: buildCacheStatus({
            hit: true,
            key: cacheKey,
            expiresAt: latestCacheEntry.expiresAt,
            forced: false,
            staleFallbackUsed: false,
          }),
        });

        return NextResponse.json(
          {
            success: true,
            data: {
              health: cachedHealth,
              metadata: cachedMetadata,
              dataSource: latestCacheEntry.dataSource,
            },
            error: null,
          },
          { status: 200 }
        );
      }
    }
  }

  const result = await runSatelliteHealthAnalysis({
    aoi: resolvedAoi.aoi,
    aoiSource: resolvedAoi.aoiSource,
    geometryUsed: resolvedAoi.geometryUsed,
    farmBoundaryPolygon: resolvedAoi.farmBoundaryPolygon,
    allowFallback,
    maxCloudCover,
    maxResults,
    currentWindowDays,
    baselineOffsetDays,
    baselineWindowDays,
  });

  if (!result.success || !result.insight) {
    if (useCache && allowFallback && latestCacheEntry) {
      const staleMetadata = buildCachedMetadata({
        entry: latestCacheEntry,
        precisionMode,
        cacheStatus: buildCacheStatus({
          hit: true,
          key: cacheKey,
          expiresAt: latestCacheEntry.expiresAt,
          forced: forceRefresh,
          staleFallbackUsed: true,
        }),
      });

      const staleHealth = {
        ...normalizeHealthPresentation(latestCacheEntry.healthPayload),
        highAccuracyUnavailableReason:
          latestCacheEntry.healthPayload.highAccuracyUnavailableReason ||
          'Live refresh failed. Showing cached data for continuity.',
      };

      return NextResponse.json(
        {
          success: true,
          data: {
            health: staleHealth,
            metadata: staleMetadata,
            dataSource: latestCacheEntry.dataSource,
          },
          error: null,
        },
        { status: 200 }
      );
    }

    const failedMetadata = attachResponseMetadata({
      baseMetadata: result.metadata,
      precisionMode,
      sourceScene: { sceneId: null, capturedAt: null },
      cache: buildCacheStatus({
        hit: false,
        key: cacheKey,
        expiresAt: latestCacheEntry?.expiresAt || null,
        forced: forceRefresh,
        staleFallbackUsed: false,
      }),
    });

    return NextResponse.json(
      {
        success: false,
        data: {
          metadata: failedMetadata,
          dataSource: result.dataSource,
        },
        error: result.error || 'Satellite health analysis failed',
      },
      { status: 500 }
    );
  }

  let health = result.insight;
  if (precisionMode === 'high_accuracy' && health.currentScene && health.mapOverlay) {
    if (simulateNdviFailure) {
      health = {
        ...health,
        highAccuracyUnavailableReason:
          'NDVI process simulation was triggered. Showing estimated zone overlay instead.',
      };
    } else {
      const rasterResult = await generateNdviRaster({
        aoi: resolvedAoi.aoi,
        scene: health.currentScene,
        maxCloudCover,
        width: 384,
        height: 384,
      });

      if (rasterResult.success && rasterResult.imageDataUrl) {
        health = {
          ...health,
          uncertaintyNote: buildRasterUncertaintyNote(health.currentScene?.cloudCover),
          highAccuracyUnavailableReason: undefined,
          mapOverlay: {
            ...health.mapOverlay,
            strategy: 'ndvi_raster',
            imageDataUrl: rasterResult.imageDataUrl,
            imageBbox: rasterResult.imageBbox,
            disclaimer:
              'High-accuracy NDVI raster is rendered from Sentinel-2 B08/B04 for the selected scene. Zone bands are retained for quick summary.',
          },
        };
      } else {
        health = {
          ...health,
          highAccuracyUnavailableReason:
            rasterResult.error ||
            'High-accuracy NDVI is unavailable right now. Showing estimated zone overlay instead.',
        };
      }
    }

    const currentOverlay = health.mapOverlay;
    if (currentOverlay && currentOverlay.strategy !== 'ndvi_raster') {
      health = {
        ...health,
        highAccuracyUnavailableReason:
          health.highAccuracyUnavailableReason ||
          'High-accuracy NDVI is unavailable right now. Showing estimated zone overlay instead.',
        mapOverlay: {
          ...currentOverlay,
          strategy: 'estimated_zones',
          imageDataUrl: undefined,
          imageBbox: undefined,
        },
      };
    }
  } else if (precisionMode !== 'high_accuracy' && health.mapOverlay) {
    health = {
      ...health,
      highAccuracyUnavailableReason: undefined,
      mapOverlay: {
        ...health.mapOverlay,
        strategy: 'estimated_zones',
        imageDataUrl: undefined,
        imageBbox: undefined,
      },
    };
  } else if (precisionMode === 'high_accuracy' && !health.highAccuracyUnavailableReason) {
    health = {
      ...health,
      highAccuracyUnavailableReason:
        'High-accuracy NDVI is unavailable for this scene. Showing estimated health summary.',
    };
  }

  health = normalizeHealthPresentation(health);

  const sourceScene = buildSourceScene(health);
  const expiresAt = new Date(now.getTime() + cacheTtlHours * 60 * 60 * 1000).toISOString();
  const responseMetadata = attachResponseMetadata({
    baseMetadata: result.metadata,
    precisionMode,
    sourceScene,
    cache: buildCacheStatus({
      hit: false,
      key: cacheKey,
      expiresAt: useCache ? expiresAt : null,
      forced: forceRefresh,
      staleFallbackUsed: false,
    }),
  });

  if (useCache) {
    await saveSatelliteHealthCacheEntry({
      cacheKey,
      userId,
      aoi: resolvedAoi.aoi,
      precisionMode,
      dataSource: result.dataSource,
      sourceSceneId: sourceScene.sceneId,
      sourceCapturedAt: sourceScene.capturedAt,
      cachedAt: now.toISOString(),
      expiresAt,
      healthPayload: health,
      metadata: responseMetadata,
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        health,
        metadata: responseMetadata,
        dataSource: result.dataSource,
      },
      error: null,
    },
    { status: 200 }
  );
}

export async function GET(request: NextRequest) {
  try {
    return await runHealth(request);
  } catch (error) {
    console.error('Satellite health route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process satellite health request',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
