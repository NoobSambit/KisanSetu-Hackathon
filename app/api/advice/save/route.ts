/**
 * Save Advice API Route (Phase 2)
 *
 * Allows authenticated users to save AI responses for later reference.
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveAdvice } from '@/lib/firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.question || !body.answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, question, answer' },
        { status: 400 }
      );
    }

    // Save the advice
    const result = await saveAdvice(
      body.userId,
      body.question,
      body.answer,
      body.category
    );

    if (result.success) {
      return NextResponse.json(
        { success: true, id: result.id },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in save advice route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save advice' },
      { status: 500 }
    );
  }
}
