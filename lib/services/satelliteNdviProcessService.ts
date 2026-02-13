import { CDSE_PROCESS_URL, getCDSEAccessToken, validateCDSEEnv } from '@/lib/services/cdseClient';
import { SatelliteAOI, SatelliteSceneMetadata } from '@/types';

const DEFAULT_NDVI_IMAGE_SIZE = 384;

interface NdviRasterRequest {
  aoi: SatelliteAOI;
  scene: SatelliteSceneMetadata;
  maxCloudCover?: number;
  width?: number;
  height?: number;
}

export interface NdviRasterResult {
  success: boolean;
  imageDataUrl: string | null;
  imageBbox: [number, number, number, number];
  error: string | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toUtcDayRange(capturedAt: string): { from: string; to: string } {
  const capturedDate = new Date(capturedAt);
  if (Number.isNaN(capturedDate.getTime())) {
    const fallback = new Date();
    const from = new Date(Date.UTC(
      fallback.getUTCFullYear(),
      fallback.getUTCMonth(),
      fallback.getUTCDate(),
      0,
      0,
      0
    ));
    const to = new Date(Date.UTC(
      fallback.getUTCFullYear(),
      fallback.getUTCMonth(),
      fallback.getUTCDate(),
      23,
      59,
      59
    ));
    return { from: from.toISOString(), to: to.toISOString() };
  }

  const from = new Date(Date.UTC(
    capturedDate.getUTCFullYear(),
    capturedDate.getUTCMonth(),
    capturedDate.getUTCDate(),
    0,
    0,
    0
  ));
  const to = new Date(Date.UTC(
    capturedDate.getUTCFullYear(),
    capturedDate.getUTCMonth(),
    capturedDate.getUTCDate(),
    23,
    59,
    59
  ));
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildNdviEvalscript(): string {
  return `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { bands: 4, sampleType: "UINT8" }
  };
}

function evaluatePixel(sample) {
  if (sample.dataMask === 0) {
    return [0, 0, 0, 0];
  }

  var ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.000001);
  var r = 34;
  var g = 197;
  var b = 94;

  if (ndvi < 0.2) {
    r = 239; g = 68; b = 68;
  } else if (ndvi < 0.4) {
    r = 245; g = 158; b = 11;
  } else if (ndvi < 0.6) {
    r = 132; g = 204; b = 22;
  }

  return [r, g, b, 170];
}`;
}

export async function generateNdviRaster(params: NdviRasterRequest): Promise<NdviRasterResult> {
  const envStatus = validateCDSEEnv();
  if (!envStatus.ok) {
    return {
      success: false,
      imageDataUrl: null,
      imageBbox: params.aoi.bbox,
      error: envStatus.message || 'CDSE environment is not configured.',
    };
  }

  try {
    const token = await getCDSEAccessToken();
    const timeRange = toUtcDayRange(params.scene.capturedAt);
    const maxCloudCover = clamp(Math.round(params.maxCloudCover ?? 35), 0, 100);
    const width = clamp(Math.round(params.width ?? DEFAULT_NDVI_IMAGE_SIZE), 128, 1024);
    const height = clamp(Math.round(params.height ?? DEFAULT_NDVI_IMAGE_SIZE), 128, 1024);

    const response = await fetch(CDSE_PROCESS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          bounds: {
            bbox: params.aoi.bbox,
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange,
                maxCloudCoverage: maxCloudCover,
                mosaickingOrder: 'mostRecent',
              },
            },
          ],
        },
        output: {
          width,
          height,
          responses: [
            {
              identifier: 'default',
              format: {
                type: 'image/png',
              },
            },
          ],
        },
        evalscript: buildNdviEvalscript(),
      }),
    });

    if (!response.ok) {
      const rawText = await response.text();
      return {
        success: false,
        imageDataUrl: null,
        imageBbox: params.aoi.bbox,
        error: `CDSE NDVI process failed (${response.status}): ${rawText.slice(0, 200)}`,
      };
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = contentType.includes('image/') ? contentType : 'image/png';

    return {
      success: true,
      imageDataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
      imageBbox: params.aoi.bbox,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      imageDataUrl: null,
      imageBbox: params.aoi.bbox,
      error: error instanceof Error ? error.message : 'Failed to generate NDVI raster.',
    };
  }
}
