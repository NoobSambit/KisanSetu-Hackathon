import { NextRequest, NextResponse } from 'next/server';
import { getSatelliteIngestHistory, saveSatelliteIngestSnapshot } from '@/lib/firebase/day2';
import { runSatelliteIngest } from '@/lib/services/satelliteIngestService';
import { resolveSatelliteAoi } from '@/lib/services/satelliteAoiResolver';

function toBoolean(value: string | null, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

async function runIngest(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || undefined;

  const resolvedAoi = await resolveSatelliteAoi({
    userId,
    queryBbox: request.nextUrl.searchParams.get('bbox'),
    queryAoiId: request.nextUrl.searchParams.get('aoiId'),
    queryAoiName: request.nextUrl.searchParams.get('aoiName'),
  });

  const startDate = request.nextUrl.searchParams.get('startDate') || undefined;
  const endDate = request.nextUrl.searchParams.get('endDate') || undefined;
  const maxCloudCover = Number(request.nextUrl.searchParams.get('maxCloudCover') || 25);
  const maxResults = Number(request.nextUrl.searchParams.get('maxResults') || 3);
  const allowFallback = toBoolean(request.nextUrl.searchParams.get('allowFallback'), true);

  const ingestResult = await runSatelliteIngest(
    {
      aoi: resolvedAoi.aoi,
      startDate,
      endDate,
      maxCloudCover: Number.isFinite(maxCloudCover) ? maxCloudCover : 25,
      maxResults: Number.isFinite(maxResults) ? maxResults : 3,
    },
    {
      allowFallback,
    }
  );

  if (ingestResult.success) {
    const saveResult = await saveSatelliteIngestSnapshot({
      userId,
      aoi: ingestResult.metadata.aoi,
      provider: ingestResult.metadata.provider,
      collection: ingestResult.metadata.collection,
      dataSource: ingestResult.dataSource,
      sceneCount: ingestResult.scenes.length,
      scenes: ingestResult.scenes,
      maxCloudCover: ingestResult.metadata.maxCloudCover,
      requestedRange: ingestResult.metadata.requestedRange,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ingest: ingestResult,
          persistedSnapshotId: saveResult.id || null,
        },
        error: null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      data: {
        ingest: ingestResult,
      },
      error: ingestResult.error || 'Satellite ingest failed',
    },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'history') {
      const userId = request.nextUrl.searchParams.get('userId') || undefined;
      const aoiId = request.nextUrl.searchParams.get('aoiId') || undefined;
      const limitCount = Number(request.nextUrl.searchParams.get('limit') || 10);

      const history = await getSatelliteIngestHistory({
        userId,
        aoiId,
        limitCount: Number.isFinite(limitCount) ? limitCount : 10,
      });

      return NextResponse.json({
        success: true,
        data: {
          history,
        },
        error: null,
      });
    }

    return runIngest(request);
  } catch (error) {
    console.error('Satellite ingest route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process satellite ingest request',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
