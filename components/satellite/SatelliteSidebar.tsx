import React from 'react';
import { SatelliteHealthInsight, SatelliteHealthResponseMetadata } from '@/types';

interface SatelliteSidebarProps {
    health: SatelliteHealthInsight | null;
    metadata: SatelliteHealthResponseMetadata | null;
    loading: boolean;
}

export default function SatelliteSidebar({ health, metadata, loading }: SatelliteSidebarProps) {
    if (loading) {
        return (
            <aside className="w-full md:w-[360px] bg-background-light dark:bg-surface-dark border-r md:border-l border-gray-200 dark:border-gray-800 overflow-y-auto custom-scrollbar flex flex-col z-20 shadow-xl h-full p-4 space-y-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
            </aside>
        );
    }

    if (!health) {
        return (
            <aside className="w-full md:w-[360px] bg-background-light dark:bg-surface-dark border-r md:border-l border-gray-200 dark:border-gray-800 overflow-y-auto custom-scrollbar flex flex-col z-20 shadow-xl h-full p-4">
                <div className="text-center text-gray-500 py-10">
                    <span className="material-icons text-4xl mb-2">satellite_alt</span>
                    <p>No satellite data available.</p>
                </div>
            </aside>
        );
    }

    const capturedAt = health.currentScene?.capturedAt || metadata?.sourceScene.capturedAt;
    const capturedDate = capturedAt ? new Date(capturedAt) : new Date();

    // Calculate relative time
    const timeDiff = Date.now() - capturedDate.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} Days Ago`;

    return (
        <aside className="w-full md:w-[360px] bg-background-light dark:bg-surface-dark border-r md:border-l border-gray-200 dark:border-gray-800 overflow-y-auto custom-scrollbar flex flex-col z-20 shadow-xl flex-1 md:h-full md:flex-none">
            <div className="p-5 space-y-5">

                {/* Timestamp Card */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Satellite Timestamp</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{timeLabel}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Acquired: {capturedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • {capturedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
                            <span className="material-icons">calendar_today</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 text-blue-500/5 pointer-events-none">
                        <span className="material-icons text-[80px]">satellite</span>
                    </div>
                </div>

                {/* Health Summary */}
                <div className="bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons text-primary text-lg">monitor_heart</span>
                            Health Summary
                        </h4>
                        <span className={`bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full font-medium ${health.scoreDelta < 0 ? 'text-red-500 bg-red-500/10' : ''}`}>
                            {health.scoreDelta > 0 ? '+' : ''}{health.scoreDelta}% vs baseline
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            {/* Circular Progress */}
                            <svg className="transform -rotate-90 w-24 h-24">
                                <circle cx="48" cy="48" fill="transparent" r="36" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700"></circle>
                                <circle
                                    cx="48" cy="48" fill="transparent" r="36" stroke="currentColor"
                                    strokeDasharray="226.2"
                                    strokeDashoffset={226.2 - (226.2 * health.normalizedHealthScore) / 100}
                                    strokeLinecap="round"
                                    strokeWidth="8"
                                    className="text-primary"
                                ></circle>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{health.normalizedHealthScore}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-medium">/ 100</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Chlorophyll</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">High</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Moisture</span>
                                    <span className="font-medium text-amber-500">Avg</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '55%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {health.stressSignals.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 shadow-sm">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                                    <span className="material-icons">warning_amber</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-600 dark:text-amber-500 text-sm">{health.stressSignals[0].type.replace(/_/g, ' ').toUpperCase()} Alert</h4>
                                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
                                    {health.stressSignals[0].message}
                                </p>
                                <button className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-300 hover:underline flex items-center gap-1">
                                    View Affected Zone <span className="material-icons text-[10px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Recommendations */}
                <div className="bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Recommendations</h4>
                        <span className="material-icons text-gray-400 text-sm">psychology</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {health.recommendations.slice(0, 3).map((rec, idx) => (
                            <div key={rec.id} className={idx > 0 ? "border-t border-gray-100 dark:border-gray-800 pt-3" : ""}>
                                <div className="flex gap-3 items-start">
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${rec.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        <span className="material-icons text-sm">
                                            {rec.priority === 'high' ? 'priority_high' : 'lightbulb'}
                                        </span>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200">{rec.title}</h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                            {rec.rationale}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                        <button className="w-full py-1.5 text-center text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                            View All Actions
                        </button>
                    </div>
                </div>

                <div className="text-center pt-4 pb-2">
                    <p className="text-[10px] text-gray-400">Data provided by Sentinel-2 • Updated 48h ago</p>
                </div>
            </div>
        </aside>
    );
}
