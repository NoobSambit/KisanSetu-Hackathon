import { DEFAULT_DEMO_AOI, FALLBACK_SATELLITE_SCENES } from '@/lib/data/satelliteFallbackScenes';
import {
  CDSE_CATALOG_URL,
  getCDSEAccessToken,
  validateCDSEEnv,
} from '@/lib/services/cdseClient';
import {
  SatelliteIngestRequest,
  SatelliteIngestResult,
  SatelliteSceneMetadata,
} from '@/types';

const DEFAULT_COLLECTION = 'sentinel-2-l2a';

interface STACFeature {
  id?: string;
  bbox?: number[];
  properties?: {
    datetime?: string;
    'eo:cloud_cover'?: number;
  };
  assets?: {
    thumbnail?: {
      href?: string;
    };
  };
}

interface STACSearchResponse {
  features?: STACFeature[];
}

function extractTileId(sceneId: string): string {
  const match = sceneId.match(/_T([0-9A-Z]{5})_/);
  return match?.[1] || 'unknown';
}

function normalizeBbox(value: unknown): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (!value.every((item) => typeof item === 'number')) return null;
  return value as [number, number, number, number];
}

function mapFeatureToScene(feature: STACFeature): SatelliteSceneMetadata | null {
  if (!feature.id || !feature.properties?.datetime) return null;

  const cloudCover = Number(feature.properties['eo:cloud_cover'] ?? 100);

  return {
    sceneId: feature.id,
    capturedAt: feature.properties.datetime,
    cloudCover: Number.isFinite(cloudCover) ? cloudCover : 100,
    tileId: extractTileId(feature.id),
    collection: DEFAULT_COLLECTION,
    bbox: normalizeBbox(feature.bbox),
    quicklookUrl: feature.assets?.thumbnail?.href,
  };
}

async function fetchLiveScenes(request: SatelliteIngestRequest): Promise<SatelliteSceneMetadata[]> {
  const token = await getCDSEAccessToken();

  const response = await fetch(CDSE_CATALOG_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bbox: request.aoi.bbox,
      datetime: `${request.startDate}T00:00:00Z/${request.endDate}T23:59:59Z`,
      collections: [DEFAULT_COLLECTION],
      limit: Math.max(request.maxResults * 3, 12),
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`CDSE catalog search failed (${response.status}): ${responseText.slice(0, 200)}`);
  }

  const data = (await response.json()) as STACSearchResponse;
  const allScenes = (data.features || [])
    .map((feature) => mapFeatureToScene(feature))
    .filter((scene): scene is SatelliteSceneMetadata => scene !== null)
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

  return allScenes.filter((scene) => scene.cloudCover <= request.maxCloudCover).slice(0, request.maxResults);
}

function buildFallbackResult(request: SatelliteIngestRequest, reason: string): SatelliteIngestResult {
  return {
    success: true,
    dataSource: 'fallback_sample',
    scenes: FALLBACK_SATELLITE_SCENES.slice(0, request.maxResults),
    metadata: {
      provider: 'cdse-sentinel-hub',
      collection: DEFAULT_COLLECTION,
      ingestedAt: new Date().toISOString(),
      aoi: request.aoi,
      maxCloudCover: request.maxCloudCover,
      requestedRange: {
        startDate: request.startDate,
        endDate: request.endDate,
      },
    },
    error: reason,
  };
}

export async function runSatelliteIngest(
  request: Partial<SatelliteIngestRequest>,
  options?: {
    allowFallback?: boolean;
  }
): Promise<SatelliteIngestResult> {
  const now = new Date();
  const endDate = request.endDate || now.toISOString().slice(0, 10);
  const startDate =
    request.startDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10);

  const normalizedRequest: SatelliteIngestRequest = {
    aoi: request.aoi || DEFAULT_DEMO_AOI,
    startDate,
    endDate,
    maxCloudCover: typeof request.maxCloudCover === 'number' ? request.maxCloudCover : 25,
    maxResults: typeof request.maxResults === 'number' ? request.maxResults : 3,
  };

  const envStatus = validateCDSEEnv();
  if (!envStatus.ok) {
    if (options?.allowFallback) {
      return buildFallbackResult(normalizedRequest, envStatus.message || 'Satellite environment missing.');
    }

    return {
      success: false,
      dataSource: 'live_cdse',
      scenes: [],
      metadata: {
        provider: 'cdse-sentinel-hub',
        collection: DEFAULT_COLLECTION,
        ingestedAt: new Date().toISOString(),
        aoi: normalizedRequest.aoi,
        maxCloudCover: normalizedRequest.maxCloudCover,
        requestedRange: {
          startDate: normalizedRequest.startDate,
          endDate: normalizedRequest.endDate,
        },
      },
      error: envStatus.message,
    };
  }

  try {
    const scenes = await fetchLiveScenes(normalizedRequest);

    if (scenes.length === 0 && options?.allowFallback) {
      return buildFallbackResult(
        normalizedRequest,
        `No live scenes found under cloud threshold ${normalizedRequest.maxCloudCover}%.`
      );
    }

    if (scenes.length === 0) {
      return {
        success: false,
        dataSource: 'live_cdse',
        scenes: [],
        metadata: {
          provider: 'cdse-sentinel-hub',
          collection: DEFAULT_COLLECTION,
          ingestedAt: new Date().toISOString(),
          aoi: normalizedRequest.aoi,
          maxCloudCover: normalizedRequest.maxCloudCover,
          requestedRange: {
            startDate: normalizedRequest.startDate,
            endDate: normalizedRequest.endDate,
          },
        },
        error: `No scenes found under cloud threshold ${normalizedRequest.maxCloudCover}%.`,
      };
    }

    return {
      success: true,
      dataSource: 'live_cdse',
      scenes,
      metadata: {
        provider: 'cdse-sentinel-hub',
        collection: DEFAULT_COLLECTION,
        ingestedAt: new Date().toISOString(),
        aoi: normalizedRequest.aoi,
        maxCloudCover: normalizedRequest.maxCloudCover,
        requestedRange: {
          startDate: normalizedRequest.startDate,
          endDate: normalizedRequest.endDate,
        },
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown satellite ingest error';

    if (options?.allowFallback) {
      return buildFallbackResult(normalizedRequest, `Live ingest failed: ${message}`);
    }

    return {
      success: false,
      dataSource: 'live_cdse',
      scenes: [],
      metadata: {
        provider: 'cdse-sentinel-hub',
        collection: DEFAULT_COLLECTION,
        ingestedAt: new Date().toISOString(),
        aoi: normalizedRequest.aoi,
        maxCloudCover: normalizedRequest.maxCloudCover,
        requestedRange: {
          startDate: normalizedRequest.startDate,
          endDate: normalizedRequest.endDate,
        },
      },
      error: message,
    };
  }
}
