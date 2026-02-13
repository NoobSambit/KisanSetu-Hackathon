/**
 * Farm Profile API (Day 1)
 *
 * - GET: fetch farm profile + memory context
 * - POST/PATCH: create or update farm profile
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  saveFarmProfile,
  getFarmProfile,
  buildFarmMemoryContext,
  refreshLearnedPatterns,
  getLearnedPatterns,
} from '@/lib/firebase/firestore';
import { FarmProfile } from '@/types';

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function validateProfilePayload(profile: Partial<FarmProfile>): string | null {
  if (!profile.soilType || !profile.soilType.trim()) {
    return 'Soil type is required';
  }

  if (!profile.irrigationType) {
    return 'Irrigation type is required';
  }

  if (!profile.location?.state || !profile.location?.district) {
    return 'State and district are required';
  }

  if (!profile.primaryCrops || profile.primaryCrops.length === 0) {
    return 'At least one primary crop is required';
  }

  const landGeometry = profile.location?.landGeometry;
  if (!landGeometry) {
    return 'Farm boundary map selection is required.';
  }

  if (landGeometry.type !== 'Polygon') {
    return 'Land geometry type must be Polygon';
  }

  if (!landGeometry.coordinates || !Array.isArray(landGeometry.coordinates)) {
    return 'Invalid land geometry coordinates';
  }

  const outerRing = landGeometry.coordinates[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) {
    return 'Land geometry must include a valid polygon ring.';
  }

  for (const point of outerRing) {
    if (!Array.isArray(point) || point.length !== 2) {
      return 'Land geometry points must be [longitude, latitude].';
    }

    const [lon, lat] = point;
    if (!isValidLongitude(Number(lon)) || !isValidLatitude(Number(lat))) {
      return 'Land geometry contains invalid coordinates.';
    }
  }

  if (!landGeometry.bbox || landGeometry.bbox.length !== 4) {
    return 'Invalid bounding box in land geometry';
  }

  const [minLon, minLat, maxLon, maxLat] = landGeometry.bbox;
  if (
    !isValidLongitude(Number(minLon)) ||
    !isValidLongitude(Number(maxLon)) ||
    !isValidLatitude(Number(minLat)) ||
    !isValidLatitude(Number(maxLat)) ||
    !(Number(minLon) < Number(maxLon) && Number(minLat) < Number(maxLat))
  ) {
    return 'Invalid bounding box in land geometry';
  }

  if (
    !landGeometry.centerPoint ||
    !isValidLatitude(Number(landGeometry.centerPoint.lat)) ||
    !isValidLongitude(Number(landGeometry.centerPoint.lon))
  ) {
    return 'Invalid center point in land geometry';
  }

  if (!Number.isFinite(landGeometry.calculatedAreaAcres) || landGeometry.calculatedAreaAcres <= 0) {
    return 'Calculated area must be a positive number';
  }

  // Validate coordinates are within India bounds (roughly)
  const center = landGeometry.centerPoint;
  if (center.lat < 6 || center.lat > 38 || center.lon < 68 || center.lon > 98) {
    return 'Land location appears to be outside India';
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const [profile, memoryContext, patterns] = await Promise.all([
      getFarmProfile(userId),
      buildFarmMemoryContext(userId),
      getLearnedPatterns(userId, 6),
    ]);

    return NextResponse.json(
      {
        success: true,
        profile,
        memoryContext,
        patterns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching farm profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch farm profile' },
      { status: 500 }
    );
  }
}

async function upsertProfile(request: NextRequest) {
  try {
    const body = await request.json();
    const userId: string | undefined = body.userId;
    const profile: Partial<FarmProfile> = body.profile;

    if (!userId || !profile) {
      return NextResponse.json(
        { success: false, error: 'userId and profile are required' },
        { status: 400 }
      );
    }

    const validationError = validateProfilePayload(profile);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const geometry = profile.location!.landGeometry!;
    const normalizedArea = Number(geometry.calculatedAreaAcres.toFixed(2));
    const normalizedCenter = {
      lat: Number(geometry.centerPoint.lat.toFixed(6)),
      lon: Number(geometry.centerPoint.lon.toFixed(6)),
    };
    const normalizedGeometry = {
      ...geometry,
      calculatedAreaAcres: normalizedArea,
      centerPoint: normalizedCenter,
      selectedAt: typeof geometry.selectedAt === 'string' ? geometry.selectedAt : new Date().toISOString(),
    };

    const saveResult = await saveFarmProfile(userId, {
      farmerName: profile.farmerName,
      preferredLanguage: profile.preferredLanguage,
      landSize: normalizedArea,
      landUnit: 'acres',
      soilType: profile.soilType!,
      irrigationType: profile.irrigationType!,
      waterSource: profile.waterSource,
      location: {
        state: profile.location!.state,
        district: profile.location!.district,
        village: profile.location!.village,
        coordinates: normalizedCenter,
        landGeometry: normalizedGeometry,
      },
      primaryCrops: profile.primaryCrops!,
      annualBudget: profile.annualBudget,
      riskPreference: profile.riskPreference,
      historicalChallenges: profile.historicalChallenges || [],
      notes: profile.notes,
    });

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: saveResult.error || 'Failed to save farm profile' },
        { status: 500 }
      );
    }

    const patterns = await refreshLearnedPatterns(userId);

    return NextResponse.json(
      {
        success: true,
        message: 'Farm profile saved successfully',
        patterns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving farm profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save farm profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return upsertProfile(request);
}

export async function PATCH(request: NextRequest) {
  return upsertProfile(request);
}
