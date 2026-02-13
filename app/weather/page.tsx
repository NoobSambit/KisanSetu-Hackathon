/**
 * Weather Intelligence Page (Phase 3)
 * Real-time weather data with farming-specific advice
 */

'use client';

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AlertCard from '@/components/ui/AlertCard';
import { useAuth } from '@/lib/context/AuthContext';
import { logPageView } from '@/lib/services/analyticsService';
import type { WeatherData, WeatherAlert } from '@/types';

export default function WeatherPage() {
  const { user } = useAuth();
  const [city, setCity] = useState('Delhi');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logPageView('/weather', user?.uid);
    fetchWeather('Delhi');
  }, [user]);

  const fetchWeather = async (cityName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        city: cityName,
        ...(user?.uid && { userId: user.uid }),
      });

      const response = await fetch(`/api/weather?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch weather');
      }

      setWeather(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city.trim());
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: position.coords.latitude.toString(),
            lon: position.coords.longitude.toString(),
            ...(user?.uid && { userId: user.uid }),
          });

          const response = await fetch(`/api/weather?${params}`);
          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error);
          }

          setWeather(data.data);
          setCity(data.data.location);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch weather'
          );
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location');
        setIsLoading(false);
      }
    );
  };

  const getAlertIcon = (type: WeatherAlert['type']) => {
    const icons = {
      'extreme-heat': '🌡️',
      'heavy-rain': '🌧️',
      frost: '❄️',
      wind: '💨',
      general: 'ℹ️',
    };
    return icons[type];
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-primary-50 min-h-screen pt-20 pb-12">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

      <Container className="relative z-10">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-block p-3 rounded-full bg-blue-100 text-blue-600 mb-4 text-3xl shadow-sm">
            🌤️
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4 tracking-tight">
            Weather Intelligence
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Precision forecasts and farming insights to help you plan your day.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 animate-slide-up animate-delay-100">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name..."
              className="w-full pl-6 pr-32 py-4 rounded-full border border-neutral-200 shadow-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-lg"
            />
            <div className="absolute right-2 top-2 bottom-2 flex gap-2">
              <Button type="button" onClick={useCurrentLocation} size="sm" variant="ghost" className="rounded-full w-10 h-10 !p-0" title="Use Current Location">
                📍
              </Button>
              <Button type="submit" size="sm" className="rounded-full px-6" disabled={isLoading}>
                {isLoading ? '...' : 'Search'}
              </Button>
            </div>
          </form>
          {error && <div className="mt-4"><AlertCard type="error" message={error} /></div>}
        </div>


        {isLoading && !weather ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Analyzing weather patterns..." />
          </div>
        ) : weather ? (
          <div className="space-y-8 animate-fade-in">
            {/* Main Weather Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-6xl font-bold mb-2 tracking-tight">{weather.location}</h2>
                  <p className="text-xl text-blue-100 font-medium capitalize flex items-center justify-center md:justify-start gap-2">
                    <span>{weather.description}</span>
                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">Today</span>
                  </p>

                  <div className="mt-8 flex gap-8 justify-center md:justify-start">
                    <div>
                      <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Humidity</div>
                      <div className="text-2xl font-bold">{weather.humidity}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Wind</div>
                      <div className="text-2xl font-bold">{weather.windSpeed} km/h</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Rain</div>
                      <div className="text-2xl font-bold">{weather.rainProbability}%</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                    alt={weather.description}
                    className="w-40 h-40 drop-shadow-lg filter brightness-110"
                  />
                  <div className="text-7xl font-bold tracking-tighter">
                    {Math.round(weather.temperature)}°
                  </div>
                  <p className="text-blue-100 mt-1">Feels like {Math.round(weather.feelsLike)}°</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Farming Advice */}
              <div className="lg:col-span-2">
                <Card className="h-full border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 p-2 rounded-lg text-2xl">👨‍🌾</span>
                      Farming Advisory
                    </h3>
                    <p className="text-lg text-neutral-700 leading-relaxed">
                      {weather.farmingAdvice || "Conditions are favorable for general field activities. Monitor soil moisture levels."}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Alerts */}
              <div className="lg:col-span-1">
                {weather.alerts && weather.alerts.length > 0 ? (
                  <div className="space-y-4">
                    {weather.alerts.map((alert, index) => (
                      <div key={index} className={`p-5 rounded-2xl border ${alert.severity === 'high' ? 'bg-red-50 border-red-200 text-red-900' :
                          alert.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            'bg-blue-50 border-blue-200 text-blue-900'
                        }`}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-1">{getAlertIcon(alert.type)}</span>
                          <div>
                            <div className="font-bold flex items-center gap-2 mb-1">
                              {alert.message}
                              {alert.severity === 'high' && <span className="text-[10px] bg-red-200 px-1.5 py-0.5 rounded uppercase tracking-wider">High</span>}
                            </div>
                            <p className="text-sm opacity-90">{alert.advice}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="h-full bg-green-50/50 border-green-100 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-4xl mb-3 text-green-600">✅</div>
                    <h3 className="font-bold text-green-900 mb-1">No Alerts</h3>
                    <p className="text-sm text-green-700">Conditions are stable in your area.</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Practical Tips */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/40">
              <h3 className="text-xl font-bold text-neutral-800 mb-6">💡 Smart Farming Tips for Today</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: '💧', text: `Irrigation: ${weather.rainProbability > 40 ? 'Postpone' : 'As needed'}` },
                  { icon: '💊', text: `Spraying: ${weather.windSpeed > 15 ? 'Avoid (Windy)' : 'Favorable'}` },
                  { icon: '🚜', text: `Field Work: ${weather.rainProbability > 70 ? 'Avoid' : 'Good'}` },
                  { icon: '🌡️', text: `Heat Stress: ${weather.temperature > 35 ? 'High Risk' : 'Low Risk'}` }
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
                    <span className="text-2xl">{tip.icon}</span>
                    <span className="font-medium text-neutral-700">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : null}
      </Container>
    </div>
  );
}
