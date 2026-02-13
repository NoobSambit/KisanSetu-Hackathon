'use client';

import { useMemo } from 'react';
import { ImageOverlay, MapContainer, Polygon, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SatelliteHealthMapOverlay, SatelliteStressSignal } from '@/types';

interface SatelliteHealthMapProps {
  overlay: SatelliteHealthMapOverlay;
  stressSignals?: SatelliteStressSignal[];
  height?: number;
  className?: string;
}

type LatLonPair = [number, number];

function toLatLonPairs(polygonCoords: number[][]): LatLonPair[] {
  return polygonCoords.map((coord) => [coord[1], coord[0]]);
}

function getBoundsFromPolygon(polygonCoords: number[][]): [[number, number], [number, number]] {
  const lats = polygonCoords.map((coord) => coord[1]);
  const lons = polygonCoords.map((coord) => coord[0]);

  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
}

function statusColor(status: 'healthy' | 'watch' | 'critical'): string {
  if (status === 'healthy') return '#22c55e';
  if (status === 'watch') return '#f59e0b';
  return '#ef4444';
}

function trendLabel(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return 'Improving';
  if (trend === 'down') return 'Declining';
  return 'Stable';
}

function FitToBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
  return null;
}

export default function SatelliteHealthMap({
  overlay,
  stressSignals,
  height = 360,
  className,
}: SatelliteHealthMapProps) {
  const fallbackRing: number[][] = [
    [78.8, 20.7],
    [79.1, 20.7],
    [79.1, 20.4],
    [78.8, 20.4],
    [78.8, 20.7],
  ];
  const farmRing = (overlay.farmBoundary.coordinates[0] || []).length >= 4
    ? overlay.farmBoundary.coordinates[0]
    : fallbackRing;
  const farmPolygon = toLatLonPairs(farmRing);
  const bounds = getBoundsFromPolygon(farmRing);
  const hasRasterOverlay = overlay.strategy === 'ndvi_raster' && !!overlay.imageDataUrl && !!overlay.imageBbox;

  const topSignal = useMemo(() => {
    if (!stressSignals || stressSignals.length === 0) return null;
    return [...stressSignals].sort((a, b) => b.confidence - a.confidence)[0];
  }, [stressSignals]);

  return (
    <div className={className}>
      <div className="relative rounded-xl overflow-hidden border border-neutral-200">
        <MapContainer
          center={farmPolygon[0] || [20.5937, 78.9629]}
          zoom={15}
          scrollWheelZoom
          className="w-full"
          style={{ minHeight: `${height}px`, height: `${height}px` }}
        >
          <FitToBounds bounds={bounds} />

          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.7}
          />

          {hasRasterOverlay && overlay.imageBbox ? (
            <ImageOverlay
              url={overlay.imageDataUrl || ''}
              bounds={[
                [overlay.imageBbox[1], overlay.imageBbox[0]],
                [overlay.imageBbox[3], overlay.imageBbox[2]],
              ]}
              opacity={0.55}
              zIndex={350}
            />
          ) : null}

          {overlay.zonePolygons.map((zone) => {
            const zoneRing = zone.coordinates[0] || [];
            return (
              <Polygon
                key={zone.zoneId}
                positions={toLatLonPairs(zoneRing)}
                pathOptions={{
                  color: statusColor(zone.status),
                  weight: 2,
                  fillColor: statusColor(zone.status),
                  fillOpacity: hasRasterOverlay ? 0.08 : 0.34,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-neutral-900">{zone.zoneLabel}</p>
                    <p className="text-neutral-700">Score: {zone.normalizedHealthScore}/100</p>
                    <p className="text-neutral-700">Trend: {trendLabel(zone.trend)}</p>
                    {topSignal ? (
                      <p className="text-neutral-600">Top signal: {topSignal.message}</p>
                    ) : null}
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          <Polygon
            positions={farmPolygon}
            pathOptions={{
              color: '#0f172a',
              weight: 3,
              fillOpacity: 0,
              dashArray: '6 4',
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold text-neutral-900">Farm Boundary</p>
                <p className="text-neutral-700">Source: {overlay.aoiSource.replace(/_/g, ' ')}</p>
              </div>
            </Popup>
          </Polygon>

          {overlay.sceneFootprintBbox ? (
            <Rectangle
              bounds={[
                [overlay.sceneFootprintBbox[1], overlay.sceneFootprintBbox[0]],
                [overlay.sceneFootprintBbox[3], overlay.sceneFootprintBbox[2]],
              ]}
              pathOptions={{
                color: '#2563eb',
                weight: 2,
                fillOpacity: 0,
                dashArray: '4 4',
              }}
            >
              <Popup>
                <p className="text-xs font-medium text-neutral-800">Current scene footprint</p>
              </Popup>
            </Rectangle>
          ) : null}
        </MapContainer>

        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-sm p-2 text-[11px] space-y-1 z-[500] max-w-[220px]">
          <p className="text-[10px] font-semibold text-neutral-600">Zone Score Colors</p>
          {overlay.legend.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-neutral-700">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              <span>{item.label} ({item.scoreMin}-{item.scoreMax})</span>
            </div>
          ))}
          {hasRasterOverlay ? (
            <p className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-200">
              Raster hint: red = low vigor, green = strong vigor.
            </p>
          ) : null}
        </div>

        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-sm px-3 py-2 text-[11px] text-neutral-600 z-[500]">
          {overlay.disclaimer}
        </div>
      </div>
    </div>
  );
}
