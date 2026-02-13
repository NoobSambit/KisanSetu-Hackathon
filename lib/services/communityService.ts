/**
 * Community Service (Phase 4)
 *
 * Handles all community forum operations:
 * - Posts CRUD
 * - Comments CRUD
 * - Replies CRUD
 * - Like/Unlike functionality
 * - Feed generation
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  CommunityPost,
  CommunityComment,
  CommunityReply,
} from '@/types';

/**
 * Create a new community post
 */
export async function createPost(
  userId: string,
  userName: string,
  userEmail: string,
  title: string,
  content: string,
  category?: string,
  tags?: string[]
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const postData = {
      userId,
      userName,
      userEmail,
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      likes: 0,
      likedBy: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
      moderationFlag: false,
    };

    const docRef = await addDoc(collection(db, 'communityPosts'), postData);
    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

/**
 * Get all community posts (feed)
 */
export async function getAllPosts(
  limitCount: number = 50
): Promise<CommunityPost[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts: CommunityPost[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        commentCount: data.commentCount || 0,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        moderationFlag: data.moderationFlag || false,
        moderationReason: data.moderationReason,
      });
    });

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get posts by user
 */
export async function getPostsByUser(userId: string): Promise<CommunityPost[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'communityPosts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const posts: CommunityPost[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        commentCount: data.commentCount || 0,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        moderationFlag: data.moderationFlag || false,
      });
    });

    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

/**
 * Create a comment on a post
 */
export async function createComment(
  postId: string,
  userId: string,
  userName: string,
  content: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const commentData = {
      postId,
      userId,
      userName,
      content,
      likes: 0,
      likedBy: [],
      replyCount: 0,
      createdAt: serverTimestamp(),
      moderationFlag: false,
    };

    const docRef = await addDoc(collection(db, 'communityComments'), commentData);

    // Update post comment count
    await updateDoc(doc(db, 'communityPosts', postId), {
      commentCount: increment(1),
    });

    return { success: true, commentId: docRef.id };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { success: false, error: 'Failed to create comment' };
  }
}

/**
 * Get comments for a post
 */
export async function getCommentsByPost(postId: string): Promise<CommunityComment[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'communityComments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const comments: CommunityComment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        postId: data.postId,
        userId: data.userId,
        userName: data.userName,
        content: data.content,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        replyCount: data.replyCount || 0,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        moderationFlag: data.moderationFlag || false,
      });
    });

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

/**
 * Create a reply to a comment
 */
export async function createReply(
  commentId: string,
  postId: string,
  userId: string,
  userName: string,
  content: string
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const replyData = {
      commentId,
      postId,
      userId,
      userName,
      content,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      moderationFlag: false,
    };

    const docRef = await addDoc(collection(db, 'communityReplies'), replyData);

    // Update comment reply count
    await updateDoc(doc(db, 'communityComments', commentId), {
      replyCount: increment(1),
    });

    return { success: true, replyId: docRef.id };
  } catch (error) {
    console.error('Error creating reply:', error);
    return { success: false, error: 'Failed to create reply' };
  }
}

/**
 * Get replies for a comment
 */
export async function getRepliesByComment(commentId: string): Promise<CommunityReply[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'communityReplies'),
      where('commentId', '==', commentId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const replies: CommunityReply[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        commentId: data.commentId,
        postId: data.postId,
        userId: data.userId,
        userName: data.userName,
        content: data.content,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        moderationFlag: data.moderationFlag || false,
      });
    });

    return replies;
  } catch (error) {
    console.error('Error fetching replies:', error);
    return [];
  }
}

/**
 * Toggle like on post
 */
export async function togglePostLike(
  postId: string,
  userId: string,
  isLiked: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const postRef = doc(db, 'communityPosts', postId);

    if (isLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling post like:', error);
    return { success: false, error: 'Failed to update like' };
  }
}

/**
 * Toggle like on comment
 */
export async function toggleCommentLike(
  commentId: string,
  userId: string,
  isLiked: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const commentRef = doc(db, 'communityComments', commentId);

    if (isLiked) {
      await updateDoc(commentRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return { success: false, error: 'Failed to update like' };
  }
}

/**
 * Toggle like on reply
 */
export async function toggleReplyLike(
  replyId: string,
  userId: string,
  isLiked: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const replyRef = doc(db, 'communityReplies', replyId);

    if (isLiked) {
      await updateDoc(replyRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      await updateDoc(replyRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling reply like:', error);
    return { success: false, error: 'Failed to update like' };
  }
}

/**
 * Delete a post (soft delete via moderation flag)
 */
export async function deletePost(
  postId: string,
  reason: string = 'User deleted'
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    await updateDoc(doc(db, 'communityPosts', postId), {
      moderationFlag: true,
      moderationReason: reason,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: 'Failed to delete post' };
  }
}
