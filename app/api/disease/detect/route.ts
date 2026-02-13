/**
 * Disease Detection API Route (Phase 3)
 *
 * POST /api/disease/detect
 * Accepts image upload and returns disease prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictDiseaseFromImage } from '@/lib/services/diseaseService';
import { logDiseaseDetection } from '@/lib/services/analyticsService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userId = formData.get('userId') as string | null;

    // Validate image file
    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'No image file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get prediction from disease service
    const result = await predictDiseaseFromImage(buffer);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    const prediction = result.data;

    // Log to Firestore (async, non-blocking)
    try {
      if (db) {
        await addDoc(collection(db, 'diseasePredictions'), {
          userId: userId || null,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          treatment: prediction.treatment,
          severity: prediction.severity,
          timestamp: serverTimestamp(),
          imageMetadata: {
            size: imageFile.size,
            type: imageFile.type,
            name: imageFile.name,
          },
        });

        // Log analytics event
        await logDiseaseDetection(
          userId || undefined,
          prediction.prediction,
          prediction.confidence
        );
      }
    } catch (logError) {
      console.error('Error logging disease prediction:', logError);
      // Don't fail the request if logging fails
    }

    // Return successful prediction
    return NextResponse.json({
      success: true,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      treatment: prediction.treatment,
      scientificName: prediction.scientificName,
      severity: prediction.severity,
      preventionTips: prediction.preventionTips,
      error: null,
    });
  } catch (error) {
    console.error('Disease detection API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process image. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
