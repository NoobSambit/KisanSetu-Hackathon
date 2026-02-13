/**
 * Crop Plan API Route (Phase 4)
 *
 * Handles crop planning recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAICropPlan } from '@/lib/services/cropPlanningService';
import { trackEvent } from '@/lib/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, inputs } = body;

    // Validation
    if (!inputs || !inputs.landSize || !inputs.soilType || !inputs.season || !inputs.location) {
      return NextResponse.json(
        { success: false, error: 'Missing required input fields' },
        { status: 400 }
      );
    }

    // Generate crop plan
    const result = await generateAICropPlan(userId, inputs);

    if (result.success) {
      // Track analytics
      await trackEvent({
        eventType: 'feature_usage',
        userId,
        feature: 'crop_planner',
        metadata: {
          landSize: inputs.landSize,
          soilType: inputs.soilType,
          season: inputs.season,
        },
      });

      return NextResponse.json({
        success: true,
        plan: result.plan,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in crop plan API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate crop plan' },
      { status: 500 }
    );
  }
}
