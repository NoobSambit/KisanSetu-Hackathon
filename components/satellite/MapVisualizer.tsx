'use client';

import { useMemo } from 'react';
import { ImageOverlay, MapContainer, Polygon, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SatelliteHealthMapOverlay, SatelliteStressSignal } from '@/types';

interface MapVisualizerProps {
    overlay: SatelliteHealthMapOverlay;
    stressSignals?: SatelliteStressSignal[];
    className?: string;
    onRefresh?: () => void;
    onLayers?: () => void;
    onShare?: () => void;
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
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    return null;
}

export default function MapVisualizer({
    overlay,
    stressSignals,
    className,
}: MapVisualizerProps) {
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
        <div className={`relative w-full h-full ${className}`}>
            {/* Pattern Overlay Effect (Optional - from HTML design) */}
            <div className="absolute inset-0 map-pattern opacity-10 pointer-events-none z-0"></div>

            <MapContainer
                center={farmPolygon[0] || [20.5937, 78.9629]}
                zoom={15}
                scrollWheelZoom
                className="w-full h-full z-10"
                style={{ background: '#0f172a' }} // Dark background for loading
            >
                <FitToBounds bounds={bounds} />

                {/* Satellite Base Layer */}
                <TileLayer
                    attribution='&copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                {/* Dark Labels */}
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                    opacity={0.8}
                />

                {/* Raster Overlay (NDVI Image) */}
                {hasRasterOverlay && overlay.imageBbox && (
                    <ImageOverlay
                        url={overlay.imageDataUrl || ''}
                        bounds={[
                            [overlay.imageBbox[1], overlay.imageBbox[0]],
                            [overlay.imageBbox[3], overlay.imageBbox[2]],
                        ]}
                        opacity={0.65}
                        zIndex={350}
                    />
                )}

                {/* Vector Polygons (Zones) */}
                {overlay.zonePolygons.map((zone) => {
                    const zoneRing = zone.coordinates[0] || [];
                    return (
                        <Polygon
                            key={zone.zoneId}
                            positions={toLatLonPairs(zoneRing)}
                            pathOptions={{
                                color: statusColor(zone.status),
                                weight: 1,
                                fillColor: statusColor(zone.status),
                                fillOpacity: hasRasterOverlay ? 0.1 : 0.4,
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="text-xs space-y-1 font-display">
                                    <p className="font-bold text-gray-900">{zone.zoneLabel}</p>
                                    <p className="text-gray-700">Score: {zone.normalizedHealthScore}/100</p>
                                    <p className="text-gray-700">Trend: {trendLabel(zone.trend)}</p>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Farm Boundary Dashed Line */}
                <Polygon
                    positions={farmPolygon}
                    pathOptions={{
                        color: '#fff',
                        weight: 2,
                        fillOpacity: 0,
                        dashArray: '8 4',
                        opacity: 0.8,
                    }}
                />
            </MapContainer>

            {/* Top Left: Live Feed Indicator */}
            <div className="absolute top-4 left-4 z-[500] bg-surface-dark/90 backdrop-blur rounded-lg px-3 py-2 shadow-md border border-gray-700 text-xs font-medium text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                LIVE Feed: Sentinel-2A
            </div>

            {/* Top Right: Legend */}
            <div className="absolute top-4 right-4 z-[500] bg-surface-dark/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-700 w-64">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="material-icons text-sm">palette</span>
                    NDVI Raster Colors
                </h3>
                <div className="flex items-center justify-between mb-1 text-[10px] font-medium text-gray-400">
                    <span>Low Vigor</span>
                    <span>High Vigor</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-700 mb-2 border border-black/20"></div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-center text-gray-400 mt-2">
                    <div className="bg-red-500/10 rounded py-1 border border-red-500/20">
                        <div className="font-bold text-red-500">0.1 - 0.3</div>
                        <div>Stressed</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded py-1 border border-yellow-500/20">
                        <div className="font-bold text-yellow-500">0.3 - 0.6</div>
                        <div>Moderate</div>
                    </div>
                    <div className="bg-green-500/10 rounded py-1 border border-green-500/20">
                        <div className="font-bold text-green-500">0.6 - 0.9</div>
                        <div>Healthy</div>
                    </div>
                </div>
            </div>

            {/* Bottom Right: Controls */}
            <div className="absolute bottom-6 right-6 z-[500] flex flex-col gap-2">
                <button className="w-10 h-10 bg-surface-dark border border-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-surface-darker transition-colors">
                    <span className="material-icons">add</span>
                </button>
                <button className="w-10 h-10 bg-surface-dark border border-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-surface-darker transition-colors">
                    <span className="material-icons">remove</span>
                </button>
                <button className="w-10 h-10 bg-surface-dark border border-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-surface-darker mt-2 transition-colors">
                    <span className="material-icons">my_location</span>
                </button>
            </div>

        </div>
    );
}
