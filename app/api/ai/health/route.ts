/**
 * AI Health Route (Day 1)
 *
 * Benchmarks local Ollama inference and validates that qwen2.5:7b is reachable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { benchmarkLocalModel } from '@/lib/ai/groq';

export async function GET(request: NextRequest) {
  const prompt = request.nextUrl.searchParams.get('prompt') || undefined;

  try {
    const result = await benchmarkLocalModel(prompt);

    return NextResponse.json(
      {
        success: true,
        provider: result.meta.provider,
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
        preview: result.text.slice(0, 180),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Local AI health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to benchmark local model',
      },
      { status: 500 }
    );
  }
}
