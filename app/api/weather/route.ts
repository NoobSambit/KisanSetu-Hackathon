/**
 * Weather Intelligence API Route (Phase 3)
 *
 * GET /api/weather?city=CityName
 * GET /api/weather?lat=12.34&lon=56.78
 * Returns current weather data and farming advice
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWeatherByCity,
  getWeatherByCoordinates,
} from '@/lib/services/weatherService';
import { logWeatherCheck } from '@/lib/services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');
    const userId = searchParams.get('userId');

    let result;

    // Get weather by coordinates
    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid coordinates provided',
          },
          { status: 400 }
        );
      }

      result = await getWeatherByCoordinates(lat, lon);
    }
    // Get weather by city name
    else if (city) {
      result = await getWeatherByCity(city);
    }
    // Missing required parameters
    else {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide either city name or coordinates (lat, lon)',
        },
        { status: 400 }
      );
    }

    // Log analytics (async, non-blocking)
    try {
      await logWeatherCheck(userId || undefined, city || 'coordinates');
    } catch (logError) {
      console.error('Error logging weather check:', logError);
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
    console.error('Weather API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weather data. Please try again.',
      },
      { status: 500 }
    );
  }
}
