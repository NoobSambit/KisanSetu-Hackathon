/**
 * Community Posts API Route (Phase 4)
 *
 * Handles:
 * - GET: Fetch all posts (feed)
 * - POST: Create new post
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPost, getAllPosts } from '@/lib/services/communityService';
import { trackEvent } from '@/lib/services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) : 50;

    const posts = await getAllPosts(limitCount);

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail, title, content, category, tags } = body;

    // Validation
    if (!userId || !userName || !userEmail || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Title must be between 5 and 200 characters' },
        { status: 400 }
      );
    }

    if (content.length < 10 || content.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Content must be between 10 and 5000 characters' },
        { status: 400 }
      );
    }

    const result = await createPost(
      userId,
      userName,
      userEmail,
      title,
      content,
      category,
      tags
    );

    if (result.success) {
      // Track analytics
      await trackEvent({
        eventType: 'feature_usage',
        userId,
        feature: 'community_post',
        metadata: { postId: result.postId, category },
      });

      return NextResponse.json({
        success: true,
        postId: result.postId,
        message: 'Post created successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
