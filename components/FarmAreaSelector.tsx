'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import area from '@turf/area';
import { FarmLocation } from '@/types';
import Button from '@/components/ui/Button';
import { MapPin, X, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface FarmAreaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (geometry: FarmLocation['landGeometry']) => void;
  initialCenter?: { lat: number; lon: number };
  existingGeometry?: FarmLocation['landGeometry'];
}

// Component to center map on location
function MapCenterControl({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);
  
  return null;
}

export default function FarmAreaSelector({
  isOpen,
  onClose,
  onSave,
  initialCenter,
  existingGeometry,
}: FarmAreaSelectorProps) {
  const [selectedRectangle, setSelectedRectangle] = useState<number[][] | null>(null);
  const [calculatedAreaAcres, setCalculatedAreaAcres] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default: India center
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial center from props
  useEffect(() => {
    if (initialCenter?.lat && initialCenter?.lon) {
      setMapCenter([initialCenter.lat, initialCenter.lon]);
    }
  }, [initialCenter]);

  // Load existing geometry
  useEffect(() => {
    if (existingGeometry?.coordinates?.[0]) {
      const existingRing = existingGeometry.coordinates[0];
      const isClosedRing =
        existingRing.length > 1 &&
        existingRing[0]?.[0] === existingRing[existingRing.length - 1]?.[0] &&
        existingRing[0]?.[1] === existingRing[existingRing.length - 1]?.[1];

      setSelectedRectangle(isClosedRing ? existingRing.slice(0, -1) : existingRing);
      setCalculatedAreaAcres(existingGeometry.calculatedAreaAcres);
      return;
    }

    setSelectedRectangle(null);
    setCalculatedAreaAcres(0);
  }, [existingGeometry]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device/browser.');
      return;
    }

    setIsDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setMapCenter(newCenter);
        setIsDetectingLocation(false);
      },
      (err) => {
        const text =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please navigate manually on map.'
            : 'Unable to read location. Please try again or navigate manually on map.';
        setError(text);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const calculateRectangleArea = useCallback((coords: number[][]): number => {
    if (!coords || coords.length < 4) return 0;

    // Create GeoJSON polygon from rectangle coordinates
    const polygon = {
      type: 'Polygon' as const,
      coordinates: [[...coords, coords[0]]], // Close the polygon
    };

    // Calculate area in square meters using turf.js
    const areaSqMeters = area(polygon);
    
    // Convert to acres (1 acre = 4046.86 square meters)
    const areaAcres = areaSqMeters / 4046.86;
    
    return Math.round(areaAcres * 100) / 100; // Round to 2 decimal places
  }, []);

  const handleDrawCreated = (e: any) => {
    const { layerType, layer } = e;
    
    if (layerType === 'rectangle') {
      const latLngs = layer.getLatLngs()[0];
      const coords = latLngs.map((latLng: any) => [latLng.lng, latLng.lat]);
      
      setSelectedRectangle(coords);
      const areaAcres = calculateRectangleArea(coords);
      setCalculatedAreaAcres(areaAcres);
      setError(null);
    }
  };

  const handleDrawDeleted = () => {
    setSelectedRectangle(null);
    setCalculatedAreaAcres(0);
  };

  const handleClearSelection = () => {
    setSelectedRectangle(null);
    setCalculatedAreaAcres(0);
  };

  const handleSave = () => {
    if (!selectedRectangle || selectedRectangle.length < 4) {
      setError('Please select a farm area by drawing a rectangle on the map.');
      return;
    }

    // Calculate bounding box from rectangle coordinates
    const lons = selectedRectangle.map((c) => c[0]);
    const lats = selectedRectangle.map((c) => c[1]);
    
    const bbox: [number, number, number, number] = [
      Math.min(...lons), // minLon
      Math.min(...lats), // minLat
      Math.max(...lons), // maxLon
      Math.max(...lats), // maxLat
    ];

    // Calculate center point
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const centerLon = (bbox[0] + bbox[2]) / 2;
    const normalizedArea =
      calculatedAreaAcres > 0 ? calculatedAreaAcres : calculateRectangleArea(selectedRectangle);

    const geometry: FarmLocation['landGeometry'] = {
      type: 'Polygon',
      coordinates: [[...selectedRectangle, selectedRectangle[0]]], // Close polygon
      bbox,
      centerPoint: {
        lat: centerLat,
        lon: centerLon,
      },
      calculatedAreaAcres: normalizedArea,
      selectedAt: new Date().toISOString(),
    };

    onSave(geometry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Select Farm Area on Map</h2>
            <p className="text-sm text-neutral-500">
              Draw a rectangle around your farm for precise satellite monitoring
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2 text-sm text-blue-800">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">How to use:</p>
              <ol className="list-decimal list-inside mt-1 space-y-0.5 text-blue-700">
                <li>Click "Use My Location" or navigate to your farm manually</li>
                <li>Click the rectangle icon on the left toolbar</li>
                <li>Click and drag on the map to draw your farm boundary</li>
                <li>Click "Save Selection" when done</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-b border-neutral-100 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleUseCurrentLocation}
            isLoading={isDetectingLocation}
            size="sm"
            variant="outline"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Use My Location
          </Button>
          
          {selectedRectangle && (
            <Button
              onClick={handleClearSelection}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear Selection
            </Button>
          )}

          <div className="ml-auto flex items-center gap-4">
            {calculatedAreaAcres > 0 && (
              <div className="text-right">
                <p className="text-sm text-neutral-500">Selected Area</p>
                <p className="text-xl font-bold text-neutral-900">
                  {calculatedAreaAcres.toFixed(2)} acres
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 min-h-[400px] relative">
          <MapContainer
            center={mapCenter}
            zoom={16}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          >
            <MapCenterControl center={mapCenter} />
            
            {/* Satellite layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            
            {/* Labels layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
              opacity={0.7}
            />

            <FeatureGroup>
              <EditControl
                position="topleft"
                onCreated={handleDrawCreated}
                onDeleted={handleDrawDeleted}
                draw={{
                  rectangle: {
                    shapeOptions: {
                      color: '#10b981',
                      weight: 3,
                      fillOpacity: 0.2,
                    },
                  },
                  polygon: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                }}
                edit={{
                  edit: false,
                  remove: true,
                }}
              />
              
              {/* Show existing rectangle if any */}
              {selectedRectangle && (
                <Polygon
                  positions={selectedRectangle.map((c) => [c[1], c[0]])}
                  pathOptions={{
                    color: '#10b981',
                    weight: 3,
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </FeatureGroup>
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedRectangle}
            className={selectedRectangle ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <Check className="w-4 h-4 mr-1" />
            Save Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
