/**
 * Chat Logger Service
 *
 * Handles logging of chat interactions to Firestore.
 * This creates an audit trail of all AI conversations.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { ChatLogDocument } from '@/types';

/**
 * Collection name for chat logs in Firestore
 */
const CHAT_LOGS_COLLECTION = 'chatLogs';

/**
 * Logs a chat interaction to Firestore
 *
 * @param userMessage - The question asked by the user
 * @param aiMessage - The response from the AI
 * @param userId - Optional user ID (null for anonymous users)
 * @returns Promise<string> - The document ID of the logged interaction
 */
export async function logChatInteraction(
  userMessage: string,
  aiMessage: string,
  userId: string | null = null
): Promise<string> {
  try {
    if (!db) {
      throw new Error('Firestore is not configured');
    }

    // Prepare the log document
    const logData = {
      userMessage,
      aiMessage,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
      userId,
      // Optional: Add session ID or other metadata here
    };

    // Add document to Firestore
    const docRef = await addDoc(collection(db, CHAT_LOGS_COLLECTION), logData);

    console.log('Chat interaction logged successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    // Log error but don't throw - logging failure shouldn't break the user experience
    console.error('Error logging chat interaction:', error);
    throw error; // Re-throw so caller can handle if needed
  }
}

/**
 * Additional helper functions can be added here for:
 * - Retrieving chat history for a user
 * - Analytics queries
 * - Cleanup/archival operations
 */

/**
 * Future: Fetch chat history for authenticated users
 *
 * export async function getChatHistory(userId: string, limit: number = 50) {
 *   // Implementation when user auth is added
 * }
 */
