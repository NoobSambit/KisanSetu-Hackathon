import { DEFAULT_DEMO_AOI } from '@/lib/data/satelliteFallbackScenes';
import {
  normalizeSceneIdForLookup,
  SATELLITE_NDVI_REFERENCE_BY_SCENE,
} from '@/lib/data/satelliteNdviReference';
import { runSatelliteIngest } from '@/lib/services/satelliteIngestService';
import {
  SatelliteAOI,
  SatelliteAoiSource,
  SatelliteActionRecommendation,
  SatelliteHealthAlert,
  SatelliteHealthInsight,
  SatelliteHealthMapOverlay,
  SatelliteSceneMetadata,
  SatelliteStressSignal,
  SatelliteZoneHealth,
} from '@/types';

interface SatelliteHealthAnalysisRequest {
  aoi?: SatelliteAOI;
  aoiSource?: SatelliteAoiSource;
  geometryUsed?: boolean;
  farmBoundaryPolygon?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  allowFallback?: boolean;
  maxCloudCover?: number;
  maxResults?: number;
  currentWindowDays?: number;
  baselineOffsetDays?: number;
  baselineWindowDays?: number;
}

export interface SatelliteHealthAnalysisResult {
  success: boolean;
  dataSource: 'live_cdse' | 'fallback_sample';
  insight: SatelliteHealthInsight | null;
  metadata: {
    aoi: SatelliteAOI;
    aoiSource: SatelliteAoiSource;
    geometryUsed: boolean;
    currentRequestedRange: {
      startDate: string;
      endDate: string;
    };
    baselineRequestedRange: {
      startDate: string;
      endDate: string;
    };
    currentSceneCount: number;
    baselineSceneCount: number;
  };
  error: string | null;
}

interface SceneEstimate {
  ndviEstimate: number;
  zoneNdvi: [number, number, number];
  confidence: number;
  method: 'reference_seed' | 'metadata_proxy';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

function asDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function shiftDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function ndviToScore(ndvi: number): number {
  return Math.round(clamp((ndvi - 0.15) / 0.65, 0, 1) * 100);
}

function scoreToLabel(score: number): SatelliteHealthInsight['scoreLabel'] {
  if (score >= 75) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'watch';
  return 'critical';
}

function scoreToZoneStatus(score: number): SatelliteZoneHealth['status'] {
  if (score >= 65) return 'healthy';
  if (score >= 40) return 'watch';
  return 'critical';
}

function deltaToTrend(delta: number): SatelliteHealthInsight['trend'] {
  if (delta >= 4) return 'up';
  if (delta <= -4) return 'down';
  return 'stable';
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function deriveMetadataProxy(scene: SatelliteSceneMetadata): SceneEstimate {
  const capturedAt = new Date(scene.capturedAt);
  const month = capturedAt.getUTCMonth() + 1;
  const seasonCurve = 0.5 + 0.13 * Math.sin((month / 12) * 2 * Math.PI);
  const hashDrift = ((hashString(scene.sceneId) % 100) / 100 - 0.5) * 0.18;
  const cloudPenalty = clamp(scene.cloudCover, 0, 80) / 320;
  const ndviEstimate = clamp(seasonCurve + hashDrift - cloudPenalty, 0.12, 0.86);

  const spread = 0.04 + ((hashString(`${scene.sceneId}-spread`) % 8) / 100);
  const zoneNdvi: [number, number, number] = [
    clamp(ndviEstimate + spread * 0.8, 0.1, 0.9),
    clamp(ndviEstimate - spread * 0.2, 0.1, 0.9),
    clamp(ndviEstimate - spread, 0.1, 0.9),
  ];

  return {
    ndviEstimate: round(ndviEstimate, 3),
    zoneNdvi: [round(zoneNdvi[0], 3), round(zoneNdvi[1], 3), round(zoneNdvi[2], 3)],
    confidence: round(clamp(0.58 - scene.cloudCover / 180 + (scene.cloudCover < 15 ? 0.08 : 0), 0.28, 0.76)),
    method: 'metadata_proxy',
  };
}

function deriveSceneEstimate(scene: SatelliteSceneMetadata): SceneEstimate {
  const reference = SATELLITE_NDVI_REFERENCE_BY_SCENE[normalizeSceneIdForLookup(scene.sceneId)];

  if (!reference) {
    return deriveMetadataProxy(scene);
  }

  const cloudPenalty = clamp(scene.cloudCover, 0, 50) / 1000;
  const ndviEstimate = clamp(reference.ndviMean - cloudPenalty, 0.1, 0.9);
  const zoneNdvi: [number, number, number] = [
    clamp(ndviEstimate + reference.zoneDeltas[0], 0.1, 0.9),
    clamp(ndviEstimate + reference.zoneDeltas[1], 0.1, 0.9),
    clamp(ndviEstimate + reference.zoneDeltas[2], 0.1, 0.9),
  ];

  return {
    ndviEstimate: round(ndviEstimate, 3),
    zoneNdvi: [round(zoneNdvi[0], 3), round(zoneNdvi[1], 3), round(zoneNdvi[2], 3)],
    confidence: round(clamp(0.84 - scene.cloudCover / 220, 0.45, 0.9)),
    method: 'reference_seed',
  };
}

function buildStressSignals(params: {
  currentScore: number;
  scoreDelta: number;
  zoneScores: number[];
  currentCloudCover: number;
  confidence: number;
}): SatelliteStressSignal[] {
  const { currentScore, scoreDelta, zoneScores, currentCloudCover, confidence } = params;
  const minZone = Math.min(...zoneScores);
  const maxZone = Math.max(...zoneScores);
  const zoneSpread = maxZone - minZone;
  const signals: SatelliteStressSignal[] = [];

  if (currentScore < 45 || scoreDelta <= -10) {
    signals.push({
      type: 'water_stress',
      confidence: round(clamp(0.55 + Math.abs(scoreDelta) / 40, 0.45, 0.9)),
      message: 'Vegetation vigor has dropped. Check irrigation timing and soil moisture immediately.',
    });
  }

  if (currentScore >= 40 && currentScore < 65 && zoneSpread >= 15) {
    signals.push({
      type: 'nutrient_stress',
      confidence: round(clamp(0.5 + zoneSpread / 80, 0.4, 0.86)),
      message: 'Uneven canopy strength across zones indicates potential nutrient imbalance.',
    });
  }

  if (minZone < 35 && zoneSpread >= 18) {
    signals.push({
      type: 'pest_or_disease_risk',
      confidence: round(clamp(0.45 + (35 - minZone) / 60, 0.35, 0.8)),
      message: 'One zone is significantly weaker. Prioritize visual scouting for pest or disease pockets.',
    });
  }

  if (currentCloudCover > 30 || confidence < 0.6) {
    signals.push({
      type: 'cloud_uncertainty',
      confidence: round(clamp(0.5 + currentCloudCover / 150, 0.45, 0.82)),
      message: 'Cloud/metadata limitations reduce certainty. Confirm with a quick physical field check.',
    });
  }

  if (scoreDelta >= 8) {
    signals.push({
      type: 'growth_recovery',
      confidence: round(clamp(0.55 + scoreDelta / 40, 0.45, 0.9)),
      message: 'Crop vigor is improving versus baseline. Maintain current agronomy practices.',
    });
  }

  return signals;
}

function buildRecommendations(stressSignals: SatelliteStressSignal[]): SatelliteActionRecommendation[] {
  const byType = new Set(stressSignals.map((signal) => signal.type));
  const recommendations: SatelliteActionRecommendation[] = [];

  if (byType.has('water_stress')) {
    recommendations.push({
      id: 'water-balance-check',
      title: 'Run soil moisture check today',
      rationale: 'Recent satellite health dip suggests moisture deficit risk in one or more zones.',
      priority: 'high',
      confidence: 0.82,
    });
  }

  if (byType.has('nutrient_stress')) {
    recommendations.push({
      id: 'nutrient-correction',
      title: 'Do a targeted nutrient correction',
      rationale: 'Zone variation pattern is consistent with uneven nutrient uptake.',
      priority: 'medium',
      confidence: 0.74,
    });
  }

  if (byType.has('pest_or_disease_risk')) {
    recommendations.push({
      id: 'pest-scouting',
      title: 'Scout weaker zone for pest/disease',
      rationale: 'Localized low-vigor patch may indicate early pest or disease onset.',
      priority: 'high',
      confidence: 0.76,
    });
  }

  if (byType.has('cloud_uncertainty')) {
    recommendations.push({
      id: 'field-verification',
      title: 'Verify with field walk',
      rationale: 'Observation confidence is reduced due to cloud/metadata uncertainty.',
      priority: 'medium',
      confidence: 0.68,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'maintain-practice',
      title: 'Maintain current crop routine',
      rationale: 'No major stress pattern detected in current scan compared with baseline.',
      priority: 'low',
      confidence: 0.7,
    });
  }

  return recommendations.slice(0, 4).map((item) => ({
    ...item,
    confidence: round(item.confidence),
  }));
}

function buildAlerts(params: {
  currentScore: number;
  scoreDelta: number;
  confidence: number;
  currentCloudCover: number;
}): SatelliteHealthAlert[] {
  const { currentScore, scoreDelta, confidence, currentCloudCover } = params;
  const alerts: SatelliteHealthAlert[] = [];

  if (currentScore < 35) {
    alerts.push({
      severity: 'critical',
      code: 'health-critical-drop',
      title: 'Critical crop health alert',
      message: 'Vegetation health score is below 35. Immediate field verification is recommended.',
    });
  } else if (scoreDelta <= -12) {
    alerts.push({
      severity: 'warning',
      code: 'health-decline',
      title: 'Health decline detected',
      message: 'Current crop health dropped significantly versus baseline. Prioritize intervention.',
    });
  }

  if (confidence < 0.6 || currentCloudCover > 30) {
    alerts.push({
      severity: 'info',
      code: 'low-observation-confidence',
      title: 'Low confidence observation',
      message: 'Cloud/metadata constraints may impact precision. Validate with on-ground inspection.',
    });
  }

  return alerts;
}

function buildSummaryCardText(params: {
  currentScore: number;
  scoreDelta: number;
  weakestZone: SatelliteZoneHealth;
  scoreLabel: SatelliteHealthInsight['scoreLabel'];
}): string {
  const { currentScore, scoreDelta, weakestZone, scoreLabel } = params;
  const healthWordByLabel: Record<SatelliteHealthInsight['scoreLabel'], string> = {
    excellent: 'very strong',
    good: 'stable',
    watch: 'under watch',
    critical: 'critical',
  };

  const deltaText =
    scoreDelta > 3
      ? `${Math.abs(scoreDelta)} points above baseline`
      : scoreDelta < -3
        ? `${Math.abs(scoreDelta)} points below baseline`
        : 'close to baseline';

  return `Crop health is ${healthWordByLabel[scoreLabel]} (${currentScore}/100), ${deltaText}. ${weakestZone.zoneLabel} needs ${weakestZone.status === 'critical' ? 'immediate attention' : 'monitoring'}.`;
}

function buildUncertaintyNote(params: {
  currentCloudCover: number;
  usedProxy: boolean;
  dataSource: 'live_cdse' | 'fallback_sample';
}): string | undefined {
  if (params.dataSource === 'fallback_sample') {
    return 'Insight generated from fallback sample scenes; verify with the latest live scan before major decisions.';
  }

  if (params.currentCloudCover > 25 || params.usedProxy) {
    return 'This insight uses metadata-driven NDVI estimation. Cloud cover may reduce precision, so validate critical actions in-field.';
  }

  return undefined;
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

function buildZoneOverlayPolygons(
  bbox: [number, number, number, number],
  zones: SatelliteZoneHealth[]
): SatelliteHealthMapOverlay['zonePolygons'] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const zoneCount = Math.max(zones.length, 1);
  const latStep = (maxLat - minLat) / zoneCount;

  return zones.map((zone, index) => {
    const zoneTop = maxLat - index * latStep;
    const zoneBottom = index === zoneCount - 1 ? minLat : maxLat - (index + 1) * latStep;

    return {
      zoneId: zone.zoneId,
      zoneLabel: zone.zoneLabel,
      status: zone.status,
      normalizedHealthScore: zone.normalizedHealthScore,
      trend: zone.trend,
      coordinates: [[
        [minLon, zoneTop],
        [maxLon, zoneTop],
        [maxLon, zoneBottom],
        [minLon, zoneBottom],
        [minLon, zoneTop],
      ]],
    };
  });
}

function buildMapOverlay(params: {
  aoi: SatelliteAOI;
  aoiSource: SatelliteAoiSource;
  farmBoundaryPolygon?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  zones: SatelliteZoneHealth[];
  sceneFootprintBbox?: [number, number, number, number] | null;
}): SatelliteHealthMapOverlay {
  return {
    strategy: 'estimated_zones',
    aoiSource: params.aoiSource,
    farmBoundary: params.farmBoundaryPolygon || bboxToPolygon(params.aoi.bbox),
    zonePolygons: buildZoneOverlayPolygons(params.aoi.bbox, params.zones),
    sceneFootprintBbox: params.sceneFootprintBbox || undefined,
    legend: [
      {
        key: 'healthy',
        label: 'Healthy',
        scoreMin: 65,
        scoreMax: 100,
        color: '#22c55e',
      },
      {
        key: 'watch',
        label: 'Watch',
        scoreMin: 40,
        scoreMax: 64,
        color: '#f59e0b',
      },
      {
        key: 'critical',
        label: 'Critical',
        scoreMin: 0,
        scoreMax: 39,
        color: '#ef4444',
      },
    ],
    disclaimer:
      'Zone colors are model-estimated from metadata/reference NDVI trends, not true per-pixel NDVI raster values.',
  };
}

export async function runSatelliteHealthAnalysis(
  request: SatelliteHealthAnalysisRequest
): Promise<SatelliteHealthAnalysisResult> {
  const now = new Date();
  const aoi = request.aoi || DEFAULT_DEMO_AOI;
  const aoiSource = request.aoiSource || 'demo_fallback';
  const geometryUsed = request.geometryUsed ?? false;
  const allowFallback = request.allowFallback ?? true;
  const maxCloudCover = request.maxCloudCover ?? 35;
  const maxResults = request.maxResults ?? 3;
  const currentWindowDays = request.currentWindowDays ?? 35;
  const baselineOffsetDays = request.baselineOffsetDays ?? 90;
  const baselineWindowDays = request.baselineWindowDays ?? 35;

  const currentEndDate = asDateString(now);
  const currentStartDate = asDateString(shiftDays(now, -currentWindowDays));

  const baselineEndDate = asDateString(shiftDays(now, -baselineOffsetDays));
  const baselineStartDate = asDateString(shiftDays(now, -(baselineOffsetDays + baselineWindowDays)));

  const [currentIngest, baselineIngest] = await Promise.all([
    runSatelliteIngest(
      {
        aoi,
        startDate: currentStartDate,
        endDate: currentEndDate,
        maxCloudCover,
        maxResults,
      },
      { allowFallback }
    ),
    runSatelliteIngest(
      {
        aoi,
        startDate: baselineStartDate,
        endDate: baselineEndDate,
        maxCloudCover,
        maxResults,
      },
      { allowFallback }
    ),
  ]);

  const metadata = {
    aoi,
    aoiSource,
    geometryUsed,
    currentRequestedRange: {
      startDate: currentStartDate,
      endDate: currentEndDate,
    },
    baselineRequestedRange: {
      startDate: baselineStartDate,
      endDate: baselineEndDate,
    },
    currentSceneCount: currentIngest.scenes.length,
    baselineSceneCount: baselineIngest.scenes.length,
  };

  if (!currentIngest.success || currentIngest.scenes.length === 0) {
    return {
      success: false,
      dataSource: currentIngest.dataSource,
      insight: null,
      metadata,
      error: currentIngest.error || 'No current satellite scenes available for health analysis.',
    };
  }

  const currentScene = currentIngest.scenes[0];
  const currentEstimate = deriveSceneEstimate(currentScene);
  const baselineEstimates = (baselineIngest.scenes.length ? baselineIngest.scenes : currentIngest.scenes).map(
    (scene) => deriveSceneEstimate(scene)
  );

  const baselineNdviEstimate = round(average(baselineEstimates.map((item) => item.ndviEstimate)), 3);
  const baselineZoneNdvi: [number, number, number] = [
    round(average(baselineEstimates.map((item) => item.zoneNdvi[0])), 3),
    round(average(baselineEstimates.map((item) => item.zoneNdvi[1])), 3),
    round(average(baselineEstimates.map((item) => item.zoneNdvi[2])), 3),
  ];

  const normalizedHealthScore = ndviToScore(currentEstimate.ndviEstimate);
  const baselineScore = ndviToScore(baselineNdviEstimate);
  const scoreDelta = normalizedHealthScore - baselineScore;

  const zoneLabels = ['North Zone', 'Central Zone', 'South Zone'];
  const zones: SatelliteZoneHealth[] = currentEstimate.zoneNdvi.map((zoneNdvi, index) => {
    const zoneScore = ndviToScore(zoneNdvi);
    const baselineZoneScore = ndviToScore(baselineZoneNdvi[index]);
    return {
      zoneId: `zone-${index + 1}`,
      zoneLabel: zoneLabels[index],
      normalizedHealthScore: zoneScore,
      ndviEstimate: round(zoneNdvi, 3),
      trend: deltaToTrend(zoneScore - baselineZoneScore),
      status: scoreToZoneStatus(zoneScore),
    };
  });

  const confidenceSignals = [currentEstimate.confidence, average(baselineEstimates.map((item) => item.confidence))];
  let confidence = average(confidenceSignals);

  if (currentIngest.dataSource === 'fallback_sample') {
    confidence -= 0.08;
  }
  if (baselineIngest.dataSource === 'fallback_sample') {
    confidence -= 0.05;
  }
  if (currentIngest.scenes.length + baselineIngest.scenes.length >= 4) {
    confidence += 0.05;
  }
  confidence = round(clamp(confidence, 0.28, 0.9));

  const stressSignals = buildStressSignals({
    currentScore: normalizedHealthScore,
    scoreDelta,
    zoneScores: zones.map((zone) => zone.normalizedHealthScore),
    currentCloudCover: currentScene.cloudCover,
    confidence,
  });

  const recommendations = buildRecommendations(stressSignals);
  const alerts = buildAlerts({
    currentScore: normalizedHealthScore,
    scoreDelta,
    confidence,
    currentCloudCover: currentScene.cloudCover,
  });

  const scoreLabel = scoreToLabel(normalizedHealthScore);
  const weakestZone = zones.reduce((weakest, zone) =>
    zone.normalizedHealthScore < weakest.normalizedHealthScore ? zone : weakest
  );
  const dataSource =
    currentIngest.dataSource === 'fallback_sample' || baselineIngest.dataSource === 'fallback_sample'
      ? 'fallback_sample'
      : 'live_cdse';

  const insight: SatelliteHealthInsight = {
    generatedAt: new Date().toISOString(),
    dataSource,
    confidence,
    scoreLabel,
    normalizedHealthScore,
    baselineScore,
    scoreDelta,
    trend: deltaToTrend(scoreDelta),
    ndviEstimate: currentEstimate.ndviEstimate,
    baselineNdviEstimate,
    summaryCardText: buildSummaryCardText({
      currentScore: normalizedHealthScore,
      scoreDelta,
      weakestZone,
      scoreLabel,
    }),
    uncertaintyNote: buildUncertaintyNote({
      currentCloudCover: currentScene.cloudCover,
      usedProxy: currentEstimate.method === 'metadata_proxy',
      dataSource,
    }),
    currentScene,
    baselineSceneCount: baselineIngest.scenes.length,
    zones,
    stressSignals,
    recommendations,
    alerts,
    mapOverlay: buildMapOverlay({
      aoi,
      aoiSource,
      farmBoundaryPolygon: request.farmBoundaryPolygon,
      zones,
      sceneFootprintBbox: currentScene.bbox,
    }),
  };

  return {
    success: true,
    dataSource,
    insight,
    metadata,
    error: null,
  };
}
