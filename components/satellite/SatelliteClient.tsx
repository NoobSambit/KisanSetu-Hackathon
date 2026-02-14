'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/context/AuthContext';
import { SatelliteHealthInsight, SatelliteHealthResponseMetadata } from '@/types';
import DashboardHeader from '@/components/dashboard/Header';
import DashboardSidebar from '@/components/dashboard/Sidebar'; // Global Sidebar
import SatelliteSidebar from './SatelliteSidebar'; // Local Info Sidebar

// Dynamic import for Map
const MapVisualizer = dynamic(() => import('@/components/satellite/MapVisualizer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-surface-darker flex items-center justify-center">
            <div className="text-center">
                <span className="material-icons text-primary text-4xl animate-spin">satellite_alt</span>
                <p className="text-gray-400 mt-2 text-sm">Initializing Satellite Feed...</p>
            </div>
        </div>
    ),
});

export default function SatelliteClient() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [satelliteHealth, setSatelliteHealth] = useState<SatelliteHealthInsight | null>(null);
    const [satelliteMetadata, setSatelliteMetadata] = useState<SatelliteHealthResponseMetadata | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Global sidebar
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

            try {
                if (manualRefresh) setRefreshing(true);
                else setLoading(true);

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
                const data = await response.json();

                if (data.success && data.data?.health) {
                    setSatelliteHealth(data.data.health);
                    setSatelliteMetadata(data.data.metadata || null);
                }
            } catch (error) {
                console.error('Failed to fetch satellite insight:', error);
            } finally {
                setRefreshing(false);
                setLoading(false);
            }
        },
        [user]
    );

    useEffect(() => {
        fetchSatelliteHealth({ manualRefresh: false, allowFallback: true });
    }, [fetchSatelliteHealth]);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 antialiased overflow-hidden h-screen flex flex-col">
            <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Global Sidebar (Hidden on mobile by default) */}
                <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content: Map + Satellite Sidebar */}
                <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                    {/* Toolbar (Mobile Only or Integrated) */}
                    <div className="md:hidden bg-surface-dark border-b border-gray-800 p-2 flex justify-between items-center z-20">
                        <span className="text-sm font-semibold text-white flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">satellite_alt</span>
                            Satellite Map
                        </span>
                        <button
                            onClick={() => fetchSatelliteHealth({ manualRefresh: true, forceRefresh: true })}
                            className="p-1.5 bg-surface-darker rounded border border-gray-700 text-gray-300"
                        >
                            <span className={`material-icons text-sm ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>

                    {/* Map Area */}
                    <div className="h-[60vh] md:h-auto flex-none md:flex-1 relative bg-gray-900 z-10 transition-all">
                        {satelliteHealth?.mapOverlay ? (
                            <MapVisualizer
                                overlay={satelliteHealth.mapOverlay}
                                stressSignals={satelliteHealth.stressSignals}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-surface-darker text-gray-500 p-6 text-center">
                                {loading ? (
                                    <div className="animate-pulse flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                                        <div className="h-4 w-48 bg-gray-800 rounded mb-2"></div>
                                        <div className="h-3 w-32 bg-gray-800 rounded"></div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-icons text-6xl mb-4 opacity-20">satellite_alt</span>
                                        <h3 className="text-xl font-bold text-gray-300">No Satellite Data Found</h3>
                                        <p className="max-w-md mt-2 mb-6 text-sm">
                                            We couldn't find a farm boundary or recent satellite imagery.
                                            Please update your Farm Profile with a map selection.
                                        </p>
                                        <button
                                            onClick={() => fetchSatelliteHealth({ manualRefresh: true, allowFallback: true, forceRefresh: true })}
                                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <span className="material-icons">refresh</span> Retry Scan
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Floating Toolbar (Desktop) */}
                        <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2">
                            <div className="bg-surface-dark/90 backdrop-blur border border-gray-700 rounded-lg p-1 flex">
                                <button
                                    onClick={() => fetchSatelliteHealth({ manualRefresh: true, forceRefresh: true })}
                                    className="px-3 py-1.5 rounded-md hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <span className={`material-icons text-[14px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                                    Refresh Data
                                </button>
                                <div className="w-px bg-gray-700 my-1 mx-1"></div>
                                <button className="px-3 py-1.5 rounded-md hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                                    <span className="material-icons text-[14px]">layers</span>
                                    Layers
                                </button>
                                <div className="w-px bg-gray-700 my-1 mx-1"></div>
                                <button className="px-3 py-1.5 rounded-md hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                                    <span className="material-icons text-[14px]">share</span>
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Satellite Info Sidebar */}
                    <SatelliteSidebar
                        health={satelliteHealth}
                        metadata={satelliteMetadata}
                        loading={loading}
                    />
                </main>
            </div>
        </div>
    );
}
