import { NextRequest, NextResponse } from 'next/server';
import { getSchemeUserStateMap, upsertSchemeUserState } from '@/lib/firebase/day2';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId query parameter is required',
        },
        { status: 400 }
      );
    }

    const stateMap = await getSchemeUserStateMap(userId);
    const savedSchemeIds = Object.values(stateMap)
      .filter((item) => item.saved)
      .map((item) => item.schemeId);

    return NextResponse.json({
      success: true,
      data: {
        savedSchemeIds,
        stateMap,
      },
      error: null,
    });
  } catch (error) {
    console.error('Saved schemes route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch saved schemes',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId: string | undefined = body.userId;
    const schemeId: string | undefined = body.schemeId;
    const saved: boolean = typeof body.saved === 'boolean' ? body.saved : true;

    if (!userId || !schemeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId and schemeId are required',
        },
        { status: 400 }
      );
    }

    const updateResult = await upsertSchemeUserState(userId, schemeId, { saved });

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.error || 'Failed to update saved state',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        schemeId,
        saved,
      },
      error: null,
    });
  } catch (error) {
    console.error('Saved schemes update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update saved scheme state',
      },
      { status: 500 }
    );
  }
}
