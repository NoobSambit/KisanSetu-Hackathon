'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { SatelliteAoiSource, SatelliteHealthInsight, SatelliteHealthResponseMetadata } from '@/types';
import { AlertCircle, ArrowLeft, RefreshCcw, Satellite } from 'lucide-react';

const SatelliteHealthMap = dynamic(() => import('@/components/SatelliteHealthMap'), {
  ssr: false,
});

function describeAoiSource(source?: SatelliteAoiSource): string {
  if (source === 'profile_land_geometry') {
    return 'Using your saved farm boundary from map selection.';
  }

  if (source === 'query_bbox') {
    return 'Using custom query area override.';
  }

  return 'Using demo fallback area. Save farm boundary in Farm Profile for accurate field scan.';
}

function formatSatelliteCaptured(capturedAt?: string | null): string {
  if (!capturedAt) return 'Unknown';
  const value = new Date(capturedAt);
  if (Number.isNaN(value.getTime())) return 'Unknown';
  return value.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDataAgeLabel(capturedAt?: string | null): string {
  if (!capturedAt) return 'Unknown age';
  const value = new Date(capturedAt);
  if (Number.isNaN(value.getTime())) return 'Unknown age';

  const now = Date.now();
  const diffMs = now - value.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day(s) old`;
  if (diffHours > 0) return `${diffHours} hour(s) old`;
  return 'Captured recently';
}

const NDVI_RASTER_COLOR_GUIDE = [
  { label: 'Low vigor (NDVI < 0.20)', color: '#ef4444' },
  { label: 'Watch area (0.20 - 0.40)', color: '#f59e0b' },
  { label: 'Moderate vigor (0.40 - 0.60)', color: '#84cc16' },
  { label: 'Strong vigor (> 0.60)', color: '#22c55e' },
] as const;

export default function SatellitePage() {
  return (
    <ProtectedRoute>
      <SatellitePageContent />
    </ProtectedRoute>
  );
}

function SatellitePageContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [coverageNote, setCoverageNote] = useState('');
  const [dataSource, setDataSource] = useState<'live_cdse' | 'fallback_sample' | null>(null);
  const [satelliteMetadata, setSatelliteMetadata] = useState<SatelliteHealthResponseMetadata | null>(null);
  const [satelliteHealth, setSatelliteHealth] = useState<SatelliteHealthInsight | null>(null);
  const satelliteHealthRef = useRef<SatelliteHealthInsight | null>(null);

  useEffect(() => {
    satelliteHealthRef.current = satelliteHealth;
  }, [satelliteHealth]);

  const fetchSatelliteHealth = useCallback(
    async (options?: { manualRefresh?: boolean; allowFallback?: boolean; forceRefresh?: boolean }) => {
      if (!user) return;

      const manualRefresh = options?.manualRefresh ?? false;
      const allowFallback = options?.allowFallback ?? true;
      const forceRefresh = options?.forceRefresh ?? false;
      const previousHealth = satelliteHealthRef.current;

      try {
        setError(null);
        setNotice(null);
        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          userId: user.uid,
          allowFallback: allowFallback ? 'true' : 'false',
          maxResults: '3',
          precisionMode: 'high_accuracy',
          useCache: 'true',
          forceRefresh: forceRefresh ? 'true' : 'false',
          cacheTtlHours: '24',
        });

        const response = await fetch(`/api/satellite/health?${params.toString()}`);
        const rawBody = await response.text();
        let data: {
          success?: boolean;
          error?: string | null;
          data?: {
            health?: SatelliteHealthInsight;
            dataSource?: 'live_cdse' | 'fallback_sample';
            metadata?: SatelliteHealthResponseMetadata;
          };
        } | null = null;

        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          data = null;
        }

        if (!response.ok || !data?.success || !data.data?.health) {
          const message = data?.error || 'Satellite health insight unavailable.';
          // Keep existing scan visible when live manual refresh fails.
          if (manualRefresh && !allowFallback && previousHealth) {
            setNotice(`Live refresh failed: ${message}. Showing your previous scan.`);
            return;
          }

          setSatelliteHealth(null);
          satelliteHealthRef.current = null;
          setSatelliteMetadata(null);
          setCoverageNote('');
          setDataSource(null);
          setError(message);
          return;
        }

        setSatelliteHealth(data.data.health);
        setSatelliteMetadata(data.data.metadata || null);
        setDataSource(
          data.data?.dataSource || data.data.health?.dataSource || null
        );
        const source =
          data.data?.metadata?.aoiSource || data.data.health?.mapOverlay?.aoiSource;
        setCoverageNote(describeAoiSource(source));

        if (manualRefresh) {
          if (data.data?.metadata?.cache?.staleFallbackUsed) {
            setNotice('Live refresh failed. Showing stale cached data to keep map available.');
          } else if (data.data?.metadata?.cache?.hit && !forceRefresh) {
            setNotice('Loaded cached satellite scan (within 24h cache window).');
          } else if (data.data?.dataSource === 'live_cdse') {
            setNotice('Live scan refreshed successfully.');
          } else if (data.data?.dataSource === 'fallback_sample') {
            setNotice('Refresh completed with fallback sample scenes (live feed unavailable right now).');
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch satellite insight:', fetchError);
        const message = 'Failed to fetch satellite insight. Please retry.';
        if (manualRefresh && previousHealth) {
          setNotice(`${message} Showing your previous scan.`);
        } else {
          setError(message);
        }
      } finally {
        if (manualRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    fetchSatelliteHealth({ manualRefresh: false, allowFallback: true, forceRefresh: false });
  }, [fetchSatelliteHealth]);

  const capturedAt =
    satelliteMetadata?.sourceScene?.capturedAt || satelliteHealth?.currentScene?.capturedAt || null;
  const capturedText = formatSatelliteCaptured(capturedAt);
  const dataAgeText = getDataAgeLabel(capturedAt);
  const isRasterOverlay = satelliteHealth?.mapOverlay?.strategy === 'ndvi_raster';

  return (
    <div className="min-h-screen pt-24 pb-24 bg-neutral-50">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Satellite className="w-6 h-6 text-primary-600" /> Interactive Satellite Map
            </h1>
            <p className="text-sm text-neutral-500 mt-1">Explore color-coded farm zones from the latest scan.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                fetchSatelliteHealth({
                  manualRefresh: true,
                  allowFallback: false,
                  forceRefresh: false,
                })
              }
              isLoading={refreshing}
            >
              <RefreshCcw className="w-4 h-4 mr-1" /> Refresh Scan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                fetchSatelliteHealth({
                  manualRefresh: true,
                  allowFallback: false,
                  forceRefresh: true,
                })
              }
              isLoading={refreshing}
            >
              Force Live Check
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                fetchSatelliteHealth({
                  manualRefresh: true,
                  allowFallback: true,
                  forceRefresh: true,
                })
              }
              isLoading={refreshing}
            >
              Refresh With Fallback
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-[520px] bg-neutral-200 animate-pulse rounded-2xl" />
        ) : error ? (
          <Card>
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="w-7 h-7 text-red-500 mx-auto" />
              <p className="text-sm text-red-700">{error}</p>
              <Button
                size="sm"
                onClick={() =>
                  fetchSatelliteHealth({ manualRefresh: true, allowFallback: true, forceRefresh: true })
                }
              >
                Retry
              </Button>
            </div>
          </Card>
        ) : satelliteHealth ? (
          <div className="space-y-4">
            {notice ? (
              <div className="text-xs rounded-lg p-2 border border-blue-200 bg-blue-50 text-blue-700">
                {notice}
              </div>
            ) : null}

            {coverageNote ? (
              <p className="text-xs text-neutral-500">{coverageNote}</p>
            ) : null}

            {dataSource === 'fallback_sample' ? (
              <div className="text-xs rounded-lg p-2 border border-amber-200 bg-amber-50 text-amber-700">
                Live satellite feed was unavailable. Showing fallback sample scenes for continuity.
              </div>
            ) : null}

            {satelliteHealth.mapOverlay?.aoiSource === 'demo_fallback' ? (
              <div className="text-xs rounded-lg p-2 border border-amber-200 bg-amber-50 text-amber-700">
                Demo fallback is active. Save farm map boundary in Farm Profile to target your actual field.
              </div>
            ) : null}

            {satelliteHealth.highAccuracyUnavailableReason ? (
              <div className="text-xs rounded-lg p-2 border border-amber-200 bg-amber-50 text-amber-700">
                High accuracy mode unavailable: {satelliteHealth.highAccuracyUnavailableReason}
              </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                {satelliteHealth.mapOverlay ? (
                  <SatelliteHealthMap
                    overlay={satelliteHealth.mapOverlay}
                    stressSignals={satelliteHealth.stressSignals}
                    height={560}
                  />
                ) : (
                  <Card>
                    <p className="text-sm text-neutral-600">Map overlay unavailable for this scan.</p>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Satellite Timestamp</p>
                  <p className="text-sm text-neutral-900 mt-2">
                    Satellite Captured: {capturedText}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">Data Age: {dataAgeText}</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Mode: {isRasterOverlay ? 'High-accuracy NDVI raster' : 'Estimated zone overlay'}
                  </p>
                  {satelliteMetadata?.cache ? (
                    <p className="text-xs text-neutral-500 mt-2">
                      Cache: {satelliteMetadata.cache.hit ? 'hit' : 'miss'} | TTL until{' '}
                      {satelliteMetadata.cache.expiresAt
                        ? formatSatelliteCaptured(satelliteMetadata.cache.expiresAt)
                        : 'N/A'}
                    </p>
                  ) : null}
                </Card>

                <Card>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Health Summary</p>
                  <p className="text-sm text-neutral-700 mt-2">{satelliteHealth.summaryCardText}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary-700">{satelliteHealth.normalizedHealthScore}</p>
                      <p className="text-xs text-neutral-500">Health Score / 100</p>
                    </div>
                    <p className={`text-xs font-semibold ${satelliteHealth.scoreDelta >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                      {satelliteHealth.scoreDelta >= 0 ? '+' : ''}
                      {satelliteHealth.scoreDelta} vs baseline
                    </p>
                  </div>
                </Card>

                <Card>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Color Labels</p>
                  <div className="mt-2 space-y-2">
                    {(satelliteHealth.mapOverlay?.legend || []).map((item) => (
                      <div key={item.key} className="flex items-center gap-2 text-xs text-neutral-700">
                        <span
                          className="inline-block h-3 w-3 rounded-sm border border-neutral-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>
                          {item.label}: {item.scoreMin}-{item.scoreMax} score
                        </span>
                      </div>
                    ))}
                  </div>

                  {isRasterOverlay ? (
                    <div className="mt-3 border-t border-neutral-200 pt-2 space-y-2">
                      <p className="text-[11px] font-semibold text-neutral-600">NDVI Raster Colors</p>
                      {NDVI_RASTER_COLOR_GUIDE.map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs text-neutral-700">
                          <span
                            className="inline-block h-3 w-3 rounded-sm border border-neutral-300"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>

                <Card>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Recommendations</p>
                  <div className="mt-2 space-y-2">
                    {satelliteHealth.recommendations.map((item) => (
                      <div key={item.id} className="text-xs border border-neutral-200 rounded-lg p-2">
                        <p className="font-semibold text-neutral-900">{item.title}</p>
                        <p className="text-neutral-600 mt-1">{item.rationale}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {satelliteHealth.alerts.length > 0 ? (
                  <Card>
                    <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Alerts</p>
                    <div className="mt-2 space-y-2">
                      {satelliteHealth.alerts.map((alert) => (
                        <div
                          key={alert.code}
                          className={`text-xs rounded-lg p-2 ${alert.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : alert.severity === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                        >
                          <strong>{alert.title}:</strong> {alert.message}
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {satelliteHealth.uncertaintyNote ? (
                  <Card>
                    <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Uncertainty Note</p>
                    <p className="text-xs text-neutral-600 mt-2">{satelliteHealth.uncertaintyNote}</p>
                  </Card>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-neutral-600">Satellite health insight unavailable.</p>
          </Card>
        )}
      </Container>
    </div>
  );
}
