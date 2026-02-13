/**
 * Admin Service (Phase 4)
 *
 * Handles admin operations:
 * - Role management
 * - User analytics
 * - Content moderation
 * - System health
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Check if user has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const userRoleDoc = await getDoc(doc(db, 'userRoles', userId));

    if (!userRoleDoc.exists()) {
      return false;
    }

    const roleData = userRoleDoc.data();
    return roleData.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Set user role
 */
export async function setUserRole(
  userId: string,
  role: 'user' | 'admin',
  assignedBy?: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    await setDoc(doc(db, 'userRoles', userId), {
      uid: userId,
      role,
      assignedAt: Timestamp.now(),
      assignedBy: assignedBy || 'system',
    });

    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    return { success: false, error: 'Failed to set user role' };
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<any> {
  if (!db) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalPosts: 0,
      totalAIQueries: 0,
      flaggedContent: 0,
      systemHealth: 'good',
    };
  }

  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get total posts
    const postsSnapshot = await getDocs(collection(db, 'communityPosts'));
    const totalPosts = postsSnapshot.size;

    // Get total AI queries
    const aiLogsSnapshot = await getDocs(collection(db, 'aiLogs'));
    const totalAIQueries = aiLogsSnapshot.size;

    // Get flagged content
    const flaggedPostsQuery = query(
      collection(db, 'communityPosts'),
      where('moderationFlag', '==', true)
    );
    const flaggedPosts = await getDocs(flaggedPostsQuery);
    const flaggedContent = flaggedPosts.size;

    // Determine system health (simple heuristic)
    let systemHealth: 'good' | 'warning' | 'critical' = 'good';
    if (flaggedContent > 10) systemHealth = 'warning';
    if (flaggedContent > 50) systemHealth = 'critical';

    return {
      totalUsers,
      activeUsers: Math.floor(totalUsers * 0.6), // Estimate
      totalPosts,
      totalAIQueries,
      flaggedContent,
      systemHealth,
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalPosts: 0,
      totalAIQueries: 0,
      flaggedContent: 0,
      systemHealth: 'good',
    };
  }
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(limitCount: number = 50): Promise<any[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const users: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        name: data.name,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        lastLogin: (data.lastLogin as Timestamp)?.toDate(),
      });
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get flagged content
 */
export async function getFlaggedContent(): Promise<any[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'communityPosts'),
      where('moderationFlag', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const flagged: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      flagged.push({
        id: doc.id,
        type: 'post',
        title: data.title,
        content: data.content,
        userName: data.userName,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        moderationReason: data.moderationReason,
      });
    });

    return flagged;
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    return [];
  }
}

/**
 * Soft delete content
 */
export async function moderateContent(
  contentType: 'post' | 'comment' | 'reply',
  contentId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    const collectionName =
      contentType === 'post'
        ? 'communityPosts'
        : contentType === 'comment'
        ? 'communityComments'
        : 'communityReplies';

    await updateDoc(doc(db, collectionName, contentId), {
      moderationFlag: true,
      moderationReason: reason,
    });

    return { success: true };
  } catch (error) {
    console.error('Error moderating content:', error);
    return { success: false, error: 'Failed to moderate content' };
  }
}
