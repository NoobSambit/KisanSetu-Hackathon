/**
 * Community Comments API Route (Phase 4)
 *
 * Handles:
 * - GET: Fetch comments for a post
 * - POST: Create new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createComment,
  createReply,
  getCommentsByPost,
  getRepliesByComment,
} from '@/lib/services/communityService';
import { trackEvent } from '@/lib/services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const commentId = searchParams.get('commentId');

    if (commentId) {
      // Get replies for a comment
      const replies = await getRepliesByComment(commentId);
      return NextResponse.json({
        success: true,
        replies,
        count: replies.length,
      });
    }

    if (postId) {
      // Get comments for a post
      const comments = await getCommentsByPost(postId);
      return NextResponse.json({
        success: true,
        comments,
        count: comments.length,
      });
    }

    return NextResponse.json(
      { success: false, error: 'postId or commentId required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching comments/replies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, postId, commentId, userId, userName, content } = body;

    // Validation
    if (!userId || !userName || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Content must be between 1 and 2000 characters' },
        { status: 400 }
      );
    }

    if (type === 'reply') {
      // Create reply
      if (!commentId || !postId) {
        return NextResponse.json(
          { success: false, error: 'commentId and postId required for replies' },
          { status: 400 }
        );
      }

      const result = await createReply(commentId, postId, userId, userName, content);

      if (result.success) {
        await trackEvent({
          eventType: 'feature_usage',
          userId,
          feature: 'community_reply',
          metadata: { replyId: result.replyId, commentId },
        });

        return NextResponse.json({
          success: true,
          replyId: result.replyId,
          message: 'Reply created successfully',
        });
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    } else {
      // Create comment
      if (!postId) {
        return NextResponse.json(
          { success: false, error: 'postId required for comments' },
          { status: 400 }
        );
      }

      const result = await createComment(postId, userId, userName, content);

      if (result.success) {
        await trackEvent({
          eventType: 'feature_usage',
          userId,
          feature: 'community_comment',
          metadata: { commentId: result.commentId, postId },
        });

        return NextResponse.json({
          success: true,
          commentId: result.commentId,
          message: 'Comment created successfully',
        });
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating comment/reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
