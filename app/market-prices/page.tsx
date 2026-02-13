/**
 * Market/Mandi Price Intelligence Page (Phase 3)
 * Real-time crop prices and market data
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
import type { CropPrice } from '@/types';
import { Coins, TrendingUp, TrendingDown, Minus, BarChart3, ArrowRight } from 'lucide-react';

export default function MarketPricesPage() {
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popularCrops, setPopularCrops] = useState<string[]>([]);

  useEffect(() => {
    logPageView('/market-prices', user?.uid);
    loadPopularCrops();
  }, [user]);

  const loadPopularCrops = async () => {
    try {
      const response = await fetch('/api/prices?action=crops');
      const data = await response.json();
      if (data.success) {
        setPopularCrops(data.data);
      }
    } catch (err) {
      console.error('Failed to load crops:', err);
    }
  };

  const fetchPrices = async () => {
    if (!selectedCrop) {
      setError('Please select a crop');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        crop: selectedCrop,
        ...(selectedState && { state: selectedState }),
        ...(user?.uid && { userId: user.uid }),
      });

      const response = await fetch(`/api/prices?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prices');
      }

      setPrices(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      setPrices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-neutral-400" />;
  };

  return (
    <div className="bg-neutral-50 min-h-screen pt-20 pb-12">
      <Container>
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-block p-3 rounded-full bg-green-100 text-green-600 mb-4 shadow-sm">
            <Coins className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">Market Intelligence</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Real-time mandi prices to help you make the best selling decisions.
          </p>
        </div>

        {/* Filter Bar */}
        <Card className="p-6 mb-10 bg-white shadow-lg border-none animate-slide-up animate-delay-100">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="">Select Crop</option>
                {popularCrops.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="">All States</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
              </select>
            </div>

            <Button onClick={fetchPrices} disabled={isLoading || !selectedCrop} size="lg" className="w-full">
              {isLoading ? 'Loading...' : 'Check Prices'}
            </Button>
          </div>
        </Card>

        {error && <div className="mb-6"><AlertCard type="error" message={error} /></div>}

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Fetching latest mandi rates..." />
          </div>
        )}

        {!isLoading && prices.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">
                Latest {selectedCrop} Prices
              </h2>
              <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-neutral-200 text-neutral-500">
                {prices.length} Markets Found
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prices.map((price, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900">{price.market}</h3>
                        <p className="text-sm text-neutral-500">{price.district}, {price.state}</p>
                      </div>
                      {price.trend && (
                        <span title={`${price.trend} trend`}>{getTrendIcon(price.trend)}</span>
                      )}
                    </div>

                    <div className="py-4 border-t border-b border-neutral-50 my-4 text-center">
                      <div className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Model Price</div>
                      <div className="text-3xl font-extrabold text-green-700">₹{price.modalPrice}</div>
                      <div className="text-xs text-neutral-400 mt-1">per {price.unit}</div>
                    </div>

                    <div className="flex justify-between text-sm text-neutral-600">
                      <div>Min: <span className="font-semibold">₹{price.minPrice}</span></div>
                      <div>Max: <span className="font-semibold">₹{price.maxPrice}</span></div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-50 text-[10px] text-neutral-400 flex justify-between">
                      <span>Variety: {price.variety || 'Standard'}</span>
                      <span>{price.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && prices.length === 0 && !error && (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-neutral-300 flex flex-col items-center justify-center">
            <div className="mb-4 opacity-30">
              <BarChart3 className="w-16 h-16 text-neutral-400" />
            </div>
            <p className="text-lg text-neutral-500 font-medium">No price data to display</p>
            <p className="text-sm text-neutral-400">Select a crop and state to view prices</p>
          </div>
        )}
      </Container>
    </div>
  );
}
