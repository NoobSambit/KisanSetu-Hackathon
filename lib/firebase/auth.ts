/**
 * Firebase Authentication Service Layer (Phase 2)
 *
 * Provides a clean abstraction for all authentication operations.
 * Separates auth logic from UI components for better maintainability.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/types';

/**
 * Sign up a new user with email and password
 * Also creates a user document in Firestore
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if Firebase is initialized
    if (!auth || !db) {
      return { user: null, error: 'Authentication service is not available. Please configure Firebase.' };
    }

    // Validate input
    if (!email || !password) {
      return { user: null, error: 'Email and password are required' };
    }

    if (password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters' };
    }

    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name if provided
    if (name) {
      await updateProfile(firebaseUser, { displayName: name });
    }

    // Create user document in Firestore
    const userData: Omit<User, 'uid'> = {
      email: firebaseUser.email || email,
      name: name || undefined,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    const user: User = {
      uid: firebaseUser.uid,
      ...userData,
    };

    return { user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    console.error('Sign up error:', authError);
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if Firebase is initialized
    if (!auth || !db) {
      return { user: null, error: 'Authentication service is not available. Please configure Firebase.' };
    }

    // Validate input
    if (!email || !password) {
      return { user: null, error: 'Email and password are required' };
    }

    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update last login time
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLogin: serverTimestamp(),
    });

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist (edge case)
      const userData: Omit<User, 'uid'> = {
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || undefined,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      return {
        user: { uid: firebaseUser.uid, ...userData },
        error: null,
      };
    }

    const userData = userDoc.data();
    const user: User = {
      uid: firebaseUser.uid,
      email: userData.email,
      name: userData.name,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLogin: userData.lastLogin?.toDate() || new Date(),
    };

    return { user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    console.error('Sign in error:', authError);
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign out the current user
 */
export async function logOut(): Promise<{ error: string | null }> {
  try {
    if (!auth) {
      return { error: 'Authentication service is not available.' };
    }
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: 'Failed to sign out. Please try again.' };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    if (!auth) {
      return { error: 'Authentication service is not available.' };
    }

    if (!email) {
      return { error: 'Email is required' };
    }

    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    console.error('Password reset error:', authError);
    return { error: errorMessage };
  }
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  // If auth is not initialized, return a no-op unsubscribe function
  if (!auth) {
    console.warn('Firebase Auth is not initialized. Auth features will not work.');
    callback(null);
    return () => { };
  }

  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // Fetch user data from Firestore
      try {
        if (!db) {
          console.error('Firestore is not initialized');
          callback(null);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const user: User = {
            uid: firebaseUser.uid,
            email: userData.email,
            name: userData.name,
            createdAt: userData.createdAt?.toDate() || new Date(),
            lastLogin: userData.lastLogin?.toDate() || new Date(),
          };
          callback(user);
        } else {
          // User document doesn't exist, create it
          const newUser: Omit<User, 'uid'> = {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            createdAt: new Date(),
            lastLogin: new Date(),
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });

          callback({ uid: firebaseUser.uid, ...newUser });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth?.currentUser || null;
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/configuration-not-found':
      return 'Firebase Auth is not configured for this project. Enable Authentication and Email/Password sign-in in Firebase Console.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/unauthorized-domain':
      return 'This app domain is not authorized for Firebase Auth. Add localhost and 127.0.0.1 in Firebase Authentication > Settings > Authorized domains.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API key. Verify your NEXT_PUBLIC_FIREBASE_* values in .env.local.';
    case 'auth/app-not-authorized':
      return 'Firebase app is not authorized. Confirm your Firebase web app config matches this project.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled in Firebase Authentication. Enable it in Firebase Console and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    default:
      return 'An error occurred. Please try again.';
  }
}
