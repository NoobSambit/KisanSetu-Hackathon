import { SatelliteAOI, SatelliteSceneMetadata } from '@/types';

export const DEFAULT_DEMO_AOI: SatelliteAOI = {
  aoiId: 'odisha-demo-aoi',
  name: 'Odisha Demo AOI',
  bbox: [85.2, 20.1, 85.45, 20.35],
};

export const FALLBACK_SATELLITE_SCENES: SatelliteSceneMetadata[] = [
  {
    sceneId: 'S2B_MSIL2A_20260205T044859_N0512_R076_T45QUC_20260205T101322.SAFE',
    capturedAt: '2026-02-05T05:02:58.594Z',
    cloudCover: 0,
    tileId: '45QUC',
    collection: 'sentinel-2-l2a',
    bbox: [85.2, 20.1, 85.45, 20.35],
    quicklookUrl: '',
  },
  {
    sceneId: 'S2B_MSIL2A_20260126T044959_N0511_R076_T45QUC_20260126T083358.SAFE',
    capturedAt: '2026-01-26T05:02:59.387Z',
    cloudCover: 0.01,
    tileId: '45QUC',
    collection: 'sentinel-2-l2a',
    bbox: [85.2, 20.1, 85.45, 20.35],
    quicklookUrl: '',
  },
];
