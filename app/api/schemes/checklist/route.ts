import { NextRequest, NextResponse } from 'next/server';
import { upsertSchemeUserState } from '@/lib/firebase/day2';
import { getChecklistProgress } from '@/lib/services/schemeMatcherService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId: string | undefined = body.userId;
    const schemeId: string | undefined = body.schemeId;
    const checklist: Record<string, boolean> | undefined = body.checklist;
    const notes: string | undefined = body.notes;

    if (!userId || !schemeId || !checklist || typeof checklist !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, schemeId, and checklist are required',
        },
        { status: 400 }
      );
    }

    const updateResult = await upsertSchemeUserState(userId, schemeId, {
      checklist,
      notes,
    });

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.error || 'Failed to update checklist',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        schemeId,
        checklist,
        checklistProgress: getChecklistProgress(checklist),
      },
      error: null,
    });
  } catch (error) {
    console.error('Checklist route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update checklist',
      },
      { status: 500 }
    );
  }
}
