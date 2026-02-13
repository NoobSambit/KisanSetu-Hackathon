/**
 * AI Query API Route
 *
 * Assistant query pipeline:
 * 1. Validate input
 * 2. Retrieve conversation + farm memory context
 * 3. Query selected model provider (Ollama or Gemini)
 * 4. Persist logs and memory signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAssistantQuery } from '@/lib/services/assistantQueryService';
import { AIQueryResponse } from '@/types';

/**
 * POST handler for AI queries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await runAssistantQuery({
      question: body.question,
      userId: body.userId || null,
      sessionId: body.sessionId,
      responseLanguageHint: typeof body.language === 'string' ? body.language : null,
      modelProvider: typeof body.provider === 'string' ? body.provider : null,
    });

    const response: AIQueryResponse = {
      success: result.success,
      answer: result.answer,
      error: result.error,
      meta: result.meta,
    };

    return NextResponse.json(response, { status: result.status });
  } catch (error) {
    console.error('Unexpected error in AI query route:', error);

    const errorResponse: AIQueryResponse = {
      success: false,
      answer: null,
      error: 'An unexpected error occurred. Please try again.',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to query the AI.' },
    { status: 405 }
  );
}
