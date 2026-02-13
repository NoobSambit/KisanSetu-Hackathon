/**
 * Dashboard Page (Phase 3 Enhanced)
 *
 * Comprehensive farmer dashboard featuring:
 * - Welcome overview with stats
 * - Weather widget (Phase 3)
 * - Saved advice management
 * - Recent activity feed
 * - Quick actions with new Phase 3 features
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  getDashboardStats,
  getSavedAdvice,
  getRecentActivities,
  deleteSavedAdvice,
} from '@/lib/firebase/firestore';
import {
  DashboardStats,
  SavedAdviceDocument,
  RecentActivity,
  WeatherData,
} from '@/types';
import {
  CloudSun,
  Satellite,
  Bot,
  Leaf,
  Coins,
  BookOpen,
  Zap,
  Bookmark,
  Inbox,
  History,
  MessageCircle,
  AlertCircle,
  Map
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    totalInteractions: 0,
    savedAdviceCount: 0,
    lastActivityTime: null,
  });
  const [savedAdvice, setSavedAdvice] = useState<SavedAdviceDocument[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      setLoading(true);
      try {
        const [statsData, savedData, activityData] = await Promise.all([
          getDashboardStats(user.uid),
          getSavedAdvice(user.uid),
          getRecentActivities(user.uid, 5),
        ]);

        setStats(statsData);
        setSavedAdvice(savedData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  // Fetch weather data
  useEffect(() => {
    async function fetchWeather() {
      try {
        setWeatherLoading(true);
        const response = await fetch('/api/weather?city=Delhi');
        const data = await response.json();
        if (data.success) {
          setWeather(data.data);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchWeather();
  }, []);

  const handleDeleteAdvice = async (adviceId: string) => {
    if (!confirm('Are you sure you want to delete this saved advice?')) {
      return;
    }

    setDeletingId(adviceId);
    const { success, error } = await deleteSavedAdvice(adviceId);

    if (success) {
      setSavedAdvice(savedAdvice.filter((item) => item.id !== adviceId));
      setStats({
        ...stats,
        savedAdviceCount: stats.savedAdviceCount - 1,
      });
    } else {
      alert(error || 'Failed to delete advice');
    }

    setDeletingId(null);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-neutral-50/50">
        <Container>
          {/* Skeleton UI */}
          <div className="animate-pulse space-y-8">
            <div className="h-12 w-1/3 bg-neutral-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>)}
            </div>
            <div className="h-64 bg-neutral-200 rounded-2xl"></div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-neutral-50">
      <Container>
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
              Dashboard
            </h1>
            <p className="text-neutral-500 text-lg">
              Welcome back, <span className="font-semibold text-primary-600">{user?.name || 'Farmer'}</span>!
            </p>
          </div>
          <p className="text-sm text-neutral-400 bg-white px-3 py-1 rounded-full border border-neutral-200">
            User ID: {user?.uid?.slice(0, 6)}...
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-slide-up">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-primary-100 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-4xl font-bold text-primary-700 mb-1">{stats.totalQuestions}</span>
              <span className="text-sm font-medium text-primary-600 uppercase tracking-wide">Questions Asked</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-4xl font-bold text-amber-700 mb-1">{stats.savedAdviceCount}</span>
              <span className="text-sm font-medium text-amber-600 uppercase tracking-wide">Saved Notes</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-lg font-bold text-indigo-700 mb-1 mt-2">{formatDate(stats.lastActivityTime)}</span>
              <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Last Active</span>
            </div>
          </Card>
        </div>

        {/* Weather Widget (Phase 3) */}
        <div className="mb-10 animate-slide-up animate-delay-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-blue-500" /> Local Weather
          </h2>
          {weatherLoading ? (
            <div className="h-40 bg-neutral-200 animate-pulse rounded-2xl" />
          ) : weather ? (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>

              <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    {weather.icon ? (
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.description}
                        className="w-16 h-16 drop-shadow-md"
                      />
                    ) : (
                      <CloudSun className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold">{weather.temperature}°C</h3>
                    <p className="text-blue-100 capitalize text-lg font-medium">{weather.description}</p>
                    <p className="text-sm text-blue-200 flex items-center gap-1 mt-1">
                      📍 {weather.location}
                    </p>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 flex gap-8 text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <div>
                    <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Humidity</div>
                    <div className="text-xl font-bold">{weather.humidity}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Wind</div>
                    <div className="text-xl font-bold">{weather.windSpeed} <span className="text-xs font-normal">km/h</span></div>
                  </div>
                  <div className="flex items-center">
                    <Link href="/weather">
                      <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                        Full Forecast
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {weather.farmingAdvice && (
                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-sm text-blue-50 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-200" />
                    <span>{weather.farmingAdvice}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-8">
                <p className="text-neutral-600">Weather data unavailable</p>
              </div>
            </Card>
          )}
        </div>

        {/* Satellite Analysis Entry */}
        <div className="mb-10 animate-slide-up animate-delay-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Satellite className="w-6 h-6 text-primary-600" /> Satellite Analysis
          </h2>
          <Card className="border-primary-100 bg-gradient-to-r from-primary-50 to-emerald-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-700">
                  Satellite health analysis now has its own dedicated page for full map overlays, zone-level details, alerts, and manual refresh.
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Open the Satellite page from navbar or use the button below.
                </p>
              </div>
              <Link
                href="/satellite"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Map className="w-4 h-4 mr-1" />
                Open Satellite Analysis
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 animate-slide-up animate-delay-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" /> Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/assistant">
              <button className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-5 py-3 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:shadow-md transition-all font-medium">
                <Bot className="w-6 h-6 text-primary-500" /> Ask AI Assistant
              </button>
            </Link>
            <Link href="/satellite">
              <button className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-5 py-3 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:shadow-md transition-all font-medium">
                <Satellite className="w-6 h-6 text-primary-500" /> Satellite Analysis
              </button>
            </Link>
            <Link href="/disease-detection">
              <button className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-5 py-3 rounded-xl hover:border-green-500 hover:text-green-600 hover:shadow-md transition-all font-medium">
                <Leaf className="w-6 h-6 text-green-500" /> Detect Disease
              </button>
            </Link>
            <Link href="/market-prices">
              <button className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-5 py-3 rounded-xl hover:border-orange-500 hover:text-orange-600 hover:shadow-md transition-all font-medium">
                <Coins className="w-6 h-6 text-orange-500" /> Check Prices
              </button>
            </Link>
            <Link href="/resources">
              <button className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-5 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all font-medium">
                <BookOpen className="w-6 h-6 text-blue-500" /> Browse Library
              </button>
            </Link>
          </div>
        </div>

        {/* Main Grid: Saved & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up animate-delay-200">
          {/* Saved Advice */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-primary-600" /> Saved Advice
              </h2>
              <span className="text-xs text-neutral-500 bg-white px-2 py-1 rounded-md border border-neutral-100">{savedAdvice.length} items</span>
            </div>

            {savedAdvice.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-8 text-center opacity-70">
                <div className="flex justify-center mb-3">
                  <Inbox className="w-10 h-10 text-neutral-400" />
                </div>
                <p className="text-neutral-500 mb-4">No saved advice yet.</p>
                <Link href="/assistant">
                  <Button variant="outline" size="sm">Get Started</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedAdvice.map((advice) => (
                  <div key={advice.id} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="mb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-neutral-900 leading-snug pr-8 line-clamp-1">{advice.question}</h3>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex-shrink-0 bg-neutral-50 px-2 py-1 rounded">
                          {formatDate(advice.savedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-2 line-clamp-2 leading-relaxed">{advice.answer}</p>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-neutral-50 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteAdvice(advice.id!)}
                        disabled={deletingId === advice.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        {deletingId === advice.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <History className="w-6 h-6 text-neutral-600" /> Recent Activity
            </h2>

            {recentActivity.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-8 text-center opacity-70">
                <p className="text-neutral-500">No recent activity.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-4 bottom-4 w-px bg-neutral-200"></div>

                <div className="space-y-6 relative">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white border border-neutral-200 rounded-full flex items-center justify-center z-10 shadow-sm">
                        <MessageCircle className="w-5 h-5 text-neutral-500" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex-grow shadow-sm hover:shadow-md transition-all">
                        <p className="font-medium text-neutral-800 mb-1">{activity.message}</p>
                        {activity.preview && (
                          <p className="text-sm text-neutral-500 line-clamp-1 mb-2 italic">"{activity.preview}"</p>
                        )}
                        <p className="text-xs text-neutral-400">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
