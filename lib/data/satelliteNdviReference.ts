export interface SatelliteNdviReference {
  ndviMean: number;
  zoneDeltas: [number, number, number];
}

/**
 * Curated NDVI priors for fallback/demo scenes.
 * These are deterministic references used when spectral bands are not fetched in this MVP stage.
 */
export const SATELLITE_NDVI_REFERENCE_BY_SCENE: Record<string, SatelliteNdviReference> = {
  S2B_MSIL2A_20260205T044859_N0512_R076_T45QUC_20260205T101322_SAFE: {
    ndviMean: 0.67,
    zoneDeltas: [0.03, 0, -0.05],
  },
  S2B_MSIL2A_20260126T044959_N0511_R076_T45QUC_20260126T083358_SAFE: {
    ndviMean: 0.62,
    zoneDeltas: [0.01, -0.02, -0.04],
  },
};

export function normalizeSceneIdForLookup(sceneId: string): string {
  return sceneId.replace(/\./g, '_');
}
