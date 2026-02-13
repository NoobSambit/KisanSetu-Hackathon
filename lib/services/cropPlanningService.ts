/**
 * Crop Planning Service (Phase 4)
 *
 * AI-powered crop planning and recommendation system
 * Uses Gemini AI to generate personalized crop plans
 */

import { generateCropPlan } from '@/lib/ai/groq';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CropPlanInputs, CropPlan } from '@/types';

/**
 * Generate AI crop plan based on user inputs
 */
export async function generateAICropPlan(
  userId: string,
  inputs: CropPlanInputs
): Promise<{ success: boolean; plan?: any; error?: string }> {
  if (!db) return { success: false, error: 'Firestore is not configured' };

  try {
    // Validate inputs
    if (!inputs.landSize || !inputs.soilType || !inputs.season || !inputs.location) {
      return { success: false, error: 'Missing required input fields' };
    }

    // Generate AI recommendations
    const aiResponse = await generateCropPlan(inputs);

    if (!aiResponse) {
      return { success: false, error: 'Failed to generate crop plan' };
    }

    // Save to Firestore
    const planData = {
      userId,
      inputs,
      aiResponse,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'cropPlans'), planData);

    return {
      success: true,
      plan: {
        id: docRef.id,
        ...aiResponse,
      },
    };
  } catch (error) {
    console.error('Error generating crop plan:', error);
    return { success: false, error: 'Failed to generate crop plan' };
  }
}

/**
 * Get saved crop plans for a user
 */
export async function getUserCropPlans(userId: string): Promise<CropPlan[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'cropPlans'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const plans: CropPlan[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      plans.push({
        id: doc.id,
        userId: data.userId,
        inputs: data.inputs,
        recommendations: data.aiResponse?.recommendations || [],
        schedule: data.aiResponse?.schedule || {
          sowingPeriod: '',
          growthStages: [],
          harvestPeriod: '',
          totalDuration: '',
        },
        resourcePlan: data.aiResponse?.resourcePlan || {
          seeds: [],
          fertilizers: [],
          laborRequirement: '',
          waterRequirement: '',
          equipmentNeeded: [],
        },
        aiAdvice: data.aiResponse?.aiAdvice || '',
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      });
    });

    return plans;
  } catch (error) {
    console.error('Error fetching crop plans:', error);
    return [];
  }
}

/**
 * Get crop recommendations based on inputs (without saving)
 */
export async function getCropRecommendations(
  inputs: CropPlanInputs
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const recommendations = await generateCropPlan(inputs);

    if (!recommendations) {
      return { success: false, error: 'Failed to generate recommendations' };
    }

    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return { success: false, error: 'Failed to get recommendations' };
  }
}
