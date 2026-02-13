import { DEFAULT_DEMO_AOI } from '@/lib/data/satelliteFallbackScenes';
import { getFarmProfile } from '@/lib/firebase/firestore';
import { SatelliteAOI, SatelliteAoiSource } from '@/types';

interface ResolveSatelliteAoiParams {
  userId?: string;
  queryBbox?: string | null;
  queryAoiId?: string | null;
  queryAoiName?: string | null;
}

export interface ResolvedSatelliteAoi {
  aoi: SatelliteAOI;
  aoiSource: SatelliteAoiSource;
  geometryUsed: boolean;
  farmBoundaryPolygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

function parseBbox(raw: string | null | undefined): [number, number, number, number] | null {
  if (!raw) return null;

  const parts = raw.split(',').map((item) => Number(item.trim()));
  if (parts.length !== 4 || parts.some((item) => Number.isNaN(item))) {
    return null;
  }

  const [minLon, minLat, maxLon, maxLat] = parts;
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) return null;
  if (!(minLon < maxLon && minLat < maxLat)) return null;

  return [minLon, minLat, maxLon, maxLat];
}

function bboxToPolygon(bbox: [number, number, number, number]): {
  type: 'Polygon';
  coordinates: number[][][];
} {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return {
    type: 'Polygon',
    coordinates: [[
      [minLon, maxLat],
      [maxLon, maxLat],
      [maxLon, minLat],
      [minLon, minLat],
      [minLon, maxLat],
    ]],
  };
}

function buildAoi(params: {
  bbox: [number, number, number, number];
  aoiId?: string | null;
  aoiName?: string | null;
  fallbackAoiId: string;
  fallbackAoiName: string;
}): SatelliteAOI {
  return {
    aoiId: params.aoiId?.trim() || params.fallbackAoiId,
    name: params.aoiName?.trim() || params.fallbackAoiName,
    bbox: params.bbox,
  };
}

export async function resolveSatelliteAoi(
  params: ResolveSatelliteAoiParams
): Promise<ResolvedSatelliteAoi> {
  const queryBbox = parseBbox(params.queryBbox);

  if (queryBbox) {
    return {
      aoi: buildAoi({
        bbox: queryBbox,
        aoiId: params.queryAoiId,
        aoiName: params.queryAoiName,
        fallbackAoiId: 'query-bbox-aoi',
        fallbackAoiName: 'Custom Query AOI',
      }),
      aoiSource: 'query_bbox',
      geometryUsed: false,
      farmBoundaryPolygon: bboxToPolygon(queryBbox),
    };
  }

  if (params.userId) {
    try {
      const profile = await getFarmProfile(params.userId);

      if (profile?.location?.landGeometry?.bbox) {
        return {
          aoi: buildAoi({
            bbox: profile.location.landGeometry.bbox,
            aoiId: params.queryAoiId,
            aoiName: params.queryAoiName,
            fallbackAoiId: `farm-${params.userId}`,
            fallbackAoiName: profile.farmerName ? `${profile.farmerName}'s Farm` : 'My Farm',
          }),
          aoiSource: 'profile_land_geometry',
          geometryUsed: true,
          farmBoundaryPolygon:
            profile.location.landGeometry.coordinates?.length > 0
              ? {
                  type: 'Polygon',
                  coordinates: profile.location.landGeometry.coordinates,
                }
              : bboxToPolygon(profile.location.landGeometry.bbox),
        };
      }
    } catch (error) {
      console.error('Error resolving AOI from farm profile:', error);
    }
  }

  return {
    aoi: buildAoi({
      bbox: DEFAULT_DEMO_AOI.bbox,
      aoiId: params.queryAoiId,
      aoiName: params.queryAoiName,
      fallbackAoiId: DEFAULT_DEMO_AOI.aoiId,
      fallbackAoiName: DEFAULT_DEMO_AOI.name,
    }),
    aoiSource: 'demo_fallback',
    geometryUsed: false,
    farmBoundaryPolygon: bboxToPolygon(DEFAULT_DEMO_AOI.bbox),
  };
}
