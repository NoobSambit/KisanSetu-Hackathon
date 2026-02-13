/**
 * Community Likes API Route (Phase 4)
 *
 * Handles:
 * - POST: Toggle like on post, comment, or reply
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  togglePostLike,
  toggleCommentLike,
  toggleReplyLike,
} from '@/lib/services/communityService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, userId, isLiked } = body;

    // Validation
    if (!targetType || !targetId || !userId || typeof isLiked !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (targetType) {
      case 'post':
        result = await togglePostLike(targetId, userId, isLiked);
        break;
      case 'comment':
        result = await toggleCommentLike(targetId, userId, isLiked);
        break;
      case 'reply':
        result = await toggleReplyLike(targetId, userId, isLiked);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid target type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: isLiked ? 'Unliked successfully' : 'Liked successfully',
        action: isLiked ? 'unliked' : 'liked',
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update like' },
      { status: 500 }
    );
  }
}
