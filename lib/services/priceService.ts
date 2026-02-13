/**
 * Market/Mandi Price Intelligence Service (Phase 3)
 *
 * Provides crop price data, trends, and market insights
 * Integrates with government APIs or provides structured mock data
 */

import {
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
} from '../utils/errorHandler';
import { cache } from '../utils/cache';

export interface CropPrice {
  cropName: string;
  variety?: string;
  market: string;
  state: string;
  district?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number; // Most common price
  unit: string;
  date: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  previousPrice?: number;
}

export interface MarketData {
  market: string;
  state: string;
  district?: string;
  prices: CropPrice[];
  lastUpdated: string;
}

export interface PriceComparison {
  crop: string;
  markets: {
    name: string;
    price: number;
    distance?: string;
  }[];
  bestMarket: string;
  priceDifference: number;
}

/**
 * Get current prices for a specific crop
 */
export async function getCropPrices(
  cropName: string,
  state?: string
): Promise<ServiceResponse<CropPrice[]>> {
  try {
    const cacheKey = `prices:${cropName}:${state || 'all'}`;
    const cached = cache.get<CropPrice[]>(cacheKey);

    if (cached) {
      return createSuccessResponse(cached);
    }

    // For MVP, use mock data
    // In production, integrate with Agmarknet API or similar
    const prices = await fetchMockPrices(cropName, state);

    // Cache for 2 hours (prices don't change frequently)
    cache.set(cacheKey, prices, 7200);

    return createSuccessResponse(prices);
  } catch (error) {
    console.error('Price fetch error:', error);
    return createErrorResponse(
      'Failed to fetch crop prices. Please try again.',
      'PRICE_FETCH_FAILED'
    );
  }
}

/**
 * Get prices for a specific market
 */
export async function getMarketPrices(
  marketName: string,
  state: string
): Promise<ServiceResponse<MarketData>> {
  try {
    const cacheKey = `market:${marketName}:${state}`;
    const cached = cache.get<MarketData>(cacheKey);

    if (cached) {
      return createSuccessResponse(cached);
    }

    const marketData = await fetchMockMarketData(marketName, state);

    cache.set(cacheKey, marketData, 7200);
    return createSuccessResponse(marketData);
  } catch (error) {
    console.error('Market data fetch error:', error);
    return createErrorResponse(
      'Failed to fetch market data. Please try again.',
      'MARKET_FETCH_FAILED'
    );
  }
}

/**
 * Compare prices across multiple markets
 */
export async function comparePricesAcrossMarkets(
  cropName: string,
  markets: string[]
): Promise<ServiceResponse<PriceComparison>> {
  try {
    const comparison = await generatePriceComparison(cropName, markets);
    return createSuccessResponse(comparison);
  } catch (error) {
    console.error('Price comparison error:', error);
    return createErrorResponse(
      'Failed to compare prices. Please try again.',
      'COMPARISON_FAILED'
    );
  }
}

/**
 * Get price trends for a crop
 */
export async function getPriceTrends(
  cropName: string,
  days: number = 30
): Promise<
  ServiceResponse<{
    crop: string;
    trends: { date: string; price: number }[];
    averagePrice: number;
    trend: 'up' | 'down' | 'stable';
  }>
> {
  try {
    const trends = await generateMockTrends(cropName, days);
    return createSuccessResponse(trends);
  } catch (error) {
    console.error('Trend fetch error:', error);
    return createErrorResponse(
      'Failed to fetch price trends. Please try again.',
      'TREND_FETCH_FAILED'
    );
  }
}

/**
 * Mock price data (to be replaced with real API)
 */
async function fetchMockPrices(
  cropName: string,
  state?: string
): Promise<CropPrice[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const cropDatabase: Record<string, Partial<CropPrice>[]> = {
    wheat: [
      {
        cropName: 'Wheat',
        variety: 'Sharbati',
        market: 'Indore Mandi',
        state: 'Madhya Pradesh',
        district: 'Indore',
        minPrice: 2050,
        maxPrice: 2150,
        modalPrice: 2100,
        unit: 'Rs/Quintal',
        trend: 'up',
        trendPercentage: 3.5,
        previousPrice: 2030,
      },
      {
        cropName: 'Wheat',
        variety: 'Lok-1',
        market: 'Delhi Mandi',
        state: 'Delhi',
        minPrice: 2000,
        maxPrice: 2100,
        modalPrice: 2050,
        unit: 'Rs/Quintal',
        trend: 'stable',
        trendPercentage: 0.5,
        previousPrice: 2040,
      },
    ],
    rice: [
      {
        cropName: 'Rice',
        variety: 'Basmati',
        market: 'Karnal Mandi',
        state: 'Haryana',
        district: 'Karnal',
        minPrice: 3500,
        maxPrice: 3800,
        modalPrice: 3650,
        unit: 'Rs/Quintal',
        trend: 'up',
        trendPercentage: 5.2,
        previousPrice: 3470,
      },
      {
        cropName: 'Rice',
        variety: 'IR-64',
        market: 'Guntur Mandi',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        minPrice: 1900,
        maxPrice: 2100,
        modalPrice: 2000,
        unit: 'Rs/Quintal',
        trend: 'down',
        trendPercentage: -2.3,
        previousPrice: 2047,
      },
    ],
    tomato: [
      {
        cropName: 'Tomato',
        market: 'Azadpur Mandi',
        state: 'Delhi',
        minPrice: 800,
        maxPrice: 1200,
        modalPrice: 1000,
        unit: 'Rs/Quintal',
        trend: 'up',
        trendPercentage: 15.5,
        previousPrice: 865,
      },
      {
        cropName: 'Tomato',
        market: 'Pune Mandi',
        state: 'Maharashtra',
        district: 'Pune',
        minPrice: 700,
        maxPrice: 1000,
        modalPrice: 850,
        unit: 'Rs/Quintal',
        trend: 'stable',
        trendPercentage: 1.2,
        previousPrice: 840,
      },
    ],
    onion: [
      {
        cropName: 'Onion',
        market: 'Lasalgaon Mandi',
        state: 'Maharashtra',
        district: 'Nashik',
        minPrice: 1200,
        maxPrice: 1500,
        modalPrice: 1350,
        unit: 'Rs/Quintal',
        trend: 'down',
        trendPercentage: -8.5,
        previousPrice: 1476,
      },
    ],
    potato: [
      {
        cropName: 'Potato',
        market: 'Agra Mandi',
        state: 'Uttar Pradesh',
        district: 'Agra',
        minPrice: 900,
        maxPrice: 1100,
        modalPrice: 1000,
        unit: 'Rs/Quintal',
        trend: 'stable',
        trendPercentage: 0.8,
        previousPrice: 992,
      },
    ],
  };

  const today = new Date().toISOString().split('T')[0];

  const prices =
    cropDatabase[cropName.toLowerCase()] ||
    cropDatabase.wheat ||
    [];

  return prices.map((p) => ({
    ...p,
    date: today,
  })) as CropPrice[];
}

/**
 * Mock market data
 */
async function fetchMockMarketData(
  marketName: string,
  state: string
): Promise<MarketData> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const wheatPrices = await fetchMockPrices('wheat');
  const ricePrices = await fetchMockPrices('rice');
  const tomatoPrices = await fetchMockPrices('tomato');

  const allPrices = [...wheatPrices, ...ricePrices, ...tomatoPrices].filter(
    (p) => p.market.toLowerCase().includes(marketName.toLowerCase())
  );

  return {
    market: marketName,
    state,
    prices: allPrices,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate price comparison
 */
async function generatePriceComparison(
  cropName: string,
  markets: string[]
): Promise<PriceComparison> {
  const prices = await fetchMockPrices(cropName);

  const marketPrices = markets.map((market) => {
    const price =
      prices.find((p) => p.market.toLowerCase().includes(market.toLowerCase()))
        ?.modalPrice || 0;

    return {
      name: market,
      price,
      distance: `${Math.floor(Math.random() * 100 + 10)} km`,
    };
  });

  const sortedMarkets = [...marketPrices].sort((a, b) => b.price - a.price);

  return {
    crop: cropName,
    markets: marketPrices,
    bestMarket: sortedMarkets[0].name,
    priceDifference: sortedMarkets[0].price - sortedMarkets[sortedMarkets.length - 1].price,
  };
}

/**
 * Generate mock price trends
 */
async function generateMockTrends(
  cropName: string,
  days: number
): Promise<{
  crop: string;
  trends: { date: string; price: number }[];
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
}> {
  const basePrice = 2000;
  const trends: { date: string; price: number }[] = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const variation = Math.sin(i / 10) * 200 + Math.random() * 100;
    const price = Math.round(basePrice + variation);

    trends.push({
      date: date.toISOString().split('T')[0],
      price,
    });
  }

  const averagePrice = Math.round(
    trends.reduce((sum, t) => sum + t.price, 0) / trends.length
  );

  const firstPrice = trends[0].price;
  const lastPrice = trends[trends.length - 1].price;
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change > 2) trend = 'up';
  if (change < -2) trend = 'down';

  return {
    crop: cropName,
    trends,
    averagePrice,
    trend,
  };
}

/**
 * Get list of popular crops
 */
export function getPopularCrops(): string[] {
  return [
    'Wheat',
    'Rice',
    'Tomato',
    'Onion',
    'Potato',
    'Cotton',
    'Sugarcane',
    'Maize',
    'Pulses',
    'Groundnut',
  ];
}

/**
 * Get list of major markets
 */
export function getMajorMarkets(): { name: string; state: string }[] {
  return [
    { name: 'Azadpur Mandi', state: 'Delhi' },
    { name: 'Lasalgaon Mandi', state: 'Maharashtra' },
    { name: 'Indore Mandi', state: 'Madhya Pradesh' },
    { name: 'Karnal Mandi', state: 'Haryana' },
    { name: 'Guntur Mandi', state: 'Andhra Pradesh' },
    { name: 'Bangalore Mandi', state: 'Karnataka' },
    { name: 'Kota Mandi', state: 'Rajasthan' },
    { name: 'Agra Mandi', state: 'Uttar Pradesh' },
  ];
}
