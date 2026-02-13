/**
 * Market/Mandi Price Intelligence API Route (Phase 3)
 *
 * GET /api/prices?crop=CropName&state=StateName
 * GET /api/prices?market=MarketName&state=StateName
 * Returns current crop prices and market data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCropPrices,
  getMarketPrices,
  getPopularCrops,
  getMajorMarkets,
} from '@/lib/services/priceService';
import { logPriceCheck } from '@/lib/services/analyticsService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const crop = searchParams.get('crop');
    const market = searchParams.get('market');
    const state = searchParams.get('state');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action'); // 'crops' or 'markets' for listing

    // Handle list actions
    if (action === 'crops') {
      const crops = getPopularCrops();
      return NextResponse.json({
        success: true,
        data: crops,
        error: null,
      });
    }

    if (action === 'markets') {
      const markets = getMajorMarkets();
      return NextResponse.json({
        success: true,
        data: markets,
        error: null,
      });
    }

    let result;

    // Get prices by market
    if (market && state) {
      result = await getMarketPrices(market, state);

      // Log to Firestore
      try {
        if (userId && db) {
          await addDoc(collection(db, 'priceChecks'), {
            userId,
            market,
            state,
            timestamp: serverTimestamp(),
          });
        }
      } catch (logError) {
        console.error('Error logging price check:', logError);
      }
    }
    // Get prices by crop
    else if (crop) {
      result = await getCropPrices(crop, state || undefined);

      // Log to Firestore
      try {
        if (userId && db) {
          await addDoc(collection(db, 'priceChecks'), {
            userId,
            crop,
            state: state || null,
            timestamp: serverTimestamp(),
          });
        }
      } catch (logError) {
        console.error('Error logging price check:', logError);
      }
    }
    // Missing required parameters
    else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Please provide either crop name or market name with state. Or use action=crops or action=markets to list available options.',
        },
        { status: 400 }
      );
    }

    // Log analytics (async, non-blocking)
    try {
      await logPriceCheck(userId || undefined, crop || undefined, market || undefined);
    } catch (logError) {
      console.error('Error logging analytics:', logError);
    }

    // Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      error: null,
    });
  } catch (error) {
    console.error('Prices API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch price data. Please try again.',
      },
      { status: 500 }
    );
  }
}
